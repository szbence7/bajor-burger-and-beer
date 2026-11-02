// Admin accounts for the /admin panel. Run with bun (it loads .env):
//   bun run admin create <email> [password]   new admin (prints a generated password if omitted)
//   bun run admin promote <email>              make an existing user an admin
//   bun run admin reset-2fa <email>            remove their authenticator (lost phone)
//   bun run admin list
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY of the target instance. The admin sets up
// the authenticator app (2FA) on their first sign-in; the panel does not work without it.
import { randomBytes } from "node:crypto";
import { createClient, type User } from "@supabase/supabase-js";

const url = process.env["SUPABASE_URL"];
const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env).");
  process.exit(1);
}
const auth = createClient(url, key, { auth: { persistSession: false } }).auth.admin;

async function findUser(email: string): Promise<User> {
  for (let page = 1; ; page++) {
    const { data, error } = await auth.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 200) throw new Error(`No user with email ${email}`);
  }
}

const [command, email, password] = process.argv.slice(2);

switch (command) {
  case "create": {
    if (!email) throw new Error("Usage: create <email> [password]");
    const pass = password ?? randomBytes(12).toString("base64url");
    const { error } = await auth.createUser({
      email,
      password: pass,
      email_confirm: true,
      app_metadata: { role: "admin" },
    });
    if (error) throw error;
    console.log(`Admin ${email} created.${password ? "" : ` Password: ${pass}`}`);
    console.log("On first sign-in at /admin they link an authenticator app (required).");
    break;
  }
  case "promote": {
    if (!email) throw new Error("Usage: promote <email>");
    const user = await findUser(email);
    const { error } = await auth.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, role: "admin" },
    });
    if (error) throw error;
    console.log(`${email} is now an admin.`);
    break;
  }
  case "reset-2fa": {
    if (!email) throw new Error("Usage: reset-2fa <email>");
    const user = await findUser(email);
    const { data, error } = await auth.mfa.listFactors({ userId: user.id });
    if (error) throw error;
    for (const factor of data.factors) {
      const removed = await auth.mfa.deleteFactor({ userId: user.id, id: factor.id });
      if (removed.error) throw removed.error;
    }
    console.log(
      `Removed ${data.factors.length} factor(s); ${email} sets up 2FA again on next sign-in.`,
    );
    break;
  }
  case "list": {
    const { data, error } = await auth.listUsers({ perPage: 200 });
    if (error) throw error;
    for (const u of data.users) {
      const verified = (u.factors ?? []).filter((f) => f.status === "verified").length;
      console.log(
        `${u.email}\t${u.app_metadata["role"] === "admin" ? "admin" : "-"}\t2FA: ${verified ? "igen" : "nincs"}`,
      );
    }
    break;
  }
  default:
    console.error(
      "Commands: create <email> [password] | promote <email> | reset-2fa <email> | list",
    );
    process.exit(1);
}

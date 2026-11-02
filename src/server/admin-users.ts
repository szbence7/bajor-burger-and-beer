// Admin accounts managed from the panel. Uses the Auth admin API (service role), so every
// function first checks that the caller is a two-factor admin by asking the database as them.
import { randomBytes } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import type { AccountEmailOutcome, AdminResult, AdminUser } from "@/features/admin/schema";
import { fail, failFrom } from "./admin";
import { deliverAccountEmail } from "./notifications";
import { createAnonSupabase, getServiceSupabase, getUserSupabase } from "./supabase";

/** 12 characters from an unambiguous alphabet, easy to type from an email. */
export function temporaryPassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(12), (b) => alphabet[b % alphabet.length]).join("");
}

const isAdminUser = (u: User) => u.app_metadata["role"] === "admin";

/** The caller's user id if their token belongs to a two-factor admin (checked by RLS's own rule). */
async function requireAdmin(token: string) {
  const { data, error } = await getUserSupabase(token).rpc("is_admin");
  if (error) return failFrom(error, "admin check");
  if (data !== true) return fail("forbidden");
  const { data: me } = await getServiceSupabase().auth.getUser(token);
  if (!me.user) return fail("unauthorized");
  return { ok: true, userId: me.user.id } as const;
}

/** Verified-or-not factors of a user (listUsers does not include them). */
async function factorsOf(userId: string) {
  const { data, error } = await getServiceSupabase().auth.admin.mfa.listFactors({ userId });
  if (error) throw error;
  return data.factors;
}

async function allUsers(): Promise<User[]> {
  const { data, error } = await getServiceSupabase().auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users;
}

export async function listAdmins(token: string): Promise<AdminResult<AdminUser[]>> {
  const caller = await requireAdmin(token);
  if (!caller.ok) return caller;
  const users = (await allUsers()).filter(isAdminUser);
  const factors = await Promise.all(users.map((u) => factorsOf(u.id)));
  return {
    ok: true,
    data: users
      .map((u, i) => ({
        id: u.id,
        email: u.email ?? "",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        mustChangePassword: u.app_metadata["must_change_password"] === true,
        hasTwoFactor: (factors[i] ?? []).some((f) => f.status === "verified"),
        isSelf: u.id === caller.userId,
      }))
      .sort((a, b) => a.email.localeCompare(b.email)),
  };
}

/** Creates an admin with a temporary password and emails it to them. */
export async function inviteAdmin(
  token: string,
  email: string,
): Promise<AdminResult<AccountEmailOutcome>> {
  const caller = await requireAdmin(token);
  if (!caller.ok) return caller;
  const password = temporaryPassword();
  const { error } = await getServiceSupabase().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin", must_change_password: true },
  });
  if (error) {
    if (error.code === "email_exists" || error.status === 422) return fail("user_exists");
    console.error("Admin invite failed:", error);
    return fail("unknown");
  }
  return { ok: true, data: await accountEmail("admin_invite", email, password) };
}

/** Lost phone or password: new temporary password, 2FA removed, both set up again. */
export async function resetAdmin(
  token: string,
  id: string,
): Promise<AdminResult<AccountEmailOutcome>> {
  const caller = await requireAdmin(token);
  if (!caller.ok) return caller;
  if (id === caller.userId) return fail("self");
  const auth = getServiceSupabase().auth.admin;
  const { data: found } = await auth.getUserById(id);
  if (!found.user || !isAdminUser(found.user)) return fail("forbidden");

  const password = temporaryPassword();
  const { error } = await auth.updateUserById(id, {
    password,
    app_metadata: { ...found.user.app_metadata, must_change_password: true },
  });
  if (error) {
    console.error("Admin reset failed:", error);
    return fail("unknown");
  }
  for (const factor of await factorsOf(id)) {
    const removed = await auth.mfa.deleteFactor({ userId: id, id: factor.id });
    if (removed.error) console.error(`Factor ${factor.id} not removed:`, removed.error);
  }
  return { ok: true, data: await accountEmail("admin_reset", found.user.email ?? "", password) };
}

export async function removeAdmin(token: string, id: string): Promise<AdminResult> {
  const caller = await requireAdmin(token);
  if (!caller.ok) return caller;
  if (id === caller.userId) return fail("self");
  const admins = (await allUsers()).filter(isAdminUser);
  if (!admins.some((u) => u.id === id)) return fail("forbidden");
  if (admins.length <= 1) return fail("last_admin");
  const { error } = await getServiceSupabase().auth.admin.deleteUser(id);
  if (error) {
    console.error("Admin removal failed:", error);
    return fail("unknown");
  }
  return { ok: true, data: null };
}

async function accountEmail(
  kind: "admin_invite" | "admin_reset",
  to: string,
  password: string,
): Promise<AccountEmailOutcome> {
  const status = await deliverAccountEmail(kind, to, password);
  // When the email did not go out, the inviting admin hands the password over in person.
  return status === "sent" ? { email: status } : { email: status, temporaryPassword: password };
}

/**
 * First sign-in: replaces the emailed temporary password. Allowed on the password-only (aal1)
 * session, because the second factor is set up right after; only for accounts that are still
 * flagged, so it can't be used to change a password without the second factor later.
 */
export async function completePasswordChange(
  token: string,
  currentPassword: string,
  password: string,
): Promise<AdminResult> {
  const service = getServiceSupabase().auth;
  const { data } = await service.getUser(token);
  const user = data.user;
  if (!user) return fail("unauthorized");
  if (!isAdminUser(user) || user.app_metadata["must_change_password"] !== true) {
    return fail("forbidden");
  }
  // The current (temporary) password again. The check signs in on a throwaway client; that
  // session ends with the password change below, which revokes the user's sessions.
  const check = await createAnonSupabase().auth.signInWithPassword({
    email: user.email ?? "",
    password: currentPassword,
  });
  if (check.error) return fail("wrong_password");

  const { error } = await service.admin.updateUserById(user.id, {
    password,
    app_metadata: { ...user.app_metadata, must_change_password: false },
  });
  if (error) {
    if (error.code === "weak_password" || error.code === "same_password") {
      return fail("weak_password");
    }
    console.error("Password change failed:", error);
    return fail("unknown");
  }
  return { ok: true, data: null };
}

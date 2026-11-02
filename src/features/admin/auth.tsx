// Admin sign-in: email + password, then a mandatory authenticator-app code (TOTP). The panel
// only opens on an aal2 session of a user with app_metadata.role = 'admin'; RLS enforces the
// same on every query, so skipping this UI gains nothing.
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { BrandLogo } from "@/components/BrandLogo";
import { Swap, m } from "@/components/motion";
import { Button, Card, inputClass, labelClass } from "./ui";
import { adminSupabase } from "./supabase";
import { completePasswordChangeFn } from "./api";
import { ADMIN_ERRORS, PASSWORD_MIN_LENGTH, newPasswordInput } from "./schema";

type Stage =
  | { name: "loading" }
  | { name: "signedOut" }
  | { name: "notAdmin" }
  | { name: "changePassword" }
  | { name: "enroll" }
  | { name: "verify"; factorId: string }
  | { name: "ready"; email: string };

const AdminUserContext = createContext<{ email: string; signOut: () => void }>({
  email: "",
  signOut: () => {},
});
export const useAdminUser = () => useContext(AdminUserContext);

async function stageFor(session: Session | null): Promise<Stage> {
  if (!session) return { name: "signedOut" };
  if (session.user.app_metadata["role"] !== "admin") return { name: "notAdmin" };
  // Order on first sign-in: own password first, then the authenticator app.
  if (session.user.app_metadata["must_change_password"] === true) return { name: "changePassword" };
  const sb = adminSupabase();
  const aal = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal.data?.currentLevel === "aal2") return { name: "ready", email: session.user.email ?? "" };
  const factors = await sb.auth.mfa.listFactors();
  const totp = factors.data?.totp[0];
  return totp ? { name: "verify", factorId: totp.id } : { name: "enroll" };
}

function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[100svh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <BrandLogo alt="" className="h-12" />
          <span className="font-display text-2xl text-primary">Bajor admin</span>
        </div>
        <h1 className="mb-4 font-display text-3xl">{title}</h1>
        {children}
      </Card>
    </div>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-2xl border-2 border-primary-glow p-3 text-sm font-bold">
      {children}
    </p>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await adminSupabase().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(
        error.status === 400 || error.code === "invalid_credentials"
          ? "Hibás e-mail-cím vagy jelszó."
          : "A bejelentkezés most nem sikerült. Próbáld újra.",
      );
    }
  };

  return (
    <Screen title="Bejelentkezés">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="admin-email" className={labelClass}>
            E-mail
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="admin-password" className={labelClass}>
            Jelszó
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Belépés…" : "Belépés"}
        </Button>
      </form>
    </Screen>
  );
}

function CodeForm({
  onSubmit,
  submitLabel,
}: {
  onSubmit: (code: string) => Promise<string | null>;
  submitLabel: string;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const failure = await onSubmit(code.replace(/\s/g, ""));
    setBusy(false);
    if (failure) {
      setError(failure);
      setCode("");
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="admin-code" className={labelClass}>
          6 jegyű kód a hitelesítő alkalmazásból
        </label>
        <input
          id="admin-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          autoFocus
          className={`${inputClass} text-center font-display text-3xl tracking-[0.4em]`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Ellenőrzés…" : submitLabel}
      </Button>
    </form>
  );
}

const codeError = "Hibás vagy lejárt kód. Írd be az alkalmazásban éppen látható kódot.";

/** First sign-in with the emailed temporary password: choose an own one. */
function ChangePassword({ onSignOut }: { onSignOut: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = newPasswordInput.safeParse({ currentPassword, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? ADMIN_ERRORS.unknown);
      return;
    }
    if (password !== confirm) {
      setError("A két jelszó nem egyezik.");
      return;
    }
    setBusy(true);
    try {
      const sb = adminSupabase();
      const email = (await sb.auth.getSession()).data.session?.user.email ?? "";
      const result = await completePasswordChangeFn({ data: parsed.data });
      if (!result.ok) {
        setError(ADMIN_ERRORS[result.error]);
        return;
      }
      // Changing the password ends the old session; sign in with the new one. The fresh token
      // no longer carries must_change_password, so the gate moves on to the 2FA setup.
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) await sb.auth.signOut();
    } catch {
      setError(ADMIN_ERRORS.unknown);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Új jelszó">
      <p className="mb-6 text-muted-foreground">
        Ideiglenes jelszóval léptél be. Add meg még egyszer, majd válassz egy saját jelszót
        (legalább {PASSWORD_MIN_LENGTH} karakter). Utána a kétlépcsős azonosítást állítjuk be.
      </p>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="admin-current-password" className={labelClass}>
            Jelenlegi (ideiglenes) jelszó
          </label>
          <input
            id="admin-current-password"
            type="password"
            autoComplete="current-password"
            className={inputClass}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="admin-new-password" className={labelClass}>
            Új jelszó
          </label>
          <input
            id="admin-new-password"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="admin-confirm-password" className={labelClass}>
            Új jelszó még egyszer
          </label>
          <input
            id="admin-confirm-password"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Mentés…" : "Tovább"}
        </Button>
      </form>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-6 text-sm font-bold text-muted-foreground underline underline-offset-4"
      >
        Kijelentkezés
      </button>
    </Screen>
  );
}

/** First sign-in: link an authenticator app (Google Authenticator, Microsoft Authenticator…). */
function Enroll({ onSignOut }: { onSignOut: () => void }) {
  const [factor, setFactor] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      const sb = adminSupabase();
      // Drop half-finished setups from earlier attempts, then start a fresh one.
      const { data } = await sb.auth.mfa.listFactors();
      for (const f of data?.all ?? []) {
        if (f.factor_type === "totp" && f.status === "unverified") {
          await sb.auth.mfa.unenroll({ factorId: f.id });
        }
      }
      const enrolled = await sb.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Bajor admin",
        friendlyName: `Hitelesítő ${new Date().toISOString()}`,
      });
      if (enrolled.error) {
        setError("A kétlépcsős azonosítás beállítása nem indult el. Frissítsd az oldalt.");
        return;
      }
      setFactor({
        id: enrolled.data.id,
        qr: enrolled.data.totp.qr_code,
        secret: enrolled.data.totp.secret,
      });
    })();
  }, []);

  return (
    <Screen title="Kétlépcsős azonosítás">
      <p className="mb-4 text-muted-foreground">
        Az admin felülethez kötelező. Olvasd be a QR-kódot egy hitelesítő alkalmazással (pl. Google
        Authenticator, Microsoft Authenticator), majd írd be az ott megjelenő kódot.
      </p>
      <ErrorText>{error}</ErrorText>
      {factor ? (
        <>
          <div className="mx-auto mb-4 w-52 rounded-2xl bg-foreground p-3">
            <img src={factor.qr} alt="QR-kód a hitelesítő alkalmazáshoz" className="w-full" />
          </div>
          <details className="mb-6 text-sm text-muted-foreground">
            <summary className="cursor-pointer font-bold">Nem tudod beolvasni?</summary>
            <p className="mt-2">Add meg kézzel ezt a kulcsot az alkalmazásban:</p>
            <code className="mt-1 block break-all rounded-xl bg-background p-3 text-foreground">
              {factor.secret}
            </code>
          </details>
          <CodeForm
            submitLabel="Bekapcsolom"
            onSubmit={async (code) => {
              const { error } = await adminSupabase().auth.mfa.challengeAndVerify({
                factorId: factor.id,
                code,
              });
              return error ? codeError : null;
            }}
          />
        </>
      ) : (
        !error && <p className="text-muted-foreground">Előkészítés…</p>
      )}
      <button
        type="button"
        onClick={onSignOut}
        className="mt-6 text-sm font-bold text-muted-foreground underline underline-offset-4"
      >
        Kijelentkezés
      </button>
    </Screen>
  );
}

function Verify({ factorId, onSignOut }: { factorId: string; onSignOut: () => void }) {
  return (
    <Screen title="Belépési kód">
      <p className="mb-6 text-muted-foreground">
        Nyisd meg a hitelesítő alkalmazást, és írd be a Bajor admin 6 jegyű kódját.
      </p>
      <CodeForm
        submitLabel="Belépés"
        onSubmit={async (code) => {
          const { error } = await adminSupabase().auth.mfa.challengeAndVerify({ factorId, code });
          return error ? codeError : null;
        }}
      />
      <p className="mt-6 text-sm text-muted-foreground">
        Elveszett a telefonod? Kérd meg a rendszergazdát, hogy állítsa vissza a kétlépcsős
        azonosításodat.
      </p>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-4 text-sm font-bold text-muted-foreground underline underline-offset-4"
      >
        Kijelentkezés
      </button>
    </Screen>
  );
}

/** Renders the panel only for a two-factor admin; otherwise the matching sign-in step. */
export function AdminAuthGate({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<Stage>({ name: "loading" });

  useEffect(() => {
    const sb = adminSupabase();
    let current = 0;
    const update = (session: Session | null) => {
      const run = ++current;
      // Deferred: supabase-js must not be called from inside its own auth callback.
      setTimeout(() => {
        void stageFor(session).then((s) => run === current && setStage(s));
      }, 0);
    };
    void sb.auth.getSession().then(({ data }) => update(data.session));
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event !== "INITIAL_SESSION") update(session);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signOut = () => void adminSupabase().auth.signOut();

  let screen: ReactNode;
  switch (stage.name) {
    case "loading":
      screen = (
        <div className="flex min-h-[100svh] items-center justify-center text-muted-foreground">
          Betöltés…
        </div>
      );
      break;
    case "signedOut":
      screen = <Login />;
      break;
    case "notAdmin":
      screen = (
        <Screen title="Nincs jogosultság">
          <p className="mb-6 text-muted-foreground">
            Ez a fiók nem admin. Kérd meg a rendszergazdát, hogy adjon hozzáférést.
          </p>
          <Button variant="outline" onClick={signOut}>
            Kijelentkezés
          </Button>
        </Screen>
      );
      break;
    case "changePassword":
      screen = <ChangePassword onSignOut={signOut} />;
      break;
    case "enroll":
      screen = <Enroll onSignOut={signOut} />;
      break;
    case "verify":
      screen = <Verify factorId={stage.factorId} onSignOut={signOut} />;
      break;
    case "ready":
      // Opacity only: a transform here would trap the panel's fixed toasts.
      return (
        <AdminUserContext.Provider value={{ email: stage.email, signOut }}>
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {children}
          </m.div>
        </AdminUserContext.Provider>
      );
  }
  // The sign-in steps cross-fade into each other.
  return <Swap id={stage.name}>{screen}</Swap>;
}

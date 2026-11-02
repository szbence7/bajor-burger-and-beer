import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, ShieldCheck, ShieldOff, Trash2, UserPlus } from "lucide-react";
import { inviteAdminFn, listAdminsFn, removeAdminFn, resetAdminFn } from "./api";
import {
  ADMIN_ERRORS,
  inviteInput,
  type AccountEmailOutcome,
  type AdminResult,
  type AdminUser,
} from "./schema";
import { Button, Card, PageTitle, formatTimestamp, inputClass, labelClass, useToast } from "./ui";
import { Collapse } from "@/components/motion";
import { useSmoothList } from "@/lib/motion";

const QUERY_KEY = ["admin", "users"];

/** Shown when the email with the temporary password could not be sent. */
function HandOver({ email, outcome }: { email: string; outcome: AccountEmailOutcome }) {
  if (!outcome.temporaryPassword) return null;
  return (
    <div role="alert" className="mt-4 rounded-2xl border-2 border-primary-glow p-4">
      <p className="font-bold">
        Az e-mail nem ment ki
        {outcome.email === "skipped" ? " (az e-mail-küldés nincs beállítva)" : ""}. Add át
        személyesen az ideiglenes jelszót:
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{email}</p>
      <code className="mt-1 block select-all rounded-xl bg-background p-3 font-display text-2xl tracking-wider">
        {outcome.temporaryPassword}
      </code>
      <p className="mt-2 text-sm text-muted-foreground">
        Csak most látod. Első belépéskor saját jelszót kell megadnia, és be kell állítania a
        kétlépcsős azonosítást.
      </p>
    </div>
  );
}

function InviteForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [handOver, setHandOver] = useState<{ email: string; outcome: AccountEmailOutcome }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const invite = useMutation({
    mutationFn: (value: string) => inviteAdminFn({ data: { email: value } }),
    onSuccess: (result, value) => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      if (!result.ok) {
        setError(ADMIN_ERRORS[result.error]);
        return;
      }
      setEmail("");
      setHandOver({ email: value, outcome: result.data });
      if (result.data.email === "sent") toast(`Meghívó elküldve: ${value}`);
    },
    onError: () => setError(ADMIN_ERRORS.unknown),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setHandOver(undefined);
    const parsed = inviteInput.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? ADMIN_ERRORS.unknown);
      return;
    }
    invite.mutate(parsed.data.email);
  };

  return (
    <Card className="mb-8">
      <form onSubmit={submit} noValidate>
        <h2 className="mb-2 font-display text-2xl">Új admin meghívása</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          E-mailben kap egy ideiglenes jelszót. Első belépéskor saját jelszót ad meg, és beállítja a
          kétlépcsős azonosítást; addig semmihez nem fér hozzá.
        </p>
        <label htmlFor="invite-email" className={labelClass}>
          E-mail-cím
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="invite-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            className={inputClass}
            value={email}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "invite-error" : undefined}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" disabled={invite.isPending} className="shrink-0">
            <UserPlus className="h-4 w-4" aria-hidden />
            {invite.isPending ? "Küldés…" : "Meghívom"}
          </Button>
        </div>
        <Collapse open={Boolean(error)}>
          <p id="invite-error" className="pt-2 text-sm font-bold text-primary-glow">
            {error}
          </p>
        </Collapse>
        <Collapse open={Boolean(handOver)}>{handOver && <HandOver {...handOver} />}</Collapse>
      </form>
    </Card>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [handOver, setHandOver] = useState<AccountEmailOutcome>();
  const done = (result: AdminResult<unknown>, ok: string) => {
    void queryClient.invalidateQueries({ queryKey: ["admin"] });
    if (!result.ok) toast(ADMIN_ERRORS[result.error], "warning");
    else toast(ok);
  };
  const reset = useMutation({
    mutationFn: () => resetAdminFn({ data: { id: user.id } }),
    onSuccess: (result) => {
      done(result, `Fiók visszaállítva: ${user.email}`);
      if (result.ok) setHandOver(result.data);
    },
    onError: () => toast(ADMIN_ERRORS.unknown, "warning"),
  });
  const remove = useMutation({
    mutationFn: () => removeAdminFn({ data: { id: user.id } }),
    onSuccess: (result) => done(result, `Törölve: ${user.email}`),
    onError: () => toast(ADMIN_ERRORS.unknown, "warning"),
  });
  const busy = reset.isPending || remove.isPending;

  let state: string;
  if (user.mustChangePassword) state = "Még nem lépett be (ideiglenes jelszó)";
  else if (!user.hasTwoFactor) state = "Kétlépcsős azonosítás még nincs beállítva";
  else state = "Aktív, kétlépcsős azonosítással";

  return (
    <li>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold [overflow-wrap:anywhere]">
              {user.email}
              {user.isSelf && <span className="ml-2 text-sm text-muted-foreground">(te)</span>}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              {user.hasTwoFactor && !user.mustChangePassword ? (
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
              ) : (
                <ShieldOff className="h-4 w-4" aria-hidden />
              )}
              {state}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Létrehozva: {formatTimestamp(user.createdAt)}
              {user.lastSignInAt && ` · Utolsó belépés: ${formatTimestamp(user.lastSignInAt)}`}
            </p>
          </div>
          {!user.isSelf && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                disabled={busy}
                title="Új ideiglenes jelszó és új kétlépcsős azonosítás (elveszett telefon vagy jelszó)"
                onClick={() => {
                  if (
                    window.confirm(
                      `${user.email} új ideiglenes jelszót kap e-mailben, és újra be kell állítania a kétlépcsős azonosítást. Mehet?`,
                    )
                  )
                    reset.mutate();
                }}
              >
                <KeyRound className="h-4 w-4" aria-hidden /> Visszaállítás
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Biztosan törlöd ${user.email} fiókját?`)) remove.mutate();
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden /> Törlés
              </Button>
            </div>
          )}
        </div>
        <Collapse open={Boolean(handOver)}>
          {handOver && <HandOver email={user.email} outcome={handOver} />}
        </Collapse>
      </Card>
    </li>
  );
}

export function UsersManager() {
  const listRef = useSmoothList<HTMLUListElement>();
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const result = await listAdminsFn();
      if (!result.ok) throw new Error(ADMIN_ERRORS[result.error]);
      return result.data;
    },
  });

  return (
    <>
      <PageTitle>Felhasználók</PageTitle>
      <InviteForm />
      {query.isError ? (
        <Card>
          <p className="mb-3">{query.error.message}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Újrapróbálom
          </Button>
        </Card>
      ) : query.isPending ? (
        <p className="text-muted-foreground">Betöltés…</p>
      ) : (
        <ul ref={listRef} className="space-y-4">
          {query.data.map((u) => (
            <UserRow key={u.id} user={u} />
          ))}
        </ul>
      )}
    </>
  );
}

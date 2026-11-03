import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Beer,
  Eye,
  EyeOff,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Collapse, Swap } from "@/components/motion";
import { useSmoothList } from "@/lib/motion";
import { deleteTapFn, reorderTapsFn, saveTapFn } from "./api";
import {
  ADMIN_ERRORS,
  tapInput,
  tapRow,
  type AdminResult,
  type TapInput,
  type TapRow,
} from "./schema";
import { adminSupabase } from "./supabase";
import { removeUploadedImage, uploadImage } from "./upload";
import { Button, Card, IconButton, PageTitle, inputClass, labelClass, useToast } from "./ui";

const QUERY_KEY = ["admin", "taps"];

function useTaps() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await adminSupabase()
        .from("taps")
        .select("id, name, logo, sort_order, is_active")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return z.array(tapRow).parse(data);
    },
  });
}

/** The logo as the site shows it: cropped to a circle in a gold ring. */
function Logo({ logo, name }: { logo: string; name: string }) {
  return (
    <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-primary bg-background">
      {logo ? (
        <img src={logo} alt={name} className="h-full w-full object-cover" />
      ) : (
        <Beer className="h-8 w-8 text-muted-foreground" aria-hidden />
      )}
    </span>
  );
}

const toForm = (t: TapRow | null): TapInput => ({
  id: t?.id ?? null,
  name: t?.name ?? "",
  logo: t?.logo ?? "",
  isActive: t?.is_active ?? true,
});

function TapForm({ tap, onDone }: { tap: TapRow | null; onDone: () => void }) {
  const [f, setF] = useState<TapInput>(() => toForm(tap));
  const [errors, setErrors] = useState<Partial<Record<keyof TapInput, string>>>({});
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  /** Logos uploaded in this edit; deleted again if they end up unused. */
  const uploaded = useRef<string[]>([]);
  const toast = useToast();
  const queryClient = useQueryClient();

  const cleanup = (keep: string | null) =>
    uploaded.current.filter((u) => u !== keep).forEach((u) => void removeUploadedImage(u));

  const save = useMutation({
    mutationFn: (data: TapInput) => saveTapFn({ data }),
    onSuccess: (result, data) => {
      if (!result.ok) {
        toast(ADMIN_ERRORS[result.error], "warning");
        return;
      }
      cleanup(data.logo);
      toast("Mentve. A főoldalon már így látszik.");
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      onDone();
    },
    onError: () => toast(ADMIN_ERRORS.unknown, "warning"),
  });

  const set = <K extends keyof TapInput>(k: K, v: TapInput[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const pickLogo = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "taps");
      uploaded.current.push(url);
      set("logo", url);
    } catch (error) {
      toast(error instanceof Error ? error.message : ADMIN_ERRORS.unknown, "warning");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = tapInput.safeParse(f);
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof TapInput;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    save.mutate(parsed.data);
  };

  const cancel = () => {
    cleanup(null);
    onDone();
  };

  return (
    <Card className="border-2 border-primary">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <h2 className="font-display text-2xl">{tap ? "Sör szerkesztése" : "Új sör a csapra"}</h2>
        <div>
          <label htmlFor="tap-name" className={labelClass}>
            Név
          </label>
          <input
            id="tap-name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "tap-name-error" : undefined}
            maxLength={60}
            className={inputClass}
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
          />
          {errors.name && (
            <p id="tap-name-error" className="mt-2 text-sm font-bold text-primary-glow">
              {errors.name}
            </p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            A főoldalon csak a logó látszik; a nevet a felolvasóprogramok mondják be.
          </p>
        </div>
        <div>
          <span className={labelClass}>Logó</span>
          <div className="flex flex-wrap items-center gap-4">
            <Logo logo={f.logo} name={f.name} />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              id="tap-logo"
              onChange={(e) => void pickLogo(e.target.files?.[0])}
            />
            <Button variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-4 w-4" aria-hidden />
              {uploading ? "Feltöltés…" : f.logo ? "Másik logó" : "Logó feltöltése"}
            </Button>
          </div>
          {errors.logo && <p className="mt-2 text-sm font-bold text-primary-glow">{errors.logo}</p>}
          <p className="mt-2 text-sm text-muted-foreground">
            Kerek, négyzetes képet tölts fel (PNG vagy JPG); a széleit körre vágjuk, ahogy fent
            látod.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-3 font-bold">
          <input
            type="checkbox"
            className="h-5 w-5 accent-primary"
            checked={f.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
          />
          Most csapon van (látszik a főoldalon)
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={save.isPending || uploading}>
            {save.isPending ? "Mentés…" : "Mentés"}
          </Button>
          <Button variant="ghost" onClick={cancel} disabled={save.isPending}>
            Mégse
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function TapsEditor() {
  // Reordering, adding and deleting slide the rows instead of jumping.
  const listRef = useSmoothList<HTMLOListElement>();
  const query = useTaps();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<TapRow | "new" | null>(null);

  const report = (result: AdminResult, ok: string) => {
    if (result.ok) toast(ok);
    else toast(ADMIN_ERRORS[result.error], "warning");
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  const reorder = useMutation({
    mutationFn: (ids: string[]) => reorderTapsFn({ data: { ids } }),
    onSuccess: (r) => report(r, "Sorrend mentve."),
  });
  const toggle = useMutation({
    mutationFn: (t: TapRow) =>
      saveTapFn({ data: { id: t.id, name: t.name, logo: t.logo, isActive: !t.is_active } }),
    onSuccess: (r, t) => report(r, t.is_active ? "Levéve a csapról." : "Újra csapon."),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteTapFn({ data: { id } }),
    onSuccess: (r) => report(r, "Törölve."),
  });

  const rows = query.data ?? [];
  const visible = rows.filter((t) => t.is_active).length;
  const busy = reorder.isPending || toggle.isPending || remove.isPending;

  const move = (index: number, delta: number) => {
    const ids = rows.map((t) => t.id);
    const [id] = ids.splice(index, 1);
    if (!id) return;
    ids.splice(index + delta, 0, id);
    reorder.mutate(ids);
  };

  return (
    <>
      <PageTitle
        aside={
          editing === null && (
            <Button onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" aria-hidden /> Új sör
            </Button>
          )
        }
      >
        Most csapon
      </PageTitle>
      <p className="mb-6 max-w-2xl text-muted-foreground">
        Minden sör egy arany csap a főoldalon, a logójával a karon, ebben a sorrendben (balról
        jobbra). Ha egy hordó kifogy, vedd le a csapról a szem ikonnal; ha egy sem látszik, a
        szekció eltűnik.
        {visible > 0 && ` Most ${visible} csap látszik.`}
      </p>

      <Collapse open={editing === "new"}>
        <div className="pb-6">
          <TapForm tap={null} onDone={() => setEditing(null)} />
        </div>
      </Collapse>

      {query.isError ? (
        <Card>
          <p className="mb-3">Nem sikerült betölteni a söröket.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Újrapróbálom
          </Button>
        </Card>
      ) : query.isPending ? (
        <p className="text-muted-foreground">Betöltés…</p>
      ) : rows.length === 0 && editing !== "new" ? (
        <Card>
          <p className="text-muted-foreground">Még nincs sör a csapon.</p>
        </Card>
      ) : (
        <ol ref={listRef} className="space-y-4">
          {rows.map((t, i) =>
            editing !== "new" && editing?.id === t.id ? (
              <li key={t.id}>
                <Swap id="edit">
                  <TapForm tap={t} onDone={() => setEditing(null)} />
                </Swap>
              </li>
            ) : (
              <li key={t.id}>
                <Card
                  className={cn("flex flex-wrap items-center gap-4", !t.is_active && "opacity-60")}
                >
                  <Logo logo={t.logo} name={t.name} />
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-display text-2xl">{t.name}</p>
                    {!t.is_active && (
                      <p className="text-sm font-bold text-muted-foreground">Nincs csapon</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <IconButton
                      label="Előrébb"
                      disabled={busy || i === 0}
                      onClick={() => move(i, -1)}
                    >
                      <ArrowUp className="h-5 w-5" />
                    </IconButton>
                    <IconButton
                      label="Hátrébb"
                      disabled={busy || i === rows.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDown className="h-5 w-5" />
                    </IconButton>
                    <IconButton
                      label={t.is_active ? "Levétel a csapról" : "Vissza a csapra"}
                      disabled={busy}
                      onClick={() => toggle.mutate(t)}
                    >
                      {t.is_active ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </IconButton>
                    <IconButton label="Szerkesztés" disabled={busy} onClick={() => setEditing(t)}>
                      <Pencil className="h-5 w-5" />
                    </IconButton>
                    <IconButton
                      label="Törlés"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(`Biztosan törlöd: ${t.name}?`)) remove.mutate(t.id);
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                    </IconButton>
                  </div>
                </Card>
              </li>
            ),
          )}
        </ol>
      )}
    </>
  );
}

import { useRef, useState, type ButtonHTMLAttributes, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { Picture } from "@/components/Picture";
import { Price } from "@/components/Price";
import { images, resolveImage } from "@/data/images";
import { cn } from "@/lib/utils";
import { deleteSpecialFn, reorderSpecialsFn, saveSpecialFn } from "./api";
import {
  ADMIN_ERRORS,
  specialInput,
  specialRow,
  type AdminResult,
  type SpecialInput,
  type SpecialRow,
} from "./schema";
import { adminSupabase } from "./supabase";
import { Collapse, Swap } from "@/components/motion";
import { useSmoothList } from "@/lib/motion";
import { removeUploadedImage, uploadImage } from "./upload";
import { Button, Card, Chip, PageTitle, inputClass, labelClass, useToast } from "./ui";
import { SpiceIcon } from "@/features/menu/SpiceIcon";
import { SPICE_LABELS, SPICE_LEVELS } from "@/data/specials";

const QUERY_KEY = ["admin", "specials"];

function useSpecials() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await adminSupabase()
        .from("monthly_specials")
        .select("id, name, description, price, image, spice, sort_order, is_active")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return z.array(specialRow).parse(data);
    },
  });
}

function Thumb({ image, name }: { image: string | null; name: string }) {
  return (
    <Picture
      image={resolveImage(image) ?? images.burgerHero}
      alt={name}
      sizes="96px"
      className="h-20 w-20 shrink-0 rounded-2xl bg-background object-contain p-1"
    />
  );
}

type FormState = Omit<SpecialInput, "price"> & { price: string };

const toForm = (s: SpecialRow | null): FormState => ({
  id: s?.id ?? null,
  name: s?.name ?? "",
  description: s?.description ?? "",
  price: s ? String(s.price) : "",
  image: s?.image ?? null,
  spice: s?.spice ?? 0,
  isActive: s?.is_active ?? true,
});

function SpecialForm({ special, onDone }: { special: SpecialRow | null; onDone: () => void }) {
  const [f, setF] = useState<FormState>(() => toForm(special));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  /** Images uploaded in this edit; deleted again if they end up unused. */
  const uploaded = useRef<string[]>([]);
  const toast = useToast();
  const queryClient = useQueryClient();

  const cleanup = (keep: string | null) =>
    uploaded.current.filter((u) => u !== keep).forEach((u) => void removeUploadedImage(u));

  const save = useMutation({
    mutationFn: (data: SpecialInput) => saveSpecialFn({ data }),
    onSuccess: (result, data) => {
      if (!result.ok) {
        toast(ADMIN_ERRORS[result.error], "warning");
        return;
      }
      cleanup(data.image);
      toast("Mentve. A főoldalon már az új ajánlat látszik.");
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      onDone();
    },
    onError: () => toast(ADMIN_ERRORS.unknown, "warning"),
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "specials");
      uploaded.current.push(url);
      set("image", url);
    } catch (error) {
      toast(error instanceof Error ? error.message : ADMIN_ERRORS.unknown, "warning");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = specialInput.safeParse({
      ...f,
      price: f.price.trim() === "" ? undefined : Number(f.price.replace(/\s/g, "")),
    });
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState;
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

  const field = (name: keyof FormState) => ({
    id: `special-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `special-${name}-error` : undefined,
  });
  const error = (name: keyof FormState) =>
    errors[name] && (
      <p id={`special-${name}-error`} className="mt-2 text-sm font-bold text-primary-glow">
        {errors[name]}
      </p>
    );

  return (
    <Card className="border-2 border-primary">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <h2 className="font-display text-2xl">{special ? "Ajánlat szerkesztése" : "Új ajánlat"}</h2>
        <div>
          <label htmlFor="special-name" className={labelClass}>
            Név
          </label>
          <input
            {...field("name")}
            maxLength={40}
            className={inputClass}
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
          />
          {error("name")}
        </div>
        <div>
          <label htmlFor="special-description" className={labelClass}>
            Leírás{" "}
            <span className="font-normal text-muted-foreground">({f.description.length}/300)</span>
          </label>
          <textarea
            {...field("description")}
            rows={3}
            maxLength={300}
            className={inputClass}
            value={f.description}
            onChange={(e) => set("description", e.target.value)}
          />
          {error("description")}
        </div>
        <div className="max-w-48">
          <label htmlFor="special-price" className={labelClass}>
            Ár (Ft)
          </label>
          <input
            {...field("price")}
            inputMode="numeric"
            className={inputClass}
            placeholder="4290"
            value={f.price}
            onChange={(e) => set("price", e.target.value)}
          />
          {error("price")}
        </div>
        <div>
          <span className={labelClass}>Kép</span>
          <div className="flex flex-wrap items-center gap-4">
            <Thumb image={f.image} name={f.name} />
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                id="special-image"
                onChange={(e) => void pickImage(e.target.files?.[0])}
              />
              <Button
                variant="outline"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" aria-hidden />
                {uploading ? "Feltöltés…" : "Új kép"}
              </Button>
              {f.image && (
                <Button variant="ghost" onClick={() => set("image", null)} disabled={uploading}>
                  Alapkép
                </Button>
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Legszebb egy kivágott, átlátszó hátterű burgerfotó (PNG). Kép nélkül az alap burgerfotó
            jelenik meg.
          </p>
        </div>
        <div>
          <span id="special-spice-label" className={labelClass}>
            Csípősség
          </span>
          <div role="group" aria-labelledby="special-spice-label" className="flex flex-wrap gap-2">
            {SPICE_LEVELS.map((level) => (
              <Chip
                key={level}
                selected={f.spice === level}
                onClick={() => set("spice", level)}
                className="inline-flex items-center gap-2"
              >
                <SpiceIcon level={level} className="h-5" decorative />
                {SPICE_LABELS[level]}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            A kártya jobb felső sarkában egy vagy két chili jelzi.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-3 font-bold">
          <input
            type="checkbox"
            className="h-5 w-5 accent-primary"
            checked={f.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
          />
          Látható a főoldalon
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

export function SpecialsEditor() {
  // Reordering, adding and deleting slide the cards instead of jumping.
  const listRef = useSmoothList<HTMLOListElement>();
  const query = useSpecials();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<SpecialRow | "new" | null>(null);

  const report = (result: AdminResult, ok: string) => {
    if (result.ok) toast(ok);
    else toast(ADMIN_ERRORS[result.error], "warning");
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  const reorder = useMutation({
    mutationFn: (ids: string[]) => reorderSpecialsFn({ data: { ids } }),
    onSuccess: (r) => report(r, "Sorrend mentve."),
  });
  const toggle = useMutation({
    mutationFn: (s: SpecialRow) =>
      saveSpecialFn({
        data: {
          id: s.id,
          name: s.name,
          description: s.description,
          price: s.price,
          image: s.image,
          spice: s.spice,
          isActive: !s.is_active,
        },
      }),
    onSuccess: (r, s) =>
      report(r, s.is_active ? "Elrejtve a főoldalról." : "Megjelenik a főoldalon."),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteSpecialFn({ data: { id } }),
    onSuccess: (r) => report(r, "Törölve."),
  });

  const rows = query.data ?? [];
  const visible = rows.filter((s) => s.is_active).length;
  const busy = reorder.isPending || toggle.isPending || remove.isPending;

  const move = (index: number, delta: number) => {
    const ids = rows.map((s) => s.id);
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
              <Plus className="h-4 w-4" aria-hidden /> Új ajánlat
            </Button>
          )
        }
      >
        Hónap ajánlata
      </PageTitle>
      <p className="mb-6 max-w-2xl text-muted-foreground">
        Ezek a kártyák a főoldalon, a „Hónap ajánlata” szekcióban jelennek meg, ebben a sorrendben.
        Három látható ajánlat tölt ki szépen egy sort; ha egy sincs, a szekció eltűnik.
        {visible > 0 && ` Most ${visible} látható.`}
      </p>

      <Collapse open={editing === "new"}>
        <div className="pb-6">
          <SpecialForm special={null} onDone={() => setEditing(null)} />
        </div>
      </Collapse>

      {query.isError ? (
        <Card>
          <p className="mb-3">Nem sikerült betölteni az ajánlatokat.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Újrapróbálom
          </Button>
        </Card>
      ) : query.isPending ? (
        <p className="text-muted-foreground">Betöltés…</p>
      ) : rows.length === 0 && editing !== "new" ? (
        <Card>
          <p className="text-muted-foreground">Még nincs ajánlat.</p>
        </Card>
      ) : (
        <ol ref={listRef} className="space-y-4">
          {rows.map((s, i) =>
            editing !== "new" && editing?.id === s.id ? (
              <li key={s.id}>
                <Swap id="edit">
                  <SpecialForm special={s} onDone={() => setEditing(null)} />
                </Swap>
              </li>
            ) : (
              <li key={s.id}>
                <Card
                  className={cn("flex flex-wrap items-center gap-4", !s.is_active && "opacity-60")}
                >
                  <Thumb image={s.image} name={s.name} />
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-script text-3xl">{s.name}</p>
                    <p className="flex items-center gap-2">
                      <Price value={s.price} className="font-bold text-primary" />
                      <SpiceIcon level={s.spice} className="h-6" />
                    </p>
                    {!s.is_active && (
                      <p className="text-sm font-bold text-muted-foreground">Rejtett</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <IconButton
                      label="Feljebb"
                      disabled={busy || i === 0}
                      onClick={() => move(i, -1)}
                    >
                      <ArrowUp className="h-5 w-5" />
                    </IconButton>
                    <IconButton
                      label="Lejjebb"
                      disabled={busy || i === rows.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDown className="h-5 w-5" />
                    </IconButton>
                    <IconButton
                      label={s.is_active ? "Elrejtés" : "Megjelenítés"}
                      disabled={busy}
                      onClick={() => toggle.mutate(s)}
                    >
                      {s.is_active ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </IconButton>
                    <IconButton label="Szerkesztés" disabled={busy} onClick={() => setEditing(s)}>
                      <Pencil className="h-5 w-5" />
                    </IconButton>
                    <IconButton
                      label="Törlés"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(`Biztosan törlöd: ${s.name}?`)) remove.mutate(s.id);
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

function IconButton({
  label,
  children,
  ...props
}: { label: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid h-11 w-11 place-items-center rounded-full border-2 border-border text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  );
}

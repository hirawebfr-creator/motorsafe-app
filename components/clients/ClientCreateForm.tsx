"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/Toast";

type GarageOption = { id: number; name: string };

type VatMode = "STANDARD" | "REDUCED_10" | "REDUCED_55" | "EXEMPT" | "CUSTOM";

const vatSchema = z.enum(["STANDARD", "REDUCED_10", "REDUCED_55", "EXEMPT", "CUSTOM"]);

const schema = z.object({
  garageId: z.string().min(1, "Sélectionne un garage"),

  firstName: z.string().trim().min(2, "Prénom requis"),
  lastName: z.string().trim().min(2, "Nom requis"),
  email: z.string().trim().toLowerCase().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  gender: z.enum(["HOMME", "FEMME"]).optional(),

  address: z.string().trim().optional().or(z.literal("")),

  vatMode: vatSchema.default("STANDARD"),
  vatCustomRate: z.coerce.number().min(0).max(100).optional(),
});

type FormValues = z.input<typeof schema>;

const UI = {
  page: "w-full",

  panel:
    "mx-auto w-full max-w-[409px] bg-white rounded-[10px] shadow-[0px_10px_30px_rgba(3,2,41,0.06)] border border-[rgba(3,2,41,0.08)]",
  panelInner: "flex h-full flex-col px-7 py-6",
  panelHeader: "flex items-start justify-between gap-3 pb-4",
  panelTitle: "text-[20px] font-semibold",
  panelHint: "mt-1 text-[13px] text-[#030229]/55",
  divider: "h-px w-full bg-[rgba(3,2,41,0.08)]",
  closeBtn:
    "inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E71D36]/5 text-[#E71D36] hover:bg-[#E71D36]/10",
  closeIcon: "h-2.5 w-2.5 rounded bg-[#E71D36]",

  form: "mt-6 flex flex-1 flex-col",
  fields: "space-y-4",
  fieldsCard: "rounded-[14px] border border-[rgba(3,2,41,0.08)] bg-[#FAFAFB] p-4",
  field: "space-y-1.5",
  label: "text-[12px] font-semibold text-[#030229]/80",
  input:
    "h-[50px] w-full rounded-[10px] bg-[#F7F7F8] px-4 text-[14px] text-[#030229] outline-none placeholder:text-[#030229]/45 border border-[rgba(3,2,41,0.14)] focus:border-[#605BFF] focus:ring-4 focus:ring-[#605BFF]/15",
  select:
    "h-[50px] w-full rounded-[10px] bg-[#F7F7F8] px-4 text-[14px] text-[#030229] outline-none border border-[rgba(3,2,41,0.14)] focus:border-[#605BFF] focus:ring-4 focus:ring-[#605BFF]/15",
  error: "text-[12px] text-[#D11A2A]",
  banner:
    "mb-4 rounded-[12px] border border-[rgba(209,26,42,0.20)] bg-[rgba(209,26,42,0.06)] px-4 py-3 text-[13px] text-[#030229]",

  footer: "mt-auto pt-6",
  submit:
    "h-[50px] w-full rounded-[10px] bg-[#605BFF] text-[16px] font-medium text-white hover:opacity-95 disabled:opacity-60",
};

function vatLabel(mode: VatMode) {
  switch (mode) {
    case "STANDARD":
      return "Standard (20%)";
    case "REDUCED_10":
      return "Réduite (10%)";
    case "REDUCED_55":
      return "Réduite (5,5%)";
    case "EXEMPT":
      return "Exonérée (0%)";
    case "CUSTOM":
      return "Personnalisée";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractGarages(json: unknown): GarageOption[] {
  const direct = Array.isArray(json) ? json : null;
  const rec = isRecord(json) ? json : null;
  const data = rec && isRecord(rec.data) ? rec.data : null;

  const items: unknown[] =
    direct ??
    (rec && Array.isArray(rec.items) ? (rec.items as unknown[]) : null) ??
    (rec && Array.isArray(rec.garages) ? (rec.garages as unknown[]) : null) ??
    (data && Array.isArray(data.items) ? (data.items as unknown[]) : null) ??
    (data && Array.isArray(data.garages) ? (data.garages as unknown[]) : null) ??
    [];

  return items
    .map((g): GarageOption | null => {
      const r = isRecord(g) ? g : null;
      const id = Number(r?.id);
      const nameRaw = r?.name;
      const name = typeof nameRaw === "string" ? nameRaw : String(nameRaw ?? "");
      if (!Number.isFinite(id) || id <= 0) return null;
      if (!name.trim()) return null;
      return { id, name: name.trim() };
    })
    .filter((g): g is GarageOption => Boolean(g));
}

export function ClientCreateForm() {
  const router = useRouter();
  const toast = useToast();

  const [garages, setGarages] = React.useState<GarageOption[]>([]);
  const [loadingGarages, setLoadingGarages] = React.useState(true);
  const [garagesError, setGaragesError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      garageId: "",
      firstName: "",
      lastName: "",
      vatMode: "STANDARD",
      vatCustomRate: undefined,
      email: "",
      phone: "",
      gender: undefined,
      address: "",
    },
    mode: "onBlur",
  });

  const vatMode = (form.watch("vatMode") ?? "STANDARD") as VatMode;

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingGarages(true);
        setGaragesError(null);

        const res = await fetch("/api/garages", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          const message = json?.error?.message || json?.error || `GET /api/garages ${res.status}`;
          throw new Error(message);
        }

        const list = extractGarages(json);
        if (!mounted) return;

        setGarages(list);

        const current = form.getValues("garageId");
        if (!current && list[0]?.id != null) {
          form.setValue("garageId", String(list[0].id), { shouldValidate: true });
        }
      } catch (e) {
        if (!mounted) return;
        setGarages([]);
        form.setValue("garageId", "", { shouldValidate: true });
        setGaragesError(e instanceof Error ? e.message : "Impossible de charger les garages");
      } finally {
        if (mounted) setLoadingGarages(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [form]);

  const garageDisabled = loadingGarages || garages.length <= 1;

  async function onSubmit(values: FormValues) {
    const effectiveVatMode = (values.vatMode ?? "STANDARD") as VatMode;
    const customRateNum =
      values.vatCustomRate === undefined || values.vatCustomRate === null || values.vatCustomRate === ""
        ? undefined
        : Number(values.vatCustomRate);

    if (effectiveVatMode === "CUSTOM") {
      if (customRateNum === undefined || Number.isNaN(customRateNum)) {
        form.setError("vatCustomRate", { message: "Renseigne un taux personnalisé (0 à 100)" });
        return;
      }
    }

    const payload = {
      garageId: Number(values.garageId),
      name: `${values.firstName ?? ""} ${values.lastName ?? ""}`.trim(),
      email: values.email || "",
      phone: values.phone || "",
      address: values.address || "",
      vatMode: effectiveVatMode,
      vatRate: effectiveVatMode === "CUSTOM" ? Number(customRateNum) / 100 : undefined,
    };

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.ok) {
      const message = json?.error?.message || json?.error || `POST /api/clients ${res.status}`;
      throw new Error(message);
    }

    const createdId = json?.data?.id;

    toast.push({
      variant: "success",
      title: "Client créé",
      description: "Le client a été créé avec succès.",
    });

    router.push(createdId ? `/clients/${createdId}` : "/clients");
    router.refresh();
  }

  return (
    <div className={UI.page}>
      <div className={UI.panel}>
        <div className={UI.panelInner}>
            <div className={UI.panelHeader}>
              <div>
                <div className={UI.panelTitle}>Ajouter un client</div>
                <div className={UI.panelHint}>Renseigne les informations ci-dessous.</div>
              </div>
              <button type="button" className={UI.closeBtn} aria-label="Fermer" onClick={() => router.push("/clients")}>
                <span className={UI.closeIcon} />
              </button>
            </div>

            <div className={UI.divider} />

            <form
              className={UI.form}
              onSubmit={form.handleSubmit(async (v: FormValues) => {
                try {
                  await onSubmit(v);
                } catch (e) {
                  const message = e instanceof Error ? e.message : "Création impossible";
                  form.setError("garageId", { message });
                }
              })}
            >
              {garagesError ? <div className={UI.banner}>{garagesError}</div> : null}
              {form.formState.errors.garageId?.message ? <div className={UI.banner}>{form.formState.errors.garageId.message}</div> : null}

              <div className={UI.fieldsCard}>
                <div className={UI.fields}>
                  <div className={UI.field}>
                    <label className={UI.label} htmlFor="garageId">
                      Garage
                    </label>
                    <select id="garageId" className={UI.select} disabled={garageDisabled} {...form.register("garageId")}>
                      <option value="">
                        {loadingGarages ? "Chargement des garages…" : garages.length ? "Sélectionner un garage" : "Aucun garage"}
                      </option>
                      {garages.map((g) => (
                        <option key={g.id} value={String(g.id)}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className={UI.field}>
                      <label className={UI.label} htmlFor="firstName">
                        Prénom
                      </label>
                      <input id="firstName" className={UI.input} placeholder="John" {...form.register("firstName")} />
                      {form.formState.errors.firstName?.message ? (
                        <div className={UI.error}>{form.formState.errors.firstName.message}</div>
                      ) : null}
                    </div>

                    <div className={UI.field}>
                      <label className={UI.label} htmlFor="lastName">
                        Nom
                      </label>
                      <input id="lastName" className={UI.input} placeholder="Deo" {...form.register("lastName")} />
                      {form.formState.errors.lastName?.message ? (
                        <div className={UI.error}>{form.formState.errors.lastName.message}</div>
                      ) : null}
                    </div>
                  </div>

                  <div className={UI.field}>
                    <label className={UI.label} htmlFor="email">
                      Email
                    </label>
                    <input id="email" className={UI.input} placeholder="exemple@gmail.com" {...form.register("email")} />
                    {form.formState.errors.email?.message ? <div className={UI.error}>{form.formState.errors.email.message}</div> : null}
                  </div>

                  <div className={UI.field}>
                    <label className={UI.label} htmlFor="phone">
                      Téléphone
                    </label>
                    <input id="phone" className={UI.input} placeholder="06 00 00 00 00" {...form.register("phone")} />
                  </div>

                  <div className={UI.field}>
                    <label className={UI.label} htmlFor="gender">
                      Genre
                    </label>
                    <select id="gender" className={UI.select} defaultValue="" {...form.register("gender")}>
                      <option value="">Sélectionner</option>
                      <option value="HOMME">Homme</option>
                      <option value="FEMME">Femme</option>
                    </select>
                  </div>

                  <div className={UI.field}>
                    <label className={UI.label} htmlFor="address">
                      Adresse (optionnel)
                    </label>
                    <input id="address" className={UI.input} placeholder="2 rue de la Rive…" {...form.register("address")} />
                  </div>

                  <div className={UI.field}>
                    <label className={UI.label} htmlFor="vatMode">
                      TVA
                    </label>
                    <select id="vatMode" className={UI.select} {...form.register("vatMode")}>
                      <option value="STANDARD">{vatLabel("STANDARD")}</option>
                      <option value="REDUCED_10">{vatLabel("REDUCED_10")}</option>
                      <option value="REDUCED_55">{vatLabel("REDUCED_55")}</option>
                      <option value="EXEMPT">{vatLabel("EXEMPT")}</option>
                      <option value="CUSTOM">{vatLabel("CUSTOM")}</option>
                    </select>
                  </div>

                  {vatMode === "CUSTOM" ? (
                    <div className={UI.field}>
                      <label className={UI.label} htmlFor="vatCustomRate">
                        Taux TVA personnalisé (%)
                      </label>
                      <input
                        id="vatCustomRate"
                        type="number"
                        step="0.1"
                        className={UI.input}
                        placeholder="Ex: 8.5"
                        {...form.register("vatCustomRate")}
                      />
                      {form.formState.errors.vatCustomRate?.message ? (
                        <div className={UI.error}>{form.formState.errors.vatCustomRate.message}</div>
                      ) : (
                        <div className="text-[12px] text-[#030229]/55">Entre 0 et 100.</div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className={UI.footer}>
                <button type="submit" className={UI.submit} disabled={form.formState.isSubmitting || garages.length === 0}>
                  {form.formState.isSubmitting ? "Création…" : "Ajouter"}
                </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
}

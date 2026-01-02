# UI_CODE_DUMP — SafeMotor

Ce fichier est généré automatiquement.

**Scope:** `app/**` (hors `app/api/**`), `components/**`, `tailwind.config.js`.

**Génération:** `node scripts/dump-ui.js`

## Index

- [app/(dashboard)/admin/garages/page.tsx](#app-dashboard-admin-garages-pagetsx)
- [app/(dashboard)/admin/page.tsx](#app-dashboard-admin-pagetsx)
- [app/(dashboard)/admin/pro-demandes/page.tsx](#app-dashboard-admin-pro-demandes-pagetsx)
- [app/(dashboard)/admin/references/page.tsx](#app-dashboard-admin-references-pagetsx)
- [app/(dashboard)/clients/[id]/page.tsx](#app-dashboard-clients-id-pagetsx)
- [app/(dashboard)/clients/page.tsx](#app-dashboard-clients-pagetsx)
- [app/(dashboard)/dashboard/page.tsx](#app-dashboard-dashboard-pagetsx)
- [app/(dashboard)/documents/page.tsx](#app-dashboard-documents-pagetsx)
- [app/(dashboard)/interventions/[id]/page.tsx](#app-dashboard-interventions-id-pagetsx)
- [app/(dashboard)/interventions/page.tsx](#app-dashboard-interventions-pagetsx)
- [app/(dashboard)/layout.tsx](#app-dashboard-layouttsx)
- [app/(dashboard)/parametres/page.tsx](#app-dashboard-parametres-pagetsx)
- [app/(dashboard)/parametres/ParametresClient.tsx](#app-dashboard-parametres-parametresclienttsx)
- [app/(dashboard)/settings/page.tsx](#app-dashboard-settings-pagetsx)
- [app/(dashboard)/vehicules/[id]/page.tsx](#app-dashboard-vehicules-id-pagetsx)
- [app/(dashboard)/vehicules/page.tsx](#app-dashboard-vehicules-pagetsx)
- [app/auth/login/page.tsx](#app-auth-login-pagetsx)
- [app/auth/pending/page.tsx](#app-auth-pending-pagetsx)
- [app/auth/register-pro/page.tsx](#app-auth-register-pro-pagetsx)
- [app/globals.css](#app-globalscss)
- [app/layout.tsx](#app-layouttsx)
- [app/legal/page.tsx](#app-legal-pagetsx)
- [app/page.tsx](#app-pagetsx)
- [app/pro/en-attente/page.tsx](#app-pro-en-attente-pagetsx)
- [app/pro/inscription/page.tsx](#app-pro-inscription-pagetsx)
- [app/pro/page.tsx](#app-pro-pagetsx)
- [app/pro/pending/page.tsx](#app-pro-pending-pagetsx)
- [app/pro/signup/page.tsx](#app-pro-signup-pagetsx)
- [components/common/BadgeStatus.tsx](#components-common-badgestatustsx)
- [components/common/DataCards.tsx](#components-common-datacardstsx)
- [components/common/DataTable.tsx](#components-common-datatabletsx)
- [components/common/EmptyState.tsx](#components-common-emptystatetsx)
- [components/common/ErrorBanner.tsx](#components-common-errorbannertsx)
- [components/common/LegalReferencesConfig.ts](#components-common-legalreferencesconfigts)
- [components/common/LegalReferencesPanel.tsx](#components-common-legalreferencespaneltsx)
- [components/common/Loading.tsx](#components-common-loadingtsx)
- [components/common/PageHeader.tsx](#components-common-pageheadertsx)
- [components/common/Skeleton.tsx](#components-common-skeletontsx)
- [components/common/StatCard.tsx](#components-common-statcardtsx)
- [components/dashboard-shell.tsx](#components-dashboard-shelltsx)
- [components/layout/AppShell.tsx](#components-layout-appshelltsx)
- [components/layout/MobileNav.tsx](#components-layout-mobilenavtsx)
- [components/layout/nav-config.ts](#components-layout-nav-configts)
- [components/layout/Sidebar.tsx](#components-layout-sidebartsx)
- [components/layout/Topbar.tsx](#components-layout-topbartsx)
- [components/parametres/ComplianceToggles.tsx](#components-parametres-compliancetogglestsx)
- [components/ui/Badge.tsx](#components-ui-badgetsx)
- [components/ui/Button.tsx](#components-ui-buttontsx)
- [components/ui/Card.tsx](#components-ui-cardtsx)
- [components/ui/container/Container.tsx](#components-ui-container-containertsx)
- [components/ui/DataTable.tsx](#components-ui-datatabletsx)
- [components/ui/Dialog.tsx](#components-ui-dialogtsx)
- [components/ui/DropdownMenu.tsx](#components-ui-dropdownmenutsx)
- [components/ui/Input.tsx](#components-ui-inputtsx)
- [components/ui/KpiCard.tsx](#components-ui-kpicardtsx)
- [components/ui/navigation/Drawer.tsx](#components-ui-navigation-drawertsx)
- [components/ui/SectionHeader.tsx](#components-ui-sectionheadertsx)
- [components/ui/Select.tsx](#components-ui-selecttsx)
- [components/ui/Skeleton.tsx](#components-ui-skeletontsx)
- [components/ui/Table.tsx](#components-ui-tabletsx)
- [components/ui/Textarea.tsx](#components-ui-textareatsx)
- [components/ui/Toast.tsx](#components-ui-toasttsx)
- [components/ui/Toggle.tsx](#components-ui-toggletsx)
- [components/ui/Tooltip.tsx](#components-ui-tooltiptsx)
- [components/user-context.tsx](#components-user-contexttsx)
- [tailwind.config.js](#tailwindconfigjs)

---

## app/(dashboard)/admin/garages/page.tsx
<a id="app-dashboard-admin-garages-pagetsx"></a>

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useUser } from "@/components/user-context";
import { fetcher } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";

type GarageItem = {
  id: number;
  name: string;
  email: string;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  createdAt: string;
  users: Array<{ id: string; email: string; role: string; createdAt: string }>;
};

export default function AdminGaragesPage() {
  const user = useUser();
  if (!user) return null;
  const [garages, setGarages] = useState<GarageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [keyReady, setKeyReady] = useState(user.role === "ADMIN");
  const isAdmin = user.role === "ADMIN";

  useEffect(() => {
    if (isAdmin) return;
    const stored = window.localStorage.getItem("ms_admin_key");
    if (stored) {
      setAdminKey(stored);
      setKeyReady(true);
    }
  }, [isAdmin]);

  const loadGarages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<GarageItem[]>("/api/admin/garages", {
        noStore: true,
        headers: !isAdmin && adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      setGarages(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (keyReady) {
      loadGarages();
    }
  }, [keyReady]);

  if (!keyReady && !isAdmin) {
    return (
      <Card className="p-6">
        <p className="text-sm text-[color:var(--textMuted)]">
          Accès réservé à l'administration. Renseignez votre ADMIN_KEY pour continuer.
        </p>
        <div className="mt-4 grid gap-3 max-w-md">
          <Input
            label="ADMIN_KEY"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="ADMIN_KEY"
          />
          <Button
            onClick={() => {
              if (!adminKey.trim()) return;
              window.localStorage.setItem("ms_admin_key", adminKey.trim());
              setKeyReady(true);
            }}
          >
            Deverrouiller
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Tous les garages"
        description="Liste complète des garages inscrits sur la plateforme."
        action={
          <Link
            href="/admin"
            className="text-sm font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]"
          >
            Retour validations
          </Link>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <Card className="p-0 overflow-hidden">
        <DataTable stickyHeader className="rounded-none border-0 shadow-none">
          <DataTableHead sticky>
            <tr>
              <th className="px-5 py-4">Garage</th>
              <th className="px-5 py-4">Statut</th>
              <th className="px-5 py-4">Responsable</th>
              <th className="px-5 py-4 text-right">Création</th>
            </tr>
          </DataTableHead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-5 py-6" colSpan={4}>
                  <Loading />
                </td>
              </tr>
            ) : garages.length === 0 ? (
              <tr>
                <td className="px-5 py-6" colSpan={4}>
                  <EmptyState title="Aucun garage" description="Les garages apparaitront ici." />
                </td>
              </tr>
            ) : (
              garages.map((garage) => (
                <tr
                  key={garage.id}
                  className="border-t border-[color:var(--border)] transition hover:bg-[color:var(--surface2)]"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[color:var(--text)]">{garage.name}</p>
                    <p className="text-xs text-[color:var(--textMuted)]">{garage.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant={
                        garage.status === "ACTIVE"
                          ? "success"
                          : garage.status === "REJECTED"
                          ? "neutral"
                          : "warning"
                      }
                    >
                      {garage.status === "ACTIVE"
                        ? "Actif"
                        : garage.status === "REJECTED"
                        ? "Refusé"
                        : "En attente"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-sm text-[color:var(--textMuted)]">
                    {garage.users[0]?.email ?? "-"}
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-[color:var(--textMuted)]">
                    {new Date(garage.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>
      </Card>
    </div>
  );
}

```

## app/(dashboard)/admin/page.tsx
<a id="app-dashboard-admin-pagetsx"></a>

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useUser } from "@/components/user-context";
import { fetcher, requestJson } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { SectionHeader } from "@/components/ui/SectionHeader";

type GarageItem = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  siret?: string | null;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  createdAt: string;
  users: Array<{ id: string; email: string; role: string; createdAt: string }>;
};

export default function AdminPendingPage() {
  const user = useUser();
  if (!user) return null;
  const [garages, setGarages] = useState<GarageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [keyReady, setKeyReady] = useState(user.role === "ADMIN");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<GarageItem | null>(null);
  const isAdmin = user.role === "ADMIN";
  const toast = useToast();

  useEffect(() => {
    if (isAdmin) return;
    const stored = window.localStorage.getItem("ms_admin_key");
    if (stored) {
      setAdminKey(stored);
      setKeyReady(true);
    }
  }, [isAdmin]);

  const loadPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<GarageItem[]>("/api/admin/garages?status=pending", {
        noStore: true,
        headers: !isAdmin && adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      setGarages(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: number) => {
    setError(null);
    try {
      await requestJson(`/api/admin/garages/${id}/approve`, {
        method: "POST",
        body: {},
        noStore: true,
        headers: !isAdmin && adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      toast.push({
        title: "Garage approuve",
        description: "Le compte est maintenant actif.",
        variant: "success",
      });
      await loadPending();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  const openReject = (garage: GarageItem) => {
    setRejectTarget(garage);
    setRejectReason("");
    setRejectOpen(true);
  };

  const reject = async () => {
    if (!rejectTarget) return;
    setError(null);
    try {
      await requestJson(`/api/admin/garages/${rejectTarget.id}/reject`, {
        method: "POST",
        body: { reviewNote: rejectReason },
        noStore: true,
        headers: !isAdmin && adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      toast.push({
        title: "Garage refuse",
        description: "La demande a ete refusee.",
        variant: "info",
      });
      await loadPending();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    } finally {
      setRejectOpen(false);
      setRejectTarget(null);
      setRejectReason("");
    }
  };

  useEffect(() => {
    if (keyReady) {
      loadPending();
    }
  }, [keyReady]);

  if (!keyReady && !isAdmin) {
    return (
      <Card className="p-6">
        <p className="text-sm text-[color:var(--textMuted)]">
          Accès réservé à l'administration. Renseignez votre ADMIN_KEY pour continuer.
        </p>
        <div className="mt-4 grid gap-3 max-w-md">
          <Input
            label="ADMIN_KEY"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="ADMIN_KEY"
          />
          <Button
            onClick={() => {
              if (!adminKey.trim()) return;
              window.localStorage.setItem("ms_admin_key", adminKey.trim());
              setKeyReady(true);
            }}
          >
            Deverrouiller
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Demandes en attente"
        description="Gérez les demandes d'inscription des garages. Approvez ou refusez avec un motif."
        action={
          <Link
            href="/admin/garages"
            className="text-sm font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]"
          >
            Voir tous les garages
          </Link>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <Loading />
      ) : garages.length === 0 ? (
        <EmptyState title="Aucune demande" description="Les demandes en attente apparaitront ici." />
      ) : (
        <div className="grid gap-4">
          {garages.map((garage) => (
            <Card key={garage.id} className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[color:var(--text)]">{garage.name}</p>
                  <p className="text-xs text-[color:var(--textMuted)]">{garage.email}</p>
                </div>
                <Badge variant="warning">En attente</Badge>
              </div>
              <div className="grid gap-2 text-sm text-[color:var(--textMuted)]">
                <p>Téléphone : {garage.phone || "-"}</p>
                <p>Adresse : {garage.address || "-"}</p>
                <p>SIRET : {garage.siret || "-"}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[color:var(--textMuted)]">
                  Responsable : {garage.users[0]?.email ?? "-"}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => openReject(garage)}>
                    Refuser
                  </Button>
                  <Button onClick={() => approve(garage.id)}>Approuver</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Dialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Refuser la demande"
        description={rejectTarget ? `Motif pour ${rejectTarget.name}` : undefined}
        confirmLabel="Refuser"
        confirmVariant="destructive"
        onConfirm={reject}
      >
        <Textarea
          label="Motif"
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="Expliquer la raison du refus."
        />
      </Dialog>
    </div>
  );
}

```

## app/(dashboard)/admin/pro-demandes/page.tsx
<a id="app-dashboard-admin-pro-demandes-pagetsx"></a>

```tsx
import AdminPendingPage from "../page";

export default AdminPendingPage;

```

## app/(dashboard)/admin/references/page.tsx
<a id="app-dashboard-admin-references-pagetsx"></a>

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { fetcher, requestJson } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { useToast } from "@/components/ui/Toast";
import { useUser } from "@/components/user-context";
import { SectionHeader } from "@/components/ui/SectionHeader";

type LegalReference = {
  id: string;
  title: string;
  summary?: string | null;
  sourceUrl?: string | null;
  code?: string | null;
  articleRef?: string | null;
  tags?: string | null;
  severity: "INFO" | "WARNING" | "CRITICAL";
  isActive: boolean;
  assignments: Array<{ interventionType: string }>;
};

const TYPES = ["E85", "Reprog", "Diag", "Autre"];

export default function AdminReferencesPage() {
  const user = useUser();
  if (!user) return null;
  const [items, setItems] = useState<LegalReference[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    sourceUrl: "",
    code: "",
    articleRef: "",
    tags: "",
    severity: "INFO",
    types: [] as string[],
  });
  const toast = useToast();

  const load = async () => {
    setError(null);
    try {
      const data = await fetcher<LegalReference[]>("/api/legal-references", { noStore: true });
      setItems(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((item) => item !== type)
        : [...prev.types, type],
    }));
  };

  const submit = async () => {
    setError(null);
    try {
      await requestJson("/api/legal-references", {
        method: "POST",
        body: {
          title: form.title,
          summary: form.summary || null,
          sourceUrl: form.sourceUrl || null,
          code: form.code || null,
          articleRef: form.articleRef || null,
          tags: form.tags || null,
          severity: form.severity,
          types: form.types,
        },
      });
      toast.push({
        title: "Reference ajoutee",
        description: "La reference est maintenant disponible.",
        variant: "success",
      });
      setForm({
        title: "",
        summary: "",
        sourceUrl: "",
        code: "",
        articleRef: "",
        tags: "",
        severity: "INFO",
        types: [],
      });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  const toggleActive = async (reference: LegalReference) => {
    try {
      await requestJson(`/api/legal-references/${reference.id}`, {
        method: "PUT",
        body: { isActive: !reference.isActive },
      });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  const deleteReference = async (reference: LegalReference) => {
    if (!confirm("Supprimer cette reference ?")) return;
    try {
      await requestJson(`/api/legal-references/${reference.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  const isAdmin = user.role === "ADMIN";

  const activeCount = useMemo(() => items.filter((item) => item.isActive).length, [items]);

  if (!isAdmin) {
    return (
      <Card>
        <p className="text-sm text-[color:var(--textMuted)]">Accès réservé à l'administration.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Références légales"
        description="Gérez les références applicables aux interventions. Elles seront visibles dans les dossiers."
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="grid gap-4 p-0 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Références actives</h2>
            <Badge variant="accent">{activeCount} actives</Badge>
          </div>
          <DataTable stickyHeader>
            <DataTableHead sticky>
              <tr>
                <th className="px-5 py-4">Référence</th>
                <th className="px-5 py-4">Types</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </DataTableHead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="px-5 py-6" colSpan={3}>
                    <p className="text-sm text-[color:var(--textMuted)]">Aucune référence.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-[color:var(--border)] transition hover:bg-[color:var(--surface2)]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[color:var(--text)]">{item.title}</p>
                      <p className="text-xs text-[color:var(--textMuted)]">{item.summary || "-"}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--textMuted)]">
                        {item.code ? <span>{item.code}</span> : null}
                        {item.articleRef ? <span>{item.articleRef}</span> : null}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-[color:var(--textMuted)]">
                      {item.assignments.map((entry) => entry.interventionType).join(", ") || "-"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(item)}>
                          {item.isActive ? "Désactiver" : "Activer"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteReference(item)}>
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DataTable>
        </Card>

        <Card className="grid gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Nouvelle référence</p>
            <h2 className="mt-2 text-xl font-semibold">Ajouter une référence</h2>
          </div>
          <Input
            label="Titre"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Intervention E85 et obligations"
          />
          <Textarea
            label="Résumé"
            value={form.summary}
            onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
            placeholder="Résumé court pour les techniciens."
          />
          <Input
            label="Source URL"
            value={form.sourceUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, sourceUrl: event.target.value }))}
            placeholder="https://..."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Code"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="Code de la route"
            />
            <Input
              label="Article"
              value={form.articleRef}
              onChange={(event) => setForm((prev) => ({ ...prev, articleRef: event.target.value }))}
              placeholder="R.123-4"
            />
          </div>
          <Input
            label="Tags"
            value={form.tags}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
            placeholder="E85, anti-demarrage"
          />
          <Select
            label="Sévérité"
            value={form.severity}
            onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value }))}
          >
            <option value="INFO">Info</option>
            <option value="WARNING">Attention</option>
            <option value="CRITICAL">Critique</option>
          </Select>
          <div className="grid gap-2 text-xs text-[color:var(--textMuted)]">
            <p className="text-[color:var(--text)]">Types d'intervention associés</p>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`rounded-[var(--rButton)] border px-3 py-2 text-xs font-semibold transition ${
                    form.types.includes(type)
                      ? "border-[color:var(--accent)] bg-[color:var(--accentWeak)] text-[color:var(--text)]"
                      : "border-[color:var(--border)] text-[color:var(--textMuted)] hover:bg-[color:var(--surface2)]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={submit}>Ajouter la référence</Button>
        </Card>
      </div>
    </div>
  );
}

```

## app/(dashboard)/clients/[id]/page.tsx
<a id="app-dashboard-clients-id-pagetsx"></a>

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { fetcher } from "@/lib/fetcher";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";

type ClientDetails = {
  id: number;
  firstName: string;
  lastName: string;
  garageId: number | null;
  garage?: { id: number; name: string } | null;
  createdAt: string;
};

type VehicleItem = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  createdAt?: string;
  client: { id: number; firstName: string; lastName: string };
};

type InterventionItem = {
  id: string;
  type: string;
  createdAt: string;
  vehicle: {
    id: string;
    plate: string;
    brand: string;
    model: string;
    client: { id: number; firstName: string; lastName: string };
  };
};

export default function ClientDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [client, setClient] = useState<ClientDetails | null>(null);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [interventions, setInterventions] = useState<InterventionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const [clientData, vehiclesData, interventionsData] = await Promise.all([
          fetcher<ClientDetails>(`/api/clients/${id}`, { noStore: true }),
          fetcher<VehicleItem[]>("/api/vehicules", { noStore: true }),
          fetcher<InterventionItem[]>("/api/interventions", { noStore: true }),
        ]);

        setClient(clientData);
        const clientId = Number(clientData.id);
        setVehicles((vehiclesData ?? []).filter((v) => v?.client?.id === clientId));
        setInterventions((interventionsData ?? []).filter((i) => i?.vehicle?.client?.id === clientId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur serveur.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading />
      </div>
    );
  }

  if (error) {
    return <ErrorBanner message={error} />;
  }

  if (!client) {
    return <EmptyState title="Client introuvable" description="Vérifiez l’identifiant du client." />;
  }

  const fullName = `${client.firstName} ${client.lastName}`;

  return (
    <div className="grid gap-6">
      <SectionHeader
        title={fullName}
        description={`Fiche client #${client.id}`}
        action={
          <Link href="/clients">
            <Button variant="secondary" size="sm">Retour</Button>
          </Link>
        }
        level={1}
      />

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Informations</p>
            <p className="mt-1 text-sm text-[color:var(--textMuted)]">Client #{client.id}</p>
          </div>
          <Badge variant="accent">Client</Badge>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-[color:var(--textMuted)]">
          <p>
            Nom: <span className="text-[color:var(--text)]">{client.firstName} {client.lastName}</span>
          </p>
          <p>
            Garage: <span className="text-[color:var(--text)]">{client.garage?.name ?? (client.garageId ? `#${client.garageId}` : "-")}</span>
          </p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-5 py-4">
            <div>
              <p className="ms-kicker">Véhicules</p>
              <p className="mt-1 text-sm text-[color:var(--textMuted)]">
                {vehicles.length} véhicule(s)
              </p>
            </div>
            <Link href="/vehicules">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState
                title="Aucun véhicule"
                description="Ce client n'a pas encore de véhicule."
                action={
                  <Link href="/vehicules">
                    <Button size="sm">Créer un véhicule</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <DataTable className="rounded-none border-0 bg-transparent shadow-none">
              <DataTableHead>
                <tr>
                  <th className="px-5 py-3">Plaque</th>
                  <th className="px-5 py-3">Modèle</th>
                  <th className="px-5 py-3">Dossier</th>
                </tr>
              </DataTableHead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {vehicles.slice(0, 8).map((v) => (
                  <tr key={v.id} className="transition hover:bg-[color:var(--surface2)]">
                    <td className="px-5 py-3 text-sm font-medium">{v.plate}</td>
                    <td className="px-5 py-3 text-sm text-[color:var(--textMuted)]">
                      {v.brand} {v.model}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/vehicules?selected=${encodeURIComponent(v.id)}`} className="text-sm font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]">
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-5 py-4">
            <div>
              <p className="ms-kicker">Interventions</p>
              <p className="mt-1 text-sm text-[color:var(--textMuted)]">
                {interventions.length} intervention(s)
              </p>
            </div>
            <Link href="/interventions">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>

          {interventions.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState
                title="Aucune intervention"
                description="Les interventions de ce client apparaîtront ici."
                action={
                  <Link href="/interventions">
                    <Button size="sm">Créer une intervention</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <DataTable className="rounded-none border-0 bg-transparent shadow-none">
              <DataTableHead>
                <tr>
                  <th className="px-5 py-3">Véhicule</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Créée</th>
                  <th className="px-5 py-3">Dossier</th>
                </tr>
              </DataTableHead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {interventions.slice(0, 8).map((i) => (
                  <tr key={i.id} className="transition hover:bg-[color:var(--surface2)]">
                    <td className="px-5 py-3 text-sm font-medium">{i.vehicle.plate}</td>
                    <td className="px-5 py-3 text-sm text-[color:var(--textMuted)]">{i.type}</td>
                    <td className="px-5 py-3 text-xs text-[color:var(--textMuted)]">
                      {new Date(i.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/interventions?selected=${encodeURIComponent(i.id)}`} className="text-sm font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]">
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>
    </div>
  );
}

```

## app/(dashboard)/clients/page.tsx
<a id="app-dashboard-clients-pagetsx"></a>

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, MoreHorizontal, Trash2, Pencil } from "lucide-react";

import { useUser } from "@/components/user-context";
import { fetcher, requestJson } from "@/lib/fetcher";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownItem } from "@/components/ui/DropdownMenu";
import { useToast } from "@/components/ui/Toast";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { EmptyState } from "@/components/common/EmptyState";

type GarageOption = { id: number; name: string; status: "PENDING" | "ACTIVE" | "REJECTED" };
type ClientItem = {
  id: number;
  firstName: string;
  lastName: string;
  garageId: number | null;
  garage?: { id: number; name: string } | null;
  createdAt: string;
};

export default function ClientsPage() {
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [garages, setGarages] = useState<GarageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const selectedFromUrl = Number(searchParams.get("selected") || "");
  const [selectedId, setSelectedId] = useState<number | null>(Number.isFinite(selectedFromUrl) ? selectedFromUrl : null);

  const [detail, setDetail] = useState<ClientItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const toast = useToast();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    garageId: "",
  });

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<ClientItem[]>("/api/clients", { noStore: true });
      setClients(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  const loadGarages = async () => {
    if (user.role !== "ADMIN") return;
    try {
      const data = await fetcher<GarageOption[]>("/api/admin/garages", { noStore: true });
      setGarages(data ?? []);
    } catch {
      setGarages([]);
    }
  };

  useEffect(() => {
    loadClients();
    loadGarages();
  }, []);

  useEffect(() => {
    // keep selectedId in sync if URL changes
    if (!Number.isFinite(selectedFromUrl)) return;
    setSelectedId(selectedFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFromUrl]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedId) {
        setDetail(null);
        return;
      }
      setDetailLoading(true);
      try {
        const client = await fetcher<ClientItem>(`/api/clients/${selectedId}`, { noStore: true });
        setDetail(client);
      } catch (err) {
        setDetail(null);
        setError(err instanceof Error ? err.message : "Erreur serveur.");
      } finally {
        setDetailLoading(false);
      }
    };
    loadDetail();
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) => {
      const full = `${client.firstName} ${client.lastName}`.toLowerCase();
      const id = String(client.id);
      return full.includes(q) || id.includes(q);
    });
  }, [clients, query]);

  const openCreate = () => {
    setEditorMode("create");
    setForm({ firstName: "", lastName: "", garageId: "" });
    setEditorOpen(true);
  };

  const openEdit = (client: ClientItem) => {
    setEditorMode("edit");
    setForm({
      firstName: client.firstName,
      lastName: client.lastName,
      garageId: client.garageId ? String(client.garageId) : "",
    });
    setEditorOpen(true);
  };

  const submit = async () => {
    setError(null);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        garageId: form.garageId ? Number(form.garageId) : undefined,
      };

      await requestJson<ClientItem>(
        editorMode === "edit" && detail ? `/api/clients/${detail.id}` : "/api/clients",
        { method: editorMode === "edit" ? "PUT" : "POST", body: payload }
      );
      toast.push({
        title: editorMode === "edit" ? "Client mis à jour" : "Client créé",
        description: "Les informations sont enregistrees.",
        variant: "success",
      });
      setEditorOpen(false);
      await loadClients();
      if (editorMode === "edit" && detail) {
        setSelectedId(detail.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  const requestDelete = (clientId: number) => {
    setPendingDeleteId(clientId);
    setConfirmOpen(true);
  };

  const removeClient = async () => {
    if (!pendingDeleteId) return;
    try {
      await requestJson<boolean>(`/api/clients/${pendingDeleteId}`, { method: "DELETE" });
      toast.push({
        title: "Client supprime",
        description: "Le client a ete retire.",
        variant: "success",
      });
      await loadClients();
      if (selectedId === pendingDeleteId) {
        setSelectedId(null);
        router.replace("/clients");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    } finally {
      setConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Clients"
        description="Liste, recherche et gestion des fiches clients."
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Créer
          </Button>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* Left: list */}
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-[color:var(--border)] p-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par nom ou ID"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-[color:var(--textMuted)]">
                {loading ? "Chargement…" : `${filtered.length} client(s)`}
              </p>
              {selectedId ? <Badge variant="accent">Sélectionné</Badge> : null}
            </div>
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-[color:var(--textMuted)]">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Aucun client"
                  description="Créez un client pour démarrer."
                  action={<Button onClick={openCreate}>Créer un client</Button>}
                />
              </div>
            ) : (
              <div className="p-2">
                {filtered.map((client) => {
                  const isActive = selectedId === client.id;
                  return (
                    <Link
                      key={client.id}
                      href={`/clients/${client.id}`}
                      onClick={(e) => {
                        if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
                          e.preventDefault();
                          setSelectedId(client.id);
                          router.replace(`/clients?selected=${client.id}`);
                        }
                      }}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm transition ${
                        isActive
                          ? "bg-[color:var(--accentWeak)] text-[color:var(--text)] border border-[color:var(--accent)]"
                          : "text-[color:var(--text)] hover:bg-[color:var(--surface2)] border border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {client.firstName} {client.lastName}
                        </p>
                        {user.role === "ADMIN" ? (
                          <p className="truncate text-xs text-[color:var(--textMuted)]">
                            {client.garage?.name ?? (client.garageId ? `Garage #${client.garageId}` : "-")}
                          </p>
                        ) : (
                          <p className="text-xs text-[color:var(--textMuted)]">ID #{client.id}</p>
                        )}
                      </div>
                      <span className="text-xs text-[color:var(--textMuted)]">#{client.id}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Right: detail */}
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-[color:var(--border)] p-4 flex items-start justify-between gap-3">
            <div>
              <p className="ms-kicker">Détail</p>
              <p className="mt-1 text-sm text-[color:var(--textMuted)]">
                {detail ? `Client #${detail.id}` : "Sélectionnez un client"}
              </p>
            </div>

            {detail ? (
              <DropdownMenu
                trigger={
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--surface2)]"
                    aria-label="Actions"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                }
              >
                <DropdownItem onClick={() => openEdit(detail)}>
                  <span className="inline-flex items-center gap-2"><Pencil size={16} /> Modifier</span>
                </DropdownItem>
                <DropdownItem onClick={() => requestDelete(detail.id)}>
                  <span className="inline-flex items-center gap-2 text-[color:var(--danger)]"><Trash2 size={16} /> Supprimer</span>
                </DropdownItem>
              </DropdownMenu>
            ) : null}
          </div>

          <div className="p-4">
            {detailLoading ? (
              <div className="text-sm text-[color:var(--textMuted)]">Chargement du détail…</div>
            ) : !detail ? (
              <EmptyState
                title="Aucun client sélectionné"
                description="Choisissez un client dans la liste pour afficher sa fiche."
              />
            ) : (
              <div className="grid gap-4">
                <div className="rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface2)] p-4">
                  <p className="text-sm font-semibold">
                    {detail.firstName} {detail.lastName}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--textMuted)]">ID #{detail.id}</p>
                  {user.role === "ADMIN" ? (
                    <p className="mt-2 text-xs text-[color:var(--textMuted)]">
                      Garage: {detail.garage?.name ?? (detail.garageId ? `#${detail.garageId}` : "-")}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <p className="text-sm font-semibold">Véhicules</p>
                  <p className="mt-1 text-sm text-[color:var(--textMuted)]">
                    Disponible dans le dossier client.
                  </p>
                  <div className="mt-3">
                    <Link href="/vehicules">
                      <Button variant="secondary" size="sm">Voir les véhicules</Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Create/Edit dialog */}
      <Dialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={editorMode === "edit" ? "Modifier le client" : "Créer un client"}
        description={editorMode === "edit" ? "Mettez à jour les informations du client." : "Renseignez les informations du client."}
        confirmLabel={editorMode === "edit" ? "Mettre à jour" : "Créer"}
        confirmVariant="primary"
        onConfirm={submit}
      >
        <div className="grid gap-4">
          <Input
            label="Prénom"
            value={form.firstName}
            onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
            placeholder="Jean"
          />
          <Input
            label="Nom"
            value={form.lastName}
            onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
            placeholder="Dupont"
          />
          {user.role === "ADMIN" ? (
            <Select
              label="Garage"
              value={form.garageId}
              onChange={(event) => setForm((prev) => ({ ...prev, garageId: event.target.value }))}
            >
              <option value="">Sélectionner un garage</option>
              {garages.map((garage) => (
                <option key={garage.id} value={garage.id}>
                  {garage.name} {garage.status === "ACTIVE" ? "" : "(en attente)"}
                </option>
              ))}
            </Select>
          ) : null}
        </div>
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer ce client"
        description="Cette action est définitive."
        confirmLabel="Supprimer"
        confirmVariant="destructive"
        onConfirm={removeClient}
      />
    </div>
  );
}

```

## app/(dashboard)/dashboard/page.tsx
<a id="app-dashboard-dashboard-pagetsx"></a>

```tsx
import { prisma } from "@/lib/prisma";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";
import { redirect } from "next/navigation";

import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { formatDistance } from "date-fns/formatDistance";
import { fr } from "date-fns/locale/fr";
import Link from "next/link";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (!isApprovedGarage(user)) redirect("/pro/en-attente");

  const baseWhere = user.role === "ADMIN" ? {} : { garageId: user.garageId ?? -1 };
  const weekSince = new Date();
  weekSince.setDate(weekSince.getDate() - 7);
  const todaySince = new Date();
  todaySince.setHours(0, 0, 0, 0);

  const [clientsCount, vehiclesCount, interventionsCount, interventionsWeek, interventionsToday] =
    await Promise.all([
    prisma.client.count({ where: baseWhere }),
    prisma.vehicle.count({ where: baseWhere }),
    prisma.intervention.count({ where: baseWhere }),
    prisma.intervention.count({ where: { ...baseWhere, createdAt: { gte: weekSince } } }),
    prisma.intervention.count({ where: { ...baseWhere, createdAt: { gte: todaySince } } }),
  ]);

  const [recentClients, recentInterventions] = await Promise.all([
    prisma.client.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.intervention.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { vehicle: { include: { client: true } } },
    }),
  ]);

  // Helper for relative date
  const getRelativeDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return formatDistance(d, new Date(), { addSuffix: true, locale: fr });
  };

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Tableau de bord"
        description="Vue d’ensemble de votre activité : clients, véhicules et interventions."
        level={1}
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Link href="/clients">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                Nouveau client
              </Button>
            </Link>
            <Link href="/interventions">
              <Button size="sm" className="w-full sm:w-auto">
                Nouvelle intervention
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clients actifs" value={clientsCount} />
        <StatCard label="Véhicules suivis" value={vehiclesCount} />
        <StatCard label="Interventions totales" value={interventionsCount} />
        <StatCard label="Aujourd’hui" value={interventionsToday} badge={`7j: ${interventionsWeek}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-0">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-5 py-4">
            <div>
              <p className="ms-kicker">Derniers clients</p>
              <p className="mt-1 text-sm text-[color:var(--textMuted)]">Ajouts récents</p>
            </div>
            <Link href="/clients">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>
          {recentClients.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState
                title="Aucun client"
                description="Créez votre premier client pour démarrer."
                action={
                  <Link href="/clients">
                    <Button size="sm">Créer un client</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <DataTable className="rounded-none border-0 bg-transparent shadow-none">
              <DataTableHead>
                <tr>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Créé</th>
                </tr>
              </DataTableHead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {recentClients.map((client) => (
                  <tr key={client.id} className="transition hover:bg-[color:var(--surface2)]">
                    <td className="px-5 py-3">
                      <Link
                        href={`/clients?selected=${client.id}`}
                        className="block min-w-0"
                      >
                        <p className="truncate text-sm font-medium">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-xs text-[color:var(--textMuted)]">ID #{client.id}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-xs text-[color:var(--textMuted)]" title={new Date(client.createdAt).toLocaleString("fr-FR")}>
                      {getRelativeDate(client.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-5 py-4">
            <div>
              <p className="ms-kicker">Dernières interventions</p>
              <p className="mt-1 text-sm text-[color:var(--textMuted)]">Trafic atelier</p>
            </div>
            <Link href="/interventions">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>
          {recentInterventions.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState title="Aucune intervention" description="Les interventions récentes apparaîtront ici." />
            </div>
          ) : (
            <DataTable className="rounded-none border-0 bg-transparent shadow-none">
              <DataTableHead>
                <tr>
                  <th className="px-5 py-3">Véhicule</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Créée</th>
                </tr>
              </DataTableHead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {recentInterventions.map((intervention) => (
                  <tr key={intervention.id} className="transition hover:bg-[color:var(--surface2)]">
                    <td className="px-5 py-3">
                      <Link
                        href={`/interventions/${intervention.id}`}
                        className="text-sm font-medium"
                      >
                        {intervention.vehicle.plate}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-sm text-[color:var(--textMuted)]">
                      {intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {intervention.type}
                    </td>
                    <td className="px-5 py-3 text-xs text-[color:var(--textMuted)]" title={new Date(intervention.createdAt).toLocaleString("fr-FR")}>
                      {getRelativeDate(intervention.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>
    </div>
  );
}

```

## app/(dashboard)/documents/page.tsx
<a id="app-dashboard-documents-pagetsx"></a>

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDistance } from "date-fns/formatDistance";
import { fr } from "date-fns/locale/fr";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { fetcher } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useRouter } from "next/navigation";

type DocumentItem = {
  id: string;
  type: string;
  createdAt: string;
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    client: { firstName: string; lastName: string };
  };
};

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<DocumentItem[]>("/api/interventions", { noStore: true });
      setDocuments(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((doc) => {
      const data = `${doc.vehicle.plate} ${doc.vehicle.brand} ${doc.vehicle.model} ${doc.vehicle.client.firstName} ${doc.vehicle.client.lastName} ${doc.type}`.toLowerCase();
      return data.includes(q);
    });
  }, [documents, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  const visibleDocuments = filtered.slice(0, visibleCount);

  // Helper for relative date
  const getRelativeDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return formatDistance(d, new Date(), { addSuffix: true, locale: fr });
  };

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Documents"
        description="Téléchargez les dossiers PDF générés depuis les interventions."
        action={<Button onClick={() => router.push("/interventions")}>Ouvrir interventions</Button>}
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-[color:var(--border)] p-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par plaque, client, type"
            className="max-w-md"
          />
          <p className="mt-3 text-xs text-[color:var(--textMuted)]">
            {loading ? "Chargement…" : `${filtered.length} document(s)`}
          </p>
        </div>

        <DataTable stickyHeader className="rounded-none border-0 shadow-none">
          <DataTableHead sticky>
            <tr>
              <th className="px-5 py-4">Intervention</th>
              <th className="px-5 py-4">Client</th>
              <th className="px-5 py-4 text-right">PDF</th>
            </tr>
          </DataTableHead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-[color:var(--border)]">
                  <td className="px-5 py-6" colSpan={3}>
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr className="border-t border-[color:var(--border)]">
                <td className="px-5 py-8" colSpan={3}>
                  <EmptyState title="Aucun document" description="Les PDFs seront disponibles ici." />
                </td>
              </tr>
            ) : (
              visibleDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-t border-[color:var(--border)] transition hover:bg-[color:var(--surface2)]"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[color:var(--text)]">
                      {doc.vehicle.plate} · {doc.type}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--textMuted)]">
                      <span title={new Date(doc.createdAt).toLocaleString("fr-FR")}>{getRelativeDate(doc.createdAt)}</span>
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-[color:var(--textMuted)]">
                    {doc.vehicle.client.firstName} {doc.vehicle.client.lastName}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <a
                      href={`/api/interventions/${doc.id}/pdf`}
                      className="text-sm font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]"
                    >
                      Télécharger
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>

        {filtered.length > visibleCount ? (
          <div className="border-t border-[color:var(--border)] p-4 flex justify-center">
            <Button variant="ghost" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
              Afficher plus
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

```

## app/(dashboard)/interventions/[id]/page.tsx
<a id="app-dashboard-interventions-id-pagetsx"></a>

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";

import { LegalReferencesPanel } from "@/components/common/LegalReferencesPanel";

type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  client: { firstName: string; lastName: string };
};

type Intervention = {
  id: string;
  type: string;
  createdAt: string;
  performedAt?: string | null;
  notes?: string | null;
  odometerKm?: string | null;
  ecuType?: string | null;
  softwareVersion?: string | null;
  checksum?: string | null;
  vehicle: Vehicle;
  revisions?: Array<any>;
};

export default function InterventionDetailPage() {
  const { id } = useParams();
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntervention = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/interventions/${id}`);
        if (!res.ok) throw new Error("Erreur lors du chargement de l'intervention.");
        const data = await res.json();
        setIntervention(data?.data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur serveur.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchIntervention();
  }, [id]);

  return (
    <div className="grid gap-6">
      <SectionHeader
        title={intervention ? `Dossier ${intervention.vehicle.plate}` : "Dossier intervention"}
        description="Détail complet de l'intervention, traçabilité et conformité."
        level={1}
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <a href="/interventions" className="w-full sm:w-auto">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                Retour
              </Button>
            </a>
            {intervention ? (
              <a
                href={`/api/interventions/${intervention.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto"
              >
                <Button size="sm" className="w-full sm:w-auto">Télécharger PDF</Button>
              </a>
            ) : null}
          </div>
        }
      />
      {loading ? (
        <div className="flex justify-center py-12"><Loading /></div>
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !intervention ? (
        <EmptyState title="Intervention introuvable" description="Ce dossier n'existe pas ou n'est plus accessible." />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <p className="ms-kicker">Véhicule</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                  {intervention.vehicle.plate}{" "}
                  <span className="text-[color:var(--textMuted)] font-normal">· {intervention.type}</span>
                </h2>
                <p className="mt-1 text-xs text-[color:var(--textMuted)]">
                  {intervention.vehicle.brand} {intervention.vehicle.model}
                </p>
                <p className="text-xs text-[color:var(--textMuted)]">
                  Client :{" "}
                  <span className="font-medium text-[color:var(--text)]">
                    {intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}
                  </span>
                </p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className="text-xs text-[color:var(--textMuted)]">Créée le {new Date(intervention.createdAt).toLocaleDateString("fr-FR")}</span>
                {intervention.performedAt && <span className="text-xs text-[color:var(--textMuted)]">Réalisée le {new Date(intervention.performedAt).toLocaleDateString("fr-FR")}</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-xs text-[color:var(--textMuted)] mb-1">Kilométrage</p>
                <p className="text-[color:var(--text)] font-medium">{intervention.odometerKm ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[color:var(--textMuted)] mb-1">ECU</p>
                <p className="text-[color:var(--text)] font-medium">{intervention.ecuType ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[color:var(--textMuted)] mb-1">Version logicielle</p>
                <p className="text-[color:var(--text)] font-medium">{intervention.softwareVersion ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[color:var(--textMuted)] mb-1">Checksum</p>
                <p className="text-[color:var(--text)] font-medium">{intervention.checksum ?? "-"}</p>
              </div>
            </div>
            {intervention.notes && (
              <div className="mt-4">
                <p className="text-xs text-[color:var(--textMuted)] mb-1">Notes</p>
                <p className="text-[color:var(--text)] whitespace-pre-line">{intervention.notes}</p>
              </div>
            )}
          </Card>
          <div className="flex flex-col gap-6">
            <LegalReferencesPanel type={intervention.type} />
            {/* Historique des révisions, si présent */}
            {intervention.revisions && intervention.revisions.length > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Historique des révisions</h3>
                <ul className="space-y-2">
                  {intervention.revisions.map((rev, idx) => (
                    <li key={rev.id || idx} className="text-xs text-[color:var(--textMuted)]">
                      <span className="font-medium text-[color:var(--text)]">Révision {idx + 1}</span> – {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("fr-FR") : ""}
                      {rev.hash && <span className="ml-2 text-[color:var(--textMuted)]">HASH: {rev.hash}</span>}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

```

## app/(dashboard)/interventions/page.tsx
<a id="app-dashboard-interventions-pagetsx"></a>

```tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";

import { fetcher, requestJson } from "@/lib/fetcher";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { EmptyState } from "@/components/common/EmptyState";
import { LegalReferencesPanel } from "@/components/common/LegalReferencesPanel";
import { useToast } from "@/components/ui/Toast";
import { Dialog } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownItem } from "@/components/ui/DropdownMenu";

type VehicleOption = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  client: { firstName: string; lastName: string };
};

type InterventionItem = {
  id: string;
  type: string;
  createdAt: string;
  performedAt?: string | null;
  vehicle: VehicleOption;
};

type InterventionDetails = InterventionItem & {
  notes?: string | null;
  odometerKm?: string | null;
  ecuType?: string | null;
  softwareVersion?: string | null;
  checksum?: string | null;
  revisions?: Array<{ id: string; createdAt: string; hash?: string | null }>;
};

const INTERVENTION_TYPES = ["E85", "Reprog", "Diag", "Autre"];

export default function InterventionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [interventions, setInterventions] = useState<InterventionItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const toast = useToast();

  const selectedFromUrl = searchParams.get("selected") || "";
  const [selectedId, setSelectedId] = useState<string | null>(selectedFromUrl || null);
  const [detail, setDetail] = useState<InterventionDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);

  const [form, setForm] = useState({
    vehicleId: "",
    type: "E85",
    notes: "",
    performedAt: "",
    odometerKm: "",
    ecuType: "",
    softwareVersion: "",
    checksum: "",
  });

  // Fetch interventions from API
  const loadInterventions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interventions");
      if (!res.ok) throw new Error("Erreur lors du chargement des interventions.");
      const data = await res.json();
      setInterventions(data?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch vehicles from API
  const loadVehicles = async () => {
    try {
      const res = await fetch("/api/vehicules");
      if (!res.ok) throw new Error("Erreur lors du chargement des véhicules.");
      const data = await res.json();
      setVehicles(data?.data ?? []);
    } catch (err) {
      setVehicles([]);
    }
  };

  useEffect(() => {
    loadInterventions();
    loadVehicles();
  }, []);

  useEffect(() => {
    setSelectedId(selectedFromUrl || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFromUrl]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedId) {
        setDetail(null);
        return;
      }
      setDetailLoading(true);
      try {
        const data = await fetcher<InterventionDetails>(`/api/interventions/${selectedId}`, {
          noStore: true,
        });
        setDetail(data);
      } catch (err) {
        setDetail(null);
        setError(err instanceof Error ? err.message : "Erreur serveur.");
      } finally {
        setDetailLoading(false);
      }
    };
    loadDetail();
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return interventions;
    return interventions.filter((item) => {
      const data = `${item.vehicle.plate} ${item.vehicle.brand} ${item.vehicle.model} ${item.vehicle.client.firstName} ${item.vehicle.client.lastName} ${item.type}`.toLowerCase();
      return data.includes(q);
    });
  }, [interventions, query]);

  const resetForm = () => {
    setForm({
      vehicleId: "",
      type: "E85",
      notes: "",
      performedAt: "",
      odometerKm: "",
      ecuType: "",
      softwareVersion: "",
      checksum: "",
    });
  };

  const createIntervention = async () => {
    setError(null);
    try {
      const payload = {
        vehicleId: form.vehicleId,
        type: form.type,
        notes: form.notes || null,
        performedAt: form.performedAt || null,
        odometerKm: form.odometerKm || null,
        ecuType: form.ecuType || null,
        softwareVersion: form.softwareVersion || null,
        checksum: form.checksum || null,
      };

      const created = await requestJson<InterventionItem>("/api/interventions", {
        method: "POST",
        body: payload,
        noStore: true,
      });

      toast.push({
        title: "Intervention créée",
        description: "Le dossier a été ajouté.",
        variant: "success",
      });

      setCreateOpen(false);
      resetForm();
      await loadInterventions();

      if (created?.id) {
        setSelectedId(created.id);
        router.replace(`/interventions?selected=${created.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Interventions"
        description="Suivi, dossiers et génération PDF."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Créer
          </Button>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-[color:var(--border)] p-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par plaque, client, type"
            />
            <p className="mt-3 text-xs text-[color:var(--textMuted)]">
              {loading ? "Chargement…" : `${filtered.length} intervention(s)`}
            </p>
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-[color:var(--textMuted)]">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Aucune intervention"
                  description="Créez une intervention pour démarrer."
                  action={<Button onClick={() => setCreateOpen(true)}>Créer une intervention</Button>}
                />
              </div>
            ) : (
              <div className="p-2">
                {filtered.map((item) => {
                  const isActive = selectedId === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={`/interventions/${item.id}`}
                      onClick={(e) => {
                        if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
                          e.preventDefault();
                          setSelectedId(item.id);
                          router.replace(`/interventions?selected=${item.id}`);
                        }
                      }}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm transition ${
                        isActive
                          ? "bg-[color:var(--surface2)] text-[color:var(--text)] border border-[color:var(--accent)]"
                          : "text-[color:var(--text)] hover:bg-[color:var(--surface2)] border border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {item.vehicle.plate} <span className="text-[color:var(--textMuted)]">· {item.type}</span>
                        </p>
                        <p className="truncate text-xs text-[color:var(--textMuted)]">
                          {item.vehicle.client.firstName} {item.vehicle.client.lastName} · {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Badge variant="accent">Dossier</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="border-b border-[color:var(--border)] p-4 flex items-start justify-between gap-3">
            <div>
              <p className="ms-kicker">Détail</p>
              <p className="mt-1 text-sm text-[color:var(--textMuted)]">
                {detail ? `${detail.vehicle.plate} · ${detail.type}` : "Sélectionnez une intervention"}
              </p>
            </div>

            {detail ? (
              <DropdownMenu
                trigger={
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--surface2)]"
                    aria-label="Actions"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                }
              >
                <DropdownItem>
                  <a className="block" href={`/api/interventions/${detail.id}/pdf`} target="_blank" rel="noreferrer">
                    Télécharger PDF
                  </a>
                </DropdownItem>
                <DropdownItem>
                  <Link href={`/interventions/${detail.id}`}>Ouvrir le dossier complet</Link>
                </DropdownItem>
              </DropdownMenu>
            ) : null}
          </div>

          <div className="p-4">
            {detailLoading ? (
              <div className="text-sm text-[color:var(--textMuted)]">Chargement du détail…</div>
            ) : !detail ? (
              <EmptyState
                title="Aucune intervention sélectionnée"
                description="Choisissez une intervention dans la liste pour afficher son dossier."
              />
            ) : (
              <div className="grid gap-4">
                <div className="rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface2)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{detail.vehicle.plate}</p>
                      <p className="mt-1 text-xs text-[color:var(--textMuted)]">
                        {detail.vehicle.brand} {detail.vehicle.model} · {detail.vehicle.client.firstName} {detail.vehicle.client.lastName}
                      </p>
                    </div>
                    <Badge variant="accent">{detail.type}</Badge>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-[color:var(--textMuted)]">
                    <p>Créée le {new Date(detail.createdAt).toLocaleString("fr-FR")}</p>
                    {detail.performedAt ? (
                      <p>Réalisée le {new Date(detail.performedAt).toLocaleString("fr-FR")}</p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <p className="text-sm font-semibold">Conformité</p>
                  <div className="mt-3">
                    <LegalReferencesPanel type={detail.type} />
                  </div>
                </div>

                <div className="rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <p className="text-sm font-semibold">Révisions</p>
                  <p className="mt-2 text-sm text-[color:var(--textMuted)]">
                    {detail.revisions && detail.revisions.length > 0
                      ? `${detail.revisions.length} révision(s) enregistrée(s).`
                      : "Aucune révision."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Créer une intervention"
        description="Ajoutez un dossier intervention rattaché à un véhicule."
        confirmLabel="Créer"
        confirmVariant="primary"
        onConfirm={createIntervention}
      >
        <div className="grid gap-4">
          <Select
            label="Véhicule"
            value={form.vehicleId}
            onChange={(event) => setForm((prev) => ({ ...prev, vehicleId: event.target.value }))}
          >
            <option value="">Sélectionner un véhicule</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} — {v.client.firstName} {v.client.lastName}
              </option>
            ))}
          </Select>

          <Select
            label="Type"
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
          >
            {INTERVENTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          <Input
            label="Date réalisée"
            type="datetime-local"
            value={form.performedAt}
            onChange={(event) => setForm((prev) => ({ ...prev, performedAt: event.target.value }))}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Kilométrage"
              value={form.odometerKm}
              onChange={(event) => setForm((prev) => ({ ...prev, odometerKm: event.target.value }))}
              placeholder="120000"
            />
            <Input
              label="ECU"
              value={form.ecuType}
              onChange={(event) => setForm((prev) => ({ ...prev, ecuType: event.target.value }))}
              placeholder="Bosch EDC17"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Version logicielle"
              value={form.softwareVersion}
              onChange={(event) => setForm((prev) => ({ ...prev, softwareVersion: event.target.value }))}
              placeholder="v3.2"
            />
            <Input
              label="Checksum"
              value={form.checksum}
              onChange={(event) => setForm((prev) => ({ ...prev, checksum: event.target.value }))}
              placeholder="SHA256"
            />
          </div>

          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Détails de l'intervention"
          />

          <LegalReferencesPanel type={form.type} />
        </div>
      </Dialog>
    </div>
  );
}


```

## app/(dashboard)/layout.tsx
<a id="app-dashboard-layouttsx"></a>

```tsx
import { redirect } from "next/navigation";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";
import DashboardShell from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (!isApprovedGarage(user)) redirect("/pro/en-attente");

  return <DashboardShell user={user}>{children}</DashboardShell>;
}

```

## app/(dashboard)/parametres/page.tsx
<a id="app-dashboard-parametres-pagetsx"></a>

```tsx
import { prisma } from "@/lib/prisma";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ParametresClient } from "./ParametresClient";

export const runtime = "nodejs";

export default async function ParametresPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (!isApprovedGarage(user)) redirect("/pro/en-attente");

  const garage = user.role === "ADMIN"
    ? null
    : await prisma.garage.findUnique({ where: { id: user.garageId ?? -1 } });

  return <ParametresClient role={user.role} userEmail={user.email} garage={garage} />;
}

```

## app/(dashboard)/parametres/ParametresClient.tsx
<a id="app-dashboard-parametres-parametresclienttsx"></a>

```tsx
"use client";

import { useMemo, useState } from "react";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { EmptyState } from "@/components/common/EmptyState";
import { ComplianceToggles } from "@/components/parametres/ComplianceToggles";

type GarageInfo = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  siret?: string | null;
  status?: "PENDING" | "ACTIVE" | "REJECTED" | string | null;
} | null;

type TabKey = "garage" | "users" | "security" | "notifications";

export function ParametresClient({
  role,
  userEmail,
  garage,
}: {
  role: "ADMIN" | "GARAGE" | string;
  userEmail: string;
  garage: GarageInfo;
}) {
  const [tab, setTab] = useState<TabKey>("garage");

  const roleLabel = role === "ADMIN" ? "Admin" : "Garage";

  const statusLabel = useMemo(() => {
    if (role === "ADMIN") return "Administration";
    if (!garage?.status) return "-";
    if (garage.status === "ACTIVE") return "Actif";
    if (garage.status === "REJECTED") return "Refusé";
    if (garage.status === "PENDING") return "En attente";
    return String(garage.status);
  }, [garage?.status, role]);

  const tabButtonClass = (active: boolean) => {
    return `inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition ${
      active
        ? "border-[color:var(--accent)] bg-[color:var(--surface2)] text-[color:var(--text)]"
        : "border-[color:var(--border)] bg-transparent text-[color:var(--textMuted)] hover:bg-[color:var(--surface2)] hover:text-[color:var(--text)]"
    }`;
  };

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Paramètres"
        description="Identité, conformité et préférences de l’atelier."
        level={1}
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabButtonClass(tab === "garage")} onClick={() => setTab("garage")}>
          Garage
        </button>
        <button type="button" className={tabButtonClass(tab === "users")} onClick={() => setTab("users")}>
          Utilisateurs
        </button>
        <button type="button" className={tabButtonClass(tab === "security")} onClick={() => setTab("security")}>
          Sécurité
        </button>
        <button
          type="button"
          className={tabButtonClass(tab === "notifications")}
          onClick={() => setTab("notifications")}
        >
          Notifications
        </button>
      </div>

      {tab === "garage" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="grid gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Profil</p>
                <h2 className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                  {role === "ADMIN" ? "Administration" : garage?.name ?? "Garage"}
                </h2>
              </div>
              <Badge variant="accent">{roleLabel}</Badge>
            </div>

            <div className="grid gap-2 text-sm text-[color:var(--textMuted)]">
              <div className="flex items-center justify-between gap-4">
                <span>Email</span>
                <span className="text-[color:var(--text)]">{garage?.email ?? userEmail}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Téléphone</span>
                <span className="text-[color:var(--text)]">{garage?.phone || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Adresse</span>
                <span className="text-[color:var(--text)]">{garage?.address || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>SIRET</span>
                <span className="text-[color:var(--text)]">{garage?.siret || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Statut</span>
                <span className="text-[color:var(--text)]">{statusLabel}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="secondary" onClick={() => setTab("security")}>Voir conformité</Button>
            </div>
          </Card>

          <Card className="grid gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Résumé</p>
              <h3 className="mt-2 text-lg font-semibold text-[color:var(--text)]">Conformité</h3>
            </div>
            <p className="text-sm text-[color:var(--textMuted)]">
              Les paramètres de sécurité contrôlent la traçabilité et la génération des preuves.
            </p>
            <Badge variant="success">Conformité active</Badge>
          </Card>
        </div>
      ) : null}

      {tab === "users" ? (
        <Card className="p-6">
          <EmptyState
            title="Utilisateurs"
            description="Cette section centralise la gestion des accès."
          />
        </Card>
      ) : null}

      {tab === "security" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="grid gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Sécurité</p>
              <h3 className="mt-2 text-lg font-semibold text-[color:var(--text)]">Assurance & traçabilité</h3>
            </div>
            <ComplianceToggles />
            <Badge variant="success">Conformité active</Badge>
          </Card>

          <Card className="grid gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Bonnes pratiques</p>
              <h3 className="mt-2 text-lg font-semibold text-[color:var(--text)]">Recommandations</h3>
            </div>
            <div className="grid gap-2 text-sm text-[color:var(--textMuted)]">
              <p>• Conservez les preuves et révisions pour chaque dossier.</p>
              <p>• Générez un PDF après validation du client.</p>
              <p>• Activez les alertes pour les dossiers critiques.</p>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "notifications" ? (
        <NotificationsPanel />
      ) : null}
    </div>
  );
}

function NotificationsPanel() {
  const [mailOnCritical, setMailOnCritical] = useState(true);
  const [mailOnPdf, setMailOnPdf] = useState(false);
  const [digest, setDigest] = useState(false);

  return (
    <Card className="grid gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Notifications</p>
        <h3 className="mt-2 text-lg font-semibold text-[color:var(--text)]">Préférences email</h3>
      </div>
      <div className="grid gap-3">
        <Toggle checked={mailOnCritical} onChange={setMailOnCritical} label="Alertes sur dossier critique" />
        <Toggle checked={mailOnPdf} onChange={setMailOnPdf} label="Confirmation lors de génération PDF" />
        <Toggle checked={digest} onChange={setDigest} label="Récapitulatif hebdomadaire" />
      </div>
      <p className="text-xs text-[color:var(--textMuted)]">
        Ces préférences sont locales pour le moment.
      </p>
    </Card>
  );
}

```

## app/(dashboard)/settings/page.tsx
<a id="app-dashboard-settings-pagetsx"></a>

```tsx
import { redirect } from "next/navigation";

export default function SettingsRedirect() {
  redirect("/parametres");
}

```

## app/(dashboard)/vehicules/[id]/page.tsx
<a id="app-dashboard-vehicules-id-pagetsx"></a>

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { fetcher, requestJson } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { LegalReferencesPanel } from "@/components/common/LegalReferencesPanel";
import { SectionHeader } from "@/components/ui/SectionHeader";

type VehicleDetails = {
  id: string;
  brand: string;
  model: string;
  plate: string;
  vin?: string | null;
  fuel?: string | null;
  client: { id: number; firstName: string; lastName: string };
  interventions: Array<{
    id: string;
    type: string;
    notes?: string | null;
    createdAt: string;
    performedAt?: string | null;
  }>;
};

const INTERVENTION_TYPES = ["E85", "Reprog", "Diag", "Autre"];

export default function VehiculeDetailPage() {
  const params = useParams();
  const vehicleId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "E85",
    notes: "",
    performedAt: "",
    odometerKm: "",
    ecuType: "",
    softwareVersion: "",
    checksum: "",
  });

  const loadVehicle = async () => {
    if (!vehicleId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<VehicleDetails>(`/api/vehicules/${vehicleId}`, {
        noStore: true,
      });
      setVehicle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  const createIntervention = async () => {
    if (!vehicleId) return;
    setError(null);
    try {
      const payload = {
        vehicleId,
        type: form.type,
        notes: form.notes || null,
        performedAt: form.performedAt || null,
        odometerKm: form.odometerKm || null,
        ecuType: form.ecuType || null,
        softwareVersion: form.softwareVersion || null,
        checksum: form.checksum || null,
      };
      await requestJson("/api/interventions", { method: "POST", body: payload });
      setForm({
        type: "E85",
        notes: "",
        performedAt: "",
        odometerKm: "",
        ecuType: "",
        softwareVersion: "",
        checksum: "",
      });
      await loadVehicle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    }
  };

  return (
    <div className="grid gap-6">
      <SectionHeader
        title={vehicle ? vehicle.plate : "Véhicule"}
        description="Dossier véhicule et historique des interventions."
        action={
          <Link
            href="/vehicules"
            className="text-sm font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]"
          >
            Retour véhicules
          </Link>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <Loading />
      ) : vehicle ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-6">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Véhicule</p>
                  <h2 className="mt-2 text-xl font-semibold text-[color:var(--text)]">
                    {vehicle.brand} {vehicle.model}
                  </h2>
                  <p className="text-sm text-[color:var(--textMuted)]">
                    Client: {vehicle.client.firstName} {vehicle.client.lastName}
                  </p>
                </div>
                <Badge variant="accent">{vehicle.plate}</Badge>
              </div>
              <div className="mt-6 grid gap-3 text-sm text-[color:var(--textMuted)]">
                <p>VIN: {vehicle.vin || "-"}</p>
                <p>Carburant: {vehicle.fuel || "-"}</p>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Interventions</p>
                  <h2 className="mt-2 text-xl font-semibold text-[color:var(--text)]">Historique</h2>
                </div>
                <Badge variant="accent">{vehicle.interventions.length}</Badge>
              </div>
              <div className="mt-6 grid gap-3">
                {vehicle.interventions.length === 0 ? (
                  <p className="text-sm text-[color:var(--textMuted)]">Aucune intervention.</p>
                ) : (
                  vehicle.interventions.map((intervention) => (
                    <div
                      key={intervention.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface2)] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--text)]">{intervention.type}</p>
                        <p className="text-xs text-[color:var(--textMuted)]">
                          {new Date(intervention.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Link
                          href={`/interventions/${intervention.id}`}
                          className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]"
                        >
                          Détails
                        </Link>
                        <a
                          href={`/api/interventions/${intervention.id}/pdf`}
                          className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]"
                        >
                          PDF
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card className="grid gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Nouvelle intervention</p>
              <h2 className="mt-2 text-xl font-semibold text-[color:var(--text)]">Ajouter un dossier</h2>
            </div>
            <Select
              label="Type"
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            >
              {INTERVENTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            <Input
              label="Date realisee"
              type="datetime-local"
              value={form.performedAt}
              onChange={(event) => setForm((prev) => ({ ...prev, performedAt: event.target.value }))}
            />
            <Input
              label="Kilometrage"
              value={form.odometerKm}
              onChange={(event) => setForm((prev) => ({ ...prev, odometerKm: event.target.value }))}
              placeholder="120000"
            />
            <Input
              label="ECU"
              value={form.ecuType}
              onChange={(event) => setForm((prev) => ({ ...prev, ecuType: event.target.value }))}
              placeholder="Bosch EDC17"
            />
            <Input
              label="Version logicielle"
              value={form.softwareVersion}
              onChange={(event) => setForm((prev) => ({ ...prev, softwareVersion: event.target.value }))}
              placeholder="v3.2"
            />
            <Input
              label="Checksum"
              value={form.checksum}
              onChange={(event) => setForm((prev) => ({ ...prev, checksum: event.target.value }))}
              placeholder="SHA256"
            />
            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Details de l'intervention"
            />
            <LegalReferencesPanel type={form.type} />
            <Button onClick={createIntervention}>Créer l'intervention</Button>
          </Card>
        </div>
      ) : (
        <p className="text-sm text-[color:var(--textMuted)]">Véhicule introuvable.</p>
      )}
    </div>
  );
}

```

## app/(dashboard)/vehicules/page.tsx
<a id="app-dashboard-vehicules-pagetsx"></a>

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { fetcher, requestJson } from "@/lib/fetcher";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownItem } from "@/components/ui/DropdownMenu";
import { useToast } from "@/components/ui/Toast";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { EmptyState } from "@/components/common/EmptyState";

type ClientOption = { id: number; firstName: string; lastName: string };

type VehicleItem = {
  id: string;
  brand: string;
  model: string;
  plate: string;
  vin?: string | null;
  fuel?: string | null;
  createdAt?: string;
  client: ClientOption;
};

type VehicleDetails = VehicleItem & {
  interventions?: Array<{ id: string; type: string; createdAt: string }>
};

export default function VehiculesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const selectedFromUrl = searchParams.get("selected") || "";
  const [selectedId, setSelectedId] = useState<string | null>(selectedFromUrl || null);
  const [detail, setDetail] = useState<VehicleDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const toast = useToast();

  const [form, setForm] = useState({
    clientId: "",
    brand: "",
    model: "",
    plate: "",
    vin: "",
    fuel: "",
  });

  const loadVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<VehicleItem[]>("/api/vehicules", { noStore: true });
      setVehicles(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await fetcher<ClientOption[]>("/api/clients", { noStore: true });
      setClients(data ?? []);
    } catch {
      setClients([]);
    }
  };

  useEffect(() => {
    loadVehicles();
    loadClients();
  }, []);

  useEffect(() => {
    setSelectedId(selectedFromUrl || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFromUrl]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedId) {
        setDetail(null);
        return;
      }
      setDetailLoading(true);
      try {
        const data = await fetcher<VehicleDetails>(`/api/vehicules/${selectedId}`, { noStore: true });
        setDetail(data);
      } catch (err) {
        setDetail(null);
        setError(err instanceof Error ? err.message : "Erreur serveur.");
      } finally {
        setDetailLoading(false);
      }
    };
    loadDetail();
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((vehicle) => {
      const data = `${vehicle.plate} ${vehicle.brand} ${vehicle.model} ${vehicle.client.firstName} ${vehicle.client.lastName}`.toLowerCase();
      return data.includes(q);
    });
  }, [vehicles, query]);

  const openCreate = () => {
    setEditorMode("create");
    setForm({ clientId: "", brand: "", model: "", plate: "", vin: "", fuel: "" });
    setEditorOpen(true);
  };

  const openEdit = (vehicle: VehicleDetails) => {
    setEditorMode("edit");
    setForm({
      clientId: String(vehicle.client.id),
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      vin: vehicle.vin ?? "",
      fuel: vehicle.fuel ?? "",
    });
    setEditorOpen(true);
  };

  const submit = async () => {
    setError(null);
    try {
      const payload = {
        clientId: Number(form.clientId),
        brand: form.brand,
        model: form.model,
        plate: form.plate,
        vin: form.vin || null,
        fuel: form.fuel || null,
      };

      if (editorMode === "edit" && detail) {
        await requestJson<VehicleItem>(`/api/vehicules/${detail.id}`, { method: "PUT", body: payload });
      } else {
        await requestJson<VehicleItem>("/api/vehicules", { method: "POST", body: payload });
      }
      toast.push({
        title: editorMode === "edit" ? "Véhicule mis à jour" : "Véhicule créé",
        description: "Les informations sont enregistrees.",
        variant: "success",
      });
      setEditorOpen(false);
      await loadVehicles();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  const requestDelete = (vehicleId: string) => {
    setPendingDeleteId(vehicleId);
    setConfirmOpen(true);
  };

  const removeVehicle = async () => {
    if (!pendingDeleteId) return;
    try {
      await requestJson(`/api/vehicules/${pendingDeleteId}`, { method: "DELETE" });
      toast.push({
        title: "Vehicule supprime",
        description: "Le vehicule a ete retire.",
        variant: "success",
      });
      await loadVehicles();
      if (selectedId === pendingDeleteId) {
        setSelectedId(null);
        router.replace("/vehicules");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    } finally {
      setConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Véhicules"
        description="Parc véhicule, recherche et accès aux dossiers."
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Créer
          </Button>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-[color:var(--border)] p-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par plaque, marque, client"
            />
            <p className="mt-3 text-xs text-[color:var(--textMuted)]">
              {loading ? "Chargement…" : `${filtered.length} véhicule(s)`}
            </p>
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-[color:var(--textMuted)]">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Aucun véhicule"
                  description="Créez un véhicule pour démarrer."
                  action={<Button onClick={openCreate}>Créer un véhicule</Button>}
                />
              </div>
            ) : (
              <div className="p-2">
                {filtered.map((vehicle) => {
                  const isActive = selectedId === vehicle.id;
                  return (
                    <Link
                      key={vehicle.id}
                      href={`/vehicules/${vehicle.id}`}
                      onClick={(e) => {
                        if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
                          e.preventDefault();
                          setSelectedId(vehicle.id);
                          router.replace(`/vehicules?selected=${vehicle.id}`);
                        }
                      }}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm transition ${
                        isActive
                          ? "bg-[color:var(--surface2)] text-[color:var(--text)] border border-[color:var(--accent)]"
                          : "text-[color:var(--text)] hover:bg-[color:var(--surface2)] border border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{vehicle.plate}</p>
                        <p className="truncate text-xs text-[color:var(--textMuted)]">
                          {vehicle.brand} {vehicle.model} · {vehicle.client.firstName} {vehicle.client.lastName}
                        </p>
                      </div>
                      <Badge variant="accent">Dossier</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="border-b border-[color:var(--border)] p-4 flex items-start justify-between gap-3">
            <div>
              <p className="ms-kicker">Détail</p>
              <p className="mt-1 text-sm text-[color:var(--textMuted)]">
                {detail ? detail.plate : "Sélectionnez un véhicule"}
              </p>
            </div>

            {detail ? (
              <DropdownMenu
                trigger={
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--surface2)]"
                    aria-label="Actions"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                }
              >
                <DropdownItem onClick={() => openEdit(detail)}>
                  <span className="inline-flex items-center gap-2"><Pencil size={16} /> Modifier</span>
                </DropdownItem>
                <DropdownItem onClick={() => requestDelete(detail.id)}>
                  <span className="inline-flex items-center gap-2 text-[color:var(--danger)]"><Trash2 size={16} /> Supprimer</span>
                </DropdownItem>
              </DropdownMenu>
            ) : null}
          </div>

          <div className="p-4">
            {detailLoading ? (
              <div className="text-sm text-[color:var(--textMuted)]">Chargement du détail…</div>
            ) : !detail ? (
              <EmptyState
                title="Aucun véhicule sélectionné"
                description="Choisissez un véhicule dans la liste pour afficher son dossier."
              />
            ) : (
              <div className="grid gap-4">
                <div className="rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface2)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{detail.plate}</p>
                      <p className="mt-1 text-xs text-[color:var(--textMuted)]">
                        {detail.brand} {detail.model}
                      </p>
                    </div>
                    <Badge variant="accent">{detail.fuel ?? "-"}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-[color:var(--textMuted)]">
                    Client: <span className="text-[color:var(--text)]">{detail.client.firstName} {detail.client.lastName}</span>
                  </p>
                  {detail.vin ? (
                    <p className="mt-1 text-xs text-[color:var(--textMuted)]">VIN: {detail.vin}</p>
                  ) : null}
                  <div className="mt-4">
                    <Link href={`/vehicules/${detail.id}`}>
                      <Button variant="secondary" size="sm">Ouvrir le dossier complet</Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <p className="text-sm font-semibold">Interventions récentes</p>
                  <div className="mt-3 grid gap-2">
                    {!detail.interventions || detail.interventions.length === 0 ? (
                      <p className="text-sm text-[color:var(--textMuted)]">Aucune intervention.</p>
                    ) : (
                      detail.interventions.slice(0, 5).map((i) => (
                        <Link
                          key={i.id}
                          href={`/interventions/${i.id}`}
                          className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--surface2)] px-3 py-2 text-sm hover:bg-[color:var(--surface)]"
                        >
                          <span className="font-medium">{i.type}</span>
                          <span className="text-xs text-[color:var(--textMuted)]">
                            {new Date(i.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={editorMode === "edit" ? "Modifier le véhicule" : "Créer un véhicule"}
        description={editorMode === "edit" ? "Mettez à jour la fiche véhicule." : "Renseignez les informations du véhicule."}
        confirmLabel={editorMode === "edit" ? "Mettre à jour" : "Créer"}
        confirmVariant="primary"
        onConfirm={submit}
      >
        <div className="grid gap-4">
          <Select
            label="Client"
            value={form.clientId}
            onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
          >
            <option value="">Sélectionner un client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
              </option>
            ))}
          </Select>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Marque"
              value={form.brand}
              onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))}
              placeholder="BMW"
            />
            <Input
              label="Modèle"
              value={form.model}
              onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))}
              placeholder="Série 1"
            />
          </div>

          <Input
            label="Immatriculation"
            value={form.plate}
            onChange={(event) => setForm((prev) => ({ ...prev, plate: event.target.value }))}
            placeholder="AB-123-CD"
          />
          <Input
            label="VIN"
            value={form.vin}
            onChange={(event) => setForm((prev) => ({ ...prev, vin: event.target.value }))}
            placeholder="WBA12345678900000"
          />
          <Input
            label="Carburant"
            value={form.fuel}
            onChange={(event) => setForm((prev) => ({ ...prev, fuel: event.target.value }))}
            placeholder="SP98"
          />
        </div>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer ce véhicule"
        description="Le véhicule sera retiré du parc."
        confirmLabel="Supprimer"
        confirmVariant="destructive"
        onConfirm={removeVehicle}
      />
    </div>
  );
}

```

## app/auth/login/page.tsx
<a id="app-auth-login-pagetsx"></a>

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        if (res.status === 403) {
          window.location.href = "/pro/en-attente";
          return;
        }
        throw new Error(json?.error || "Erreur serveur.");
      }
      toast.push({ title: "Connexion reussie", description: "Bienvenue sur votre panel.", variant: "success" });
      window.location.href = "/dashboard";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
      <Card className="w-full max-w-lg p-8">
        <div className="grid gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Connexion</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--text)]">Accès garage</h1>
          <p className="text-sm text-[color:var(--textMuted)]">
            Connectez-vous pour accéder à votre dashboard sécurisé.
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 grid gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="contact@garage.fr"
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            required
          />
          {error ? <p className="text-sm text-[color:var(--danger)]">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--textMuted)]">
          <Link
            href="/auth/register-pro"
            className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]"
          >
            Créer un compte pro
          </Link>
          <Link href="/" className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]">
            Retour site
          </Link>
        </div>
      </Card>
    </main>
  );
}

```

## app/auth/pending/page.tsx
<a id="app-auth-pending-pagetsx"></a>

```tsx
import { redirect } from "next/navigation";

export default function PendingPage() {
  redirect("/pro/en-attente");
}

```

## app/auth/register-pro/page.tsx
<a id="app-auth-register-pro-pagetsx"></a>

```tsx
import { redirect } from "next/navigation";

export default function RegisterProPage() {
  redirect("/pro/inscription");
}

```

## app/globals.css
<a id="app-globalscss"></a>

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;

  /* Design tokens (dark-first) */
  --bg: #0B0D12;
  --surface: #0F1320;
  --surface2: #121A2A;
  --border: rgba(255, 255, 255, 0.06);
  --text: rgba(255, 255, 255, 0.92);
  --textSecondary: rgba(255, 255, 255, 0.62);
  --textMuted: rgba(255, 255, 255, 0.40);
  --accent: #8B5CF6;
  --accentHover: #7C3AED;
  --accent2: #8B5CF6;
  --accentWeak: rgba(139, 92, 246, 0.18);
  --danger: #EF4444;
  --success: #22C55E;
  --warning: #F59E0B;

  /* Friendly aliases for consistent naming */
  --muted: var(--textSecondary);
  --muted2: var(--textMuted);

  /* Radii */
  --rGlobal: 12px;
  --rButton: 10px;
  --rInput: 10px;
  --rCard: 14px;

  /* Internal convenience aliases */
  --r: var(--rCard);
  --sh: var(--shCard);

  /* Shadows */
  --shCard: 0 10px 30px rgba(0, 0, 0, 0.35);
  --shDropdown: 0 18px 40px rgba(0, 0, 0, 0.45);

  /* Compatibility aliases removed: all components use canonical tokens */
}

html,
body {
  height: 100%;
}

body {
  background: var(--bg);
  color: var(--text);
}

/* Focus ring (consistent everywhere) */
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.55);
}

::selection {
  background: rgba(139, 92, 246, 0.22);
  color: rgba(255, 255, 255, 0.96);
}

/* Scrollbar (subtle) */
::-webkit-scrollbar {
  width: 10px;
}
::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.04);
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.10);
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.16);
}

@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
}

@layer components {
  .ms-card {
    @apply border;
    border-color: var(--border);
    background: var(--surface);
    border-radius: var(--rCard);
    box-shadow: var(--shCard);
  }

  .ms-input {
    @apply w-full;
    min-height: 44px;
    border-radius: var(--rInput);
    background: var(--surface2);
    border: 1px solid var(--border);
    padding: 0.5rem 0.75rem;
    color: var(--text);
  }
  .ms-input::placeholder {
    color: var(--textMuted);
  }
  .ms-input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.55);
  }

  .ms-kicker {
    font-size: 0.72rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--textMuted);
  }
}



```

## app/layout.tsx
<a id="app-layouttsx"></a>

```tsx

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MotorSafe",
    template: "%s | MotorSafe",
  },
  description: "Panel professionnel pour garages, interventions et conformite.",
  applicationName: "MotorSafe",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.variable} ${jetbrains.variable} min-h-screen`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

```

## app/legal/page.tsx
<a id="app-legal-pagetsx"></a>

```tsx
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function LegalPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-16">
      <Card className="grid gap-4">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--textMuted)]">Légal</p>
        <h1 className="text-3xl font-semibold text-[color:var(--text)]">Informations légales</h1>
        <p className="text-sm text-[color:var(--textMuted)]">
          Cette page sera completee avec les mentions legales, la politique de confidentialite et les
          conditions d'utilisation.
        </p>
        <Link href="/" className="text-sm font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]">
          Retour au site
        </Link>
      </Card>
    </main>
  );
}

```

## app/page.tsx
<a id="app-pagetsx"></a>

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "MotorSafe Pro – Gestion de garages et interventions",
  description:
    "La plateforme SaaS tout-en-un pour les garages, pros et flottes. Gérez clients, véhicules, interventions, documents et conformité.",
  keywords: [
    "garage",
    "SaaS",
    "gestion",
    "flotte",
    "automobile",
    "interventions",
    "MotorSafe",
    "logiciel garage",
    "cloud",
    "maintenance",
    "conformité",
  ],
  alternates: { canonical: "https://motorsafe.fr" },
  openGraph: {
    title: "MotorSafe Pro – Gestion de garages et interventions",
    description:
      "La plateforme SaaS tout-en-un pour les garages, pros et flottes. Gérez clients, véhicules, interventions, documents et conformité.",
    url: "https://motorsafe.fr",
    type: "website",
    images: ["/og-motorsafe.png"],
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen w-full bg-[color:var(--bg)] text-[color:var(--text)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-8">
        <header className="flex flex-col gap-10">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface2)]">
                <span className="text-sm font-semibold text-[color:var(--accent)]">MS</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">MotorSafe</div>
                <div className="text-xs text-[color:var(--textMuted)]">SaaS pour garages & pros</div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="secondary" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link href="/pro/inscription">
                <Button variant="primary" size="sm">
                  Demander un accès
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr] md:items-start">
            <div className="grid gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">MotorSafe Pro</p>
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                Une interface premium pour piloter votre activité.
              </h1>
              <p className="max-w-2xl text-base text-[color:var(--textSecondary)] md:text-lg">
                Clients, véhicules, interventions, documents et conformité : tout est centralisé dans un panel clair, rapide et
                responsive.
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Link href="/auth/login">
                  <Button size="lg">Démarrer</Button>
                </Link>
                <Link href="/legal">
                  <Button size="lg" variant="ghost">
                    Mentions légales
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">En bref</p>
              <ul className="mt-3 grid gap-2 text-sm text-[color:var(--textSecondary)]">
                <li>• Workflow simple : clients → véhicules → interventions → PDF</li>
                <li>• Traçabilité et conformité intégrées</li>
                <li>• Mobile, tablette, desktop</li>
              </ul>
            </Card>
          </div>
        </header>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Gestion complète</h2>
            <p className="mt-2 text-sm text-[color:var(--textSecondary)]">
              Clients, véhicules, interventions, documents et conformité : tout est au même endroit.
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Lisible & cohérent</h2>
            <p className="mt-2 text-sm text-[color:var(--textSecondary)]">
              Surfaces nettes, typographie claire, espace : une UI sobre, premium et productive.
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Sécurisé</h2>
            <p className="mt-2 text-sm text-[color:var(--textSecondary)]">
              Accès, preuves et historique : la conformité sans complexité.
            </p>
          </Card>
        </section>

        <footer className="mt-14 border-t border-[color:var(--border)] pt-8 text-center text-xs text-[color:var(--textMuted)]">
          © {new Date().getFullYear()} MotorSafe.
        </footer>
      </div>
    </main>
  );
}

```

## app/pro/en-attente/page.tsx
<a id="app-pro-en-attente-pagetsx"></a>

```tsx
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function ProPendingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
      <Card className="w-full max-w-xl text-center p-8">
        <Badge variant="warning">Validation en cours</Badge>
        <h1 className="mt-4 text-3xl font-semibold text-[color:var(--text)]">Compte en validation</h1>
        <p className="mt-3 text-sm text-[color:var(--textMuted)]">
          Votre dossier est en cours d'analyse par MotorSafe. Nous revenons vers vous dès que la
          validation est terminée.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/auth/login" className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]">
            Revenir à la connexion
          </Link>
          <Link href="/" className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]">
            Retour site
          </Link>
        </div>
      </Card>
    </main>
  );
}

```

## app/pro/inscription/page.tsx
<a id="app-pro-inscription-pagetsx"></a>

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function ProInscriptionPage() {
  const [form, setForm] = useState({
    garageName: "",
    garageEmail: "",
    phone: "",
    address: "",
    siret: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Erreur serveur.");
      }
      toast.push({
        title: "Demande envoyee",
        description: "Votre compte pro est en attente de validation.",
        variant: "success",
      });
      window.location.href = "/pro/en-attente";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-16">
      <Card className="w-full max-w-3xl p-8">
        <div className="grid gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Inscription</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--text)]">Demander un accès MotorSafe</h1>
          <p className="text-sm text-[color:var(--textMuted)]">
            Remplissez votre dossier, l'équipe MotorSafe valide les comptes avant activation.
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 grid gap-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Nom du garage"
              value={form.garageName}
              onChange={(event) => setForm((prev) => ({ ...prev, garageName: event.target.value }))}
              placeholder="Garage Horizon"
              required
            />
            <Input
              label="Email garage"
              type="email"
              value={form.garageEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, garageEmail: event.target.value }))}
              placeholder="garage@horizon.fr"
              required
            />
            <Input
              label="Telephone"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="+33 6 00 00 00 00"
            />
            <Input
              label="Adresse"
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              placeholder="12 rue des Ateliers, Lyon"
            />
            <Input
              label="SIRET"
              value={form.siret}
              onChange={(event) => setForm((prev) => ({ ...prev, siret: event.target.value }))}
              placeholder="123 456 789 00010"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Email responsable"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="responsable@garage.fr"
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="********"
              required
            />
          </div>

          {error ? <p className="text-sm text-[color:var(--danger)]">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer la demande"}
            </Button>
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]"
            >
              Déjà un compte ? Connexion
            </Link>
          </div>
        </form>
      </Card>
    </main>
  );
}

```

## app/pro/page.tsx
<a id="app-pro-pagetsx"></a>

```tsx
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ProLandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-16">
      <Card className="grid gap-6 text-center p-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">Espace pro</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--text)]">Connexion garages</h1>
          <p className="text-sm text-[color:var(--textMuted)]">
            Connectez-vous ou demandez un compte pro. Chaque demande est validée par l'administration.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/auth/login">
            <Button>Connexion Pro</Button>
          </Link>
          <Link href="/pro/inscription">
            <Button variant="secondary">Créer compte pro</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}

```

## app/pro/pending/page.tsx
<a id="app-pro-pending-pagetsx"></a>

```tsx
import { redirect } from "next/navigation";

export default function ProPendingRedirect() {
  redirect("/pro/en-attente");
}

```

## app/pro/signup/page.tsx
<a id="app-pro-signup-pagetsx"></a>

```tsx
import { redirect } from "next/navigation";

export default function ProSignupRedirect() {
  redirect("/pro/inscription");
}

```

## components/common/BadgeStatus.tsx
<a id="components-common-badgestatustsx"></a>

```tsx
export default function BadgeStatus({ status }: { status: string }) {
  let color = "";
  switch (status) {
    case "Brouillon": color = "badge badge-warning"; break;
    case "En cours": color = "badge badge-accent"; break;
    case "Terminé": color = "badge badge-success"; break;
    case "Facturé": color = "badge badge-accent-2"; break;
    default: color = "badge";
  }
  return <span className={color}>{status}</span>;
}

```

## components/common/DataCards.tsx
<a id="components-common-datacardstsx"></a>

```tsx
import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export default function DataCards({ data, render }: { data: any[], render: (row: any) => ReactNode }) {
  if (!data.length) {
    return (
      <Card className="p-8 text-center text-[color:var(--textMuted)]">
        Aucune donnée
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {data.map((row, i) => (
        <Card key={i} className="p-4">
          {render(row)}
        </Card>
      ))}
    </div>
  );
}

```

## components/common/DataTable.tsx
<a id="components-common-datatabletsx"></a>

```tsx
import { ReactNode } from "react";

export default function DataTable({ columns, data }: { columns: { key: string, label: string, render?: (row: any) => ReactNode }[], data: any[] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--rCard)] border border-border bg-surface shadow-soft">
      <table className="min-w-full text-[var(--text)]">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--textMuted)] border-b border-border">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="py-8 text-center text-[color:var(--textMuted)]">Aucune donnée</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-surface2/60 transition">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 border-b border-border text-sm">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

```

## components/common/EmptyState.tsx
<a id="components-common-emptystatetsx"></a>

```tsx
import { Card } from "@/components/ui/Card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="text-center">
      <p className="text-sm font-semibold">{title}</p>
      {description ? <p className="mt-2 text-sm text-[color:var(--textMuted)]">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </Card>
  );
}

```

## components/common/ErrorBanner.tsx
<a id="components-common-errorbannertsx"></a>

```tsx
import { Card } from "@/components/ui/Card";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <Card className="border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)]">
      <p className="text-sm text-[#fecaca]">{message}</p>
    </Card>
  );
}

```

## components/common/LegalReferencesConfig.ts
<a id="components-common-legalreferencesconfigts"></a>

```ts
// Exemple de config extensible pour références légales
export const legalRefs = {
  interventionType: {
    references: [
      "Article L.123-1 du Code de la route",
      "Arrêté du 2 mars 1995 relatif à la conformité des interventions",
    ],
    obligationsGarage: [
      "Respecter les normes de sécurité.",
      "Remettre un devis détaillé au client.",
    ],
    obligationsClient: [
      "Fournir les documents du véhicule.",
      "Accepter le devis avant intervention.",
    ],
    preuves: [
      "Devis signé.",
      "Facture acquittée.",
    ],
  },
};

```

## components/common/LegalReferencesPanel.tsx
<a id="components-common-legalreferencespaneltsx"></a>

```tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { fetcher } from "@/lib/fetcher";

type LegalReference = {
  id: string;
  title: string;
  summary?: string | null;
  sourceUrl?: string | null;
  code?: string | null;
  articleRef?: string | null;
  tags?: string | null;
  severity: "INFO" | "WARNING" | "CRITICAL";
};

const severityVariant: Record<LegalReference["severity"], "neutral" | "warning" | "accent"> = {
  INFO: "neutral",
  WARNING: "warning",
  CRITICAL: "accent",
};

export function LegalReferencesPanel({ type }: { type: string }) {
  const [items, setItems] = useState<LegalReference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!type) return;
    let active = true;
    setLoading(true);
    fetcher<LegalReference[]>(`/api/legal-references?type=${encodeURIComponent(type)}`, {
      noStore: true,
    })
      .then((data) => {
        if (active) setItems(data ?? []);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [type]);

  return (
    <Card className="grid gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">References & conformite</p>
        <h3 className="mt-2 text-lg font-semibold">Cadre legal associe</h3>
      </div>
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune reference associee"
          description="L'administration pourra ajouter des references legales liees a ce type."
        />
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <details
              key={item.id}
              className="rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[color:var(--text)]">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-[color:var(--textMuted)]">
                    {item.code || item.articleRef || item.tags ? "Voir le détail" : ""}
                  </p>
                </div>
                <Badge variant={severityVariant[item.severity]}>
                  {item.severity === "CRITICAL" ? "Critique" : item.severity === "WARNING" ? "Attention" : "Info"}
                </Badge>
              </summary>

              <div className="border-t border-[color:var(--border)] px-4 py-3 text-sm">
                {item.summary ? (
                  <p className="text-sm text-[color:var(--textMuted)]">{item.summary}</p>
                ) : (
                  <p className="text-sm text-[color:var(--textMuted)]">Aucun résumé.</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--textMuted)]">
                  {item.code ? <span>{item.code}</span> : null}
                  {item.articleRef ? <span>{item.articleRef}</span> : null}
                  {item.tags ? <span>Tags: {item.tags}</span> : null}
                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accentHover)]"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Source
                    </a>
                  ) : null}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </Card>
  );
}

```

## components/common/Loading.tsx
<a id="components-common-loadingtsx"></a>

```tsx
import { Skeleton } from "@/components/ui/Skeleton";

export function Loading({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-full" />
      <p className="text-xs text-[color:var(--textMuted)]">{label}</p>
    </div>
  );
}

```

## components/common/PageHeader.tsx
<a id="components-common-pageheadertsx"></a>

```tsx
export default function PageHeader({ title, children }: { title: string, children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">{title}</h1>
      {children}
    </div>
  );
}

```

## components/common/Skeleton.tsx
<a id="components-common-skeletontsx"></a>

```tsx
export default function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-surface2 rounded-[var(--rGlobal)] ${className}`} />;
}

```

## components/common/StatCard.tsx
<a id="components-common-statcardtsx"></a>

```tsx
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function StatCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: number | string;
  badge?: string;
}) {
  return (
    <Card className="relative flex flex-col gap-3 overflow-hidden">
      <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-[color:var(--accentWeak)] blur-2xl" />
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
      {badge ? <Badge variant="accent">{badge}</Badge> : null}
    </Card>
  );
}

```

## components/dashboard-shell.tsx
<a id="components-dashboard-shelltsx"></a>

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { UserProvider } from "@/components/user-context";
import { AppShell } from "@/components/layout/AppShell";
import type { SessionUser } from "@/lib/auth";



export default function DashboardShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("ms_sidebar_collapsed");
    if (stored) {
      setCollapsed(stored === "1");
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("ms_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  };

  const filteredNav = useMemo(
    () => NAV_ITEMS.filter((item) => !item.adminOnly || user.role === "ADMIN"),
    [user.role]
  );

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <UserProvider user={user}>
      <AppShell
        user={user}
        navItems={filteredNav}
        activePath={pathname}
        sidebarOpen={sidebarOpen}
        onSidebarClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        onMenu={() => setSidebarOpen(true)}
        onToggleCreate={() => setCreateOpen((open) => !open)}
        createOpen={createOpen}
        onLogout={handleLogout}
      >
        {children}
      </AppShell>
    </UserProvider>
  );
}

```

## components/layout/AppShell.tsx
<a id="components-layout-appshelltsx"></a>

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import Drawer from "@/components/ui/navigation/Drawer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import {
  LayoutGrid,
  Users,
  Car,
  Wrench,
  FileText,
  Settings,
  ShieldCheck,
  Menu,
  Plus,
  Search,
  MoreHorizontal,
  LogOut,
  UserCircle2,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type AppShellProps = {
  children: React.ReactNode;
  user?: SessionUser;
  navItems?: NavItem[];
  activePath?: string;
  sidebarOpen?: boolean;
  onSidebarClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onMenu?: () => void;
  onToggleCreate?: () => void;
  createOpen?: boolean;
  onLogout?: () => void;
};

export function AppShell({
  children,
  user,
  navItems = [],
  activePath,
  sidebarOpen = false,
  onSidebarClose = () => {},
  collapsed: _collapsed = false,
  onToggleCollapse: _onToggleCollapse = () => {},
  onMenu = () => {},
  onToggleCreate = () => {},
  createOpen: _createOpen = false,
  onLogout = () => {},
}: AppShellProps) {
  const pathname = usePathname?.() || activePath || "/";

  const bottomItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Clients", href: "/clients", icon: Users },
    { label: "Véhicules", href: "/vehicules", icon: Car },
    { label: "Interventions", href: "/interventions", icon: Wrench },
  ] as const;

  const [plusOpen, setPlusOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      {/* TopBar (fixed) */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--bg)]/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 lg:px-8">
          <button
            type="button"
            onClick={onMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-transparent text-[color:var(--textMuted)] hover:bg-white/5 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu size={18} />
          </button>

          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface2)]">
              <span className="text-sm font-semibold text-[color:var(--accent2)]">MS</span>
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-semibold">MotorSafe</div>
              <div className="text-xs text-[color:var(--textMuted)]">Panel garages</div>
            </div>
          </Link>

          <div className="hidden flex-1 items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 md:flex">
            <Search size={16} className="text-[color:var(--textMuted)]" />
            <input
              className="h-10 w-full bg-transparent text-sm text-[color:var(--text)] placeholder:text-[color:var(--textMuted)] outline-none"
              placeholder="Rechercher un client, une plaque, un dossier…"
              aria-label="Recherche globale"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-transparent text-[color:var(--textMuted)] hover:bg-white/5 md:hidden"
              aria-label="Recherche"
            >
              <Search size={18} />
            </button>

            <DropdownMenu
              trigger={
                <Button variant="primary" size="sm" onClick={onToggleCreate}>
                  <Plus size={16} /> Nouveau
                </Button>
              }
            >
              <Link className="block" href="/clients">
                <div className="rounded-xl px-3 py-2 text-sm hover:bg-white/5">Client</div>
              </Link>
              <Link className="block" href="/vehicules">
                <div className="rounded-xl px-3 py-2 text-sm hover:bg-white/5">Véhicule</div>
              </Link>
              <Link className="block" href="/interventions">
                <div className="rounded-xl px-3 py-2 text-sm hover:bg-white/5">Intervention</div>
              </Link>
              <Link className="block" href="/documents">
                <div className="rounded-xl px-3 py-2 text-sm hover:bg-white/5">PDF</div>
              </Link>
            </DropdownMenu>

            <DropdownMenu
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm hover:bg-white/5"
                >
                  <UserCircle2 size={18} className="text-[color:var(--textMuted)]" />
                  <span className="hidden sm:block max-w-[180px] truncate">{user?.email ?? "Profil"}</span>
                </button>
              }
            >
              <Link className="block" href="/parametres">
                <div className="rounded-xl px-3 py-2 text-sm hover:bg-white/5">Paramètres</div>
              </Link>
              <button
                type="button"
                className="w-full rounded-xl px-3 py-2 text-left text-sm text-[color:var(--text)] hover:bg-white/5"
                onClick={onLogout}
              >
                Quitter
              </button>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop layout */}
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-[260px] shrink-0 border-r border-[color:var(--border)] bg-[color:var(--bg)] lg:block">
          <div className="flex h-full flex-col px-3 py-4">
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-[color:var(--accentWeak)] text-white"
                        : "text-[color:var(--textMuted)] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={18} className={isActive ? "text-[color:var(--accent2)]" : "text-[color:var(--textMuted)]"} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user?.email ?? ""}</p>
                  <p className="text-xs text-[color:var(--textMuted)]">Profil</p>
                </div>
                <Badge variant="accent">{user?.role === "ADMIN" ? "Admin" : "Pro"}</Badge>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm text-[color:var(--textMuted)] hover:bg-white/5"
              >
                <LogOut size={16} /> Quitter
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pt-16">
          <div className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8">{children}</div>
          <div className="h-20 md:hidden" />
        </main>
      </div>

      {/* Mobile Drawer (sidebar) */}
      <Drawer open={sidebarOpen} onClose={onSidebarClose} side="left" title="Navigation">
        <div className="mb-4">
          <Input placeholder="Rechercher…" />
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onSidebarClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                  isActive
                    ? "bg-[color:var(--accentWeak)] text-white"
                    : "text-[color:var(--textMuted)] hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} className={isActive ? "text-[color:var(--accent2)]" : "text-[color:var(--textMuted)]"} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface2)] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm">{user?.email ?? ""}</p>
            <Badge variant="accent">{user?.role === "ADMIN" ? "Admin" : "Pro"}</Badge>
          </div>
        </div>
      </Drawer>

      {/* Mobile BottomNav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--border)] bg-[color:var(--bg)]/80 backdrop-blur md:hidden">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)]">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-2 py-2 text-xs ${
                  isActive ? "text-white" : "text-[color:var(--textMuted)]"
                }`}
              >
                <Icon size={18} className={isActive ? "text-[color:var(--accent2)]" : "text-[color:var(--textMuted)]"} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setPlusOpen(true)}
            className="flex flex-col items-center gap-1 px-2 py-2 text-xs text-[color:var(--textMuted)]"
            aria-label="Plus"
          >
            <MoreHorizontal size={18} className="text-[color:var(--textMuted)]" />
            <span>Plus</span>
          </button>
        </div>
      </nav>

      <Drawer open={plusOpen} onClose={() => setPlusOpen(false)} side="bottom" title="Plus">
        <div className="grid gap-2">
          {[
            { label: "Documents PDF", href: "/documents", icon: FileText },
            { label: "Paramètres", href: "/parametres", icon: Settings },
            { label: "Pro demandes", href: "/admin/pro-demandes", icon: ShieldCheck },
            { label: "Références légales", href: "/admin/references", icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setPlusOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm hover:bg-white/5"
              >
                <Icon size={18} className="text-[color:var(--accent2)]" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </Drawer>
    </div>
  );
}

```

## components/layout/MobileNav.tsx
<a id="components-layout-mobilenavtsx"></a>

```tsx
"use client";


import Link from "next/link";
import { NAV_ITEMS } from "@/components/layout/nav-config";

export default function MobileNav({ activePath }: { activePath: string }) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[92%] -translate-x-1/2 rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] shadow-[var(--shDropdown)] lg:hidden">
      <div className="flex items-center justify-between gap-3">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = activePath === item.href || activePath.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 text-xs ${
                isActive ? "text-white" : "text-[color:var(--textMuted)]"
              }`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

```

## components/layout/nav-config.ts
<a id="components-layout-nav-configts"></a>

```ts
import {
  LayoutGrid,
  Users,
  Car,
  Wrench,
  FileText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { ComponentType } from "react";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Véhicules", href: "/vehicules", icon: Car },
  { label: "Interventions", href: "/interventions", icon: Wrench },
  { label: "Documents PDF", href: "/documents", icon: FileText },
  { label: "Paramètres", href: "/parametres", icon: Settings },
  { label: "Demandes pro", href: "/admin/pro-demandes", icon: ShieldCheck, adminOnly: true },
  { label: "Références légales", href: "/admin/references", icon: ShieldCheck, adminOnly: true },
];
```

## components/layout/Sidebar.tsx
<a id="components-layout-sidebartsx"></a>

```tsx
"use client";

import type { ReactNode } from "react";

export function Sidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="w-full h-full flex flex-col p-4 rounded-[var(--rCard)] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shCard)]">
      {children}
    </aside>
  );
}

```

## components/layout/Topbar.tsx
<a id="components-layout-topbartsx"></a>

```tsx
"use client";

import Link from "next/link";
import { Menu, Plus, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Topbar({
  onMenu,
  onToggleCreate,
  createOpen,
  onLogout,
}: {
  onMenu: () => void;
  onToggleCreate: () => void;
  createOpen: boolean;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/70 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 h-16 flex items-center gap-3">
        <button
          onClick={onMenu}
          className="rounded-[var(--rButton)] border border-border p-2 text-muted lg:hidden"
          aria-label="Menu"
        >
          <Menu size={18} />
        </button>
        <div className="flex flex-1 items-center gap-2 rounded-[var(--rInput)] border border-border bg-surface px-4 py-2">
          <Search size={16} className="text-[color:var(--textMuted)]" />
          <input
            placeholder="Rechercher un client, une plaque, un dossier..."
            className="w-full bg-transparent text-sm text-[var(--text)] outline-none"
            aria-label="Recherche globale"
          />
        </div>
        <div className="relative">
          <Button variant="primary" size="sm" onClick={onToggleCreate}>
            <Plus size={16} /> Nouveau
          </Button>
          {createOpen ? (
            <div className="absolute right-0 mt-3 w-56 rounded-[var(--rCard)] border border-border bg-surface p-2 shadow-dropdown">
              {[
                { label: "Nouveau client", href: "/clients" },
                { label: "Nouveau vehicule", href: "/vehicules" },
                { label: "Nouvelle intervention", href: "/interventions" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-[var(--rButton)] px-3 py-2 text-sm text-muted hover:bg-primary/10 hover:text-text"
                  onClick={onToggleCreate}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LogOut size={16} /> Quitter
        </Button>
      </div>
    </header>
  );
}

```

## components/parametres/ComplianceToggles.tsx
<a id="components-parametres-compliancetogglestsx"></a>

```tsx
"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/Toggle";

type ComplianceTogglesProps = {
  initialHash?: boolean;
  initialHistory?: boolean;
  initialAlerts?: boolean;
};

export function ComplianceToggles({
  initialHash = true,
  initialHistory = true,
  initialAlerts = true,
}: ComplianceTogglesProps) {
  const [hashEnabled, setHashEnabled] = useState(initialHash);
  const [historyEnabled, setHistoryEnabled] = useState(initialHistory);
  const [alertsEnabled, setAlertsEnabled] = useState(initialAlerts);

  return (
    <div className="grid gap-3 text-sm text-[color:var(--textMuted)]">
      <Toggle checked={hashEnabled} onChange={setHashEnabled} label="Activer le hash de preuve" />
      <Toggle checked={historyEnabled} onChange={setHistoryEnabled} label="Historique des révisions obligatoire" />
      <Toggle checked={alertsEnabled} onChange={setAlertsEnabled} label="Alertes email sur dossier critique" />
    </div>
  );
}

```

## components/ui/Badge.tsx
<a id="components-ui-badgetsx"></a>

```tsx
import type { HTMLAttributes } from "react";

type BadgeVariant = "success" | "warning" | "neutral" | "accent";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  success: "bg-[rgba(34,197,94,0.16)] text-[color:var(--success)]",
  warning: "bg-[rgba(251,191,36,0.14)] text-[rgba(251,191,36,0.92)]",
  neutral: "bg-[rgba(255,255,255,0.06)] text-[color:var(--textMuted)]",
  accent: "bg-[color:var(--accentWeak)] text-[color:var(--accent)]",
};

export function Badge({ className = "", variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

```

## components/ui/Button.tsx
<a id="components-ui-buttontsx"></a>

```tsx
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--rButton)] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--accent)] text-white shadow-[var(--shCard)] hover:bg-[color:var(--accentHover)] active:translate-y-[1px]",
  secondary:
    "bg-[color:var(--surface)] text-[color:var(--text)] border border-[color:var(--border)] hover:bg-[color:var(--surface2)] hover:border-[rgba(255,255,255,0.12)] active:translate-y-[1px]",
  ghost: "bg-transparent text-[color:var(--text)] hover:bg-[color:var(--surface2)] active:translate-y-[1px]",
  outline:
    "bg-transparent text-[color:var(--text)] border border-[color:var(--border)] hover:bg-[color:var(--surface2)] hover:border-[rgba(255,255,255,0.12)] active:translate-y-[1px]",
  destructive:
    "bg-[rgba(239,68,68,0.14)] text-[color:var(--danger)] border border-[rgba(239,68,68,0.35)] hover:bg-[rgba(239,68,68,0.22)] active:translate-y-[1px]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
  );
}

```

## components/ui/Card.tsx
<a id="components-ui-cardtsx"></a>

```tsx
import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--sh)] ${className}`}
      {...props}
    />
  );
}

```

## components/ui/container/Container.tsx
<a id="components-ui-container-containertsx"></a>

```tsx
import React from "react";

/**
 * Container
 * - Responsive max-width, padding, and centering
 * - Uses Tailwind's container and custom breakpoints
 */
export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
  );
}

```

## components/ui/DataTable.tsx
<a id="components-ui-datatabletsx"></a>

```tsx
type DataTableProps = {
  stickyHeader?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function DataTable({ stickyHeader = false, className = "", children }: DataTableProps) {
  return (
    <div
      className={`overflow-x-auto rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--sh)] ${className}`}
    >
      <table className="w-full text-sm">{children}</table>
      {stickyHeader ? null : null}
    </div>
  );
}

export function DataTableHead({
  sticky = false,
  children,
}: {
  sticky?: boolean;
  children: React.ReactNode;
}) {
  return (
    <thead
      className={`text-left text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)] ${
        sticky ? "sticky top-0 bg-[color:var(--surface2)]/95 backdrop-blur" : ""
      }`}
    >
      {children}
    </thead>
  );
}

```

## components/ui/Dialog.tsx
<a id="components-ui-dialogtsx"></a>

```tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "secondary" | "destructive";
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
};

export function Dialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  confirmVariant = "primary",
  onConfirm,
  onOpenChange,
  children,
}: DialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        className="absolute inset-0 bg-black/60"
        aria-label="Fermer"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-lg rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface2)] p-6 shadow-[var(--sh)]">
        <div className="grid gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description ? <p className="text-sm text-[color:var(--textMuted)]">{description}</p> : null}
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

```

## components/ui/DropdownMenu.tsx
<a id="components-ui-dropdownmenutsx"></a>

```tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";

export function DropdownMenu({
  trigger,
  children,
  align = "right",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef} data-dropdown={id}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="contents" aria-expanded={open}>
        {trigger}
      </button>
      {open ? (
        <div
          className={`absolute z-50 mt-2 min-w-[240px] rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--sh)] p-1 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="w-full rounded-xl px-3 py-2 text-left text-sm text-[color:var(--text)] hover:bg-white/5"
    >
      {children}
    </button>
  );
}

```

## components/ui/Input.tsx
<a id="components-ui-inputtsx"></a>

```tsx
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ className = "", label, ...props }: InputProps) {
  return (
    <label className="grid gap-2 text-sm text-[color:var(--textMuted)]">
      {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
      <input
        className={`min-h-[44px] w-full rounded-[var(--rInput)] border border-[color:var(--border)] bg-[color:var(--surface2)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--textMuted)] outline-none transition focus:border-[rgba(255,255,255,0.12)] focus:ring-2 focus:ring-[rgba(139,92,246,0.45)] ${className}`}
        {...props}
      />
    </label>
  );
}

```

## components/ui/KpiCard.tsx
<a id="components-ui-kpicardtsx"></a>

```tsx
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type KpiCardProps = {
  title: string;
  value: number | string;
  trend?: string;
  hint?: string;
};

export function KpiCard({ title, value, trend, hint }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-[color:var(--accentWeak)] blur-2xl" />
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)]">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-[color:var(--textMuted)]">
        {trend ? <Badge variant="accent">{trend}</Badge> : null}
        {hint ? <span>{hint}</span> : null}
      </div>
    </Card>
  );
}

```

## components/ui/navigation/Drawer.tsx
<a id="components-ui-navigation-drawertsx"></a>

```tsx
import React from "react";

type DrawerSide = "left" | "right" | "bottom";

/**
 * Drawer
 * - Used for mobile sidebar and bottom sheets.
 * - Minimal, token-based styling.
 */
export default function Drawer({
  open,
  onClose,
  side = "left",
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: DrawerSide;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  const panelClass =
    side === "bottom"
      ? "w-full max-h-[85vh] rounded-t-[var(--r)]"
      : "h-full w-[88vw] max-w-[320px]";

  const sideClass =
    side === "right"
      ? "ml-auto"
      : side === "bottom"
      ? "mt-auto"
      : "";

  const borderClass = side === "bottom" ? "border-t" : side === "right" ? "border-l" : "border-r";

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Fermer"
        onClick={onClose}
      />
      <aside
        className={`${sideClass} relative ${panelClass} ${borderClass} border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--sh)]`}
        role="dialog"
        aria-modal="true"
      >
        {title ? (
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-4 py-3">
            <p className="text-sm font-semibold text-[color:var(--text)]">{title}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-1.5 text-xs text-[color:var(--textMuted)] hover:bg-white/5"
            >
              Fermer
            </button>
          </div>
        ) : null}
        <div className="h-full overflow-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
          {children}
        </div>
      </aside>
    </div>
  );
}

```

## components/ui/SectionHeader.tsx
<a id="components-ui-sectionheadertsx"></a>

```tsx
import type { ReactNode, JSX } from "react";

export function SectionHeader({
  title,
  description,
  action,
  level = 1,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  level?: 1 | 2 | 3 | 4;
}) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return (
    <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <Tag className="text-[color:var(--text)] font-semibold text-2xl md:text-3xl tracking-tight leading-tight">
          {title}
        </Tag>
        {description ? (
          <p className="mt-1 text-sm text-[color:var(--textMuted)] max-w-2xl">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-4 md:mt-0">{action}</div> : null}
    </div>
  );
}

```

## components/ui/Select.tsx
<a id="components-ui-selecttsx"></a>

```tsx
import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ className = "", label, children, ...props }: SelectProps) {
  return (
    <label className="grid gap-2 text-sm text-[color:var(--textMuted)]">
      {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
      <select
        className={`min-h-[44px] w-full rounded-[var(--rInput)] border border-[color:var(--border)] bg-[color:var(--surface2)] px-3 py-2 text-sm text-[color:var(--text)] outline-none transition focus:border-[rgba(255,255,255,0.12)] focus:ring-2 focus:ring-[rgba(139,92,246,0.45)] ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

```

## components/ui/Skeleton.tsx
<a id="components-ui-skeletontsx"></a>

```tsx
type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-[var(--rGlobal)] bg-white/10 ${className}`}
    />
  );
}

```

## components/ui/Table.tsx
<a id="components-ui-tabletsx"></a>

```tsx
import type { HTMLAttributes } from "react";

type TableProps = HTMLAttributes<HTMLDivElement>;

export function Table({ className = "", ...props }: TableProps) {
  return (
    <div
      className={`overflow-x-auto rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--sh)] ${className}`}
      {...props}
    />
  );
}

```

## components/ui/Textarea.tsx
<a id="components-ui-textareatsx"></a>

```tsx
import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ className = "", label, ...props }: TextareaProps) {
  return (
    <label className="grid gap-2 text-sm text-[color:var(--textMuted)]">
      {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
      <textarea
        className={`min-h-[120px] w-full rounded-[var(--rInput)] border border-[color:var(--border)] bg-[color:var(--surface2)] px-3 py-3 text-sm text-[color:var(--text)] placeholder:text-[color:var(--textMuted)] outline-none transition focus:border-[rgba(255,255,255,0.12)] focus:ring-2 focus:ring-[rgba(139,92,246,0.45)] ${className}`}
        {...props}
      />
    </label>
  );
}

```

## components/ui/Toast.tsx
<a id="components-ui-toasttsx"></a>

```tsx
"use client";

import { createContext, useContext, useMemo, useState } from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  push: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-[rgba(34,197,94,0.35)]",
  error: "border-[rgba(239,68,68,0.35)]",
  info: "border-[rgba(139,92,246,0.30)]",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = (toast: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const entry: ToastItem = { id, ...toast };
    setToasts((prev) => [...prev, entry]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  };

  const value = useMemo(() => ({ push }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 grid gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-[300px] rounded-[var(--r)] border bg-[color:var(--surface2)] px-4 py-3 shadow-[var(--shDropdown)] ${variantStyles[toast.variant]}`}
          >
            <p className="text-sm font-semibold text-[var(--text)]">{toast.title}</p>
            {toast.description ? (
              <p className="mt-1 text-xs text-[color:var(--textMuted)]">{toast.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("ToastProvider is missing.");
  }
  return ctx;
}

```

## components/ui/Toggle.tsx
<a id="components-ui-toggletsx"></a>

```tsx
"use client";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
};

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 text-sm text-[color:var(--textMuted)]">
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] ${
          checked
            ? "border-[color:var(--accent)] bg-[color:var(--accentWeak)]"
            : "border-[color:var(--border)] bg-[color:var(--surface2)]"
        }`}
      >
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[color:var(--text)] transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      {label ? <span>{label}</span> : null}
    </label>
  );
}

```

## components/ui/Tooltip.tsx
<a id="components-ui-tooltiptsx"></a>

```tsx
import * as React from "react";

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  disabled?: boolean;
};

export function Tooltip({ content, children, side = "top", disabled }: TooltipProps) {
  void side;
  // Simple fallback: show content as title if not disabled
  if (disabled || !content) return <>{children}</>;
  return (
    <span title={typeof content === "string" ? content : undefined} style={{ position: "relative", display: "inline-flex" }}>
      {children}
    </span>
  );
}

```

## components/user-context.tsx
<a id="components-user-contexttsx"></a>

```tsx
"use client";

import { createContext, useContext } from "react";
import type { SessionUser } from "@/lib/auth";

const UserContext = createContext<SessionUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error("User context is missing.");
  }
  return user;
}

```

## tailwind.config.js
<a id="tailwindconfigjs"></a>

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        muted2: 'var(--muted2)',
        border: 'var(--border)',
        primary: 'var(--accent)',
        primary2: 'var(--accent2)',
        primaryHover: 'var(--accentHover)',
        primaryWeak: 'var(--accentWeak)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        warning: 'var(--warning)',
      },
      borderRadius: {
        xl: '18px',
        '2xl': '22px',
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: 'var(--shCard)',
        dropdown: 'var(--shDropdown)',
      },
    },
  },
  plugins: [],
};


```

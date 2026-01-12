# UI_CODE_DUMP — SafeMotor

Ce fichier est généré automatiquement.

**Scope:** `app/**` (hors `app/api/**`), `components/**`, `tailwind.config.js`.

**Génération:** `node scripts/dump-ui.js`

## Index

- [app/_ui-debug/page.tsx](#app-_ui-debug-pagetsx)
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
- [app/ui-debug/page.tsx](#app-ui-debug-pagetsx)
- [components/common/EmptyState.tsx](#components-common-emptystatetsx)
- [components/common/ErrorBanner.tsx](#components-common-errorbannertsx)
- [components/common/LegalReferencesConfig.ts](#components-common-legalreferencesconfigts)
- [components/common/LegalReferencesPanel.tsx](#components-common-legalreferencespaneltsx)
- [components/common/Loading.tsx](#components-common-loadingtsx)
- [components/common/StatCard.tsx](#components-common-statcardtsx)
- [components/dashboard-shell.tsx](#components-dashboard-shelltsx)
- [components/layout/AppShell.tsx](#components-layout-appshelltsx)
- [components/layout/DesktopSidebar.tsx](#components-layout-desktopsidebartsx)
- [components/layout/MobileNav.tsx](#components-layout-mobilenavtsx)
- [components/layout/nav-config.ts](#components-layout-nav-configts)
- [components/layout/responsive/ProSidebarMenu.tsx](#components-layout-responsive-prosidebarmenutsx)
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

## app/_ui-debug/page.tsx
<a id="app-_ui-debug-pagetsx"></a>

```tsx
export default function UIDebug() {
  return (
    <main style={{ padding: 40 }}>
      <h1>UI DEBUG PAGE</h1>
      <div className="p-6 rounded-xl bg-blue-600 text-white font-bold">
        If you see blue, Tailwind works.
      </div>
    </main>
  );
}

```

## app/(dashboard)/admin/garages/page.tsx
<a id="app-dashboard-admin-garages-pagetsx"></a>

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
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

  const [garages, setGarages] = useState<GarageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [keyReady, setKeyReady] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (isAdmin) return;
    const stored = window.localStorage.getItem("ms_admin_key");
    if (stored) {
      setAdminKey(stored);
      setKeyReady(true);
    }
  }, [isAdmin]);

  const loadGarages = useCallback(async () => {
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
  }, [adminKey, isAdmin]);

  useEffect(() => {
    if (!user) return;
    if (isAdmin) {
      setKeyReady(true);
      loadGarages();
      return;
    }

    if (keyReady) loadGarages();
  }, [isAdmin, keyReady, loadGarages, user]);

  if (!user) return null;

  if (!keyReady && !isAdmin) {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="ms-cardHeader">
          <p className="ms-kicker">Administration</p>
          <p className="mt-2 text-lg font-semibold text-text">Accès réservé</p>
          <p className="mt-2 text-sm text-muted2">
            Renseignez votre ADMIN_KEY pour continuer.
          </p>
        </div>
        <div className="ms-cardBody">
          <div className="grid max-w-md gap-3">
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
              Déverrouiller
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-8">
      <SectionHeader
        title="Tous les garages"
        description="Liste complète des garages inscrits sur la plateforme."
        action={
          <Link href="/admin">
            <Button variant="secondary" size="sm">Retour validations</Button>
          </Link>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <Card className="p-0 overflow-hidden">
        <div className="ms-cardHeader">
          <p className="ms-kicker">Administration</p>
          <p className="mt-2 text-lg font-semibold text-text">Liste des garages</p>
        </div>
        <DataTable stickyHeader variant="plain">
          <DataTableHead sticky>
            <tr>
              <th>Garage</th>
              <th>Statut</th>
              <th>Responsable</th>
              <th className="text-right">Création</th>
            </tr>
          </DataTableHead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>
                  <Loading />
                </td>
              </tr>
            ) : garages.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState title="Aucun garage" description="Les garages apparaitront ici." />
                </td>
              </tr>
            ) : (
              garages.map((garage) => (
                <tr key={garage.id}>
                  <td>
                    <p className="font-semibold text-text">{garage.name}</p>
                    <p className="text-xs text-muted2">{garage.email}</p>
                  </td>
                  <td>
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
                  <td className="text-sm text-muted2">
                    {garage.users[0]?.email ?? "-"}
                  </td>
                  <td className="text-right text-sm text-muted2">
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

import { useCallback, useEffect, useState } from "react";
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

  const [garages, setGarages] = useState<GarageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [keyReady, setKeyReady] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<GarageItem | null>(null);
  const isAdmin = user?.role === "ADMIN";
  const toast = useToast();

  useEffect(() => {
    if (isAdmin) return;
    const stored = window.localStorage.getItem("ms_admin_key");
    if (stored) {
      setAdminKey(stored);
      setKeyReady(true);
    }
  }, [isAdmin]);

  const loadPending = useCallback(async () => {
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
  }, [adminKey, isAdmin]);

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
        title: "Garage approuvé",
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
        title: "Garage refusé",
        description: "La demande a été refusée.",
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
    if (!user) return;
    if (isAdmin) {
      setKeyReady(true);
      loadPending();
      return;
    }

    if (keyReady) loadPending();
  }, [isAdmin, keyReady, loadPending, user]);

  if (!user) return null;

  if (!keyReady && !isAdmin) {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="ms-cardHeader">
          <p className="ms-kicker">Administration</p>
          <p className="mt-2 text-lg font-semibold text-text">Accès réservé</p>
          <p className="mt-2 text-sm text-muted2">
            Renseignez votre ADMIN_KEY pour continuer.
          </p>
        </div>
        <div className="ms-cardBody">
          <div className="grid max-w-md gap-3">
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
              Déverrouiller
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-8">
      <SectionHeader
        title="Demandes en attente"
        description="Gérez les demandes d’inscription des garages. Approvez ou refusez avec un motif."
        action={
          <Link href="/admin/garages">
            <Button variant="secondary" size="sm">Voir tous les garages</Button>
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
        <div className="grid gap-6">
          {garages.map((garage) => (
            <Card key={garage.id} className="p-0 overflow-hidden">
              <div className="ms-cardHeader flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-text">{garage.name}</p>
                  <p className="text-xs text-muted2">{garage.email}</p>
                </div>
                <Badge variant="warning">En attente</Badge>
              </div>
              <div className="ms-cardBody grid gap-2 text-sm text-muted2">
                <p>Téléphone : {garage.phone || "-"}</p>
                <p>Adresse : {garage.address || "-"}</p>
                <p>SIRET : {garage.siret || "-"}</p>
              </div>
              <div className="ms-cardFooter flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-muted2">
                  Responsable : {garage.users[0]?.email ?? "-"}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openReject(garage)}>
                    Refuser
                  </Button>
                  <Button size="sm" onClick={() => approve(garage.id)}>
                    Approuver
                  </Button>
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

import { useCallback, useEffect, useMemo, useState } from "react";
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

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetcher<LegalReference[]>("/api/legal-references", { noStore: true });
      setItems(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

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
        title: "Référence ajoutée",
        description: "La référence est maintenant disponible.",
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
    if (!confirm("Supprimer cette référence ?")) return;
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

  if (!user) return null;

  if (!isAdmin) {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="ms-cardHeader">
          <p className="ms-kicker">Administration</p>
          <p className="mt-2 text-lg font-semibold text-text">Accès restreint</p>
        </div>
        <div className="ms-cardBody">
          <p className="text-sm text-muted2">Accès réservé à l’administration.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-8">
      <SectionHeader
        title="Références légales"
        description="Gérez les références applicables aux interventions. Elles seront visibles dans les dossiers."
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="grid gap-6 p-0 overflow-hidden">
          <div className="ms-cardHeader flex items-center justify-between">
            <h2 className="text-lg font-semibold">Références actives</h2>
            <Badge variant="accent">{activeCount} actives</Badge>
          </div>
          <DataTable stickyHeader variant="plain">
            <DataTableHead sticky>
              <tr>
                <th>Référence</th>
                <th>Types</th>
                <th className="text-right">Actions</th>
              </tr>
            </DataTableHead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="p-6 text-sm text-muted2">Aucune référence.</div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p className="font-semibold text-text">{item.title}</p>
                      <p className="text-xs text-muted2">{item.summary || "-"}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted2">
                        {item.code ? <span>{item.code}</span> : null}
                        {item.articleRef ? <span>{item.articleRef}</span> : null}
                      </div>
                    </td>
                    <td className="text-xs text-muted2">
                      {item.assignments.map((entry) => entry.interventionType).join(", ") || "-"}
                    </td>
                    <td className="text-right">
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

        <Card className="grid gap-5">
          <div>
            <p className="ms-kicker">Nouvelle référence</p>
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
          <div className="grid gap-2 text-xs text-muted2">
            <p className="text-text">Types d’intervention associés</p>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`rounded-[var(--rButton)] border px-3 py-2 text-xs font-semibold transition ${
                    form.types.includes(type)
                      ? "border-primary bg-primaryWeak text-text"
                      : "border-border text-muted2 hover:bg-surface2"
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
    <div className="grid gap-8">
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

      <div className="-mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="accent">Client</Badge>
        {client.garage?.name ? <Badge variant="neutral">{client.garage.name}</Badge> : null}
        <Badge variant="neutral">{vehicles.length} véhicule(s)</Badge>
        <Badge variant="neutral">{interventions.length} intervention(s)</Badge>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="ms-cardHeader flex items-start justify-between gap-3">
          <div>
            <p className="ms-kicker">Informations</p>
            <p className="mt-2 text-lg font-semibold text-text">{fullName}</p>
            <p className="mt-1 text-sm text-muted2">Client #{client.id}</p>
          </div>
          <span className="hidden sm:block">
            <Badge variant="accent">Fiche</Badge>
          </span>
        </div>

        <div className="ms-cardBody grid gap-2 text-sm text-muted2">
          <p>
            Nom: <span className="text-text">{client.firstName} {client.lastName}</span>
          </p>
          <p>
            Garage: <span className="text-text">{client.garage?.name ?? (client.garageId ? `#${client.garageId}` : "-")}</span>
          </p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-0 overflow-hidden">
          <div className="ms-cardHeader flex items-center justify-between gap-4">
            <div>
              <p className="ms-kicker">Véhicules</p>
              <p className="mt-1 text-sm text-muted2">
                {vehicles.length} véhicule(s)
              </p>
            </div>
            <Link href="/vehicules">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <div className="ms-cardBody">
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
            <DataTable variant="plain">
              <DataTableHead>
                <tr>
                  <th>Plaque</th>
                  <th>Modèle</th>
                  <th>Dossier</th>
                </tr>
              </DataTableHead>
              <tbody>
                {vehicles.slice(0, 8).map((v) => (
                  <tr key={v.id}>
                    <td className="text-sm font-medium">{v.plate}</td>
                    <td className="text-sm text-muted2">
                      {v.brand} {v.model}
                    </td>
                    <td>
                      <Link href={`/vehicules?selected=${encodeURIComponent(v.id)}`} className="text-sm font-semibold text-primary hover:text-primaryHover">
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
          <div className="ms-cardHeader flex items-center justify-between gap-4">
            <div>
              <p className="ms-kicker">Interventions</p>
              <p className="mt-1 text-sm text-muted2">
                {interventions.length} intervention(s)
              </p>
            </div>
            <Link href="/interventions">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>

          {interventions.length === 0 ? (
            <div className="ms-cardBody">
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
            <DataTable variant="plain">
              <DataTableHead>
                <tr>
                  <th>Véhicule</th>
                  <th>Type</th>
                  <th>Créée</th>
                  <th>Dossier</th>
                </tr>
              </DataTableHead>
              <tbody>
                {interventions.slice(0, 8).map((i) => (
                  <tr key={i.id}>
                    <td className="text-sm font-medium">{i.vehicle.plate}</td>
                    <td className="text-sm text-muted2">{i.type}</td>
                    <td className="text-xs text-muted2">
                      {new Date(i.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td>
                      <Link href={`/interventions?selected=${encodeURIComponent(i.id)}`} className="text-sm font-semibold text-primary hover:text-primaryHover">
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

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const qFromUrl = searchParams.get("q") || "";
  const [query, setQuery] = useState(qFromUrl);

  const selectedParam = searchParams.get("selected");
  const selectedFromUrl = selectedParam ? Number(selectedParam) : NaN;
  const initialSelectedId = Number.isFinite(selectedFromUrl) && selectedFromUrl > 0 ? selectedFromUrl : null;
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId);

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

  const loadClients = useCallback(async () => {
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
  }, []);

  const loadGarages = useCallback(async () => {
    if (user?.role !== "ADMIN") return;
    try {
      const data = await fetcher<GarageOption[]>("/api/admin/garages", { noStore: true });
      setGarages(data ?? []);
    } catch {
      setGarages([]);
    }
  }, [user?.role]);

  useEffect(() => {
    loadClients();
    loadGarages();
  }, [loadClients, loadGarages]);

  useEffect(() => {
    // keep selectedId in sync if URL changes
    if (!selectedParam) {
      setSelectedId(null);
      return;
    }
    if (!Number.isFinite(selectedFromUrl) || selectedFromUrl <= 0) return;
    setSelectedId(selectedFromUrl);
  }, [selectedFromUrl, selectedParam]);

  useEffect(() => {
    setQuery(qFromUrl);
  }, [qFromUrl]);

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
        description: "Les informations sont enregistrées.",
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
        title: "Client supprimé",
        description: "Le client a été retiré.",
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
    <div className="grid gap-8">
      <SectionHeader
        title="Clients"
        description="Liste, recherche et gestion des fiches clients."
        action={
          <Button onClick={openCreate} size="sm">
            <Plus size={16} /> Créer
          </Button>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left: list */}
        <Card className="p-0 overflow-hidden">
          <div className="ms-cardHeader">
            <Input
              label="Recherche"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par nom ou ID"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted2">
                {loading ? "Chargement…" : `${filtered.length} client(s)`}
              </p>
              {selectedId ? <Badge variant="accent">Sélectionné</Badge> : null}
            </div>
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-auto">
            {loading ? (
              <div className="ms-cardBody text-sm text-muted2">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="ms-cardBody">
                <EmptyState
                  title="Aucun client"
                  description="Créez un client pour démarrer."
                  action={<Button onClick={openCreate}>Créer un client</Button>}
                />
              </div>
            ) : (
              <div className="p-3 sm:p-4">
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
                      className={`flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5 text-sm transition ${
                        isActive
                          ? "bg-primaryWeak text-text border border-primary/25"
                          : "text-text hover:bg-surface2/80 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {client.firstName} {client.lastName}
                        </p>
                        {user.role === "ADMIN" ? (
                          <p className="truncate text-xs text-muted2">
                            {client.garage?.name ?? (client.garageId ? `Garage #${client.garageId}` : "-")}
                          </p>
                        ) : (
                          <p className="text-xs text-muted2">ID #{client.id}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted2">#{client.id}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Right: detail */}
        <Card className="p-0 overflow-hidden">
          <div className="ms-cardHeader flex items-start justify-between gap-4">
            <div>
              <p className="ms-kicker">Détail</p>
              <p className="mt-1 text-sm text-muted2">
                {detail ? `Client #${detail.id}` : "Sélectionnez un client"}
              </p>
            </div>

            {detail ? (
              <DropdownMenu
                trigger={
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface2"
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
                  <span className="inline-flex items-center gap-2 text-danger"><Trash2 size={16} /> Supprimer</span>
                </DropdownItem>
              </DropdownMenu>
            ) : null}
          </div>

          <div className="ms-cardBody">
            {detailLoading ? (
              <div className="text-sm text-muted2">Chargement du détail…</div>
            ) : !detail ? (
              <EmptyState
                title="Aucun client sélectionné"
                description="Choisissez un client dans la liste pour afficher sa fiche."
              />
            ) : (
              <div className="grid gap-6">
                <div className="rounded-[var(--r)] border border-border bg-surface2 p-5 sm:p-6">
                  <p className="text-sm font-semibold">
                    {detail.firstName} {detail.lastName}
                  </p>
                  <p className="mt-1 text-xs text-muted2">ID #{detail.id}</p>
                  {user.role === "ADMIN" ? (
                    <p className="mt-2 text-xs text-muted2">
                      Garage: {detail.garage?.name ?? (detail.garageId ? `#${detail.garageId}` : "-")}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-[var(--r)] border border-border bg-surface p-5 sm:p-6">
                  <p className="text-sm font-semibold">Véhicules</p>
                  <p className="mt-1 text-sm text-muted2">
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
import { Badge } from "@/components/ui/Badge";
import { DataTable, DataTableHead } from "@/components/ui/DataTable";
import { formatDistance } from "date-fns/formatDistance";
import { fr } from "date-fns/locale/fr";
import Link from "next/link";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (!isApprovedGarage(user)) redirect("/pro/en-attente");

  const scopeLabel = user.role === "ADMIN" ? "Admin" : "Garage";
  const garageName = user.role === "GARAGE" ? user.garage?.name : undefined;

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
    <div className="grid gap-8">
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

      <div className="-mt-4 flex flex-wrap items-center gap-2">
        <Badge variant={user.role === "ADMIN" ? "accent" : "neutral"}>{scopeLabel}</Badge>
        {garageName ? <Badge variant="neutral">{garageName}</Badge> : null}
        {user.role === "GARAGE" ? (
          <Badge variant="neutral">ID garage #{user.garageId ?? "—"}</Badge>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clients actifs" value={clientsCount} />
        <StatCard label="Véhicules suivis" value={vehiclesCount} />
        <StatCard label="Interventions totales" value={interventionsCount} />
        <StatCard label="Aujourd’hui" value={interventionsToday} badge={`7j: ${interventionsWeek}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-0">
          <div className="ms-cardHeader flex items-center justify-between gap-4">
            <div>
              <p className="ms-kicker">Derniers clients</p>
              <p className="mt-1 text-sm text-muted2">Ajouts récents</p>
            </div>
            <Link href="/clients">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>
          {recentClients.length === 0 ? (
            <div className="ms-cardBody">
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
            <DataTable variant="plain">
              <DataTableHead>
                <tr>
                  <th>Client</th>
                  <th>Créé</th>
                </tr>
              </DataTableHead>
              <tbody>
                {recentClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <Link
                        href={`/clients?selected=${client.id}`}
                        className="block min-w-0"
                      >
                        <p className="truncate text-sm font-medium">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-xs text-muted2">ID #{client.id}</p>
                      </Link>
                    </td>
                    <td className="text-xs text-muted2" title={new Date(client.createdAt).toLocaleString("fr-FR")}>
                      {getRelativeDate(client.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>

        <Card className="p-0">
          <div className="ms-cardHeader flex items-center justify-between gap-4">
            <div>
              <p className="ms-kicker">Dernières interventions</p>
              <p className="mt-1 text-sm text-muted2">Trafic atelier</p>
            </div>
            <Link href="/interventions">
              <Button variant="secondary" size="sm">Voir tout</Button>
            </Link>
          </div>
          {recentInterventions.length === 0 ? (
            <div className="ms-cardBody">
              <EmptyState title="Aucune intervention" description="Les interventions récentes apparaîtront ici." />
            </div>
          ) : (
            <DataTable variant="plain">
              <DataTableHead>
                <tr>
                  <th>Véhicule</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Créée</th>
                </tr>
              </DataTableHead>
              <tbody>
                {recentInterventions.map((intervention) => (
                  <tr key={intervention.id}>
                    <td>
                      <Link
                        href={`/interventions/${intervention.id}`}
                        className="text-sm font-medium"
                      >
                        {intervention.vehicle.plate}
                      </Link>
                    </td>
                    <td className="text-sm text-muted2">
                      {intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}
                    </td>
                    <td className="text-sm">
                      {intervention.type}
                    </td>
                    <td className="text-xs text-muted2" title={new Date(intervention.createdAt).toLocaleString("fr-FR")}>
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
import { StatCard } from "@/components/common/StatCard";

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

  const latestCreatedAt = useMemo(() => {
    if (filtered.length === 0) return null;
    const latest = filtered.reduce((acc, current) => {
      return new Date(current.createdAt).getTime() > new Date(acc.createdAt).getTime() ? current : acc;
    }, filtered[0]);
    return latest.createdAt;
  }, [filtered]);

  // Helper for relative date
  const getRelativeDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return formatDistance(d, new Date(), { addSuffix: true, locale: fr });
  };

  return (
    <div className="grid gap-8">
      <SectionHeader
        title="Documents"
        description="Téléchargez les dossiers PDF générés depuis les interventions."
        action={<Button onClick={() => router.push("/interventions")}>Ouvrir interventions</Button>}
        level={1}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Documents" value={loading ? "…" : filtered.length} badge={loading ? undefined : "PDF"} />
        <StatCard
          label="Affichés"
          value={loading ? "…" : Math.min(visibleCount, filtered.length)}
          badge={loading ? undefined : `Sur ${filtered.length}`}
        />
        <StatCard
          label="Dernière génération"
          value={loading ? "…" : latestCreatedAt ? getRelativeDate(latestCreatedAt) : "—"}
          badge={loading ? undefined : latestCreatedAt ? new Date(latestCreatedAt).toLocaleDateString("fr-FR") : undefined}
        />
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <Card className="p-0 overflow-hidden">
        <div className="ms-cardHeader">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full max-w-xl">
              <p className="ms-kicker">Recherche</p>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Plaque, client, type…"
                className="mt-2"
              />
            </div>
            <div className="text-xs text-muted2">
              {loading ? "Chargement…" : `${filtered.length} document(s)`}
            </div>
          </div>
        </div>

        <DataTable stickyHeader variant="plain">
          <DataTableHead sticky>
            <tr>
              <th>Intervention</th>
              <th>Client</th>
              <th className="text-right">PDF</th>
            </tr>
          </DataTableHead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={3}>
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <EmptyState title="Aucun document" description="Les PDFs seront disponibles ici." />
                </td>
              </tr>
            ) : (
              visibleDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <p className="font-semibold text-text">
                      {doc.vehicle.plate} · {doc.type}
                    </p>
                    <p className="mt-1 text-xs text-muted2">
                      <span title={new Date(doc.createdAt).toLocaleString("fr-FR")}>{getRelativeDate(doc.createdAt)}</span>
                    </p>
                  </td>
                  <td className="text-sm text-muted2">
                    {doc.vehicle.client.firstName} {doc.vehicle.client.lastName}
                  </td>
                  <td className="text-right">
                    <a href={`/api/interventions/${doc.id}/pdf`} className="inline-flex">
                      <Button variant="outline" size="sm">Télécharger</Button>
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>

        {filtered.length > visibleCount ? (
          <div className="ms-cardFooter flex justify-center">
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
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
  revisions?: Array<{ id?: string; createdAt?: string; hash?: string | null }>;
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
    <div className="grid gap-8">
      <SectionHeader
        title={intervention ? `Dossier ${intervention.vehicle.plate}` : "Dossier intervention"}
        description="Détail complet de l'intervention, traçabilité et conformité."
        level={1}
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Link href="/interventions" className="w-full sm:w-auto">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                Retour
              </Button>
            </Link>
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

      {intervention ? (
        <div className="-mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="accent">{intervention.type}</Badge>
          <Badge variant="neutral">{intervention.vehicle.brand} {intervention.vehicle.model}</Badge>
          <Badge variant="neutral">Client: {intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}</Badge>
          {intervention.revisions?.length ? (
            <Badge variant="neutral">{intervention.revisions.length} révision(s)</Badge>
          ) : (
            <Badge variant="neutral">Aucune révision</Badge>
          )}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12"><Loading /></div>
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !intervention ? (
        <EmptyState title="Intervention introuvable" description="Ce dossier n'existe pas ou n'est plus accessible." />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="p-0 overflow-hidden">
            <div className="ms-cardHeader flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="ms-kicker">Véhicule</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                  {intervention.vehicle.plate}{" "}
                  <span className="font-normal text-muted2">· {intervention.type}</span>
                </h2>
                <p className="mt-1 text-xs text-muted2">
                  {intervention.vehicle.brand} {intervention.vehicle.model}
                </p>
                <p className="text-xs text-muted2">
                  Client :{" "}
                  <span className="font-medium text-text">
                    {intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}
                  </span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-muted2">
                  Créée le {new Date(intervention.createdAt).toLocaleDateString("fr-FR")}
                </span>
                {intervention.performedAt ? (
                  <span className="text-xs text-muted2">
                    Réalisée le {new Date(intervention.performedAt).toLocaleDateString("fr-FR")}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="ms-cardBody grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-muted2">Kilométrage</p>
                  <p className="font-medium text-text">{intervention.odometerKm ?? "-"}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted2">ECU</p>
                  <p className="font-medium text-text">{intervention.ecuType ?? "-"}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted2">Version logicielle</p>
                  <p className="font-medium text-text">{intervention.softwareVersion ?? "-"}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted2">Checksum</p>
                  <p className="font-medium text-text">{intervention.checksum ?? "-"}</p>
                </div>
              </div>

              {intervention.notes ? (
                <div>
                  <p className="mb-1 text-xs text-muted2">Notes</p>
                  <p className="whitespace-pre-line text-text">{intervention.notes}</p>
                </div>
              ) : null}
            </div>
          </Card>
          <div className="flex flex-col gap-6">
            <LegalReferencesPanel type={intervention.type} />
            {/* Historique des révisions, si présent */}
            {intervention.revisions && intervention.revisions.length > 0 && (
              <Card className="p-5 sm:p-6">
                <h3 className="mb-3 text-lg font-semibold">Historique des révisions</h3>
                <ul className="space-y-2">
                  {intervention.revisions.map((rev, idx) => (
                    <li key={rev.id || idx} className="text-xs text-muted2">
                      <span className="font-medium text-text">Révision {idx + 1}</span> – {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("fr-FR") : ""}
                      {rev.hash && <span className="ml-2 text-muted2">HASH: {rev.hash}</span>}
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
  const qFromUrl = searchParams.get("q") || "";
  const [query, setQuery] = useState(qFromUrl);
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
    } catch {
      setVehicles([]);
    }
  };

  useEffect(() => {
    loadInterventions();
    loadVehicles();
  }, []);

  useEffect(() => {
    setSelectedId(selectedFromUrl || null);
  }, [selectedFromUrl]);

  useEffect(() => {
    setQuery(qFromUrl);
  }, [qFromUrl]);

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
    <div className="grid gap-8">
      <SectionHeader
        title="Interventions"
        description="Suivi, dossiers et génération PDF."
        action={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus size={16} /> Créer
          </Button>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="p-0 overflow-hidden">
          <div className="ms-cardHeader">
            <Input
              label="Recherche"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par plaque, client, type"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted2">
                {loading ? "Chargement…" : `${filtered.length} intervention(s)`}
              </p>
              {selectedId ? <Badge variant="accent">Sélectionnée</Badge> : null}
            </div>
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-auto">
            {loading ? (
              <div className="ms-cardBody text-sm text-muted2">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="ms-cardBody">
                <EmptyState
                  title="Aucune intervention"
                  description="Créez une intervention pour démarrer."
                  action={<Button onClick={() => setCreateOpen(true)}>Créer une intervention</Button>}
                />
              </div>
            ) : (
              <div className="p-3 sm:p-4">
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
                      className={`flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5 text-sm transition ${
                        isActive
                          ? "bg-primaryWeak text-text border border-primary/25"
                          : "text-text hover:bg-surface2/80 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {item.vehicle.plate} <span className="text-muted2">· {item.type}</span>
                        </p>
                        <p className="truncate text-xs text-muted2">
                          {item.vehicle.client.firstName} {item.vehicle.client.lastName} · {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <span className="text-xs text-muted2">#{item.id}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="ms-cardHeader flex items-start justify-between gap-4">
            <div>
              <p className="ms-kicker">Détail</p>
              <p className="mt-1 text-sm text-muted2">
                {detail ? `${detail.vehicle.plate} · ${detail.type}` : "Sélectionnez une intervention"}
              </p>
            </div>

            {detail ? (
              <DropdownMenu
                trigger={
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface2"
                    aria-label="Actions"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                }
              >
                <DropdownItem asChild>
                  <a href={`/api/interventions/${detail.id}/pdf`} target="_blank" rel="noreferrer">
                    Télécharger PDF
                  </a>
                </DropdownItem>
                <DropdownItem asChild>
                  <Link href={`/interventions/${detail.id}`}>Ouvrir le dossier complet</Link>
                </DropdownItem>
              </DropdownMenu>
            ) : null}
          </div>

          <div className="ms-cardBody">
            {detailLoading ? (
              <div className="text-sm text-muted2">Chargement du détail…</div>
            ) : !detail ? (
              <EmptyState
                title="Aucune intervention sélectionnée"
                description="Choisissez une intervention dans la liste pour afficher son dossier."
              />
            ) : (
              <div className="grid gap-6">
                <div className="rounded-[var(--r)] border border-border bg-surface2 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{detail.vehicle.plate}</p>
                      <p className="mt-1 text-xs text-muted2">
                        {detail.vehicle.brand} {detail.vehicle.model} · {detail.vehicle.client.firstName} {detail.vehicle.client.lastName}
                      </p>
                    </div>
                    <Badge variant="accent">{detail.type}</Badge>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-muted2">
                    <p>Créée le {new Date(detail.createdAt).toLocaleString("fr-FR")}</p>
                    {detail.performedAt ? (
                      <p>Réalisée le {new Date(detail.performedAt).toLocaleString("fr-FR")}</p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[var(--r)] border border-border bg-surface p-5 sm:p-6">
                  <p className="text-sm font-semibold">Conformité</p>
                  <div className="mt-3">
                    <LegalReferencesPanel type={detail.type} />
                  </div>
                </div>

                <div className="rounded-[var(--r)] border border-border bg-surface p-5 sm:p-6">
                  <p className="text-sm font-semibold">Révisions</p>
                  <p className="mt-2 text-sm text-muted2">
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
        ? "border-primary bg-surface2 text-text"
        : "border-border/70 bg-transparent text-muted2 hover:bg-surface2/80 hover:text-text"
    }`;
  };

  return (
    <div className="grid gap-8">
      <SectionHeader
        title="Paramètres"
        description="Identité, conformité et préférences de l'atelier."
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
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="grid gap-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="ms-kicker">Profil</p>
                <h2 className="mt-2 text-lg font-semibold text-text">
                  {role === "ADMIN" ? "Administration" : garage?.name ?? "Garage"}
                </h2>
              </div>
              <Badge variant="accent">{roleLabel}</Badge>
            </div>

            <div className="grid gap-2 text-sm text-muted2">
              <div className="flex items-center justify-between gap-4">
                <span>Email</span>
                <span className="text-text">{garage?.email ?? userEmail}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Téléphone</span>
                <span className="text-text">{garage?.phone || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Adresse</span>
                <span className="text-text">{garage?.address || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>SIRET</span>
                <span className="text-text">{garage?.siret || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Statut</span>
                <span className="text-text">{statusLabel}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="secondary" onClick={() => setTab("security")}>Voir conformité</Button>
            </div>
          </Card>

          <Card className="grid gap-4">
            <div>
              <p className="ms-kicker">Résumé</p>
              <h3 className="mt-2 text-lg font-semibold text-text">Conformité</h3>
            </div>
            <p className="text-sm text-muted2">
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
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="grid gap-5">
            <div>
              <p className="ms-kicker">Sécurité</p>
              <h3 className="mt-2 text-lg font-semibold text-text">Assurance & traçabilité</h3>
            </div>
            <ComplianceToggles />
            <Badge variant="success">Conformité active</Badge>
          </Card>

          <Card className="grid gap-4">
            <div>
              <p className="ms-kicker">Bonnes pratiques</p>
              <h3 className="mt-2 text-lg font-semibold text-text">Recommandations</h3>
            </div>
            <div className="grid gap-2 text-sm text-muted2">
              <p>- Conservez les preuves et révisions pour chaque dossier.</p>
              <p>- Générez un PDF après validation du client.</p>
              <p>- Activez les alertes pour les dossiers critiques.</p>
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
        <p className="ms-kicker">Notifications</p>
        <h3 className="mt-2 text-lg font-semibold text-text">Préférences email</h3>
      </div>
      <div className="grid gap-3">
        <Toggle checked={mailOnCritical} onChange={setMailOnCritical} label="Alertes sur dossier critique" />
        <Toggle checked={mailOnPdf} onChange={setMailOnPdf} label="Confirmation lors de génération PDF" />
        <Toggle checked={digest} onChange={setDigest} label="Récapitulatif hebdomadaire" />
      </div>
      <p className="text-xs text-muted2">
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

import { useCallback, useEffect, useState } from "react";
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

  const loadVehicle = useCallback(async () => {
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
  }, [vehicleId]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

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
    <div className="grid gap-8">
      <SectionHeader
        title={vehicle ? vehicle.plate : "Véhicule"}
        description="Dossier véhicule et historique des interventions."
        action={
          <Link href="/vehicules">
            <Button variant="secondary" size="sm">Retour</Button>
          </Link>
        }
        level={1}
      />

      {vehicle ? (
        <div className="-mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="accent">{vehicle.brand} {vehicle.model}</Badge>
          <Badge variant="neutral">Client: {vehicle.client.firstName} {vehicle.client.lastName}</Badge>
          <Badge variant="neutral">{vehicle.interventions.length} intervention(s)</Badge>
          <Badge variant="neutral">Carburant: {vehicle.fuel || "-"}</Badge>
        </div>
      ) : null}

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <Loading />
      ) : vehicle ? (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-8">
            <Card className="p-0 overflow-hidden">
              <div className="ms-cardHeader flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="ms-kicker">Véhicule</p>
                  <h2 className="mt-2 text-xl font-semibold text-text">
                    {vehicle.brand} {vehicle.model}
                  </h2>
                  <p className="text-sm text-muted2">
                    Client: {vehicle.client.firstName} {vehicle.client.lastName}
                  </p>
                </div>
                <Badge variant="accent">{vehicle.plate}</Badge>
              </div>
              <div className="ms-cardBody grid gap-3 text-sm text-muted2">
                <p>VIN: {vehicle.vin || "-"}</p>
                <p>Carburant: {vehicle.fuel || "-"}</p>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="ms-cardHeader flex items-center justify-between">
                <div>
                  <p className="ms-kicker">Interventions</p>
                  <h2 className="mt-2 text-xl font-semibold text-text">Historique</h2>
                </div>
                <Badge variant="accent">{vehicle.interventions.length}</Badge>
              </div>
              <div className="ms-cardBody grid gap-4">
                {vehicle.interventions.length === 0 ? (
                  <p className="text-sm text-muted2">Aucune intervention.</p>
                ) : (
                  vehicle.interventions.map((intervention) => (
                    <div
                      key={intervention.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface2 px-5 py-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-text">{intervention.type}</p>
                        <p className="text-xs text-muted2">
                          {new Date(intervention.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Link
                          href={`/interventions/${intervention.id}`}
                          className="font-semibold text-primary hover:text-primaryHover"
                        >
                          Détails
                        </Link>
                        <a
                          href={`/api/interventions/${intervention.id}/pdf`}
                          className="font-semibold text-primary hover:text-primaryHover"
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
              <p className="ms-kicker">Nouvelle intervention</p>
              <h2 className="mt-2 text-xl font-semibold text-text">Ajouter un dossier</h2>
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
              label="Date réalisée"
              type="datetime-local"
              value={form.performedAt}
              onChange={(event) => setForm((prev) => ({ ...prev, performedAt: event.target.value }))}
            />
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
              placeholder="Détails de l'intervention"
            />
            <LegalReferencesPanel type={form.type} />
            <Button onClick={createIntervention}>Créer l’intervention</Button>
          </Card>
        </div>
      ) : (
        <p className="text-sm text-muted2">Véhicule introuvable.</p>
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
  const qFromUrl = searchParams.get("q") || "";
  const [query, setQuery] = useState(qFromUrl);

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
  }, [selectedFromUrl]);

  useEffect(() => {
    setQuery(qFromUrl);
  }, [qFromUrl]);

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
        description: "Les informations sont enregistrées.",
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
        title: "Véhicule supprimé",
        description: "Le véhicule a été retiré.",
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
    <div className="grid gap-8">
      <SectionHeader
        title="Véhicules"
        description="Parc véhicule, recherche et accès aux dossiers."
        action={
          <Button onClick={openCreate} size="sm">
            <Plus size={16} /> Créer
          </Button>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="p-0 overflow-hidden">
          <div className="ms-cardHeader">
            <Input
              label="Recherche"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par plaque, marque, client"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted2">
                {loading ? "Chargement…" : `${filtered.length} véhicule(s)`}
              </p>
              {selectedId ? <Badge variant="accent">Sélectionné</Badge> : null}
            </div>
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-auto">
            {loading ? (
              <div className="ms-cardBody text-sm text-muted2">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="ms-cardBody">
                <EmptyState
                  title="Aucun véhicule"
                  description="Créez un véhicule pour démarrer."
                  action={<Button onClick={openCreate}>Créer un véhicule</Button>}
                />
              </div>
            ) : (
              <div className="p-3 sm:p-4">
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
                      className={`flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5 text-sm transition ${
                        isActive
                          ? "bg-primaryWeak text-text border border-primary/25"
                          : "text-text hover:bg-surface2/80 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{vehicle.plate}</p>
                        <p className="truncate text-xs text-muted2">
                          {vehicle.brand} {vehicle.model} · {vehicle.client.firstName} {vehicle.client.lastName}
                        </p>
                      </div>
                      <span className="text-xs text-muted2">#{vehicle.id}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="ms-cardHeader flex items-start justify-between gap-4">
            <div>
              <p className="ms-kicker">Détail</p>
              <p className="mt-1 text-sm text-muted2">
                {detail ? detail.plate : "Sélectionnez un véhicule"}
              </p>
            </div>

            {detail ? (
              <DropdownMenu
                trigger={
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface2"
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
                  <span className="inline-flex items-center gap-2 text-danger"><Trash2 size={16} /> Supprimer</span>
                </DropdownItem>
              </DropdownMenu>
            ) : null}
          </div>

          <div className="ms-cardBody">
            {detailLoading ? (
              <div className="text-sm text-muted2">Chargement du détail…</div>
            ) : !detail ? (
              <EmptyState
                title="Aucun véhicule sélectionné"
                description="Choisissez un véhicule dans la liste pour afficher son dossier."
              />
            ) : (
              <div className="grid gap-6">
                <div className="rounded-[var(--r)] border border-border bg-surface2 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{detail.plate}</p>
                      <p className="mt-1 text-xs text-muted2">
                        {detail.brand} {detail.model}
                      </p>
                    </div>
                    <Badge variant="accent">{detail.fuel ?? "-"}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted2">
                    Client: <span className="text-text">{detail.client.firstName} {detail.client.lastName}</span>
                  </p>
                  {detail.vin ? (
                    <p className="mt-1 text-xs text-muted2">VIN: {detail.vin}</p>
                  ) : null}
                  <div className="mt-4">
                    <Link href={`/vehicules/${detail.id}`}>
                      <Button variant="secondary" size="sm">Ouvrir le dossier complet</Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-[var(--r)] border border-border bg-surface p-5 sm:p-6">
                  <p className="text-sm font-semibold">Interventions récentes</p>
                  <div className="mt-4 grid gap-2">
                    {!detail.interventions || detail.interventions.length === 0 ? (
                      <p className="text-sm text-muted2">Aucune intervention.</p>
                    ) : (
                      detail.interventions.slice(0, 5).map((i) => (
                        <Link
                          key={i.id}
                          href={`/interventions/${i.id}`}
                          className="flex items-center justify-between rounded-2xl border border-border bg-surface2 px-4 py-2.5 text-sm hover:bg-surface"
                        >
                          <span className="font-medium">{i.type}</span>
                          <span className="text-xs text-muted2">
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
      toast.push({ title: "Connexion réussie", description: "Bienvenue sur votre panel.", variant: "success" });
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
    <main className="min-h-screen w-full bg-bg text-text">
      <header className="border-b border-border bg-bg/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-surface2">
              <span className="text-sm font-extrabold tracking-tight text-primary2">MS</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-text">MotorSafe</div>
              <div className="text-xs text-muted2">Espace pro</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/pro/inscription" className="hidden sm:block">
              <Button variant="ghost">Créer un compte</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">Retour site</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-6 py-16 lg:grid-cols-[1fr_440px] lg:items-start">
        <div className="hidden lg:flex flex-col gap-8">
          <div>
            <p className="ms-kicker">Connexion</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text">Accédez à votre atelier</h1>
            <p className="mt-3 text-base text-muted2">
              Retrouvez vos dossiers, vos interventions et vos documents en un seul endroit sécurisé.
            </p>
          </div>

          <div className="grid gap-4">
            <Card className="p-4">
              <p className="ms-kicker">Sécurité</p>
              <p className="mt-2 text-sm font-semibold text-text">Accès sécurisé et conformité intégrée</p>
              <p className="mt-1 text-xs text-muted2">
                Chaque action est tracée pour garantir la qualité de vos dossiers.
              </p>
            </Card>
            <Card className="p-4">
              <p className="ms-kicker">Performance</p>
              <p className="mt-2 text-sm font-semibold text-text">Une interface rapide, pensée terrain</p>
              <p className="mt-1 text-xs text-muted2">
                Pas de surcharge : juste l&apos;essentiel pour l&apos;atelier.
              </p>
            </Card>
          </div>
        </div>

        <Card className="w-full p-8">
          <div className="grid gap-3">
            <p className="ms-kicker">Connexion</p>
            <h1 className="text-2xl font-semibold tracking-tight text-text">Accès garage</h1>
            <p className="text-sm text-muted2">
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
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted2">
            <Link
              href="/auth/register-pro"
              className="font-semibold text-primary hover:text-primaryHover"
            >
              Créer un compte pro
            </Link>
            <Link href="/pro" className="font-semibold text-primary hover:text-primaryHover">
              Infos espace pro
            </Link>
          </div>
        </Card>
      </div>
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
@config "../tailwind.config.js";

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;

  /* Core tokens (RGB triples used by Tailwind config via rgb(var(--token)) ) */
  --bg: 11 15 23;
  --surface: 15 22 36;
  --surface2: 19 29 46;

  --text: 231 238 252;
  --muted: 231 238 252;
  --muted2: 231 238 252;
  --border: 231 238 252;

  --accent: 79 140 255;
  --accentHover: 120 167 255;
  --accent2: 34 197 94;
  --accentWeak: 79 140 255;

  --danger: 239 68 68;
  --warning: 245 158 11;
  --success: 34 197 94;

  /* Opacities (0..1) */
  --borderA: 0.10;
  --textA: 0.95;
  --textSecondaryA: 0.78;
  --textMutedA: 0.65;
  --accentWeakA: 0.18;
  --ringA: 0.55;

  /* Radii (12/16/20) */
  --rGlobal: 16px;
  --rButton: 16px;
  --rInput: 16px;
  --rCard: 20px;
  --r: var(--rCard);

  /* Shadows (soft) */
  --shadow: 0 10px 30px rgb(0 0 0 / 0.35);
  --shadow2: 0 1px 0 rgb(255 255 255 / 0.05), 0 12px 30px rgb(0 0 0 / 0.35);
  --shCard: var(--shadow2);
  --shDropdown: 0 18px 58px rgb(0 0 0 / 0.52);
}

html,
body {
  height: 100%;
}

body {
  margin: 0;
  background:
    radial-gradient(900px 600px at 15% -10%, rgb(var(--accent) / 0.22), transparent 60%),
    radial-gradient(900px 600px at 85% 0%, rgb(var(--success) / 0.14), transparent 55%),
    rgb(var(--bg));
  color: rgb(var(--text) / var(--textA));
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

::selection {
  background: rgb(var(--accent) / 0.22);
  color: rgb(var(--text) / 0.98);
}

* {
  outline-color: transparent;
}

:focus-visible {
  outline: 2px solid rgb(var(--accent) / var(--ringA));
  outline-offset: 2px;
  border-radius: 12px;
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
    border-radius: var(--rCard);
    border: 1px solid rgb(var(--border) / var(--borderA));
    background: rgb(var(--surface));
    box-shadow: var(--shadow2);
  }

  .ms-cardHeader {
    border-bottom: 1px solid rgb(var(--border) / 0.12);
    padding: 1rem 1.25rem;
  }

  .ms-cardBody {
    padding: 1.25rem;
  }

  .ms-cardFooter {
    border-top: 1px solid rgb(var(--border) / 0.12);
    padding: 1rem 1.25rem;
  }

  @media (min-width: 640px) {
    .ms-cardHeader {
      padding: 1.25rem 1.5rem;
    }
    .ms-cardBody {
      padding: 1.5rem;
    }
    .ms-cardFooter {
      padding: 1.25rem 1.5rem;
    }
  }

  .ms-kicker {
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 600;
    color: rgb(var(--muted2) / var(--textMutedA));
  }

  .ms-input {
    width: 100%;
    min-height: 44px;
    border-radius: var(--rInput);
    background: rgb(var(--surface2));
    border: 1px solid rgb(var(--border) / 0.14);
    padding: 0.55rem 0.8rem;
    color: rgb(var(--text) / var(--textA));
    box-shadow: 0 1px 0 rgb(255 255 255 / 0.04);
    transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
  }

  .ms-input::placeholder {
    color: rgb(var(--muted2) / var(--textMutedA));
  }

  .ms-input:focus-visible {
    outline: none;
    border-color: rgb(var(--accent) / 0.55);
    box-shadow:
      0 0 0 2px rgb(var(--accent) / 0.22),
      0 18px 44px rgb(var(--accent) / 0.10);
  }

  .ms-focus-within:focus-within {
    outline: none;
    box-shadow: 0 0 0 2px rgb(var(--accent) / 0.22);
  }

  .ms-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }

  .ms-table th {
    padding: 0.85rem 1.25rem;
    border-bottom: 1px solid rgb(var(--border) / 0.12);
    color: rgb(var(--muted2) / var(--textMutedA));
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 700;
  }

  .ms-table td {
    padding: 0.9rem 1.25rem;
    border-bottom: 1px solid rgb(var(--border) / 0.10);
    color: rgb(var(--text) / var(--textA));
  }

  .ms-table tbody tr:hover {
    background: rgb(var(--accentWeak) / 0.10);
  }
}

@keyframes ms-fade-up {
  0% {
    opacity: 0;
    transform: translateY(16px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@layer utilities {
  .ms-fade-up {
    opacity: 0;
    transform: translateY(16px);
    animation: ms-fade-up 0.7s ease forwards;
  }

  .ms-delay-1 {
    animation-delay: 120ms;
  }

  .ms-delay-2 {
    animation-delay: 240ms;
  }

  .ms-delay-3 {
    animation-delay: 360ms;
  }
}

```

## app/layout.tsx
<a id="app-layouttsx"></a>

```tsx

import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MotorSafe",
    template: "%s | MotorSafe",
  },
  metadataBase: new URL("https://motorsafe.fr"),
  description: "Panel professionnel pour garages, interventions et conformite.",
  applicationName: "MotorSafe",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body
        className={`${inter.variable} ${inter.variable} ${plexMono.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>{children}</ToastProvider>
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
import { Button } from "@/components/ui/Button";

export default function LegalPage() {
  return (
    <main className="min-h-screen w-full bg-bg text-text">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-center px-6 py-16">
        <Card className="p-0 overflow-hidden">
          <div className="ms-cardHeader">
            <p className="ms-kicker">Légal</p>
            <h1 className="mt-3 text-3xl font-semibold text-text">Informations légales</h1>
            <p className="mt-2 text-sm text-muted2">
              Cette page sera complétée avec les mentions légales, la politique de confidentialité et les conditions d&apos;utilisation.
            </p>
          </div>

          <div className="ms-cardBody">
            <div className="grid gap-3 text-sm text-muted2">
              {[
                "Mentions légales et identité de l&apos;éditeur.",
                "Politique de confidentialité et gestion des données.",
                "Conditions générales d&apos;utilisation.",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-border/60 bg-surface2/80 px-4 py-3">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="ms-cardFooter flex justify-end">
            <Link href="/">
              <Button variant="secondary" size="sm">Retour au site</Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}

```

## app/page.tsx
<a id="app-pagetsx"></a>

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "MotorSafe",
  description: "Espace pro garages : dossiers, interventions et documents PDF, avec conformité intégrée.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen w-full bg-bg text-text">
      <header className="border-b border-border bg-bg/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-surface2">
              <span className="text-sm font-extrabold tracking-tight text-primary2">MS</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-text">MotorSafe</div>
              <div className="text-xs text-muted2">Espace pro</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/pro" className="hidden sm:block">
              <Button variant="ghost">Espace pro</Button>
            </Link>
            <Link href="/auth/login">
              <Button>Connexion</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 max-w-[1200px] rounded-full bg-primaryWeak blur-3xl opacity-50" />
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">Garages & pros de l’auto</Badge>
              <Badge variant="warning">Validation des comptes</Badge>
            </div>

            <div>
              <p className="ms-kicker">MotorSafe</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text md:text-5xl">
                Le panel premium pour gérer vos dossiers atelier.
              </h1>
              <p className="mt-4 max-w-[60ch] text-base text-muted2">
                Clients, véhicules, interventions et documents PDF — avec conformité intégrée et une interface rapide,
                pensée terrain.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/auth/login">
                <Button>Accéder au dashboard</Button>
              </Link>
              <Link href="/pro/inscription">
                <Button variant="secondary">Demander un compte pro</Button>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  title: "Traçabilité",
                  desc: "Historique clair et actions sécurisées.",
                },
                {
                  title: "Documents",
                  desc: "Générez et retrouvez vos PDF rapidement.",
                },
                {
                  title: "Conformité",
                  desc: "Références légales intégrées au flux.",
                },
              ].map((item) => (
                <Card key={item.title} className="p-4">
                  <p className="text-sm font-semibold text-text">{item.title}</p>
                  <p className="mt-1 text-xs text-muted2">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-8">
            <p className="ms-kicker">Démarrage</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Accès professionnel</h2>
            <p className="mt-2 text-sm text-muted2">
              Les comptes sont validés pour garantir un environnement pro.
            </p>

            <div className="mt-6 grid gap-3">
              <Link href="/auth/login">
                <Button className="w-full">Connexion</Button>
              </Link>
              <Link href="/pro/inscription">
                <Button variant="secondary" className="w-full">
                  Créer un compte pro
                </Button>
              </Link>
              <Link href="/legal" className="text-center text-sm font-semibold text-primary hover:text-primaryHover">
                Mentions légales
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-6 py-10 text-sm text-muted2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MotorSafe</p>
          <div className="flex items-center gap-4">
            <Link href="/legal" className="font-semibold text-primary hover:text-primaryHover">
              Légal
            </Link>
            <Link href="/pro" className="font-semibold text-primary hover:text-primaryHover">
              Espace pro
            </Link>
          </div>
        </div>
      </footer>
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
import { Button } from "@/components/ui/Button";

export default function ProPendingPage() {
  return (
    <main className="min-h-screen w-full bg-bg text-text">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-6 py-16">
        <Card className="w-full max-w-2xl p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <Badge variant="warning">Validation en cours</Badge>
            <h1 className="text-3xl font-semibold text-text">Compte en validation</h1>
            <p className="text-sm text-muted2">
              Votre dossier est en cours d&apos;analyse par MotorSafe. Nous revenons vers vous dès que la validation est
              terminée.
            </p>
          </div>

          <div className="mt-8 grid gap-3 text-left">
            {[
              "Vérification des informations atelier.",
              "Contrôle des justificatifs et du SIRET.",
              "Activation des accès au dashboard.",
            ].map((step) => (
              <div key={step} className="rounded-xl border border-border/60 bg-surface2/80 px-4 py-3 text-sm text-muted2">
                {step}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            <Link href="/auth/login">
              <Button variant="secondary" size="sm">
                Revenir à la connexion
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                Retour site
              </Button>
            </Link>
          </div>
        </Card>
      </div>
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
        title: "Demande envoyée",
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
    <main className="min-h-screen w-full bg-bg text-text">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1fr_520px] lg:items-start">
        <div className="hidden lg:flex flex-col gap-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-primary to-primary2 text-white shadow-sm">
              <span className="text-sm font-semibold">MS</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">MotorSafe</div>
              <div className="text-xs text-muted2">Accès pro</div>
            </div>
          </Link>

          <div>
            <p className="ms-kicker">Inscription</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Demandez votre accès MotorSafe</h1>
            <p className="mt-3 text-base text-muted2">
              L&apos;équipe MotorSafe valide les comptes pour garantir une communauté professionnelle fiable.
            </p>
          </div>

          <Card className="p-4">
            <p className="ms-kicker">Process</p>
            <ol className="mt-3 grid gap-2 text-sm text-muted2">
              <li>1. Déposez vos informations atelier.</li>
              <li>2. Vérification administrative rapide.</li>
              <li>3. Activation et accès au dashboard.</li>
            </ol>
          </Card>

          <Card className="p-4">
            <p className="ms-kicker">Support</p>
            <p className="mt-2 text-sm font-semibold">Un accompagnement dédié</p>
            <p className="mt-1 text-xs text-muted2">
              Nos équipes répondent en moins de 24h pour les demandes urgentes.
            </p>
          </Card>
        </div>

        <Card className="w-full p-8">
          <div className="grid gap-3">
            <p className="ms-kicker">Inscription</p>
            <h1 className="text-2xl font-semibold tracking-tight text-text">Créer un compte pro</h1>
            <p className="text-sm text-muted2">
              Renseignez vos informations, nous reviendrons vers vous rapidement.
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
                label="Téléphone"
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

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Envoi..." : "Envoyer la demande"}
              </Button>
              <Link
                href="/auth/login"
                className="text-sm font-semibold text-primary hover:text-primaryHover"
              >
                Déjà un compte ? Connexion
              </Link>
            </div>
          </form>
        </Card>
      </div>
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
import { Badge } from "@/components/ui/Badge";

export default function ProLandingPage() {
  return (
    <main className="min-h-screen w-full bg-bg text-text">
      <header className="border-b border-border bg-bg/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-surface2">
              <span className="text-sm font-extrabold tracking-tight text-primary2">MS</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-text">MotorSafe</div>
              <div className="text-xs text-muted2">Espace pro</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button>Connexion</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">Garages & pros</Badge>
            <Badge variant="warning">Comptes validés</Badge>
          </div>

          <div>
            <p className="ms-kicker">Espace pro</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text">
              Un accès dédié pour les garages et pros de l&apos;auto
            </h1>
            <p className="mt-3 text-base text-muted2">
              Connectez-vous ou demandez un compte pro. Chaque demande est validée par l&apos;administration.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/auth/login">
              <Button>Connexion pro</Button>
            </Link>
            <Link href="/pro/inscription">
              <Button variant="secondary">Demander un compte</Button>
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: "Validation", desc: "Dossier vérifié avant activation." },
              { title: "Dossiers", desc: "Clients, véhicules, interventions." },
              { title: "PDF", desc: "Documents générés et accessibles." },
            ].map((item) => (
              <Card key={item.title} className="p-4">
                <p className="text-sm font-semibold text-text">{item.title}</p>
                <p className="mt-1 text-xs text-muted2">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-8">
          <p className="ms-kicker">Onboarding</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">Process simple</h2>
          <p className="mt-2 text-sm text-muted2">Trois étapes, sans friction.</p>

          <ol className="mt-5 grid gap-3 text-sm text-muted2">
            <li className="rounded-xl border border-border/60 bg-surface2/80 px-4 py-3">1. Informations atelier</li>
            <li className="rounded-xl border border-border/60 bg-surface2/80 px-4 py-3">2. Validation</li>
            <li className="rounded-xl border border-border/60 bg-surface2/80 px-4 py-3">3. Accès dashboard</li>
          </ol>

          <div className="mt-6 grid gap-3">
            <Link href="/pro/inscription">
              <Button className="w-full">Créer un compte pro</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="secondary" className="w-full">Déjà un compte ? Connexion</Button>
            </Link>
            <Link href="/" className="text-center text-sm font-semibold text-primary hover:text-primaryHover">
              Retour site
            </Link>
          </div>
        </Card>
      </div>
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

## app/ui-debug/page.tsx
<a id="app-ui-debug-pagetsx"></a>

```tsx
export default function UIDebug() {
  return (
    <main style={{ padding: 40 }}>
      <h1>UI DEBUG PAGE</h1>
      <div className="p-6 rounded-xl bg-blue-600 text-white font-bold">
        If you see blue, Tailwind works.
      </div>
    </main>
  );
}

```

## components/common/EmptyState.tsx
<a id="components-common-emptystatetsx"></a>

```tsx
import { Card } from "@/components/ui/Card";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-border/70 bg-surface2">
        {icon ?? <Inbox size={20} className="text-primary2" />}
      </div>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      {description ? <p className="mt-2 text-sm text-muted2">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </Card>
  );
}

```

## components/common/ErrorBanner.tsx
<a id="components-common-errorbannertsx"></a>

```tsx
import { Card } from "@/components/ui/Card";
import { AlertTriangle } from "lucide-react";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <Card className="border border-danger/35 bg-danger/8">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-danger/35 bg-danger/10">
          <AlertTriangle size={18} className="text-danger" />
        </span>
        <p className="text-sm text-danger/90">{message}</p>
      </div>
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
        <p className="ms-kicker">Références & conformité</p>
        <h3 className="mt-2 text-lg font-semibold">Cadre légal associé</h3>
      </div>
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune référence associée"
          description="L'administration pourra ajouter des références légales liées à ce type."
        />
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <details
              key={item.id}
              className="rounded-[var(--r)] border border-border/60 bg-surface"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted2">
                    {item.code || item.articleRef || item.tags ? "Voir le détail" : ""}
                  </p>
                </div>
                <Badge variant={severityVariant[item.severity]}>
                  {item.severity === "CRITICAL" ? "Critique" : item.severity === "WARNING" ? "Attention" : "Info"}
                </Badge>
              </summary>

              <div className="border-t border-border/60 px-4 py-3 text-sm">
                {item.summary ? (
                  <p className="text-sm text-muted2">{item.summary}</p>
                ) : (
                  <p className="text-sm text-muted2">Aucun résumé.</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted2">
                  {item.code ? <span>{item.code}</span> : null}
                  {item.articleRef ? <span>{item.articleRef}</span> : null}
                  {item.tags ? <span>Tags: {item.tags}</span> : null}
                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      className="font-semibold text-primary hover:text-primaryHover"
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
      <p className="text-xs text-muted2">{label}</p>
    </div>
  );
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
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/20 blur-2xl" />
      <p className="ms-kicker">{label}</p>
      <p className="font-display text-3xl font-semibold tracking-tight">{value}</p>
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

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import type { NavItem } from "@/components/layout/nav-config";
import { TopBar } from "@/components/layout/Topbar";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import Drawer from "@/components/ui/navigation/Drawer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { LayoutGrid, Users, Car, Wrench, FileText, Settings, ShieldCheck, MoreHorizontal } from "lucide-react";

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
  onLogout?: () => void;
};

export function AppShell({
  children,
  user,
  navItems = [],
  activePath,
  sidebarOpen = false,
  onSidebarClose = () => {},
  collapsed = false,
  onToggleCollapse = () => {},
  onMenu = () => {},
  onLogout = () => {},
}: AppShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = (usePathname() || activePath || "/").split("?")[0] || "/";
  const qFromUrl = searchParams?.get("q") ?? "";
  const [globalQuery, setGlobalQuery] = useState(qFromUrl);
  const [plusOpen, setPlusOpen] = useState(false);

  useEffect(() => {
    setGlobalQuery(qFromUrl);
  }, [qFromUrl]);

  // Prevent stacked overlays: close mobile sheets on navigation.
  useEffect(() => {
    onSidebarClose();
    setPlusOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const visibleNavItems = useMemo(
    () => navItems.filter((n) => !n.adminOnly || user?.role === "ADMIN"),
    [navItems, user?.role]
  );

  const applyGlobalSearch = () => {
    const next = globalQuery.trim();
    const params = new URLSearchParams(searchParams ? Array.from(searchParams.entries()) : []);
    if (next) params.set("q", next);
    else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const bottomItems = useMemo(
    () =>
      [
        { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
        { label: "Clients", href: "/clients", icon: Users },
        { label: "Véhicules", href: "/vehicules", icon: Car },
        { label: "Interventions", href: "/interventions", icon: Wrench },
      ] as const,
    []
  );

  return (
    <div className="min-h-screen bg-bg text-text">
      <TopBar
        user={user}
        query={globalQuery}
        onQueryChange={setGlobalQuery}
        onSearch={applyGlobalSearch}
        onMenu={() => {
          onMenu();
        }}
        onLogout={onLogout}
      />

      {/* Layout */}
      <div className="mx-auto flex max-w-[1440px]">
        <DesktopSidebar
          user={user}
          navItems={navItems}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          onLogout={onLogout}
        />
        <main className="min-w-0 flex-1 pt-16 pb-10 lg:pb-24">
          <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-10">{children}</div>
          <div className="h-20 md:hidden [@media(pointer:fine)]:hidden" />
        </main>
      </div>

      {/* Mobile Drawer (sidebar) */}
      <Drawer open={sidebarOpen} onClose={onSidebarClose} side="left" title="Navigation">
        <div className="mb-4">
          <Input
            label="Rechercher"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder="Rechercher…"
          />
          <div className="mt-2">
            <Button onClick={applyGlobalSearch} className="w-full">
              Rechercher
            </Button>
          </div>
        </div>

        <nav className="space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onSidebarClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                  isActive
                    ? "bg-primary/12 text-text"
                    : "text-muted2 hover:bg-surface2/80 hover:text-text"
                }`}
              >
                <Icon size={18} className={isActive ? "text-primary" : "text-muted2"} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 grid gap-3 rounded-[var(--r)] border border-border bg-surface/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm">{user?.email ?? ""}</p>
            <Badge variant="accent">{user?.role === "ADMIN" ? "Admin" : "Pro"}</Badge>
          </div>
          <div className="flex gap-2">
            <Link href="/parametres" onClick={onSidebarClose} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">Paramètres</Button>
            </Link>
            <Button variant="ghost" size="sm" className="flex-1" onClick={onLogout}>Quitter</Button>
          </div>
        </div>
      </Drawer>

      {/* Mobile BottomNav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-bg/80 backdrop-blur md:hidden [@media(pointer:fine)]:hidden">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)]">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-2 py-2 text-xs ${
                  isActive ? "text-text" : "text-muted2"
                }`}
              >
                <Icon size={18} className={isActive ? "text-primary2" : "text-muted2"} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setPlusOpen(true)}
            className="flex flex-col items-center gap-1 px-2 py-2 text-xs text-muted2"
            aria-label="Plus"
          >
            <MoreHorizontal size={18} className="text-muted2" />
            <span>Plus</span>
          </button>
        </div>
      </nav>

      {/* Mobile “Plus” drawer */}
      <Drawer open={plusOpen} onClose={() => setPlusOpen(false)} side="bottom" title="Plus">
        <div className="grid gap-2">
          {[
            { label: "Documents PDF", href: "/documents", icon: FileText },
            { label: "Paramètres", href: "/parametres", icon: Settings },
            ...(user?.role === "ADMIN"
              ? [
                  { label: "Demandes pro", href: "/admin/pro-demandes", icon: ShieldCheck },
                  { label: "Références légales", href: "/admin/references", icon: ShieldCheck },
                ]
              : []),
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setPlusOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-surface px-4 py-3 text-sm transition hover:bg-surface2/80"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-surface2">
                  <Icon size={18} className="text-primary2" />
                </span>
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

## components/layout/DesktopSidebar.tsx
<a id="components-layout-desktopsidebartsx"></a>

```tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import type { NavItem } from "@/components/layout/nav-config";
import { Badge } from "@/components/ui/Badge";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SectionLabel({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  if (collapsed) return null;
  return (
    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted2">
      {children}
    </p>
  );
}

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cx(
        "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
        "focus:outline-none focus:ring-2 focus:ring-primary/40",
        active
          ? "bg-primaryWeak text-text"
          : "text-muted2 hover:bg-surface2 hover:text-text"
      )}
    >
      <span
        className={cx(
          "grid h-9 w-9 place-items-center rounded-xl border transition",
          active
            ? "border-primary/20 bg-surface2"
            : "border-border bg-surface group-hover:bg-surface2"
        )}
      >
        <Icon
          size={18}
          className={cx(
            "transition",
            active
              ? "text-primary2"
              : "text-muted2 group-hover:text-text"
          )}
        />
      </span>

      {!collapsed ? <span className="truncate">{item.label}</span> : null}

      {active ? (
        <span className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary2" />
      ) : null}
    </Link>
  );
}

export function DesktopSidebar({
  user,
  navItems,
  collapsed,
  onToggleCollapse,
  onLogout,
}: {
  user?: SessionUser;
  navItems: NavItem[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  const grouped = useMemo(() => {
    const visible = navItems.filter((n) => !n.adminOnly || user?.role === "ADMIN");
    const main = visible.filter((n) => (n.group ?? "main") === "main");
    const admin = visible.filter((n) => (n.group ?? "main") === "admin");
    return { main, admin };
  }, [navItems, user?.role]);

  return (
    <aside
      className={cx(
        "sticky top-16 hidden h-[calc(100vh-64px)] shrink-0 border-r border-border bg-bg lg:block [@media(pointer:fine)]:block",
        collapsed ? "w-[88px]" : "w-[260px]"
      )}
      aria-label="Navigation"
      data-ui="desktop-sidebar-premium"
    >
      <div className={cx("relative flex h-full flex-col px-3 py-4", collapsed && "px-2")}>
        <div className="pointer-events-none absolute -top-12 left-6 h-40 w-40 rounded-full bg-primaryWeak blur-3xl opacity-40" />

        <div className={cx("mb-3 flex items-center gap-3", collapsed && "justify-center")}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-surface2">
              <span className="text-sm font-extrabold text-primary2">MS</span>
            </div>

            {!collapsed ? (
              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-semibold text-text">MotorSafe</div>
                <div className="truncate text-xs text-muted2">Panel garages</div>
              </div>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={onToggleCollapse}
            className={cx(
              "ml-auto inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface text-muted2 transition hover:bg-surface2",
              collapsed && "ml-0"
            )}
            aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          <SectionLabel collapsed={collapsed}>Menu</SectionLabel>
          <div className="space-y-1">
            {grouped.main.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
                collapsed={collapsed}
              />
            ))}
          </div>

          {grouped.admin.length ? (
            <>
              <SectionLabel collapsed={collapsed}>Admin</SectionLabel>
              <div className="space-y-1">
                {grouped.admin.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActivePath(pathname, item.href)}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </>
          ) : null}
        </nav>

        <div
          className={cx(
            "mt-4 rounded-2xl border border-border bg-surface p-3",
            collapsed && "p-2"
          )}
        >
          <div className={cx("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-surface2">
              <span className="text-xs font-bold text-primary2">U</span>
            </div>

            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">{user?.email ?? ""}</p>
                <p className="text-xs text-muted2">Profil</p>
              </div>
            ) : null}

            {!collapsed ? <Badge variant="accent">{user?.role === "ADMIN" ? "Admin" : "Pro"}</Badge> : null}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className={cx(
              "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-transparent px-3 py-2 text-sm text-muted2 transition hover:bg-surface2",
              "focus:outline-none focus:ring-2 focus:ring-primary/40",
              collapsed && "mt-2 h-10 px-0"
            )}
            aria-label="Quitter"
            title={collapsed ? "Quitter" : undefined}
          >
            <LogOut size={16} />
            {!collapsed ? "Quitter" : null}
          </button>
        </div>
      </div>
    </aside>
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
    <nav className="fixed bottom-4 left-1/2 z-40 w-[92%] -translate-x-1/2 rounded-[var(--r)] border border-border bg-surface/90 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] shadow-[var(--shDropdown)] backdrop-blur lg:hidden [@media(pointer:fine)]:hidden">
      <div className="flex items-center justify-between gap-3">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = activePath === item.href || activePath.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 text-xs ${
                isActive ? "text-text" : "text-muted2"
              }`}
            >
              <Icon size={16} className={isActive ? "text-primary" : "text-muted2"} />
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
import type React from "react";

export type NavGroup = "main" | "admin";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
  group?: NavGroup;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid, group: "main" },
  { label: "Clients", href: "/clients", icon: Users, group: "main" },
  { label: "Véhicules", href: "/vehicules", icon: Car, group: "main" },
  { label: "Interventions", href: "/interventions", icon: Wrench, group: "main" },
  { label: "Documents PDF", href: "/documents", icon: FileText, group: "main" },
  { label: "Paramètres", href: "/parametres", icon: Settings, group: "main" },
  { label: "Demandes pro", href: "/admin/pro-demandes", icon: ShieldCheck, adminOnly: true, group: "admin" },
  { label: "Références légales", href: "/admin/references", icon: ShieldCheck, adminOnly: true, group: "admin" },
];

```

## components/layout/responsive/ProSidebarMenu.tsx
<a id="components-layout-responsive-prosidebarmenutsx"></a>

```tsx
import React from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { NAV_ITEMS, type NavItem } from "../nav-config";
import { Tooltip } from "../../ui/Tooltip";
import { usePathname } from "next/navigation";

export function ProSidebarMenu() {
  // Group nav items: main, admin
  const mainNav = NAV_ITEMS.filter((item: NavItem) => !item.adminOnly);
  const adminNav = NAV_ITEMS.filter((item: NavItem) => item.adminOnly);
  // TODO: get collapsed state from context/prop if needed
  const collapsed = false;
  const activePath = usePathname();
  return (
    <nav className="flex flex-col gap-2 w-full h-full py-6" aria-label="Navigation principale">
      <div className="flex items-center gap-3 px-6 mb-8">
        <div className="h-10 w-10 rounded-[var(--rCard)] bg-primary/15 border border-primary/25 grid place-items-center">
          <span className="text-primary font-bold">M</span>
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm tracking-[0.32em] uppercase text-muted">Motorsafe</div>
            <div className="text-xs text-muted/80">Panel garages</div>
          </div>
        )}
      </div>
      <ul className="flex-1 flex flex-col gap-1 px-2" role="list">
        {mainNav.map((item) => {
          const { label, href, icon: Icon } = item;
          return (
          <li key={href} role="listitem">
            <Tooltip content={collapsed ? label : undefined} side="right" disabled={!collapsed}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-[var(--rButton)] border transition duration-200 ${
                  activePath.startsWith(href)
                    ? "bg-primary/12 border-primary/25 text-text shadow-soft"
                    : "bg-transparent border-transparent text-text/85 hover:bg-white/5 hover:border-border"
                }`}
                aria-current={activePath.startsWith(href) ? "page" : undefined}
                tabIndex={0}
              >
                <Icon className="h-4 w-4 text-primary opacity-90" />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
              </Link>
            </Tooltip>
          </li>
          );
        })}
        {adminNav.length > 0 && (
          <React.Fragment>
            <li className="my-2 border-t border-border" aria-hidden />
            {adminNav.map((item) => {
              const { label, href, icon: Icon } = item;
              return (
              <li key={href} role="listitem">
                <Tooltip content={collapsed ? label : undefined} side="right" disabled={!collapsed}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[var(--rButton)] border transition duration-200 ${
                      activePath.startsWith(href)
                        ? "bg-primary/12 border-primary/25 text-text shadow-soft"
                        : "bg-transparent border-transparent text-text/85 hover:bg-white/5 hover:border-border"
                    }`}
                    aria-current={activePath.startsWith(href) ? "page" : undefined}
                    tabIndex={0}
                  >
                    <Icon className="h-4 w-4 text-primary opacity-90" />
                    {!collapsed && <span className="text-sm font-medium">{label}</span>}
                  </Link>
                </Tooltip>
              </li>
              );
            })}
          </React.Fragment>
        )}
      </ul>
      <div className="px-6 mt-8">
        <button className="flex items-center gap-2 text-sm text-muted hover:text-white">
          <LogOut className="h-4 w-4" /> Quitter
        </button>
      </div>
    </nav>
  );
}

```

## components/layout/Sidebar.tsx
<a id="components-layout-sidebartsx"></a>

```tsx
"use client";

import type { ReactNode } from "react";

export function Sidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="ms-card w-full h-full flex flex-col p-4">
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
import { useEffect, useId, useRef } from "react";
import type { SessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownItem } from "@/components/ui/DropdownMenu";
import { Menu, Plus, Search, UserCircle2 } from "lucide-react";

export function TopBar({
  user,
  query,
  onQueryChange,
  onSearch,
  onMenu,
  onLogout,
}: {
  user?: SessionUser;
  query?: string;
  onQueryChange?: (value: string) => void;
  onSearch?: () => void;
  onMenu: () => void;
  onLogout: () => void;
}) {
  const searchId = useId();
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      if (e.key.toLowerCase() !== "k") return;
      e.preventDefault();
      searchRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-border bg-bg/60 backdrop-blur-xl"
      data-ui="topbar-2026-01-02-premium"
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={onMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface text-muted2 transition hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-primary/40 md:hidden [@media(pointer:fine)]:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu size={18} />
        </button>

        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-surface2">
            <span className="text-sm font-extrabold tracking-tight text-primary2">MS</span>
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-semibold text-text">MotorSafe</div>
            <div className="text-xs text-muted2">Panel garages</div>
          </div>
        </Link>

        <div
          className="ms-focus-within hidden flex-1 items-center gap-2 rounded-2xl border border-border bg-surface px-3 shadow-sm lg:flex"
          role="search"
          aria-label="Recherche"
        >
          <Search size={16} className="text-muted2" />
          <label htmlFor={searchId} className="sr-only">
            Recherche globale
          </label>
          <input
            id={searchId}
            ref={searchRef}
            className="h-11 w-full bg-transparent text-sm text-text placeholder:text-muted2 outline-none"
            placeholder="Rechercher un client, une plaque, un dossier…"
            value={query ?? ""}
            onChange={(e) => onQueryChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch?.();
            }}
          />
          <kbd className="hidden rounded-lg border border-border bg-surface2 px-2 py-1 text-[11px] text-muted2 sm:inline-flex">
            Ctrl K
          </kbd>
        </div>

        <div className="flex-1 md:hidden" />

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu
            trigger={
              <Button variant="primary" size="md">
                <Plus size={16} /> Nouveau
              </Button>
            }
          >
            <DropdownItem asChild>
              <Link href="/clients">Client</Link>
            </DropdownItem>
            <DropdownItem asChild>
              <Link href="/vehicules">Véhicule</Link>
            </DropdownItem>
            <DropdownItem asChild>
              <Link href="/interventions">Intervention</Link>
            </DropdownItem>
            <DropdownItem asChild>
              <Link href="/documents">PDF</Link>
            </DropdownItem>
          </DropdownMenu>

          <DropdownMenu
            trigger={
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 text-sm font-semibold text-text transition hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <UserCircle2 size={18} className="text-muted2" />
                <span className="hidden max-w-[220px] truncate sm:block">{user?.email ?? "Profil"}</span>
              </button>
            }
          >
            <DropdownItem asChild>
              <Link href="/parametres">Paramètres</Link>
            </DropdownItem>
            <DropdownItem onClick={onLogout}>Quitter</DropdownItem>
          </DropdownMenu>
        </div>
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
    <div className="grid gap-3 text-sm text-muted2">
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
import { cn } from "@/lib/cn";

type BadgeVariant = "success" | "warning" | "neutral" | "accent";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/12 text-warning border-warning/25",
  neutral: "bg-surface2/60 text-muted2 border-border",
  accent: "bg-primary/14 text-primary border-primary/30",
};

export function Badge({ className = "", variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-tight",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

```

## components/ui/Button.tsx
<a id="components-ui-buttontsx"></a>

```tsx
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--rButton)] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-bg shadow-[0_16px_40px_rgb(var(--accent)/0.14)] hover:bg-primaryHover",
  secondary:
    "bg-surface text-text border border-border/70 hover:bg-surface2",
  ghost: "bg-transparent text-text hover:bg-surface2/60",
  outline:
    "bg-transparent text-text border border-border hover:bg-surface2/70",
  danger:
    "bg-danger/12 text-danger border border-danger/35 hover:bg-danger/18",
  destructive:
    "bg-danger/12 text-danger border border-danger/35 hover:bg-danger/18",
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
    <button
      className={cn(base, "active:translate-y-[1px] active:shadow-none", variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

```

## components/ui/Card.tsx
<a id="components-ui-cardtsx"></a>

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--r)] border border-border bg-surface shadow-soft p-5 sm:p-6",
        className
      )}
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
import { cn } from "@/lib/cn";

type DataTableProps = {
  stickyHeader?: boolean;
  variant?: "card" | "plain";
  className?: string;
  children: React.ReactNode;
};

export function DataTable({
  stickyHeader = false,
  variant = "card",
  className = "",
  children,
}: DataTableProps) {
  return (
    <div
      className={cn(
        variant === "card"
          ? "rounded-[var(--r)] border border-border bg-surface shadow-soft overflow-hidden"
          : "",
        className
      )}
    >
      <div className={cn("overflow-x-auto", variant === "card" ? "" : "rounded-[var(--r)] border border-border bg-surface shadow-soft")}>
        <table className="ms-table min-w-[720px] text-sm">{children}</table>
      </div>
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
      className={cn(
        "text-left",
        sticky ? "sticky top-0 z-10 border-b border-border/70 bg-surface/95 backdrop-blur" : ""
      )}
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

import { useEffect, useId, useRef, useState } from "react";
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
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    // Focus first focusable element inside the panel
    setTimeout(() => {
      const root = panelRef.current;
      if (!root) return;
      const el = root.querySelector<HTMLElement>(
        "button,[href],input,select,textarea,[tabindex]:not([tabindex='-1'])"
      );
      el?.focus();
    }, 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!mounted || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="relative w-full max-w-lg rounded-[var(--r)] border border-border bg-surface p-7 shadow-[var(--shDropdown)]"
      >
        <div className="grid gap-2">
          <h3 id={titleId} className="text-lg font-semibold">{title}</h3>
          {description ? <p id={descId} className="text-sm text-muted2">{description}</p> : null}
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant === "destructive" ? "danger" : confirmVariant} onClick={onConfirm}>
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

import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactElement } from "react";
import { cn } from "@/lib/cn";

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
    const onTouch = (e: TouchEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onTouch);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onTouch);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  type TriggerProps = {
    onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
    "aria-expanded"?: boolean;
    "aria-haspopup"?: "menu";
  };

  const handleTriggerClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    setOpen((v) => !v);
  };

  const triggerElement = isValidElement<TriggerProps>(trigger) ? (trigger as ReactElement<TriggerProps>) : null;

  const triggerNode = triggerElement
    ? cloneElement(triggerElement, {
        onClick: (event: ReactMouseEvent<HTMLElement>) => {
          triggerElement.props.onClick?.(event);
          handleTriggerClick(event);
        },
        "aria-expanded": open,
        "aria-haspopup": "menu",
      })
    : (
        <button
          type="button"
          onClick={handleTriggerClick}
          className="inline-flex items-center gap-2"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {trigger}
        </button>
      );

  return (
    <div className="relative" ref={rootRef} data-dropdown={id}>
      {triggerNode}
      {open ? (
        <div
          className={`absolute z-50 mt-2 min-w-[240px] rounded-[var(--r)] border border-border bg-surface/95 backdrop-blur shadow-[var(--shDropdown)] p-1 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

type DropdownItemChildProps = {
  className?: string;
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  role?: string;
};

export function DropdownItem({
  children,
  onClick,
  asChild = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  asChild?: boolean;
}) {
  const itemClass =
    "w-full rounded-[var(--rButton)] px-3 py-2 text-left text-sm text-text transition hover:bg-surface2/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

  if (asChild && isValidElement<DropdownItemChildProps>(children)) {
    const child = children as ReactElement<DropdownItemChildProps>;
    return cloneElement(child, {
      className: cn(itemClass, child.props.className ?? ""),
      role: "menuitem",
      onClick: (event: ReactMouseEvent<HTMLElement>) => {
        child.props.onClick?.(event);
        onClick?.();
      },
    });
  }

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={itemClass}
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
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
};

export function Input({ className = "", containerClassName = "", label, helperText, error, id, ...props }: InputProps) {
  const describedBy = error ? `${id ?? ""}-error` : helperText ? `${id ?? ""}-help` : undefined;
  return (
    <label className={cn("grid gap-2", containerClassName)}>
      {label ? <span className="ms-kicker">{label}</span> : null}
      <input
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className={cn(
          "ms-input text-sm outline-none",
          error ? "border-danger/55 focus-visible:shadow-none" : "",
          className
        )}
        {...props}
      />
      {error ? (
        <p id={`${id ?? ""}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id ?? ""}-help`} className="text-xs text-muted2">
          {helperText}
        </p>
      ) : null}
    </label>
  );
}

```

## components/ui/navigation/Drawer.tsx
<a id="components-ui-navigation-drawertsx"></a>

```tsx
"use client";

import React, { useEffect } from "react";

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
  // Lock scroll + allow ESC close.
  // This stays client-only and does not affect backend.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const panelClass =
    side === "bottom"
      ? "fixed inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-[var(--r)] border-t"
      : side === "right"
      ? "fixed inset-y-0 right-0 h-full w-[88vw] max-w-[320px] border-l"
      : "fixed inset-y-0 left-0 h-full w-[88vw] max-w-[320px] border-r";

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <aside
        className={`relative ${panelClass} border-border bg-surface shadow-[var(--shDropdown)]`}
        role="dialog"
        aria-modal="true"
      >
        {title ? (
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
            <p className="text-sm font-semibold text-text">{title}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[var(--rButton)] border border-border/70 bg-transparent px-3 py-1.5 text-xs font-semibold text-muted2 transition hover:bg-surface2"
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
import { cn } from "@/lib/cn";

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
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <Tag
          className={cn(
            "font-display text-text font-semibold tracking-tight leading-tight",
            level <= 2 ? "text-2xl md:text-3xl lg:text-[34px]" : "text-xl md:text-2xl lg:text-[28px]"
          )}
        >
          {title}
        </Tag>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted2">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 pt-1 md:pt-0">{action}</div> : null}
    </div>
  );
}

```

## components/ui/Select.tsx
<a id="components-ui-selecttsx"></a>

```tsx
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
};

export function Select({ className = "", containerClassName = "", label, helperText, error, id, children, ...props }: SelectProps) {
  const describedBy = error ? `${id ?? ""}-error` : helperText ? `${id ?? ""}-help` : undefined;
  return (
    <label className={cn("grid gap-2", containerClassName)}>
      {label ? <span className="ms-kicker">{label}</span> : null}
      <select
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className={cn(
          "ms-input cursor-pointer text-sm outline-none",
          error ? "border-danger/55" : "",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={`${id ?? ""}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id ?? ""}-help`} className="text-xs text-muted2">
          {helperText}
        </p>
      ) : null}
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
      className={`animate-pulse rounded-[var(--rGlobal)] bg-surface2/70 ${className}`}
    />
  );
}

```

## components/ui/Table.tsx
<a id="components-ui-tabletsx"></a>

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TableProps = HTMLAttributes<HTMLDivElement>;

export function Table({ className = "", ...props }: TableProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--r)] border border-border bg-surface shadow-soft overflow-x-auto",
        className
      )}
      {...props}
    />
  );
}

```

## components/ui/Textarea.tsx
<a id="components-ui-textareatsx"></a>

```tsx
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
};

export function Textarea({ className = "", containerClassName = "", label, helperText, error, id, ...props }: TextareaProps) {
  const describedBy = error ? `${id ?? ""}-error` : helperText ? `${id ?? ""}-help` : undefined;
  return (
    <label className={cn("grid gap-2", containerClassName)}>
      {label ? <span className="ms-kicker">{label}</span> : null}
      <textarea
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className={cn(
          "ms-input min-h-[120px] resize-y py-3 text-sm outline-none",
          error ? "border-danger/55" : "",
          className
        )}
        {...props}
      />
      {error ? (
        <p id={`${id ?? ""}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id ?? ""}-help`} className="text-xs text-muted2">
          {helperText}
        </p>
      ) : null}
    </label>
  );
}

```

## components/ui/Toast.tsx
<a id="components-ui-toasttsx"></a>

```tsx
"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

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
  success: "border-success/35 bg-surface",
  error: "border-danger/35 bg-surface",
  info: "border-primary/30 bg-surface",
};

const variantIcon: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
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
        {toasts.map((toast) => {
          const Icon = variantIcon[toast.variant];
          return (
            <div
              key={toast.id}
              className={`w-[340px] rounded-[var(--r)] border px-4 py-3 shadow-[var(--shDropdown)] ${variantStyles[toast.variant]}`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-border/60 bg-surface2">
                  <Icon
                    size={18}
                    className={
                      toast.variant === "success"
                        ? "text-success"
                        : toast.variant === "error"
                          ? "text-danger"
                          : "text-primary"
                    }
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">{toast.title}</p>
                  {toast.description ? <p className="mt-1 text-xs text-muted2">{toast.description}</p> : null}
                </div>
              </div>
            </div>
          );
        })}
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

import { cn } from "@/lib/cn";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
};

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={cn("flex items-center gap-3 text-sm", disabled ? "opacity-60" : "text-muted2")}>
      <button
        type="button"
        aria-pressed={checked}
        disabled={disabled}
        onClick={() => (disabled ? null : onChange(!checked))}
        className={cn(
          "relative h-7 w-12 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
          checked ? "border-primary bg-primary/18" : "border-border bg-surface",
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-border/40 bg-surface2 shadow-sm transition",
            checked ? "translate-x-6" : "translate-x-1"
          )}
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
"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type TooltipSide = "top" | "right" | "bottom" | "left";

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: TooltipSide;
  disabled?: boolean;
};

const sideClasses: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 -translate-y-2",
  bottom: "top-full left-1/2 -translate-x-1/2 translate-y-2",
  left: "right-full top-1/2 -translate-y-1/2 -translate-x-2",
  right: "left-full top-1/2 -translate-y-1/2 translate-x-2",
};

export function Tooltip({ content, children, side = "top", disabled }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  if (disabled || !content) return <>{children}</>;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      <span
        id={id}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-[14px] border border-border bg-surface/95 px-3 py-2 text-xs text-text shadow-[var(--shDropdown)] backdrop-blur transition",
          "opacity-0 scale-[0.98]",
          open ? "opacity-100 scale-100" : "",
          sideClasses[side]
        )}
      >
        {content}
      </span>
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
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface2) / <alpha-value>)",

        // Defaults match globals.css opacities; /xx still works when Tailwind sets --tw-*-opacity
        text: "rgb(var(--text) / var(--tw-text-opacity, var(--textA)))",
        muted: "rgb(var(--muted) / var(--tw-text-opacity, var(--textSecondaryA)))",
        muted2: "rgb(var(--muted2) / var(--tw-text-opacity, var(--textMutedA)))",
        border: "rgb(var(--border) / var(--tw-border-opacity, var(--borderA)))",

        primary: "rgb(var(--accent) / <alpha-value>)",
        primary2: "rgb(var(--accent2) / <alpha-value>)",
        primaryHover: "rgb(var(--accentHover) / <alpha-value>)",
        primaryWeak: "rgb(var(--accentWeak) / var(--tw-bg-opacity, var(--accentWeakA)))",

        danger: "rgb(var(--danger) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
      },
      borderRadius: {
        xl: '18px',
        '2xl': '22px',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
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

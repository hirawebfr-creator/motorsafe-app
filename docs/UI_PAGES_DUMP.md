# UI_PAGES_DUMP — MotorSafe

Ce fichier est généré automatiquement.

**Contenu:** routes → layouts applicables → code de la page.
**Génération:** `node scripts/dump-pages-ui.js`

## Index

- [/](#root)
- [/_ui-debug](#_ui-debug)
- [/admin](#admin)
- [/admin/garages](#admin-garages)
- [/admin/pro-demandes](#admin-pro-demandes)
- [/admin/references](#admin-references)
- [/auth/login](#auth-login)
- [/auth/pending](#auth-pending)
- [/auth/register-pro](#auth-register-pro)
- [/clients](#clients)
- [/clients/[id]](#clients-[id])
- [/dashboard](#dashboard)
- [/documents](#documents)
- [/interventions](#interventions)
- [/interventions/[id]](#interventions-[id])
- [/legal](#legal)
- [/parametres](#parametres)
- [/pro](#pro)
- [/pro/en-attente](#pro-en-attente)
- [/pro/inscription](#pro-inscription)
- [/pro/pending](#pro-pending)
- [/pro/signup](#pro-signup)
- [/settings](#settings)
- [/ui-debug](#ui-debug)
- [/vehicules](#vehicules)
- [/vehicules/[id]](#vehicules-[id])

---

## /
<a id="root"></a>

### Layouts

- app/layout.tsx

#### app/layout.tsx
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

### Page

#### app/page.tsx
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

## /_ui-debug
<a id="_ui-debug"></a>

### Layouts

- app/layout.tsx

#### app/layout.tsx
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

### Page

#### app/_ui-debug/page.tsx
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

## /admin
<a id="admin"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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

#### app/(dashboard)/layout.tsx
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

### Page

#### app/(dashboard)/admin/page.tsx
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

## /admin/garages
<a id="admin-garages"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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

#### app/(dashboard)/layout.tsx
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

### Page

#### app/(dashboard)/admin/garages/page.tsx
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

## /admin/pro-demandes
<a id="admin-pro-demandes"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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

#### app/(dashboard)/layout.tsx
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

### Page

#### app/(dashboard)/admin/pro-demandes/page.tsx
```tsx
import AdminPendingPage from "../page";

export default AdminPendingPage;

```

## /admin/references
<a id="admin-references"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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

#### app/(dashboard)/layout.tsx
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

### Page

#### app/(dashboard)/admin/references/page.tsx
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

## /auth/login
<a id="auth-login"></a>

### Layouts

- app/layout.tsx

#### app/layout.tsx
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

### Page

#### app/auth/login/page.tsx
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

## /auth/pending
<a id="auth-pending"></a>

### Layouts

- app/layout.tsx

#### app/layout.tsx
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

### Page

#### app/auth/pending/page.tsx
```tsx
import { redirect } from "next/navigation";

export default function PendingPage() {
  redirect("/pro/en-attente");
}

```

## /auth/register-pro
<a id="auth-register-pro"></a>

### Layouts

- app/layout.tsx

#### app/layout.tsx
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

### Page

#### app/auth/register-pro/page.tsx
```tsx
import { redirect } from "next/navigation";

export default function RegisterProPage() {
  redirect("/pro/inscription");
}

```

## /clients
<a id="clients"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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

#### app/(dashboard)/layout.tsx
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

### Page

#### app/(dashboard)/clients/page.tsx
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

## /clients/[id]
<a id="clients-[id]"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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

#### app/(dashboard)/layout.tsx
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

### Page

#### app/(dashboard)/clients/[id]/page.tsx
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

## /dashboard
<a id="dashboard"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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

#### app/(dashboard)/layout.tsx
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

### Page

#### app/(dashboard)/dashboard/page.tsx
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

## /documents
<a id="documents"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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

#### app/(dashboard)/layout.tsx
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

### Page

#### app/(dashboard)/documents/page.tsx
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

## /interventions
<a id="interventions"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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

#### app/(dashboard)/layout.tsx
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

### Page

#### app/(dashboard)/interventions/page.tsx
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

## /interventions/[id]
<a id="interventions-[id]"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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

#### app/(dashboard)/layout.tsx
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

### Page

#### app/(dashboard)/interventions/[id]/page.tsx
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

## /legal
<a id="legal"></a>

### Layouts

- app/layout.tsx

#### app/layout.tsx
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

### Page

#### app/legal/page.tsx
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

## /parametres
<a id="parametres"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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

#### app/(dashboard)/layout.tsx
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

### Page

#### app/(dashboard)/parametres/page.tsx
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

## /pro
<a id="pro"></a>

### Layouts

- app/layout.tsx

#### app/layout.tsx
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

### Page

#### app/pro/page.tsx
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

## /pro/en-attente
<a id="pro-en-attente"></a>

### Layouts

- app/layout.tsx

#### app/layout.tsx
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

### Page

#### app/pro/en-attente/page.tsx
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

## /pro/inscription
<a id="pro-inscription"></a>

### Layouts

- app/layout.tsx

#### app/layout.tsx
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

### Page

#### app/pro/inscription/page.tsx
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

## /pro/pending
<a id="pro-pending"></a>

### Layouts

- app/layout.tsx

#### app/layout.tsx
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

### Page

#### app/pro/pending/page.tsx
```tsx
import { redirect } from "next/navigation";

export default function ProPendingRedirect() {
  redirect("/pro/en-attente");
}

```

## /pro/signup
<a id="pro-signup"></a>

### Layouts

- app/layout.tsx

#### app/layout.tsx
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

### Page

#### app/pro/signup/page.tsx
```tsx
import { redirect } from "next/navigation";

export default function ProSignupRedirect() {
  redirect("/pro/inscription");
}

```

## /settings
<a id="settings"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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

#### app/(dashboard)/layout.tsx
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

### Page

#### app/(dashboard)/settings/page.tsx
```tsx
import { redirect } from "next/navigation";

export default function SettingsRedirect() {
  redirect("/parametres");
}

```

## /ui-debug
<a id="ui-debug"></a>

### Layouts

- app/layout.tsx

#### app/layout.tsx
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

### Page

#### app/ui-debug/page.tsx
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

## /vehicules
<a id="vehicules"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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

#### app/(dashboard)/layout.tsx
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

### Page

#### app/(dashboard)/vehicules/page.tsx
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

## /vehicules/[id]
<a id="vehicules-[id]"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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

#### app/(dashboard)/layout.tsx
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

### Page

#### app/(dashboard)/vehicules/[id]/page.tsx
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

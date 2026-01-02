# UI_PAGES_DUMP — MotorSafe

Ce fichier est généré automatiquement.

**Contenu:** routes → layouts applicables → code de la page.
**Génération:** `node scripts/dump-pages-ui.js`

## Index

- [/](#root)
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

```

### Page

#### app/page.tsx
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
    <main className="min-h-screen w-full bg-bg text-text">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-8">
        <header className="flex flex-col gap-10">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-[14px] border border-border bg-surface2">
                <span className="text-sm font-semibold text-primary">MS</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">MotorSafe</div>
                <div className="text-xs text-muted2">SaaS pour garages & pros</div>
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
              <p className="ms-kicker">MotorSafe Pro</p>
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                Une interface premium pour piloter votre activité.
              </h1>
              <p className="max-w-2xl text-base text-muted md:text-lg">
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
              <p className="ms-kicker">En bref</p>
              <ul className="mt-3 grid gap-2 text-sm text-muted">
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
            <p className="mt-2 text-sm text-muted">
              Clients, véhicules, interventions, documents et conformité : tout est au même endroit.
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Lisible & cohérent</h2>
            <p className="mt-2 text-sm text-muted">
              Surfaces nettes, typographie claire, espace : une UI sobre, premium et productive.
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Sécurisé</h2>
            <p className="mt-2 text-sm text-muted">
              Accès, preuves et historique : la conformité sans complexité.
            </p>
          </Card>
        </section>

        <footer className="mt-14 border-t border-border pt-8 text-center text-xs text-muted2">
          © {new Date().getFullYear()} MotorSafe.
        </footer>
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
    if (keyReady) {
      loadPending();
    }
  }, [keyReady]);

  if (!keyReady && !isAdmin) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted2">
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
            className="text-sm font-semibold text-primary hover:text-primaryHover"
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
                  <p className="text-base font-semibold text-text">{garage.name}</p>
                  <p className="text-xs text-muted2">{garage.email}</p>
                </div>
                <Badge variant="warning">En attente</Badge>
              </div>
              <div className="grid gap-2 text-sm text-muted2">
                <p>Téléphone : {garage.phone || "-"}</p>
                <p>Adresse : {garage.address || "-"}</p>
                <p>SIRET : {garage.siret || "-"}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-muted2">
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

## /admin/garages
<a id="admin-garages"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
        <p className="text-sm text-muted2">
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
          <Link href="/admin">
            <Button variant="secondary" size="sm">Retour validations</Button>
          </Link>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <Card className="p-0 overflow-hidden">
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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

  if (!isAdmin) {
    return (
      <Card>
        <p className="text-sm text-muted2">Accès réservé à l'administration.</p>
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
          <div className="flex items-center justify-between border-b border-border p-4">
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
                    <p className="text-sm text-muted2">Aucune référence.</p>
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

        <Card className="grid gap-4">
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
            <p className="text-text">Types d'intervention associés</p>
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
      <Card className="w-full max-w-lg p-8">
        <div className="grid gap-3">
          <p className="ms-kicker">Connexion</p>
          <h1 className="text-3xl font-semibold tracking-tight text-text">Accès garage</h1>
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
          <Link href="/" className="font-semibold text-primary hover:text-primaryHover">
            Retour site
          </Link>
        </div>
      </Card>
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
          <div className="border-b border-border p-4">
            <Input
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
              <div className="p-4 text-sm text-muted2">Chargement…</div>
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
                          ? "bg-primaryWeak text-text border border-primary"
                          : "text-text hover:bg-surface2 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
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
          <div className="border-b border-border p-4 flex items-start justify-between gap-3">
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

          <div className="p-4">
            {detailLoading ? (
              <div className="text-sm text-muted2">Chargement du détail…</div>
            ) : !detail ? (
              <EmptyState
                title="Aucun client sélectionné"
                description="Choisissez un client dans la liste pour afficher sa fiche."
              />
            ) : (
              <div className="grid gap-4">
                <div className="rounded-[var(--r)] border border-border bg-surface2 p-4">
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

                <div className="rounded-[var(--r)] border border-border bg-surface p-4">
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
            <p className="mt-1 text-sm text-muted2">Client #{client.id}</p>
          </div>
          <Badge variant="accent">Client</Badge>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-muted2">
          <p>
            Nom: <span className="text-text">{client.firstName} {client.lastName}</span>
          </p>
          <p>
            Garage: <span className="text-text">{client.garage?.name ?? (client.garageId ? `#${client.garageId}` : "-")}</span>
          </p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
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
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <p className="ms-kicker">Derniers clients</p>
              <p className="mt-1 text-sm text-muted2">Ajouts récents</p>
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
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <p className="ms-kicker">Dernières interventions</p>
              <p className="mt-1 text-sm text-muted2">Trafic atelier</p>
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
        <div className="border-b border-border p-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par plaque, client, type"
            className="max-w-md"
          />
          <p className="mt-3 text-xs text-muted2">
            {loading ? "Chargement…" : `${filtered.length} document(s)`}
          </p>
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
                    <a
                      href={`/api/interventions/${doc.id}/pdf`}
                      className="text-sm font-semibold text-primary hover:text-primaryHover"
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
          <div className="border-t border-border p-4 flex justify-center">
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
          <div className="border-b border-border p-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par plaque, client, type"
            />
            <p className="mt-3 text-xs text-muted2">
              {loading ? "Chargement…" : `${filtered.length} intervention(s)`}
            </p>
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-muted2">Chargement…</div>
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
                          ? "bg-surface2 text-text border border-primary"
                          : "text-text hover:bg-surface2 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {item.vehicle.plate} <span className="text-muted2">· {item.type}</span>
                        </p>
                        <p className="truncate text-xs text-muted2">
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
          <div className="border-b border-border p-4 flex items-start justify-between gap-3">
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
              <div className="text-sm text-muted2">Chargement du détail…</div>
            ) : !detail ? (
              <EmptyState
                title="Aucune intervention sélectionnée"
                description="Choisissez une intervention dans la liste pour afficher son dossier."
              />
            ) : (
              <div className="grid gap-4">
                <div className="rounded-[var(--r)] border border-border bg-surface2 p-4">
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

                <div className="rounded-[var(--r)] border border-border bg-surface p-4">
                  <p className="text-sm font-semibold">Conformité</p>
                  <div className="mt-3">
                    <LegalReferencesPanel type={detail.type} />
                  </div>
                </div>

                <div className="rounded-[var(--r)] border border-border bg-surface p-4">
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
                  <span className="text-muted2 font-normal">· {intervention.type}</span>
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
              <div className="flex flex-col gap-2 items-end">
                <span className="text-xs text-muted2">Créée le {new Date(intervention.createdAt).toLocaleDateString("fr-FR")}</span>
                {intervention.performedAt && <span className="text-xs text-muted2">Réalisée le {new Date(intervention.performedAt).toLocaleDateString("fr-FR")}</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-xs text-muted2 mb-1">Kilométrage</p>
                <p className="text-text font-medium">{intervention.odometerKm ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted2 mb-1">ECU</p>
                <p className="text-text font-medium">{intervention.ecuType ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted2 mb-1">Version logicielle</p>
                <p className="text-text font-medium">{intervention.softwareVersion ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted2 mb-1">Checksum</p>
                <p className="text-text font-medium">{intervention.checksum ?? "-"}</p>
              </div>
            </div>
            {intervention.notes && (
              <div className="mt-4">
                <p className="text-xs text-muted2 mb-1">Notes</p>
                <p className="text-text whitespace-pre-line">{intervention.notes}</p>
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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

export default function LegalPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-16">
      <Card className="grid gap-4">
        <p className="ms-kicker">Légal</p>
        <h1 className="text-3xl font-semibold text-text">Informations légales</h1>
        <p className="text-sm text-muted2">
          Cette page sera complétée avec les mentions légales, la politique de confidentialité et les
          conditions d’utilisation.
        </p>
        <Link href="/" className="text-sm font-semibold text-primary hover:text-primaryHover">
          Retour au site
        </Link>
      </Card>
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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

export default function ProLandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-16">
      <Card className="grid gap-6 text-center p-8">
        <div className="flex flex-col gap-2">
          <p className="ms-kicker">Espace pro</p>
          <h1 className="text-3xl font-semibold tracking-tight text-text">Connexion garages</h1>
          <p className="text-sm text-muted2">
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

## /pro/en-attente
<a id="pro-en-attente"></a>

### Layouts

- app/layout.tsx

#### app/layout.tsx
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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

export default function ProPendingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
      <Card className="w-full max-w-xl text-center p-8">
        <Badge variant="warning">Validation en cours</Badge>
        <h1 className="mt-4 text-3xl font-semibold text-text">Compte en validation</h1>
        <p className="mt-3 text-sm text-muted2">
          Votre dossier est en cours d'analyse par MotorSafe. Nous revenons vers vous dès que la
          validation est terminée.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/auth/login" className="font-semibold text-primary hover:text-primaryHover">
            Revenir à la connexion
          </Link>
          <Link href="/" className="font-semibold text-primary hover:text-primaryHover">
            Retour site
          </Link>
        </div>
      </Card>
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-16">
      <Card className="w-full max-w-3xl p-8">
        <div className="grid gap-3">
          <p className="ms-kicker">Inscription</p>
          <h1 className="text-3xl font-semibold tracking-tight text-text">Demander un accès MotorSafe</h1>
          <p className="text-sm text-muted2">
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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

## /vehicules
<a id="vehicules"></a>

### Layouts

- app/layout.tsx
- app/(dashboard)/layout.tsx

#### app/layout.tsx
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
          <div className="border-b border-border p-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par plaque, marque, client"
            />
            <p className="mt-3 text-xs text-muted2">
              {loading ? "Chargement…" : `${filtered.length} véhicule(s)`}
            </p>
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-muted2">Chargement…</div>
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
                          ? "bg-surface2 text-text border border-primary"
                          : "text-text hover:bg-surface2 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{vehicle.plate}</p>
                        <p className="truncate text-xs text-muted2">
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
          <div className="border-b border-border p-4 flex items-start justify-between gap-3">
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

          <div className="p-4">
            {detailLoading ? (
              <div className="text-sm text-muted2">Chargement du détail…</div>
            ) : !detail ? (
              <EmptyState
                title="Aucun véhicule sélectionné"
                description="Choisissez un véhicule dans la liste pour afficher son dossier."
              />
            ) : (
              <div className="grid gap-4">
                <div className="rounded-[var(--r)] border border-border bg-surface2 p-4">
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

                <div className="rounded-[var(--r)] border border-border bg-surface p-4">
                  <p className="text-sm font-semibold">Interventions récentes</p>
                  <div className="mt-3 grid gap-2">
                    {!detail.interventions || detail.interventions.length === 0 ? (
                      <p className="text-sm text-muted2">Aucune intervention.</p>
                    ) : (
                      detail.interventions.slice(0, 5).map((i) => (
                        <Link
                          key={i.id}
                          href={`/interventions/${i.id}`}
                          className="flex items-center justify-between rounded-xl border border-border bg-surface2 px-3 py-2 text-sm hover:bg-surface"
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
      <body
        className={`${inter.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
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
            className="text-sm font-semibold text-primary hover:text-primaryHover"
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
              <div className="mt-6 grid gap-3 text-sm text-muted2">
                <p>VIN: {vehicle.vin || "-"}</p>
                <p>Carburant: {vehicle.fuel || "-"}</p>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="ms-kicker">Interventions</p>
                  <h2 className="mt-2 text-xl font-semibold text-text">Historique</h2>
                </div>
                <Badge variant="accent">{vehicle.interventions.length}</Badge>
              </div>
              <div className="mt-6 grid gap-3">
                {vehicle.interventions.length === 0 ? (
                  <p className="text-sm text-muted2">Aucune intervention.</p>
                ) : (
                  vehicle.interventions.map((intervention) => (
                    <div
                      key={intervention.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--r)] border border-border bg-surface2 px-4 py-3"
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

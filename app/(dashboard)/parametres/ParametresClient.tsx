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
    <div className="grid gap-6">
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
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="grid gap-4">
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

          <Card className="grid gap-3">
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
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="grid gap-4">
            <div>
              <p className="ms-kicker">Sécurité</p>
              <h3 className="mt-2 text-lg font-semibold text-text">Assurance & traçabilité</h3>
            </div>
            <ComplianceToggles />
            <Badge variant="success">Conformité active</Badge>
          </Card>

          <Card className="grid gap-3">
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

"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Building2,
  CheckCircle,
  Lock,
  Mail,
  MapPin,
  Phone,
  Settings,
  Shield,
  Users,
} from "lucide-react";
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

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: "garage", label: "Garage", icon: Building2 },
  { key: "users", label: "Utilisateurs", icon: Users },
  { key: "security", label: "Sécurité", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
];

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

  const roleLabel = role === "ADMIN" ? "Administrateur" : "Garage";

  const statusConfig = useMemo(() => {
    if (role === "ADMIN") return { label: "Administration", bg: "var(--ms-primary-light)", text: "var(--ms-primary)" };
    if (garage?.status === "ACTIVE") return { label: "Actif", bg: "var(--ms-success-light)", text: "var(--ms-success)" };
    if (garage?.status === "REJECTED") return { label: "Refusé", bg: "var(--ms-error-light)", text: "var(--ms-error)" };
    if (garage?.status === "PENDING") return { label: "En attente", bg: "var(--ms-warning-light)", text: "#B45309" };
    return { label: "—", bg: "var(--ms-bg-subtle)", text: "var(--ms-text-secondary)" };
  }, [garage?.status, role]);

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="ms-page-title">Paramètres</h1>
        <p className="ms-page-subtitle">
          Gérez les informations de votre garage et vos préférences
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="ms-tabs">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`ms-tab ${tab === key ? "ms-tab-active" : ""}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Garage Tab */}
      {tab === "garage" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Card */}
          <div className="ms-card">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--ms-primary)] to-[#8B5CF6]">
                  <Building2 size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-[var(--ms-text)]">
                      {role === "ADMIN" ? "Administration" : garage?.name ?? "Garage"}
                    </h2>
                    <span
                      className="ms-badge"
                      style={{ background: "var(--ms-primary-light)", color: "var(--ms-primary)" }}
                    >
                      {roleLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="ms-badge"
                      style={{ background: statusConfig.bg, color: statusConfig.text }}
                    >
                      <CheckCircle size={12} />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <InfoRow icon={Mail} label="Email" value={garage?.email ?? userEmail} />
                <InfoRow icon={Phone} label="Téléphone" value={garage?.phone || "Non renseigné"} />
                <InfoRow icon={MapPin} label="Adresse" value={garage?.address || "Non renseignée"} />
                <InfoRow icon={Settings} label="SIRET" value={garage?.siret || "Non renseigné"} mono />
              </div>

              <div className="mt-6 pt-6 border-t border-[var(--ms-border-light)]">
                <button type="button" className="ms-btn ms-btn-secondary">
                  Modifier les informations
                </button>
              </div>
            </div>
          </div>

          {/* Compliance Summary */}
          <div className="ms-card">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ms-success-light)]">
                  <Shield size={22} className="text-[var(--ms-success)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--ms-text)]">Conformité</h3>
                  <p className="text-sm text-[var(--ms-text-secondary)]">
                    État de vos paramètres de sécurité
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--ms-success-light)] mb-4">
                <div className="flex items-center gap-2 text-[var(--ms-success)]">
                  <CheckCircle size={18} />
                  <span className="font-medium">Conformité active</span>
                </div>
                <p className="text-sm text-[var(--ms-text-secondary)] mt-2">
                  Vos paramètres de sécurité sont correctement configurés pour la
                  traçabilité et la génération de preuves.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTab("security")}
                className="ms-btn ms-btn-ghost w-full"
              >
                <Lock size={18} />
                Voir les paramètres de sécurité
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <div className="ms-card">
          <div className="ms-empty py-12">
            <div className="ms-empty-icon">
              <Users size={28} />
            </div>
            <div className="ms-empty-title">Gestion des utilisateurs</div>
            <div className="ms-empty-text">
              Invitez des membres de votre équipe et gérez leurs accès.
              <br />
              Fonctionnalité disponible avec le plan Pro.
            </div>
            <button type="button" className="ms-btn ms-btn-primary mt-4">
              Passer à Pro
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {tab === "security" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="ms-card">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
                  <Shield size={22} className="text-[var(--ms-primary)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--ms-text)]">
                    Assurance & Traçabilité
                  </h3>
                  <p className="text-sm text-[var(--ms-text-secondary)]">
                    Paramètres de conformité
                  </p>
                </div>
              </div>

              <ComplianceToggles />

              <div className="mt-6 p-4 rounded-xl bg-[var(--ms-success-light)]">
                <div className="flex items-center gap-2 text-[var(--ms-success)]">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">Conformité active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ms-card">
            <div className="p-6">
              <h3 className="font-semibold text-[var(--ms-text)] mb-4">
                Bonnes pratiques
              </h3>
              <div className="space-y-3">
                {[
                  "Conservez les preuves et révisions pour chaque dossier.",
                  "Générez un PDF après validation du client.",
                  "Activez les alertes pour les dossiers critiques.",
                  "Effectuez des sauvegardes régulières.",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--ms-primary)] shrink-0" />
                    <span className="text-[var(--ms-text-secondary)]">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {tab === "notifications" && <NotificationsPanel />}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <Icon size={18} className="text-[var(--ms-text-muted)] shrink-0" />
      <div className="flex-1 flex items-center justify-between gap-4">
        <span className="text-sm text-[var(--ms-text-secondary)]">{label}</span>
        <span
          className={`text-sm text-[var(--ms-text)] ${mono ? "font-mono" : ""}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function NotificationsPanel() {
  const [mailOnCritical, setMailOnCritical] = useState(true);
  const [mailOnPdf, setMailOnPdf] = useState(false);
  const [digest, setDigest] = useState(false);

  return (
    <div className="ms-card max-w-lg">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
            <Bell size={22} className="text-[var(--ms-primary)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--ms-text)]">
              Préférences email
            </h3>
            <p className="text-sm text-[var(--ms-text-secondary)]">
              Gérez vos notifications
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <ToggleRow
            checked={mailOnCritical}
            onChange={setMailOnCritical}
            label="Alertes sur dossier critique"
            description="Recevez une notification pour les dossiers urgents"
          />
          <ToggleRow
            checked={mailOnPdf}
            onChange={setMailOnPdf}
            label="Confirmation génération PDF"
            description="Email de confirmation après chaque PDF généré"
          />
          <ToggleRow
            checked={digest}
            onChange={setDigest}
            label="Récapitulatif hebdomadaire"
            description="Résumé de l'activité chaque lundi"
          />
        </div>

        <p className="mt-6 text-xs text-[var(--ms-text-muted)]">
          Ces préférences sont enregistrées localement pour le moment.
        </p>
      </div>
    </div>
  );
}

function ToggleRow({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-[var(--ms-surface-hover)] transition-colors">
      <div>
        <div className="text-sm font-medium text-[var(--ms-text)]">{label}</div>
        {description && (
          <div className="text-xs text-[var(--ms-text-muted)] mt-0.5">
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`ms-toggle ${checked ? "ms-toggle-active" : ""}`}
      >
        <span className="ms-toggle-knob" />
      </button>
    </div>
  );
}

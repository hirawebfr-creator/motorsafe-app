"use client";

/**
 * EVIDENCE-CAPTURE-01: Evidence Capture Section Component
 * 
 * Shows status and quick access buttons for:
 * - Reception (INTAKE)
 * - Tech diagnostics (TECH)
 * - Restitution (DELIVERY)
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  FileCode,
  LogOut,
  Car,
  RefreshCw,
  ChevronRight,
  Shield,
  Lock,
} from "lucide-react";

type EvidenceSession = {
  id: string;
  step: "INTAKE" | "TECH" | "DELIVERY";
  status: "DRAFT" | "READY" | "SIGNED";
  intakeCompletedAt: string | null;
  techCompletedAt: string | null;
  deliveryCompletedAt: string | null;
  items: { id: string; type: string; category: string }[];
};

type Props = {
  interventionId: string;
  isClosed: boolean;
  hasActiveSubscription: boolean;
};

const STEPS = [
  {
    key: "INTAKE" as const,
    label: "Réception",
    description: "Photos, voyants, signature client",
    icon: Car,
    color: "var(--ms-primary)",
    bgColor: "var(--ms-primary-light)",
    href: (id: string) => `/interventions/${id}/reception`,
    completedField: "intakeCompletedAt" as const,
  },
  {
    key: "TECH" as const,
    label: "Diagnostics",
    description: "Rapports OBD avant/après",
    icon: Cpu,
    color: "var(--ms-accent)",
    bgColor: "var(--ms-accent-light)",
    href: (id: string) => `/interventions/${id}/tech`,
    completedField: "techCompletedAt" as const,
  },
  {
    key: "DELIVERY" as const,
    label: "Restitution",
    description: "Tests, réserves, signature PV",
    icon: LogOut,
    color: "var(--ms-success)",
    bgColor: "var(--ms-success-light)",
    href: (id: string) => `/interventions/${id}/restitution`,
    completedField: "deliveryCompletedAt" as const,
  },
];

export function EvidenceCaptureSection({ interventionId, isClosed, hasActiveSubscription }: Props) {
  const [sessions, setSessions] = useState<EvidenceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        STEPS.map(async (step) => {
          const res = await fetch(`/api/interventions/${interventionId}/evidence-session?step=${step.key}`);
          if (res.ok) {
            const data = await res.json();
            return data.data as EvidenceSession | null;
          }
          return null;
        })
      );
      setSessions(results.filter((s): s is EvidenceSession => s !== null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [interventionId]);

  useEffect(() => {
    if (interventionId) fetchSessions();
  }, [interventionId, fetchSessions]);

  const getSessionForStep = (stepKey: string) => sessions.find((s) => s.step === stepKey);

  const getStepStatus = (stepKey: string, session: EvidenceSession | undefined) => {
    if (!session) return "not_started";
    if (session.status === "SIGNED") return "signed";
    const step = STEPS.find((s) => s.key === stepKey);
    if (step && session[step.completedField]) return "completed";
    if (session.items.length > 0) return "in_progress";
    return "started";
  };

  const getItemCount = (session: EvidenceSession | undefined, type: string) => {
    if (!session) return 0;
    return session.items.filter((i) => i.type === type).length;
  };

  if (!hasActiveSubscription) {
    return (
      <Card className="p-0 overflow-hidden lg:col-span-2">
        <div className="ms-cardHeader flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-bg-subtle)]">
            <Shield size={20} className="text-muted2" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">8. Capture de preuves</h3>
            <p className="text-xs text-muted2">Réception, diagnostics, restitution</p>
          </div>
        </div>
        <div className="ms-cardBody">
          <div className="text-center py-6">
            <Lock size={32} className="mx-auto mb-3 text-muted2" />
            <p className="font-medium mb-1">Fonctionnalité Pro</p>
            <p className="text-sm text-muted2 mb-4">
              La capture de preuves avec signature électronique nécessite un abonnement.
            </p>
            <Link href="/billing">
              <Button size="sm" variant="secondary">Découvrir les plans</Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden lg:col-span-2">
      <div className="ms-cardHeader flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-success-light)]">
            <Shield size={20} className="text-[var(--ms-success)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">8. Capture de preuves</h3>
            <p className="text-xs text-muted2">Réception, diagnostics, restitution signés</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchSessions}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>
      <div className="ms-cardBody">
        {error && (
          <div className="text-sm text-[var(--ms-error)] mb-4">{error}</div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step) => {
            const session = getSessionForStep(step.key);
            const status = getStepStatus(step.key, session);
            const Icon = step.icon;

            const photoCount = getItemCount(session, "PHOTO");
            const formCount = getItemCount(session, "FORM");
            const obdCount = getItemCount(session, "OBD_REPORT");
            const signatureCount = getItemCount(session, "SIGNATURE");

            return (
              <div
                key={step.key}
                className={`rounded-xl border-2 p-4 transition-all ${
                  status === "signed"
                    ? "border-[var(--ms-success)] bg-[var(--ms-success-light)]"
                    : status === "completed"
                    ? "border-[var(--ms-primary)] bg-[var(--ms-primary-light)]"
                    : status === "in_progress"
                    ? "border-[var(--ms-warning)] bg-[var(--ms-warning-light)]"
                    : "border-[var(--ms-border)] bg-[var(--ms-bg-subtle)]"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: step.bgColor }}
                  >
                    <Icon size={20} style={{ color: step.color }} />
                  </div>
                  {status === "signed" ? (
                    <Badge variant="success">
                      <Lock size={10} className="mr-1" />
                      Signé
                    </Badge>
                  ) : status === "completed" ? (
                    <Badge variant="accent">
                      <Check size={10} className="mr-1" />
                      Prêt
                    </Badge>
                  ) : status === "in_progress" ? (
                    <Badge variant="warning">
                      <Clock size={10} className="mr-1" />
                      En cours
                    </Badge>
                  ) : (
                    <Badge variant="neutral">À faire</Badge>
                  )}
                </div>

                <h4 className="font-semibold mb-1">{step.label}</h4>
                <p className="text-xs text-muted2 mb-3">{step.description}</p>

                {/* Stats */}
                {session && (
                  <div className="flex flex-wrap gap-2 mb-3 text-xs">
                    {photoCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--ms-bg)]">
                        <Camera size={12} />
                        {photoCount}
                      </span>
                    )}
                    {obdCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--ms-bg)]">
                        <FileCode size={12} />
                        {obdCount}
                      </span>
                    )}
                    {formCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--ms-bg)]">
                        <CheckCircle2 size={12} />
                        Form
                      </span>
                    )}
                    {signatureCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--ms-success-light)] text-[var(--ms-success)]">
                        <Lock size={12} />
                        Signé
                      </span>
                    )}
                  </div>
                )}

                <Link href={step.href(interventionId)}>
                  <Button
                    variant={status === "signed" ? "ghost" : "secondary"}
                    size="sm"
                    className="w-full"
                    disabled={step.key === "DELIVERY" && !isClosed && status === "not_started"}
                  >
                    {status === "signed" ? (
                      "Consulter"
                    ) : status === "not_started" ? (
                      "Commencer"
                    ) : (
                      "Continuer"
                    )}
                    <ChevronRight size={14} className="ml-1" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Hash chain integrity indicator */}
        {sessions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--ms-border)]">
            <div className="flex items-center gap-2 text-sm">
              <Shield size={16} className="text-[var(--ms-success)]" />
              <span className="text-muted2">
                Chaîne de preuves SHA256 :
              </span>
              <span className="font-mono text-xs bg-[var(--ms-bg-subtle)] px-2 py-1 rounded">
                {sessions.reduce((acc, s) => acc + s.items.length, 0)} éléments scellés
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

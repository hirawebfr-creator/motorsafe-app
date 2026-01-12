"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  ChevronRight,
  Key,
  Shield,
  Users,
  X,
  Mail,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import { useUser } from "@/components/user-context";
import { fetcher, requestJson } from "@/lib/fetcher";
import { useToast } from "@/components/ui/Toast";

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

function fmtDate(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

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
  const [actionLoading, setActionLoading] = useState<number | null>(null);
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
    setActionLoading(id);
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
    } finally {
      setActionLoading(null);
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
    setActionLoading(rejectTarget.id);
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
      setActionLoading(null);
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

  // Admin key prompt
  if (!keyReady && !isAdmin) {
    return (
      <div className="ms-animate-slide-up">
        <div className="ms-page-header">
          <div>
            <h1 className="ms-page-title">Administration</h1>
            <p className="ms-page-subtitle">Accès réservé aux administrateurs</p>
          </div>
        </div>

        <div className="ms-card max-w-md">
          <div className="ms-card-body">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ms-primary-light)]">
                <Key size={28} className="text-[var(--ms-primary)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--ms-text)]">
                  Clé d'administration
                </h2>
                <p className="text-sm text-[var(--ms-text-secondary)]">
                  Entrez votre clé pour accéder au panneau admin
                </p>
              </div>
            </div>

            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="ADMIN_KEY"
              className="ms-input mb-4"
            />

            <button
              type="button"
              onClick={() => {
                if (!adminKey.trim()) return;
                window.localStorage.setItem("ms_admin_key", adminKey.trim());
                setKeyReady(true);
              }}
              className="ms-btn ms-btn-primary w-full"
            >
              <Shield size={18} />
              Déverrouiller
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title">Demandes en attente</h1>
          <p className="ms-page-subtitle">
            Approuvez ou refusez les demandes d'inscription des garages
          </p>
        </div>
        <Link href="/admin/garages" className="ms-btn ms-btn-secondary">
          <Building2 size={18} />
          Tous les garages
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="ms-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">En attente</div>
              <div className="ms-stat-value">{loading ? "—" : garages.length}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-warning-light)]">
              <Clock size={24} className="text-[#B45309]" />
            </div>
          </div>
        </div>
        <div className="ms-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Ce mois</div>
              <div className="ms-stat-value">—</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-success-light)]">
              <Check size={24} className="text-[var(--ms-success)]" />
            </div>
          </div>
        </div>
        <div className="ms-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Total garages</div>
              <div className="ms-stat-value">—</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
              <Building2 size={24} className="text-[var(--ms-primary)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="ms-alert ms-alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {/* Garage Cards */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="ms-skeleton h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : garages.length === 0 ? (
        <div className="ms-card">
          <div className="ms-empty">
            <div className="ms-empty-icon">
              <Check size={28} />
            </div>
            <div className="ms-empty-title">Tout est à jour</div>
            <div className="ms-empty-text">
              Aucune demande en attente de validation.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {garages.map((garage, idx) => {
            const isProcessing = actionLoading === garage.id;

            return (
              <div
                key={garage.id}
                className="ms-card ms-animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ms-primary)] to-[#8B5CF6]">
                        <Building2 size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--ms-text)]">
                          {garage.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="ms-badge ms-badge-warning">
                            <Clock size={12} />
                            En attente
                          </span>
                          <span className="text-sm text-[var(--ms-text-muted)]">
                            Demande du {fmtDate(garage.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail size={16} className="text-[var(--ms-text-muted)]" />
                      <span className="text-[var(--ms-text-secondary)]">
                        {garage.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={16} className="text-[var(--ms-text-muted)]" />
                      <span className="text-[var(--ms-text-secondary)]">
                        {garage.phone || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin size={16} className="text-[var(--ms-text-muted)]" />
                      <span className="text-[var(--ms-text-secondary)] truncate">
                        {garage.address || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[var(--ms-border-light)]">
                    <div className="flex items-center gap-2 text-sm text-[var(--ms-text-muted)]">
                      <Users size={16} />
                      <span>Responsable : {garage.users[0]?.email ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openReject(garage)}
                        disabled={isProcessing}
                        className="ms-btn ms-btn-ghost text-[var(--ms-error)] hover:bg-[var(--ms-error-light)]"
                      >
                        <X size={18} />
                        Refuser
                      </button>
                      <button
                        type="button"
                        onClick={() => approve(garage.id)}
                        disabled={isProcessing}
                        className="ms-btn text-white"
                        style={{ background: "var(--ms-success)" }}
                      >
                        <Check size={18} />
                        Approuver
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectOpen && (
        <div
          className="ms-modal-overlay"
          onClick={() => setRejectOpen(false)}
        >
          <div className="ms-modal ms-animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="ms-modal-header">
              <h2 className="ms-modal-title">Refuser la demande</h2>
              <p className="text-sm text-[var(--ms-text-secondary)] mt-1">
                Motif pour {rejectTarget?.name}
              </p>
            </div>
            <div className="ms-modal-body">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Expliquez la raison du refus..."
                className="ms-input h-24 py-3 resize-none"
              />
            </div>
            <div className="ms-modal-footer">
              <button
                type="button"
                onClick={() => setRejectOpen(false)}
                className="ms-btn ms-btn-ghost"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={reject}
                disabled={actionLoading !== null}
                className="ms-btn ms-btn-danger"
              >
                <X size={18} />
                Refuser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

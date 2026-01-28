"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@/components/user-context";
import { fetcher, requestJson } from "@/lib/fetcher";
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
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Responsive hook
function useResponsive() {
  const [screen, setScreen] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640) setScreen("mobile");
      else if (w < 1024) setScreen("tablet");
      else setScreen("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return { isMobile: screen === "mobile", isTablet: screen === "tablet", screen };
}

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
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export default function AdminPendingPage() {
  const user = useUser();
  const { isMobile } = useResponsive();

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
      toast.success("Garage approuvé");
      await loadPending();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.error(message);
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
      toast.info("Garage refusé");
      await loadPending();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.error(message);
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
      <div style={{ padding: isMobile ? "16px" : "32px", maxWidth: "500px", margin: "0 auto" }}>
        <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #E5E7EB", padding: isMobile ? "24px" : "32px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Key size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Administration</h1>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 24px" }}>Entrez votre clé pour accéder au panneau admin</p>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="ADMIN_KEY"
            style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "14px", marginBottom: "16px", boxSizing: "border-box" }}
          />
          <button
            type="button"
            onClick={() => {
              if (!adminKey.trim()) return;
              window.localStorage.setItem("ms_admin_key", adminKey.trim());
              setKeyReady(true);
            }}
            style={{ width: "100%", padding: "14px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Shield size={18} />
            Déverrouiller
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? "16px" : "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "32px", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "#111827", margin: 0 }}>Demandes en attente</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "4px" }}>Approuvez ou refusez les demandes d'inscription des garages</p>
        </div>
        <Link href="/admin/garages" style={{ textDecoration: "none" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#374151", cursor: "pointer" }}>
            <Building2 size={18} />
            Tous les garages
            <ChevronRight size={16} />
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
        <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>En attente</p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "#111827", margin: 0 }}>{loading ? "—" : garages.length}</p>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={24} color="#D97706" />
            </div>
          </div>
        </div>
        <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>Ce mois</p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "#059669", margin: 0 }}>—</p>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={24} color="#059669" />
            </div>
          </div>
        </div>
        <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>Total garages</p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "#6366F1", margin: 0 }}>—</p>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={24} color="#6366F1" />
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "16px", borderRadius: "12px", background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: "24px", color: "#DC2626", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* Garage Cards */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
          <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : garages.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", padding: "64px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Check size={32} color="#9CA3AF" />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Tout est à jour</h3>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Aucune demande en attente de validation</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {garages.map((garage, idx) => {
            const isProcessing = actionLoading === garage.id;
            return (
              <div
                key={garage.id}
                style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", overflow: "hidden", animation: `slideUp 0.3s ease ${idx * 50}ms backwards` }}
              >
                <div style={{ padding: isMobile ? "16px" : "24px" }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: "16px", marginBottom: "20px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Building2 size={24} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>{garage.name}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: "#FEF3C7", color: "#D97706" }}>
                          <Clock size={12} /> En attente
                        </span>
                        <span style={{ fontSize: "13px", color: "#9CA3AF" }}>Demande du {fmtDate(garage.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                      <Mail size={16} color="#9CA3AF" />
                      <span style={{ color: "#374151" }}>{garage.email}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                      <Phone size={16} color="#9CA3AF" />
                      <span style={{ color: "#374151" }}>{garage.phone || "—"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                      <MapPin size={16} color="#9CA3AF" />
                      <span style={{ color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{garage.address || "—"}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", paddingTop: "16px", borderTop: "1px solid #F3F4F6", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6B7280" }}>
                      <Users size={16} />
                      <span>Responsable : {garage.users[0]?.email ?? "—"}</span>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        type="button"
                        onClick={() => openReject(garage)}
                        disabled={isProcessing}
                        style={{ flex: isMobile ? 1 : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #FECACA", background: "#FEF2F2", fontSize: "14px", fontWeight: 600, color: "#DC2626", cursor: isProcessing ? "wait" : "pointer", opacity: isProcessing ? 0.6 : 1 }}
                      >
                        <X size={16} /> Refuser
                      </button>
                      <button
                        type="button"
                        onClick={() => approve(garage.id)}
                        disabled={isProcessing}
                        style={{ flex: isMobile ? 1 : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px 20px", borderRadius: "10px", border: "none", background: "#10B981", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: isProcessing ? "wait" : "pointer", opacity: isProcessing ? 0.6 : 1 }}
                      >
                        <Check size={16} /> Approuver
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
          style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}
          onClick={() => setRejectOpen(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "450px", overflow: "hidden", animation: "scaleIn 0.2s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "24px", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <XCircle size={20} color="#DC2626" />
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Refuser la demande</h2>
              </div>
              <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Motif pour {rejectTarget?.name}</p>
            </div>
            <div style={{ padding: "24px" }}>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Expliquez la raison du refus..."
                style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "14px", minHeight: "100px", resize: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ padding: "16px 24px", background: "#F9FAFB", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setRejectOpen(false)}
                style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#374151", cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={reject}
                disabled={actionLoading !== null}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "10px", border: "none", background: "#DC2626", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: actionLoading !== null ? "wait" : "pointer", opacity: actionLoading !== null ? 0.6 : 1 }}
              >
                <X size={16} /> Refuser
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      ` }} />
    </div>
  );
}

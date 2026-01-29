"use client";

/**
 * MULTI-USER-ROLES-01: Team Management Page
 * SafeMotor Design System - Inline Styles (Responsive)
 */

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/user-context";
import {
  Users,
  UserPlus,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Crown,
  Briefcase,
  Wrench,
  Phone,
  Eye,
  Mail,
  Loader2,
  AlertTriangle,
} from "lucide-react";

// ============================================================================
// ÉQUIPE PAGE - SafeMotor Design System (Responsive)
// ============================================================================

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

  return {
    isMobile: screen === "mobile",
    isTablet: screen === "tablet",
    isDesktop: screen === "desktop",
    screen,
  };
}

type MemberStatus = "INVITED" | "ACTIVE" | "DISABLED";
type GarageRole = "OWNER" | "MANAGER" | "STAFF" | "RECEPTION" | "READONLY";

interface TeamMember {
  id: string;
  userId: string | null;
  email: string;
  role: GarageRole;
  status: MemberStatus;
  invitedAt: string;
  acceptedAt: string | null;
  disabledAt: string | null;
}

interface TeamQuota {
  current: number;
  max: number;
  canInvite: boolean;
}

const ROLE_CONFIG: Record<GarageRole, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  OWNER: { label: "Propriétaire", icon: <Crown size={14} />, color: "#F59E0B", bg: "#FFFBEB" },
  MANAGER: { label: "Chef d'atelier", icon: <Briefcase size={14} />, color: "#6366F1", bg: "#EEF2FF" },
  STAFF: { label: "Mécanicien", icon: <Wrench size={14} />, color: "#10B981", bg: "#ECFDF5" },
  RECEPTION: { label: "Réception", icon: <Phone size={14} />, color: "#F97316", bg: "#FFF7ED" },
  READONLY: { label: "Consultation", icon: <Eye size={14} />, color: "#6B7280", bg: "#F3F4F6" },
};

const STATUS_CONFIG: Record<MemberStatus, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "Actif", color: "#10B981", bg: "#ECFDF5" },
  INVITED: { label: "Invité", color: "#F59E0B", bg: "#FFFBEB" },
  DISABLED: { label: "Désactivé", color: "#6B7280", bg: "#F3F4F6" },
};

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TeamPage() {
  const user = useUser();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [quota, setQuota] = useState<TeamQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<GarageRole>("STAFF");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Role change state
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/team");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Erreur de chargement");
      }
      const data = await res.json();
      setMembers(data.data?.members || []);
      setQuota(data.data?.quota || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          message: inviteMessage.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error?.message || "Erreur lors de l'invitation");
      }

      setInviteEmail("");
      setInviteRole("STAFF");
      setInviteMessage("");
      setShowInviteModal(false);
      await fetchTeam();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: GarageRole) => {
    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error?.message || "Erreur");
      }
      toast.success("Rôle modifié avec succès");
      await fetchTeam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du changement de rôle");
    } finally {
      setActionLoading(null);
      setEditingMemberId(null);
    }
  };

  const handleDisable = async (memberId: string) => {
    if (!confirm("Désactiver ce membre ? Il ne pourra plus accéder au garage.")) return;

    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Désactivé par admin" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error?.message || "Erreur");
      }
      toast.success("Membre désactivé");
      await fetchTeam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la désactivation");
    } finally {
      setActionLoading(null);
    }
  };

  // Check if current user can manage team
  const currentMember = members.find((m) => m.userId === user?.id);
  const canManage = user?.role === "ADMIN" || currentMember?.role === "OWNER" || currentMember?.role === "MANAGER";
  
  // Responsive
  const { isMobile, isTablet } = useResponsive();
  const padding = isMobile ? "16px" : isTablet ? "24px" : "32px";

  // Loading state
  if (loading) {
    return (
      <div style={{ padding, maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
          <Loader2 size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        </div>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding, maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          gap: "12px",
          padding: "16px 20px",
          borderRadius: "12px",
          background: "#FEF2F2",
          border: "1px solid #FECACA",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
            <AlertTriangle size={20} color="#EF4444" />
            <span style={{ fontSize: "14px", color: "#DC2626" }}>{error}</span>
          </div>
          <button
            onClick={fetchTeam}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#EF4444",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding, maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "stretch" : "flex-start",
        marginBottom: isMobile ? "24px" : "32px",
        gap: "16px",
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? "22px" : "28px",
            fontWeight: 700,
            color: "#111827",
            margin: 0,
            marginBottom: "4px",
          }}>
            Équipe
          </h1>
          <p style={{
            fontSize: isMobile ? "13px" : "15px",
            color: "#6B7280",
            margin: 0,
          }}>
            Gérez les membres de votre garage
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {quota && (
            <span style={{
              fontSize: "14px",
              color: "#6B7280",
            }}>
              <strong>{quota.current}</strong> / {quota.max === Infinity ? "∞" : quota.max} membres
            </span>
          )}
          <button
            onClick={fetchTeam}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={18} color="#6B7280" />
          </button>
          {canManage && quota?.canInvite && (
            <button
              onClick={() => setShowInviteModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
              }}
            >
              <UserPlus size={18} />
              Inviter
            </button>
          )}
        </div>
      </div>

      {/* Quota warning */}
      {quota && !quota.canInvite && canManage && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 20px",
          borderRadius: "12px",
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          marginBottom: "24px",
        }}>
          <Shield size={20} color="#F59E0B" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#92400E", margin: 0 }}>
              Limite d'utilisateurs atteinte
            </p>
            <p style={{ fontSize: "13px", color: "#A16207", margin: "4px 0 0" }}>
              Passez au plan supérieur pour inviter plus de membres.
            </p>
          </div>
          <button
            onClick={() => window.location.href = "/billing"}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              background: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            Voir les plans
          </button>
        </div>
      )}

      {/* Empty state */}
      {members.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "64px 24px",
          borderRadius: "20px",
          background: "#fff",
          border: "1px solid #E5E7EB",
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            margin: "0 auto",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Users size={40} color="#6366F1" />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: "24px 0 8px" }}>
            Aucun membre
          </h3>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>
            Invitez votre équipe pour collaborer sur vos dossiers.
          </p>
          {canManage && quota?.canInvite && (
            <button
              onClick={() => setShowInviteModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "12px",
                marginTop: "24px",
                border: "none",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                fontSize: "14px",
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
              }}
            >
              <UserPlus size={18} />
              Inviter un membre
            </button>
          )}
        </div>
      ) : (
        /* Members Table */
        <div style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          marginBottom: "24px",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Membre</th>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Rôle</th>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Statut</th>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Depuis</th>
                  {canManage && <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: "#374151" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {members.map((member, index) => {
                  const roleConfig = ROLE_CONFIG[member.role];
                  const statusConfig = STATUS_CONFIG[member.status];
                  const isCurrentUser = member.userId === user?.id;
                  const isOwner = member.role === "OWNER";
                  const canEdit = canManage && !isOwner && !isCurrentUser && member.status !== "DISABLED";

                  return (
                    <tr
                      key={member.id}
                      style={{
                        borderBottom: index < members.length - 1 ? "1px solid #E5E7EB" : "none",
                        opacity: member.status === "DISABLED" ? 0.5 : 1,
                      }}
                    >
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "#EEF2FF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#6366F1",
                          }}>
                            {member.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 500, color: "#111827" }}>
                              {member.email}
                              {isCurrentUser && (
                                <span style={{ fontSize: "12px", color: "#9CA3AF", marginLeft: "8px" }}>(vous)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        {editingMemberId === member.id ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as GarageRole)}
                            disabled={actionLoading === member.id}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              border: "1px solid #E5E7EB",
                              fontSize: "13px",
                              background: "#fff",
                            }}
                          >
                            <option value="MANAGER">Chef d'atelier</option>
                            <option value="STAFF">Mécanicien</option>
                            <option value="RECEPTION">Réception</option>
                            <option value="READONLY">Consultation</option>
                          </select>
                        ) : (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            background: roleConfig.bg,
                            color: roleConfig.color,
                          }}>
                            {roleConfig.icon}
                            {roleConfig.label}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: statusConfig.bg,
                          color: statusConfig.color,
                        }}>
                          {member.status === "ACTIVE" && <CheckCircle2 size={12} />}
                          {member.status === "INVITED" && <Clock size={12} />}
                          {member.status === "DISABLED" && <XCircle size={12} />}
                          {statusConfig.label}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", color: "#6B7280" }}>
                        {member.status === "ACTIVE" ? formatDate(member.acceptedAt) : formatDate(member.invitedAt)}
                      </td>
                      {canManage && (
                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                          {canEdit && (
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                              {editingMemberId === member.id ? (
                                <button
                                  onClick={() => setEditingMemberId(null)}
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #E5E7EB",
                                    background: "#fff",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "#374151",
                                    cursor: "pointer",
                                  }}
                                >
                                  Annuler
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingMemberId(member.id)}
                                    disabled={actionLoading === member.id}
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      border: "1px solid #E5E7EB",
                                      background: "#fff",
                                      fontSize: "13px",
                                      fontWeight: 500,
                                      color: "#374151",
                                      cursor: "pointer",
                                      opacity: actionLoading === member.id ? 0.5 : 1,
                                    }}
                                  >
                                    Modifier rôle
                                  </button>
                                  <button
                                    onClick={() => handleDisable(member.id)}
                                    disabled={actionLoading === member.id}
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      border: "1px solid #FECACA",
                                      background: "#FEF2F2",
                                      fontSize: "13px",
                                      fontWeight: 500,
                                      color: "#EF4444",
                                      cursor: "pointer",
                                      opacity: actionLoading === member.id ? 0.5 : 1,
                                    }}
                                  >
                                    Désactiver
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permissions Reference */}
      <div style={{
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        padding: "24px",
      }}>
        <h3 style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "#111827",
          margin: "0 0 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <Shield size={18} color="#6366F1" />
          Permissions par rôle
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ textAlign: "left", padding: "8px 12px 8px 0" }}>Permission</th>
                <th style={{ textAlign: "center", padding: "8px 8px" }}><Crown size={14} color="#F59E0B" /></th>
                <th style={{ textAlign: "center", padding: "8px 8px" }}><Briefcase size={14} color="#6366F1" /></th>
                <th style={{ textAlign: "center", padding: "8px 8px" }}><Wrench size={14} color="#10B981" /></th>
                <th style={{ textAlign: "center", padding: "8px 8px" }}><Phone size={14} color="#F97316" /></th>
                <th style={{ textAlign: "center", padding: "8px 8px" }}><Eye size={14} color="#6B7280" /></th>
              </tr>
              <tr style={{ fontSize: "11px", color: "#9CA3AF" }}>
                <th></th>
                <th style={{ padding: "4px 8px" }}>Proprio</th>
                <th style={{ padding: "4px 8px" }}>Manager</th>
                <th style={{ padding: "4px 8px" }}>Mécano</th>
                <th style={{ padding: "4px 8px" }}>Réception</th>
                <th style={{ padding: "4px 8px" }}>Lecture</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Clients", perms: [true, true, true, true, true] },
                { name: "Véhicules", perms: [true, true, true, true, true] },
                { name: "Interventions", perms: [true, true, true, false, false] },
                { name: "Documents", perms: [true, true, true, false, false] },
                { name: "Devis/Factures", perms: [true, true, false, true, false] },
                { name: "Planning", perms: [true, true, true, true, true] },
                { name: "Billing/Paiements", perms: [true, true, false, false, false] },
                { name: "Paramètres", perms: [true, false, false, false, false] },
                { name: "Équipe", perms: [true, true, false, false, false] },
                { name: "Export ZIP", perms: [true, true, false, false, false] },
              ].map((row, i) => (
                <tr key={row.name} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                  <td style={{ padding: "8px 12px 8px 0", color: "#374151" }}>{row.name}</td>
                  {row.perms.map((p, j) => (
                    <td key={j} style={{ textAlign: "center", padding: "8px" }}>
                      {p ? (
                        <CheckCircle2 size={14} color="#10B981" />
                      ) : (
                        <XCircle size={14} color="#D1D5DB" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.5)",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            width: "100%",
            maxWidth: "450px",
            padding: "24px",
            margin: "16px",
          }}>
            <h2 style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <UserPlus size={20} color="#6366F1" />
              Inviter un membre
            </h2>

            <form onSubmit={handleInvite}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="membre@exemple.com"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                  Rôle *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as GarageRole)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    fontSize: "14px",
                    background: "#fff",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="MANAGER">Chef d'atelier</option>
                  <option value="STAFF">Mécanicien</option>
                  <option value="RECEPTION">Réception</option>
                  <option value="READONLY">Consultation seule</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                  Message (optionnel)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Message personnel pour l'invitation..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    fontSize: "14px",
                    minHeight: "80px",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {inviteError && (
                <div style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#FEF2F2",
                  color: "#EF4444",
                  fontSize: "14px",
                  marginBottom: "16px",
                }}>
                  {inviteError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  disabled={inviting}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    background: "#fff",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#fff",
                    cursor: inviting || !inviteEmail ? "not-allowed" : "pointer",
                    opacity: inviting || !inviteEmail ? 0.5 : 1,
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                  }}
                >
                  {inviting ? (
                    <>
                      <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Mail size={14} />
                      Envoyer l'invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}

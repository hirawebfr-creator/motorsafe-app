"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Copy,
  ExternalLink,
  Euro,
  TrendingUp,
  CheckCircle,
  RefreshCw,
  X,
  Shield,
} from "lucide-react";
import { useUser } from "@/components/user-context";

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

interface PartnerStats {
  signups: number;
  paid: number;
  commissionTotal: number;
  commissionPaid: number;
  commissionDue: number;
}

interface Partner {
  id: string;
  name: string;
  email: string;
  type: string;
  refCode: string;
  stripeCouponId: string | null;
  commissionPercent: number;
  commissionMode: string;
  minPayoutCents: number;
  isActive: boolean;
  createdAt: string;
  stats: PartnerStats;
}

const PARTNER_TYPES = [
  { value: "GARAGE", label: "Garage partenaire" },
  { value: "INFLUENCER", label: "Influenceur" },
  { value: "AGENCY", label: "Agence" },
  { value: "OTHER", label: "Autre" },
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function AdminPartnersPage() {
  const user = useUser();
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const isAdmin = user?.role === "ADMIN";

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formType, setFormType] = useState("OTHER");
  const [formCommission, setFormCommission] = useState(20);
  const [formCouponId, setFormCouponId] = useState("");

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/partners");
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setPartners(data.partners);
    } catch {
      toast.error("Erreur de chargement des partenaires");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void fetchPartners();
    }
  }, [isAdmin]);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;
    try {
      setCreating(true);
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, type: formType, commissionPercent: formCommission, stripeCouponId: formCouponId || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erreur création");
        return;
      }
      setFormName("");
      setFormEmail("");
      setFormType("OTHER");
      setFormCommission(20);
      setFormCouponId("");
      setCreateOpen(false);
      toast.success("Partenaire créé avec succès");
      void fetchPartners();
    } catch {
      toast.error("Erreur création partenaire");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (partner: Partner) => {
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !partner.isActive }),
      });
      if (!res.ok) throw new Error("Erreur mise à jour");
      toast.success("Statut mis à jour");
      void fetchPartners();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const copyRefLink = (refCode: string) => {
    const link = `${window.location.origin}/pro/inscription?ref=${refCode}`;
    navigator.clipboard.writeText(link);
    setCopied(refCode);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalSignups = partners.reduce((sum, p) => sum + p.stats.signups, 0);
  const totalPaid = partners.reduce((sum, p) => sum + p.stats.paid, 0);
  const totalCommissionDue = partners.reduce((sum, p) => sum + p.stats.commissionDue, 0);
  const activePartners = partners.filter((p) => p.isActive).length;

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: "14px", color: "#111827", background: "#fff", outline: "none" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" };

  if (!isAdmin) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px", textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
          <Shield size={32} color="#DC2626" />
        </div>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Accès refusé</h2>
        <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Accès réservé aux administrateurs</p>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "32px", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={24} color="#059669" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>Partenaires</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Gestion du programme d&apos;affiliation</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => void fetchPartners()} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>
            <RefreshCw size={18} color="#6B7280" style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          </button>
          <button onClick={() => setCreateOpen(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            <Plus size={16} /> Nouveau partenaire
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Partenaires actifs", value: activePartners, sub: `sur ${partners.length} total`, icon: Users, color: "#6366F1", bg: "#EEF2FF" },
          { label: "Inscriptions", value: totalSignups, sub: "via liens affiliés", icon: TrendingUp, color: "#2563EB", bg: "#DBEAFE" },
          { label: "Conversions", value: totalPaid, sub: "abonnements payants", icon: CheckCircle, color: "#059669", bg: "#D1FAE5" },
          { label: "Commissions dues", value: formatCurrency(totalCommissionDue), sub: "à verser", icon: Euro, color: "#EA580C", bg: "#FFEDD5" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 4px" }}>{item.label}</p>
                  <p style={{ fontSize: "24px", fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
                  <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "4px 0 0" }}>{item.sub}</p>
                </div>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={22} color={item.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Partners */}
      <div style={{ borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>Liste des partenaires</h2>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
            <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : partners.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              <Users size={32} color="#9CA3AF" />
            </div>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Aucun partenaire</p>
            <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 16px" }}>Créez le premier partenaire affilié</p>
            <button onClick={() => setCreateOpen(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
              <Plus size={16} /> Créer un partenaire
            </button>
          </div>
        ) : isMobile ? (
          <div>
            {partners.map((partner, idx) => (
              <div key={partner.id} style={{ padding: "16px", borderBottom: idx < partners.length - 1 ? "1px solid #F3F4F6" : "none", opacity: partner.isActive ? 1 : 0.6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>{partner.name}</span>
                  <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 500, background: "#EEF2FF", color: "#6366F1" }}>
                    {PARTNER_TYPES.find((t) => t.value === partner.type)?.label || partner.type}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 8px" }}>{partner.email}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <code style={{ fontSize: "12px", padding: "4px 8px", background: "#F3F4F6", borderRadius: "6px", fontFamily: "monospace" }}>{partner.refCode}</code>
                  <button onClick={(e) => { e.stopPropagation(); copyRefLink(partner.refCode); }} style={{ padding: "4px", border: "none", background: "transparent", cursor: "pointer" }}>
                    {copied === partner.refCode ? <CheckCircle size={14} color="#059669" /> : <Copy size={14} color="#6B7280" />}
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>{partner.stats.signups} inscrits</span>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>{partner.stats.paid} payants</span>
                  </div>
                  <button onClick={() => router.push(`/admin/partners/${partner.id}`)} style={{ padding: "6px", border: "none", background: "transparent", cursor: "pointer" }}>
                    <ExternalLink size={16} color="#6366F1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Partenaire</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Type</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Code affilié</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Commission</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Inscrits</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Payants</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Due</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Actif</th>
                  <th style={{ padding: "12px 16px", width: "60px" }}></th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner, idx) => (
                  <tr key={partner.id} style={{ borderBottom: idx < partners.length - 1 ? "1px solid #F3F4F6" : "none", opacity: partner.isActive ? 1 : 0.6, transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{partner.name}</div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{partner.email}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: "#EEF2FF", color: "#6366F1" }}>
                        {PARTNER_TYPES.find((t) => t.value === partner.type)?.label || partner.type}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <code style={{ fontSize: "12px", padding: "4px 8px", background: "#F3F4F6", borderRadius: "6px", fontFamily: "monospace" }}>{partner.refCode}</code>
                        <button onClick={(e) => { e.stopPropagation(); copyRefLink(partner.refCode); }} style={{ padding: "4px", border: "none", background: "transparent", cursor: "pointer" }}>
                          {copied === partner.refCode ? <CheckCircle size={14} color="#059669" /> : <Copy size={14} color="#6B7280" />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "14px", color: "#374151" }}>{partner.commissionPercent}%</td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "14px", color: "#374151" }}>{partner.stats.signups}</td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "14px", color: "#374151" }}>{partner.stats.paid}</td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "14px", fontWeight: 600, color: "#111827" }}>{formatCurrency(partner.stats.commissionDue)}</td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <button onClick={(e) => { e.stopPropagation(); void handleToggleActive(partner); }} style={{ position: "relative", display: "inline-flex", width: "44px", height: "24px", alignItems: "center", borderRadius: "12px", border: "none", background: partner.isActive ? "#6366F1" : "#D1D5DB", cursor: "pointer", transition: "background 0.2s" }}>
                        <span style={{ position: "absolute", left: partner.isActive ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                      </button>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => router.push(`/admin/partners/${partner.id}`)} style={{ padding: "6px", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer" }}>
                        <ExternalLink size={16} color="#6366F1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {createOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "16px" }} onClick={() => setCreateOpen(false)}>
          <div style={{ width: "100%", maxWidth: "500px", borderRadius: "16px", background: "#fff", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Créer un partenaire</h2>
              <button onClick={() => setCreateOpen(false)} style={{ padding: "6px", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer" }}><X size={20} color="#6B7280" /></button>
            </div>
            <form onSubmit={handleCreatePartner}>
              <div style={{ padding: "24px" }}>
                <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 20px" }}>Un code affilié unique sera généré automatiquement.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Nom *</label>
                    <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Garage Martin" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="contact@example.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select value={formType} onChange={(e) => setFormType(e.target.value)} style={inputStyle}>
                      {PARTNER_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Commission (%)</label>
                    <input type="number" min={0} max={100} value={formCommission} onChange={(e) => setFormCommission(Number(e.target.value))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Coupon Stripe (optionnel)</label>
                    <input type="text" value={formCouponId} onChange={(e) => setFormCouponId(e.target.value)} placeholder="PROMO20" style={inputStyle} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "16px 24px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB" }}>
                <button type="button" onClick={() => setCreateOpen(false)} style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>Annuler</button>
                <button type="submit" disabled={creating} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", opacity: creating ? 0.5 : 1 }}>
                  {creating ? <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={16} />} Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}

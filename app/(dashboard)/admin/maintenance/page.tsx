"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wrench,
  RefreshCw,
  Plus,
  Calendar,
  Clock,
  Pencil,
  Power,
  Check,
  X,
  AlertTriangle,
  Info,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/components/user-context";
import { fetcher, requestJson } from "@/lib/fetcher";

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

type MaintenanceSeverity = "INFO" | "WARNING";

interface MaintenanceWindow {
  id: string;
  title: string;
  message: string;
  startsAt: string;
  endsAt: string;
  severity: MaintenanceSeverity;
  isActive: boolean;
  createdAt: string;
  createdBy: { id: string; email: string } | null;
}

export default function AdminMaintenancePage() {
  const user = useUser();
  const { isMobile, isTablet } = useResponsive();
  const isAdmin = user?.role === "ADMIN";

  const [maintenances, setMaintenances] = useState<MaintenanceWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formStartsAt, setFormStartsAt] = useState("");
  const [formEndsAt, setFormEndsAt] = useState("");
  const [formSeverity, setFormSeverity] = useState<MaintenanceSeverity>("INFO");
  const [formActive, setFormActive] = useState(true);

  const loadMaintenances = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetcher<{ maintenances: MaintenanceWindow[] }>("/api/admin/maintenance");
      setMaintenances(res.maintenances);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void loadMaintenances();
    }
  }, [isAdmin, loadMaintenances]);

  const resetForm = () => {
    setFormTitle("");
    setFormMessage("");
    setFormStartsAt("");
    setFormEndsAt("");
    setFormSeverity("INFO");
    setFormActive(true);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (m: MaintenanceWindow) => {
    setFormTitle(m.title);
    setFormMessage(m.message);
    setFormStartsAt(new Date(m.startsAt).toISOString().slice(0, 16));
    setFormEndsAt(new Date(m.endsAt).toISOString().slice(0, 16));
    setFormSeverity(m.severity);
    setFormActive(m.isActive);
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMessage.trim() || !formStartsAt || !formEndsAt) return;

    try {
      setSaving(true);
      if (editingId) {
        await requestJson(`/api/admin/maintenance/${editingId}`, {
          method: "PATCH",
          body: { title: formTitle, message: formMessage, startsAt: new Date(formStartsAt).toISOString(), endsAt: new Date(formEndsAt).toISOString(), severity: formSeverity, isActive: formActive },
        });
        toast.success("Maintenance mise à jour");
      } else {
        await requestJson("/api/admin/maintenance", {
          method: "POST",
          body: { title: formTitle, message: formMessage, startsAt: new Date(formStartsAt).toISOString(), endsAt: new Date(formEndsAt).toISOString(), severity: formSeverity, isActive: formActive },
        });
        toast.success("Maintenance créée");
      }
      resetForm();
      await loadMaintenances();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (m: MaintenanceWindow) => {
    try {
      await requestJson(`/api/admin/maintenance/${m.id}/deactivate`, { method: "POST" });
      toast.success("Maintenance désactivée");
      await loadMaintenances();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la désactivation");
    }
  };

  const formatDate = (isoDate: string): string => {
    try {
      return new Date(isoDate).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  };

  const getStatus = (m: MaintenanceWindow): { label: string; color: string; bg: string } => {
    const now = new Date();
    const start = new Date(m.startsAt);
    const end = new Date(m.endsAt);
    if (!m.isActive) return { label: "Désactivée", color: "#6B7280", bg: "#F3F4F6" };
    if (now >= start && now <= end) return { label: "En cours", color: "#EA580C", bg: "#FFEDD5" };
    if (now < start) return { label: "Planifiée", color: "#2563EB", bg: "#DBEAFE" };
    return { label: "Terminée", color: "#059669", bg: "#D1FAE5" };
  };

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
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "32px", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wrench size={24} color="#7C3AED" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>Maintenance</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Planifier les fenêtres de maintenance</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => void loadMaintenances()} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>
            <RefreshCw size={18} color="#6B7280" style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            <Plus size={16} /> Nouvelle maintenance
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ padding: "24px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 20px" }}>{editingId ? "Modifier la maintenance" : "Nouvelle maintenance"}</h2>
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>Titre *</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} style={inputStyle} placeholder="Ex: Mise à jour serveur" required />
              </div>
              <div>
                <label style={labelStyle}>Sévérité *</label>
                <select value={formSeverity} onChange={(e) => setFormSeverity(e.target.value as MaintenanceSeverity)} style={inputStyle}>
                  <option value="INFO">Info (bleu)</option>
                  <option value="WARNING">Warning (orange)</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Message *</label>
              <textarea value={formMessage} onChange={(e) => setFormMessage(e.target.value)} style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} placeholder="Description de la maintenance visible aux utilisateurs..." required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>Début *</label>
                <input type="datetime-local" value={formStartsAt} onChange={(e) => setFormStartsAt(e.target.value)} style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Fin *</label>
                <input type="datetime-local" value={formEndsAt} onChange={(e) => setFormEndsAt(e.target.value)} style={inputStyle} required />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <input type="checkbox" id="active" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} style={{ width: "18px", height: "18px" }} />
              <label htmlFor="active" style={{ fontSize: "14px", color: "#374151" }}>Active (visible aux utilisateurs)</label>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" disabled={saving || !formTitle.trim() || !formMessage.trim() || !formStartsAt || !formEndsAt} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
                {saving ? <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={16} />} {editingId ? "Enregistrer" : "Créer"}
              </button>
              <button type="button" onClick={resetForm} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
                <X size={16} /> Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
          <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* Empty */}
      {!loading && maintenances.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px", background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Wrench size={32} color="#9CA3AF" />
          </div>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Aucune maintenance planifiée</p>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Cliquez sur &quot;Nouvelle maintenance&quot; pour en créer une</p>
        </div>
      )}

      {/* List */}
      {!loading && maintenances.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {maintenances.map((m) => {
            const status = getStatus(m);
            return (
              <div key={m.id} style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", opacity: m.isActive ? 1 : 0.6 }}>
                <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: "16px", flexDirection: isMobile ? "column" : "row" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      {m.severity === "WARNING" ? (
                        <AlertTriangle size={18} color="#EA580C" />
                      ) : (
                        <Info size={18} color="#2563EB" />
                      )}
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>{m.title}</span>
                      <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: status.bg, color: status.color }}>{status.label}</span>
                    </div>
                    <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 12px", lineHeight: 1.5 }}>{m.message}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#9CA3AF" }}>
                        <Calendar size={14} /> {formatDate(m.startsAt)}
                      </span>
                      <span style={{ fontSize: "13px", color: "#9CA3AF" }}>→</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#9CA3AF" }}>
                        <Clock size={14} /> {formatDate(m.endsAt)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => handleEdit(m)} title="Modifier" style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>
                      <Pencil size={16} color="#6B7280" />
                    </button>
                    {m.isActive && (
                      <button onClick={() => void handleDeactivate(m)} title="Désactiver" style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>
                        <Power size={16} color="#6B7280" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}

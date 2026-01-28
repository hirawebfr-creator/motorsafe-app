"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { fetcher, requestJson } from "@/lib/fetcher";
import { useUser } from "@/components/user-context";
import {
  FileText,
  Plus,
  RefreshCw,
  Shield,
  ExternalLink,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Info,
  AlertCircle,
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

const SEVERITY_CONFIG = {
  INFO: { label: "Info", color: "#2563EB", bg: "#DBEAFE", icon: Info },
  WARNING: { label: "Attention", color: "#D97706", bg: "#FEF3C7", icon: AlertTriangle },
  CRITICAL: { label: "Critique", color: "#DC2626", bg: "#FEE2E2", icon: AlertCircle },
};

export default function AdminReferencesPage() {
  const user = useUser();
  const { isMobile, isTablet } = useResponsive();
  const isAdmin = user?.role === "ADMIN";

  const [items, setItems] = useState<LegalReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    sourceUrl: "",
    code: "",
    articleRef: "",
    tags: "",
    severity: "INFO" as "INFO" | "WARNING" | "CRITICAL",
    types: [] as string[],
  });

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetcher<LegalReference[]>("/api/legal-references", { noStore: true });
      setItems(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      load();
    }
  }, [isAdmin, load]);

  const toggleType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      types: prev.types.includes(type) ? prev.types.filter((item) => item !== type) : [...prev.types, type],
    }));
  };

  const submit = async () => {
    setError(null);
    try {
      await requestJson("/api/legal-references", {
        method: "POST",
        body: { title: form.title, summary: form.summary || null, sourceUrl: form.sourceUrl || null, code: form.code || null, articleRef: form.articleRef || null, tags: form.tags || null, severity: form.severity, types: form.types },
      });
      toast.success("Référence ajoutée");
      setForm({ title: "", summary: "", sourceUrl: "", code: "", articleRef: "", tags: "", severity: "INFO", types: [] });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.error(message);
    }
  };

  const toggleActive = async (reference: LegalReference) => {
    try {
      await requestJson(`/api/legal-references/${reference.id}`, { method: "PUT", body: { isActive: !reference.isActive } });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      toast.error(message);
    }
  };

  const deleteReference = async (reference: LegalReference) => {
    if (!confirm("Supprimer cette référence ?")) return;
    try {
      await requestJson(`/api/legal-references/${reference.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      toast.error(message);
    }
  };

  const activeCount = useMemo(() => items.filter((item) => item.isActive).length, [items]);

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
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={24} color="#7C3AED" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>Références légales</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Gérez les références applicables aux interventions</p>
          </div>
        </div>
        <button onClick={() => void load()} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>
          <RefreshCw size={18} color="#6B7280" style={loading ? { animation: "spin 1s linear infinite" } : {}} />
        </button>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "12px", background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: "24px" }}>
          <AlertTriangle size={20} color="#DC2626" />
          <span style={{ fontSize: "14px", color: "#DC2626" }}>{error}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "1.2fr 0.8fr", gap: "24px" }}>
        {/* Liste */}
        <div style={{ borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>Références actives</h2>
            <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: "#DBEAFE", color: "#2563EB" }}>{activeCount} actives</span>
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
              <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <p style={{ fontSize: "14px", color: "#6B7280" }}>Aucune référence.</p>
            </div>
          ) : (
            <div>
              {items.map((item, idx) => {
                const severityCfg = SEVERITY_CONFIG[item.severity];
                const SeverityIcon = severityCfg.icon;
                return (
                  <div key={item.id} style={{ padding: "16px 20px", borderBottom: idx < items.length - 1 ? "1px solid #F3F4F6" : "none", opacity: item.isActive ? 1 : 0.5, transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>{item.title}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 500, background: severityCfg.bg, color: severityCfg.color }}>
                            <SeverityIcon size={12} /> {severityCfg.label}
                          </span>
                        </div>
                        {item.summary && <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 8px", lineHeight: 1.5 }}>{item.summary}</p>}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                          {item.code && <span style={{ fontSize: "12px", color: "#6B7280", padding: "2px 6px", background: "#F3F4F6", borderRadius: "4px" }}>{item.code}</span>}
                          {item.articleRef && <span style={{ fontSize: "12px", color: "#6B7280", padding: "2px 6px", background: "#F3F4F6", borderRadius: "4px" }}>{item.articleRef}</span>}
                        </div>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {item.assignments.map((entry, i) => (
                            <span key={i} style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", background: "#EEF2FF", color: "#6366F1" }}>{entry.interventionType}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {item.sourceUrl && (
                          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ExternalLink size={16} color="#6B7280" />
                          </a>
                        )}
                        <button onClick={() => toggleActive(item)} title={item.isActive ? "Désactiver" : "Activer"} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>
                          {item.isActive ? <ToggleRight size={16} color="#059669" /> : <ToggleLeft size={16} color="#6B7280" />}
                        </button>
                        <button onClick={() => deleteReference(item)} title="Supprimer" style={{ padding: "8px", borderRadius: "8px", border: "1px solid #FECACA", background: "#FEF2F2", cursor: "pointer" }}>
                          <Trash2 size={16} color="#DC2626" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Formulaire */}
        <div style={{ padding: "24px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", height: "fit-content" }}>
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#6366F1", textTransform: "uppercase", margin: "0 0 8px" }}>Nouvelle référence</p>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Ajouter une référence</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Titre</label>
              <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Intervention E85 et obligations" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Résumé</label>
              <textarea value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} placeholder="Résumé court pour les techniciens." style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} />
            </div>
            <div>
              <label style={labelStyle}>Source URL</label>
              <input type="text" value={form.sourceUrl} onChange={(e) => setForm((p) => ({ ...p, sourceUrl: e.target.value }))} placeholder="https://..." style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Code</label>
                <input type="text" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code de la route" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Article</label>
                <input type="text" value={form.articleRef} onChange={(e) => setForm((p) => ({ ...p, articleRef: e.target.value }))} placeholder="R.123-4" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Tags</label>
              <input type="text" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="E85, anti-demarrage" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Sévérité</label>
              <select value={form.severity} onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value as "INFO" | "WARNING" | "CRITICAL" }))} style={inputStyle}>
                <option value="INFO">Info</option>
                <option value="WARNING">Attention</option>
                <option value="CRITICAL">Critique</option>
              </select>
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "10px" }}>Types d&apos;intervention associés</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {TYPES.map((type) => (
                  <button key={type} type="button" onClick={() => toggleType(type)} style={{ padding: "8px 14px", borderRadius: "8px", border: form.types.includes(type) ? "2px solid #6366F1" : "1px solid #E5E7EB", background: form.types.includes(type) ? "#EEF2FF" : "#fff", fontSize: "13px", fontWeight: 500, color: form.types.includes(type) ? "#6366F1" : "#6B7280", cursor: "pointer" }}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" onClick={submit} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "12px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", marginTop: "8px" }}>
              <Plus size={16} /> Ajouter la référence
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}

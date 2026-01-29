"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  RefreshCw,
  Plus,
  Sparkles,
  Bug,
  Shield,
  Scale,
  Eye,
  EyeOff,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { fetcher, requestJson } from "@/lib/fetcher";
import { toast } from "sonner";

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

type ChangelogType = "FEATURE" | "FIX" | "SECURITY" | "LEGAL";

interface ChangelogEntry {
  id: string;
  title: string;
  bodyMarkdown: string;
  type: ChangelogType;
  version: string | null;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  createdBy: { id: string; email: string } | null;
}

const TYPE_CONFIG: Record<ChangelogType, { color: string; bg: string; label: string; Icon: typeof Sparkles }> = {
  FEATURE: { color: "#2563EB", bg: "#DBEAFE", label: "Nouveauté", Icon: Sparkles },
  FIX: { color: "#D97706", bg: "#FEF3C7", label: "Correction", Icon: Bug },
  SECURITY: { color: "#DC2626", bg: "#FEE2E2", label: "Sécurité", Icon: Shield },
  LEGAL: { color: "#7C3AED", bg: "#EDE9FE", label: "Légal", Icon: Scale },
};

const TYPE_OPTIONS: { value: ChangelogType; label: string }[] = [
  { value: "FEATURE", label: "Nouveauté" },
  { value: "FIX", label: "Correction" },
  { value: "SECURITY", label: "Sécurité" },
  { value: "LEGAL", label: "Légal" },
];

export default function AdminChangelogPage() {
  const { isMobile, isTablet } = useResponsive();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formType, setFormType] = useState<ChangelogType>("FEATURE");
  const [formVersion, setFormVersion] = useState("");
  const [formPublished, setFormPublished] = useState(true);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetcher<{ entries: ChangelogEntry[] }>("/api/admin/changelog");
      setEntries(res.entries);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const resetForm = () => {
    setFormTitle("");
    setFormBody("");
    setFormType("FEATURE");
    setFormVersion("");
    setFormPublished(true);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (entry: ChangelogEntry) => {
    setFormTitle(entry.title);
    setFormBody(entry.bodyMarkdown);
    setFormType(entry.type);
    setFormVersion(entry.version || "");
    setFormPublished(entry.isPublished);
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) return;
    try {
      setSaving(true);
      if (editingId) {
        await requestJson(`/api/admin/changelog/${editingId}`, {
          method: "PATCH",
          body: { title: formTitle, bodyMarkdown: formBody, type: formType, version: formVersion || null, isPublished: formPublished },
        });
        toast.success("Entrée mise à jour");
      } else {
        await requestJson("/api/admin/changelog", {
          method: "POST",
          body: { title: formTitle, bodyMarkdown: formBody, type: formType, version: formVersion || null, isPublished: formPublished },
        });
        toast.success("Entrée créée");
      }
      resetForm();
      await loadEntries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (entry: ChangelogEntry) => {
    try {
      await requestJson(`/api/admin/changelog/${entry.id}/publish`, { method: "POST" });
      toast.success(entry.isPublished ? "Dépublié" : "Publié");
      await loadEntries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la modification");
    }
  };

  const formatDate = (isoDate: string): string => {
    try {
      return new Date(isoDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "—";
    }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: "14px", color: "#111827", background: "#fff", outline: "none" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" };

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "32px", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={24} color="#6366F1" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>Changelog</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Gérer les nouveautés visibles aux garages</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => void loadEntries()} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>
            <RefreshCw size={18} color="#6B7280" style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            <Plus size={16} /> Nouvelle entrée
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ padding: "24px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 20px" }}>
            {editingId ? "Modifier l'entrée" : "Nouvelle entrée"}
          </h2>
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Titre *</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Signature client mobile" required style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Type *</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value as ChangelogType)} style={inputStyle}>
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ width: "120px" }}>
                  <label style={labelStyle}>Version</label>
                  <input type="text" value={formVersion} onChange={(e) => setFormVersion(e.target.value)} placeholder="1.0.0" style={inputStyle} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <label style={labelStyle}>Contenu (Markdown) *</label>
              <textarea value={formBody} onChange={(e) => setFormBody(e.target.value)} placeholder={`## Description\n\nDétaillez la nouveauté ici...\n\n- Point 1\n- Point 2`} required style={{ ...inputStyle, minHeight: "200px", fontFamily: "monospace", resize: "vertical" }} />
            </div>
            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" id="published" checked={formPublished} onChange={(e) => setFormPublished(e.target.checked)} style={{ width: "18px", height: "18px", borderRadius: "4px", cursor: "pointer" }} />
              <label htmlFor="published" style={{ fontSize: "14px", color: "#374151", cursor: "pointer" }}>Publier immédiatement</label>
            </div>
            <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <button type="submit" disabled={saving || !formTitle.trim() || !formBody.trim()} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", opacity: saving || !formTitle.trim() || !formBody.trim() ? 0.5 : 1 }}>
                {saving ? <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={16} />}
                {editingId ? "Enregistrer" : "Créer"}
              </button>
              <button type="button" onClick={resetForm} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
                <X size={16} /> Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries List */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px" }}>
          <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : entries.length === 0 ? (
        <div style={{ padding: "64px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", textAlign: "center" }}>
          <FileText size={48} color="#D1D5DB" style={{ marginBottom: "16px" }} />
          <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Aucune entrée dans le changelog</p>
        </div>
      ) : (
        <div style={{ borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Type</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Titre</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Version</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Publié</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Date</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const cfg = TYPE_CONFIG[entry.type];
                  const TypeIcon = cfg.Icon;
                  return (
                    <tr key={entry.id} style={{ borderBottom: "1px solid #F3F4F6", background: hoveredRow === entry.id ? "#F9FAFB" : "transparent", transition: "background 0.15s" }} onMouseEnter={() => setHoveredRow(entry.id)} onMouseLeave={() => setHoveredRow(null)}>
                      <td style={{ padding: "16px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: cfg.bg, color: cfg.color }}>
                          <TypeIcon size={14} /> {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", fontWeight: 500, color: "#111827" }}>{entry.title}</td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#6B7280" }}>{entry.version || "—"}</td>
                      <td style={{ padding: "16px" }}>
                        {entry.isPublished ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#059669" }}>
                            <Eye size={14} /> Oui
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#6B7280" }}>
                            <EyeOff size={14} /> Non
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px", fontSize: "13px", color: "#6B7280" }}>{formatDate(entry.publishedAt)}</td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => handleEdit(entry)} title="Modifier" style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>
                            <Pencil size={14} color="#6B7280" />
                          </button>
                          <button onClick={() => void handleTogglePublish(entry)} title={entry.isPublished ? "Dépublier" : "Publier"} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>
                            {entry.isPublished ? <EyeOff size={14} color="#6B7280" /> : <Eye size={14} color="#6B7280" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}

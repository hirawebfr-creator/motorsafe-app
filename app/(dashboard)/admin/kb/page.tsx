"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FolderPlus,
  Save,
  X,
  FileText,
  Shield,
  Tag,
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

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  articleCount: number;
};

type Article = {
  id: number;
  title: string;
  slug: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: number; name: string; slug: string };
};

type ArticleDetail = Article & {
  bodyMarkdown: string;
};

export default function AdminKbPage() {
  const user = useUser();
  const { isMobile, isTablet } = useResponsive();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleDetail | null>(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleCategoryId, setArticleCategoryId] = useState<number | null>(null);
  const [articleBody, setArticleBody] = useState("");
  const [articleTags, setArticleTags] = useState("");
  const [articlePublished, setArticlePublished] = useState(true);
  const [savingArticle, setSavingArticle] = useState(false);

  const [filterCategory, setFilterCategory] = useState<number | null>(null);

  const isAdmin = user?.role === "ADMIN";

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, artRes] = await Promise.all([
        fetcher<{ categories: Category[] }>("/api/admin/kb/categories"),
        fetcher<{ articles: Article[] }>("/api/admin/kb/articles"),
      ]);
      setCategories(catRes.categories);
      setArticles(artRes.articles);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void loadData();
    }
  }, [isAdmin, loadData]);

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;
    try {
      setSavingCategory(true);
      await requestJson("/api/admin/kb/categories", { body: { name: categoryName.trim(), description: categoryDesc.trim() || null } });
      setCategoryName("");
      setCategoryDesc("");
      setShowCategoryForm(false);
      toast.success("Catégorie créée");
      void loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création de la catégorie");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleEditArticle = async (articleId: number) => {
    try {
      const res = await fetcher<{ article: ArticleDetail }>(`/api/admin/kb/articles/${articleId}`);
      const article = res.article;
      setEditingArticle(article);
      setArticleTitle(article.title);
      setArticleCategoryId(article.category.id);
      setArticleBody(article.bodyMarkdown);
      setArticleTags(Array.isArray(article.tags) ? article.tags.join(", ") : "");
      setArticlePublished(article.isPublished);
      setShowArticleForm(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du chargement de l'article");
    }
  };

  const handleNewArticle = () => {
    setEditingArticle(null);
    setArticleTitle("");
    setArticleCategoryId(categories[0]?.id || null);
    setArticleBody("");
    setArticleTags("");
    setArticlePublished(true);
    setShowArticleForm(true);
  };

  const handleSaveArticle = async () => {
    if (!articleTitle.trim() || !articleCategoryId || !articleBody.trim()) {
      toast.error("Titre, catégorie et contenu sont requis");
      return;
    }
    try {
      setSavingArticle(true);
      const tags = articleTags.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
      if (editingArticle) {
        await requestJson(`/api/admin/kb/articles/${editingArticle.id}`, { method: "PATCH", body: { title: articleTitle.trim(), categoryId: articleCategoryId, bodyMarkdown: articleBody, tags, isPublished: articlePublished } });
      } else {
        await requestJson("/api/admin/kb/articles", { body: { title: articleTitle.trim(), categoryId: articleCategoryId, bodyMarkdown: articleBody, tags, isPublished: articlePublished } });
      }
      setShowArticleForm(false);
      toast.success(editingArticle ? "Article mis à jour" : "Article créé");
      void loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la sauvegarde de l'article");
    } finally {
      setSavingArticle(false);
    }
  };

  const handleTogglePublish = async (articleId: number, currentState: boolean) => {
    try {
      await requestJson(`/api/admin/kb/articles/${articleId}`, { method: "PATCH", body: { isPublished: !currentState } });
      toast.success(currentState ? "Article dépublié" : "Article publié");
      void loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la modification");
    }
  };

  const handleDeleteArticle = async (articleId: number) => {
    if (!confirm("Supprimer cet article ?")) return;
    try {
      await requestJson(`/api/admin/kb/articles/${articleId}`, { method: "DELETE" });
      toast.success("Article supprimé");
      void loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  const filteredArticles = filterCategory ? articles.filter((a) => a.category.id === filterCategory) : articles;

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
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={24} color="#6366F1" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>Base de connaissance</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Gérer les articles et catégories du centre d&apos;aide</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={() => setShowCategoryForm(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
            <FolderPlus size={16} /> Catégorie
          </button>
          <button onClick={handleNewArticle} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            <Plus size={16} /> Nouvel article
          </button>
          <button onClick={() => void loadData()} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>
            <RefreshCw size={18} color="#6B7280" style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Catégories", value: categories.length, color: "#6366F1", bg: "#EEF2FF", icon: FolderPlus },
          { label: "Articles publiés", value: articles.filter((a) => a.isPublished).length, color: "#059669", bg: "#D1FAE5", icon: Eye },
          { label: "Brouillons", value: articles.filter((a) => !a.isPublished).length, color: "#F59E0B", bg: "#FEF3C7", icon: EyeOff },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 4px" }}>{item.label}</p>
                  <p style={{ fontSize: "28px", fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
                </div>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={24} color={item.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <span style={{ fontSize: "14px", color: "#6B7280" }}>Filtrer:</span>
        <select value={filterCategory || ""} onChange={(e) => setFilterCategory(e.target.value ? parseInt(e.target.value, 10) : null)} style={{ ...inputStyle, width: "auto", minWidth: "200px" }}>
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.articleCount})</option>
          ))}
        </select>
      </div>

      {/* Articles */}
      <div style={{ borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
            <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              <FileText size={32} color="#9CA3AF" />
            </div>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Aucun article</p>
            <button onClick={handleNewArticle} style={{ fontSize: "14px", color: "#6366F1", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Créer le premier article
            </button>
          </div>
        ) : isMobile ? (
          <div>
            {filteredArticles.map((article, idx) => (
              <div key={article.id} style={{ padding: "16px", borderBottom: idx < filteredArticles.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>{article.title}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 500, background: article.isPublished ? "#D1FAE5" : "#FEF3C7", color: article.isPublished ? "#059669" : "#D97706" }}>
                    {article.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                    {article.isPublished ? "Publié" : "Brouillon"}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 8px" }}>{article.category.name}</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleTogglePublish(article.id, article.isPublished)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>
                    {article.isPublished ? <EyeOff size={14} color="#6B7280" /> : <Eye size={14} color="#6B7280" />}
                  </button>
                  <button onClick={() => void handleEditArticle(article.id)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>
                    <Edit size={14} color="#6B7280" />
                  </button>
                  <button onClick={() => void handleDeleteArticle(article.id)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #FECACA", background: "#FEF2F2", cursor: "pointer" }}>
                    <Trash2 size={14} color="#DC2626" />
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
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Article</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Catégorie</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Statut</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Tags</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Mise à jour</th>
                  <th style={{ padding: "12px 16px", width: "120px" }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article, idx) => (
                  <tr
                    key={article.id}
                    style={{ borderBottom: idx < filteredArticles.length - 1 ? "1px solid #F3F4F6" : "none", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{article.title}</div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>/{article.slug}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "14px", color: "#374151" }}>{article.category.name}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: article.isPublished ? "#D1FAE5" : "#FEF3C7", color: article.isPublished ? "#059669" : "#D97706" }}>
                        {article.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                        {article.isPublished ? "Publié" : "Brouillon"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {article.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", background: "#F3F4F6", color: "#6B7280" }}>
                            <Tag size={10} /> {tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && <span style={{ fontSize: "11px", color: "#9CA3AF" }}>+{article.tags.length - 3}</span>}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#6B7280" }}>
                      {new Date(article.updatedAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button onClick={() => handleTogglePublish(article.id, article.isPublished)} title={article.isPublished ? "Dépublier" : "Publier"} style={{ padding: "6px", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer" }}>
                          {article.isPublished ? <EyeOff size={16} color="#6B7280" /> : <Eye size={16} color="#6B7280" />}
                        </button>
                        <button onClick={() => void handleEditArticle(article.id)} title="Modifier" style={{ padding: "6px", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer" }}>
                          <Edit size={16} color="#6B7280" />
                        </button>
                        <button onClick={() => void handleDeleteArticle(article.id)} title="Supprimer" style={{ padding: "6px", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer" }}>
                          <Trash2 size={16} color="#DC2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: "450px", borderRadius: "16px", background: "#fff", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 20px" }}>Nouvelle catégorie</h2>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Nom</label>
              <input type="text" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} style={inputStyle} placeholder="Ex: Signature" />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Description (optionnel)</label>
              <input type="text" value={categoryDesc} onChange={(e) => setCategoryDesc(e.target.value)} style={inputStyle} placeholder="Ex: Tout sur la signature électronique" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setShowCategoryForm(false)} style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>Annuler</button>
              <button onClick={handleCreateCategory} disabled={savingCategory || !categoryName.trim()} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", opacity: savingCategory || !categoryName.trim() ? 0.5 : 1 }}>
                {savingCategory ? <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />} Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Modal */}
      {showArticleForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "16px", overflowY: "auto" }}>
          <div style={{ width: "100%", maxWidth: "900px", borderRadius: "16px", background: "#fff", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>{editingArticle ? "Modifier l'article" : "Nouvel article"}</h2>
              <button onClick={() => setShowArticleForm(false)} style={{ padding: "6px", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer" }}>
                <X size={20} color="#6B7280" />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>Titre</label>
                <input type="text" value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} style={inputStyle} placeholder="Ex: Le client ne reçoit pas l'email de signature" />
              </div>
              <div>
                <label style={labelStyle}>Catégorie</label>
                <select value={articleCategoryId || ""} onChange={(e) => setArticleCategoryId(parseInt(e.target.value, 10))} style={inputStyle}>
                  <option value="">Sélectionner...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Contenu (Markdown)</label>
              <textarea value={articleBody} onChange={(e) => setArticleBody(e.target.value)} style={{ ...inputStyle, fontFamily: "monospace", fontSize: "13px", minHeight: "300px", resize: "vertical" }} placeholder="# Titre&#10;&#10;Écrivez votre contenu en Markdown..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label style={labelStyle}>Tags (séparés par virgule)</label>
                <input type="text" value={articleTags} onChange={(e) => setArticleTags(e.target.value)} style={inputStyle} placeholder="email, signature, spam" />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={articlePublished} onChange={(e) => setArticlePublished(e.target.checked)} style={{ width: "18px", height: "18px", borderRadius: "4px" }} />
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#374151" }}>Publié</span>
                </label>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setShowArticleForm(false)} style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>Annuler</button>
              <button onClick={handleSaveArticle} disabled={savingArticle} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", opacity: savingArticle ? 0.5 : 1 }}>
                {savingArticle ? <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />} {editingArticle ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}

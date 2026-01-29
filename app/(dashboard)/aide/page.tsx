"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Loader2,
  RefreshCw,
  FileText,
  Tag,
  HelpCircle,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";

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
  articleCount: number;
};

type Article = {
  id: number;
  title: string;
  slug: string;
  tags: string[];
  categoryName: string;
  categorySlug: string;
  updatedAt: string;
};

// ============================================
// Component
// ============================================

export default function AidePage() {
  const { isMobile, isTablet } = useResponsive();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searching, setSearching] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetcher<{ categories: Category[] }>("/api/kb/categories");
      setCategories(res.categories);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  const loadArticles = useCallback(async (query = "", category = "") => {
    try {
      setSearching(true);
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (category) params.set("category", category);
      params.set("limit", "30");
      const res = await fetcher<{ articles: Article[] }>(`/api/kb/articles?${params.toString()}`);
      setArticles(res.articles);
    } catch (err) {
      console.error("Failed to load articles:", err);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await Promise.all([loadCategories(), loadArticles()]);
      setLoading(false);
    })();
  }, [loadCategories, loadArticles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadArticles(searchQuery, selectedCategory);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, loadArticles]);

  const handleRefresh = () => {
    void loadArticles(searchQuery, selectedCategory);
  };

  const cardStyle: React.CSSProperties = { borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" };
  const inputStyle: React.CSSProperties = { padding: "10px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: "14px", color: "#111827", background: "#fff", outline: "none" };

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "32px", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HelpCircle size={24} color="#2563EB" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>Centre d&apos;aide</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Trouvez des réponses à vos questions et des guides pratiques</p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={searching} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
          <RefreshCw size={16} style={searching ? { animation: "spin 1s linear infinite" } : {}} /> Actualiser
        </button>
      </div>

      {/* Search & Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "250px", maxWidth: "400px" }}>
          <Search size={16} color="#9CA3AF" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher un article..." style={{ ...inputStyle, width: "100%", paddingLeft: "36px" }} />
        </div>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={inputStyle}>
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => <option key={cat.id} value={cat.slug}>{cat.name} ({cat.articleCount})</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
          <Loader2 size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", gap: "24px" }}>
          {/* Categories Sidebar */}
          <div style={cardStyle}>
            <div style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 600, color: "#111827" }}>Catégories</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <button onClick={() => setSelectedCategory("")} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "none", textAlign: "left", fontSize: "14px", fontWeight: 500, background: !selectedCategory ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "transparent", color: !selectedCategory ? "#fff" : "#374151", cursor: "pointer" }}>
                  Tous les articles
                </button>
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.slug)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "none", textAlign: "left", fontSize: "14px", fontWeight: 500, background: selectedCategory === cat.slug ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "transparent", color: selectedCategory === cat.slug ? "#fff" : "#374151", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>{cat.name}</span>
                    <span style={{ fontSize: "12px", opacity: 0.7 }}>{cat.articleCount}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Articles List */}
          <div>
            {searching && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", fontSize: "14px", color: "#6B7280" }}>
                <Loader2 size={14} color="#6B7280" style={{ animation: "spin 1s linear infinite" }} /> Recherche en cours...
              </div>
            )}

            {articles.length === 0 ? (
              <div style={{ ...cardStyle, padding: "48px", textAlign: "center" }}>
                <FileText size={48} color="#D1D5DB" style={{ marginBottom: "16px" }} />
                <p style={{ color: "#6B7280" }}>{searchQuery || selectedCategory ? "Aucun article trouvé pour cette recherche" : "Aucun article disponible pour le moment"}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {articles.map((article) => (
                  <Link key={article.id} href={`/aide/${article.slug}`} style={{ ...cardStyle, display: "block", textDecoration: "none" }}>
                    <div style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 500, color: "#111827" }}>{article.title}</h3>
                        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6B7280" }}>{article.categoryName}</p>
                        {article.tags.length > 0 && (
                          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {article.tags.slice(0, 3).map((tag) => (
                              <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "9999px", background: "#F3F4F6", fontSize: "11px", color: "#6B7280" }}>
                                <Tag size={10} /> {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={20} color="#9CA3AF" style={{ marginTop: "4px", flexShrink: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}

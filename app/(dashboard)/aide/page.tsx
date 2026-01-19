"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Book,
  ChevronRight,
  Loader2,
  RefreshCw,
  FileText,
  Tag,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";

// ============================================
// Types
// ============================================

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

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadArticles(searchQuery, selectedCategory);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, loadArticles]);

  const handleRefresh = () => {
    void loadArticles(searchQuery, selectedCategory);
  };

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title flex items-center gap-2">
            <Book size={24} />
            Centre d&apos;aide
          </h1>
          <p className="ms-page-subtitle">
            Trouvez des réponses à vos questions et des guides pratiques
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="ms-btn ms-btn-secondary"
          disabled={searching}
        >
          <RefreshCw size={16} className={searching ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ms-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un article..."
            className="ms-input w-full pl-9"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="ms-input"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name} ({cat.articleCount})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-[var(--ms-primary)]" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="ms-card sticky top-4">
              <div className="ms-card-body">
                <h3 className="mb-3 font-semibold text-[var(--ms-text)]">Catégories</h3>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("")}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      !selectedCategory
                        ? "bg-[var(--ms-primary)] text-white"
                        : "text-[var(--ms-text)] hover:bg-[var(--ms-bg)]"
                    }`}
                  >
                    Tous les articles
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        selectedCategory === cat.slug
                          ? "bg-[var(--ms-primary)] text-white"
                          : "text-[var(--ms-text)] hover:bg-[var(--ms-bg)]"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span>{cat.name}</span>
                        <span className="text-xs opacity-70">{cat.articleCount}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Articles List */}
          <div className="lg:col-span-3">
            {searching && (
              <div className="mb-4 flex items-center gap-2 text-sm text-[var(--ms-text-muted)]">
                <Loader2 size={14} className="animate-spin" />
                Recherche en cours...
              </div>
            )}

            {articles.length === 0 ? (
              <div className="ms-card">
                <div className="ms-card-body py-12 text-center">
                  <FileText size={48} className="mx-auto mb-4 text-[var(--ms-text-muted)]" />
                  <p className="text-[var(--ms-text-muted)]">
                    {searchQuery || selectedCategory
                      ? "Aucun article trouvé pour cette recherche"
                      : "Aucun article disponible pour le moment"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/aide/${article.slug}`}
                    className="ms-card block transition-shadow hover:shadow-md"
                  >
                    <div className="ms-card-body">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-[var(--ms-text)] group-hover:text-[var(--ms-primary)]">
                            {article.title}
                          </h3>
                          <p className="mt-1 text-sm text-[var(--ms-text-muted)]">
                            {article.categoryName}
                          </p>
                          {article.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {article.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 rounded-full bg-[var(--ms-bg)] px-2 py-0.5 text-xs text-[var(--ms-text-muted)]"
                                >
                                  <Tag size={10} />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <ChevronRight size={20} className="mt-1 text-[var(--ms-text-muted)]" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

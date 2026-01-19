"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  RefreshCw,
  Loader2,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FolderPlus,
  Save,
  X,
  FileText,
} from "lucide-react";
import { fetcher, requestJson } from "@/lib/fetcher";

// ============================================
// Types
// ============================================

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

// ============================================
// Component
// ============================================

export default function AdminKbPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Article form
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleDetail | null>(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleCategoryId, setArticleCategoryId] = useState<number | null>(null);
  const [articleBody, setArticleBody] = useState("");
  const [articleTags, setArticleTags] = useState("");
  const [articlePublished, setArticlePublished] = useState(true);
  const [savingArticle, setSavingArticle] = useState(false);

  // Filter
  const [filterCategory, setFilterCategory] = useState<number | null>(null);

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
      console.error("Failed to load KB data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Create category
  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;

    try {
      setSavingCategory(true);
      await requestJson("/api/admin/kb/categories", {
        body: {
          name: categoryName.trim(),
          description: categoryDesc.trim() || null,
        },
      });
      setCategoryName("");
      setCategoryDesc("");
      setShowCategoryForm(false);
      void loadData();
    } catch (err) {
      console.error("Failed to create category:", err);
      alert("Erreur lors de la création de la catégorie");
    } finally {
      setSavingCategory(false);
    }
  };

  // Open article form for editing
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
      console.error("Failed to load article:", err);
      alert("Erreur lors du chargement de l'article");
    }
  };

  // Open article form for new
  const handleNewArticle = () => {
    setEditingArticle(null);
    setArticleTitle("");
    setArticleCategoryId(categories[0]?.id || null);
    setArticleBody("");
    setArticleTags("");
    setArticlePublished(true);
    setShowArticleForm(true);
  };

  // Save article (create or update)
  const handleSaveArticle = async () => {
    if (!articleTitle.trim() || !articleCategoryId || !articleBody.trim()) {
      alert("Titre, catégorie et contenu sont requis");
      return;
    }

    try {
      setSavingArticle(true);
      const tags = articleTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (editingArticle) {
        // Update
        await requestJson(`/api/admin/kb/articles/${editingArticle.id}`, {
          method: "PATCH",
          body: {
            title: articleTitle.trim(),
            categoryId: articleCategoryId,
            bodyMarkdown: articleBody,
            tags,
            isPublished: articlePublished,
          },
        });
      } else {
        // Create
        await requestJson("/api/admin/kb/articles", {
          body: {
            title: articleTitle.trim(),
            categoryId: articleCategoryId,
            bodyMarkdown: articleBody,
            tags,
            isPublished: articlePublished,
          },
        });
      }

      setShowArticleForm(false);
      void loadData();
    } catch (err) {
      console.error("Failed to save article:", err);
      alert("Erreur lors de la sauvegarde de l'article");
    } finally {
      setSavingArticle(false);
    }
  };

  // Toggle publish
  const handleTogglePublish = async (articleId: number, currentState: boolean) => {
    try {
      await requestJson(`/api/admin/kb/articles/${articleId}`, {
        method: "PATCH",
        body: { isPublished: !currentState },
      });
      void loadData();
    } catch (err) {
      console.error("Failed to toggle publish:", err);
    }
  };

  // Delete article
  const handleDeleteArticle = async (articleId: number) => {
    if (!confirm("Supprimer cet article ?")) return;

    try {
      await requestJson(`/api/admin/kb/articles/${articleId}`, {
        method: "DELETE",
      });
      void loadData();
    } catch (err) {
      console.error("Failed to delete article:", err);
      alert("Erreur lors de la suppression");
    }
  };

  // Filtered articles
  const filteredArticles = filterCategory
    ? articles.filter((a) => a.category.id === filterCategory)
    : articles;

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title flex items-center gap-2">
            <BookOpen size={24} />
            Base de connaissance
          </h1>
          <p className="ms-page-subtitle">
            Gérer les articles et catégories du centre d&apos;aide
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowCategoryForm(true)}
            className="ms-btn ms-btn-secondary"
          >
            <FolderPlus size={16} />
            Catégorie
          </button>
          <button
            type="button"
            onClick={handleNewArticle}
            className="ms-btn ms-btn-primary"
          >
            <Plus size={16} />
            Nouvel article
          </button>
          <button
            type="button"
            onClick={() => void loadData()}
            className="ms-btn ms-btn-secondary"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="ms-card">
          <div className="ms-card-body">
            <p className="text-sm text-[var(--ms-text-muted)]">Catégories</p>
            <p className="text-2xl font-bold text-[var(--ms-text)]">{categories.length}</p>
          </div>
        </div>
        <div className="ms-card">
          <div className="ms-card-body">
            <p className="text-sm text-[var(--ms-text-muted)]">Articles publiés</p>
            <p className="text-2xl font-bold text-green-600">
              {articles.filter((a) => a.isPublished).length}
            </p>
          </div>
        </div>
        <div className="ms-card">
          <div className="ms-card-body">
            <p className="text-sm text-[var(--ms-text-muted)]">Brouillons</p>
            <p className="text-2xl font-bold text-orange-600">
              {articles.filter((a) => !a.isPublished).length}
            </p>
          </div>
        </div>
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Nouvelle catégorie</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nom</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="ms-input w-full"
                  placeholder="Ex: Signature"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description (optionnel)</label>
                <input
                  type="text"
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  className="ms-input w-full"
                  placeholder="Ex: Tout sur la signature électronique"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCategoryForm(false)}
                className="ms-btn ms-btn-secondary"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={savingCategory || !categoryName.trim()}
                className="ms-btn ms-btn-primary"
              >
                {savingCategory ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Form Modal */}
      {showArticleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingArticle ? "Modifier l'article" : "Nouvel article"}
              </h2>
              <button
                type="button"
                onClick={() => setShowArticleForm(false)}
                className="text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Titre</label>
                <input
                  type="text"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  className="ms-input w-full"
                  placeholder="Ex: Le client ne reçoit pas l'email de signature"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Catégorie</label>
                <select
                  value={articleCategoryId || ""}
                  onChange={(e) => setArticleCategoryId(parseInt(e.target.value, 10))}
                  className="ms-input w-full"
                >
                  <option value="">Sélectionner...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium">
                Contenu (Markdown)
              </label>
              <textarea
                value={articleBody}
                onChange={(e) => setArticleBody(e.target.value)}
                className="ms-input w-full font-mono text-sm"
                rows={15}
                placeholder="# Titre

Écrivez votre contenu en Markdown...

## Sous-titre

- Point 1
- Point 2

**Texte en gras** et *texte en italique*"
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Tags (séparés par virgule)
                </label>
                <input
                  type="text"
                  value={articleTags}
                  onChange={(e) => setArticleTags(e.target.value)}
                  className="ms-input w-full"
                  placeholder="email, signature, spam"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={articlePublished}
                    onChange={(e) => setArticlePublished(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">Publié</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowArticleForm(false)}
                className="ms-btn ms-btn-secondary"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveArticle}
                disabled={savingArticle}
                className="ms-btn ms-btn-primary"
              >
                {savingArticle ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingArticle ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-[var(--ms-text-muted)]">Filtrer:</span>
        <select
          value={filterCategory || ""}
          onChange={(e) => setFilterCategory(e.target.value ? parseInt(e.target.value, 10) : null)}
          className="ms-input"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.articleCount})
            </option>
          ))}
        </select>
      </div>

      {/* Articles Table */}
      <div className="ms-card">
        <div className="ms-card-body p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[var(--ms-primary)]" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-8 text-center text-[var(--ms-text-muted)]">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>Aucun article</p>
              <button
                type="button"
                onClick={handleNewArticle}
                className="mt-4 text-[var(--ms-primary)] hover:underline"
              >
                Créer le premier article
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--ms-border)] bg-[var(--ms-bg)]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--ms-text-muted)]">
                      Article
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--ms-text-muted)]">
                      Catégorie
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--ms-text-muted)]">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--ms-text-muted)]">
                      Mise à jour
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ms-border)]">
                  {filteredArticles.map((article) => (
                    <tr key={article.id} className="hover:bg-[var(--ms-bg)]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--ms-text)]">{article.title}</div>
                        <div className="text-xs text-[var(--ms-text-muted)]">/{article.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--ms-text)]">
                        {article.category.name}
                      </td>
                      <td className="px-4 py-3">
                        {article.isPublished ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            <Eye size={12} />
                            Publié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                            <EyeOff size={12} />
                            Brouillon
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--ms-text-muted)]">
                        {new Date(article.updatedAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(article.id, article.isPublished)}
                            className="rounded p-1 text-[var(--ms-text-muted)] hover:bg-[var(--ms-bg)] hover:text-[var(--ms-text)]"
                            title={article.isPublished ? "Dépublier" : "Publier"}
                          >
                            {article.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleEditArticle(article.id)}
                            className="rounded p-1 text-[var(--ms-text-muted)] hover:bg-[var(--ms-bg)] hover:text-[var(--ms-text)]"
                            title="Modifier"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteArticle(article.id)}
                            className="rounded p-1 text-red-500 hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
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
      </div>
    </div>
  );
}

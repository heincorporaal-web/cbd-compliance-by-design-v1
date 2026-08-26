import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, FileText, Eye, Edit2, Download, Filter, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { KNOWLEDGE_CATEGORY_TILE, KNOWLEDGE_CATEGORY_ICONS, isWikiArticle } from "@/lib/knowledgeCategories";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_COLORS = {
  implementation_guide: "bg-indigo-100 text-indigo-700",
  best_practice: "bg-emerald-100 text-emerald-700",
  policy_template: "bg-violet-100 text-violet-700",
  procedure: "bg-amber-100 text-amber-700",
  checklist: "bg-red-100 text-red-700",
  wiki_article: "bg-cyan-100 text-cyan-700",
};

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-600",
  published: "bg-green-100 text-green-700",
  archived: "bg-slate-100 text-slate-500",
};

const CATEGORY_LABELS = {
  implementation_guide: "Implementation Guide",
  best_practice: "Best Practice",
  policy_template: "Policy Template",
  procedure: "Procedure",
  checklist: "Checklist",
  wiki_article: "Wiki Article",
};

export default function KnowledgeGalleryView({ articles, frameworks, onView, canEdit }) {
  const [frameworkFilter, setFrameworkFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    articles.forEach((a) => (a.tags || []).forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter((article) => {
      const fw = frameworks.find((f) => f.id === article.framework_id);
      if (frameworkFilter !== "all" && article.framework_id !== frameworkFilter) return false;
      if (categoryFilter !== "all" && article.category !== categoryFilter) return false;
      if (statusFilter !== "all" && article.status !== statusFilter) return false;
      if (tagFilter !== "all" && !(article.tags || []).includes(tagFilter)) return false;
      return true;
    });
  }, [articles, frameworks, frameworkFilter, categoryFilter, statusFilter, tagFilter]);

  const activeFilterCount =
    (frameworkFilter !== "all" ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (tagFilter !== "all" ? 1 : 0);

  const clearFilters = () => {
    setFrameworkFilter("all");
    setCategoryFilter("all");
    setStatusFilter("all");
    setTagFilter("all");
  };

  if (articles.length === 0) {
    return (
      <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
        <CardContent className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Knowledge Articles</h3>
          <p className="text-slate-600">No articles match your search.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Advanced filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1.5"
        >
          <Filter className="w-3.5 h-3.5" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-indigo-600 text-white">{activeFilterCount}</Badge>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 gap-1">
            <X className="w-3.5 h-3.5" /> Clear filters
          </Button>
        )}
        <span className="text-sm text-slate-500 ml-auto">{filtered.length} article{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {showFilters && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Framework</label>
                <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All frameworks</SelectItem>
                    {frameworks.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Tag</label>
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tags</SelectItem>
                    {allTags.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gallery grid */}
      {filtered.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
          <CardContent className="p-12 text-center">
            <Filter className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No matches</h3>
            <p className="text-slate-600 mb-4">No articles match the selected filters.</p>
            <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((article) => {
            const fw = frameworks.find((f) => f.id === article.framework_id);
            const CategoryIcon = KNOWLEDGE_CATEGORY_ICONS[article.category] || FileText;
            return (
              <Card key={article.id} className="group hover:shadow-lg transition-shadow border-slate-200 flex flex-col">
                <CardContent className="p-4 flex flex-col flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${KNOWLEDGE_CATEGORY_TILE[article.category] || "from-slate-400 to-slate-500"} flex items-center justify-center flex-shrink-0`}>
                      <CategoryIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{article.title}</h3>
                      {article.reference_number && (
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block">{article.reference_number}</span>
                      )}
                    </div>
                  </div>

                  {article.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">{article.description}</p>
                  )}

                  {article.source_url && (
                    <a
                      href={article.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-600 hover:underline flex items-center gap-1 mb-3 truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">Source article</span>
                    </a>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {article.category && (
                      <Badge className={`text-[10px] py-0 px-1.5 ${CATEGORY_COLORS[article.category] || "bg-slate-100 text-slate-700"}`}>
                        {CATEGORY_LABELS[article.category] || article.category}
                      </Badge>
                    )}
                    <Badge className={`text-[10px] py-0 px-1.5 ${STATUS_COLORS[article.status] || "bg-slate-100 text-slate-600"}`}>
                      {article.status || "draft"}
                    </Badge>
                  </div>

                  {fw && (
                    <p className="text-[11px] text-slate-500 mb-3 truncate">
                      <BookOpen className="w-3 h-3 inline mr-1" />{fw.name}
                    </p>
                  )}

                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{tag}</span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-slate-400">+{article.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-auto pt-2 border-t border-slate-100">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onView(article)}>
                      <Eye className="w-3.5 h-3.5 mr-1" /> View
                    </Button>
                    {isWikiArticle(article) && article.source_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(article.source_url).then(() => toast.success("Link copied"));
                        }}
                        title="Copy link to share"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
                      </Button>
                    )}
                    {canEdit && (
                      <Link to={createPageUrl(`KnowledgeArticleDetail?id=${article.id}`)} className="ml-auto">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                        </Button>
                      </Link>
                    )}
                    {article.pdf_url && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(article.pdf_url, "_blank")}>
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
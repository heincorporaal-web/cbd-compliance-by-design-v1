import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Download,
  Eye,
  Trash2,
  LayoutGrid,
  ListTree,
  Printer,
  Copy,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import KnowledgeTreeView from "@/components/knowledge/KnowledgeTreeView";
import KnowledgeGalleryView from "@/components/knowledge/KnowledgeGalleryView";
import KnowledgeArticleImport from "@/components/knowledge/KnowledgeArticleImport";
import { useIsImplementerRole } from "@/hooks/useIsImplementerRole";
import { useIsKnowledgeManager } from "@/hooks/useIsKnowledgeManager";
import PageHeader from "@/components/layout/PageHeader";
import {
  printKnowledgeArticle,
  printFrameworkImplementation
} from "@/lib/knowledgePrint";
import { isWikiArticle } from "@/lib/knowledgeCategories";

export default function KnowledgeManagement() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState("tree");

  const { canEdit: canEditArticles } = useIsKnowledgeManager();
  const { canImport } = useIsImplementerRole();

  const isAdmin = canEditArticles;

  const { data: articles = [] } = useQuery({
    queryKey: ["knowledgeArticles"],
    queryFn: () =>
      base44.entities.KnowledgeArticle.list("-created_date")
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ["frameworks"],
    queryFn: () => base44.entities.Framework.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      base44.entities.KnowledgeArticle.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries(["knowledgeArticles"]);
      toast.success("Article deleted");
    }
  });

  const filteredArticles = articles.filter((article) => {
    const term = searchTerm.toLowerCase();

    if (!term) return true;

    const fw = frameworks.find(
      (f) => f.id === article.framework_id
    );

    return (
      article.title?.toLowerCase().includes(term) ||
      article.chapter?.toLowerCase().includes(term) ||
      article.tags?.some((tag) =>
        tag.toLowerCase().includes(term)
      ) ||
      fw?.name?.toLowerCase().includes(term)
    );
  });

  const getCategoryColor = (category) => {
    const colors = {
      implementation_guide:
        "bg-indigo-100 text-indigo-700",
      best_practice:
        "bg-emerald-100 text-emerald-700",
      policy_template:
        "bg-violet-100 text-violet-700",
      procedure:
        "bg-amber-100 text-amber-700",
      checklist:
        "bg-red-100 text-red-700",
      wiki_article:
        "bg-cyan-100 text-cyan-700"
    };

    return (
      colors[category] ||
      "bg-slate-100 text-slate-700"
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      draft:
        "bg-slate-100 text-slate-700",
      published:
        "bg-green-100 text-green-700",
      archived:
        "bg-slate-100 text-slate-700"
    };

    return (
      colors[status] ||
      "bg-slate-100 text-slate-700"
    );
  };

  const handleView = (article) => {
    setSelectedArticle(article);
    setIsViewDialogOpen(true);
  };

  const handlePrintArticle = () => {
    if (!selectedArticle) return;

    const fw = frameworks.find(
      (f) => f.id === selectedArticle.framework_id
    );

    printKnowledgeArticle(
      selectedArticle,
      fw?.name
    );
  };

  const handlePrintFramework = (framework) => {
    printFrameworkImplementation(
      framework,
      articles
    );
  };

  const handleCopyLink = () => {
    if (!selectedArticle?.source_url) {
      toast.error(
        "No source URL set for this article"
      );
      return;
    }

    navigator.clipboard
      .writeText(selectedArticle.source_url)
      .then(() => {
        toast.success(
          "Link copied to clipboard — paste into SharePoint, Teams, etc."
        );
      })
      .catch(() => {
        toast.error(
          "Could not copy link"
        );
      });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <PageHeader
          icon={BookOpen}
          title="Knowledge Management"
          tagline="Framework guides, best practices, and documentation"
          gradient="from-indigo-600 to-purple-700"
        />

        <div className="flex items-center gap-2">

          {/* VIEW MODE BUTTONS */}

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">

            <Button
              variant={
                viewMode === "tree"
                  ? "default"
                  : "ghost"
              }
              size="sm"
              onClick={() =>
                setViewMode("tree")
              }
              className={`h-8 ${
                viewMode === "tree"
                  ? "bg-white shadow-sm"
                  : "hover:bg-slate-200"
              }`}
              title="Tree view"
            >
              <ListTree className="w-4 h-4" />
            </Button>

            <Button
              variant={
                viewMode === "gallery"
                  ? "default"
                  : "ghost"
              }
              size="sm"
              onClick={() =>
                setViewMode("gallery")
              }
              className={`h-8 ${
                viewMode === "gallery"
                  ? "bg-white shadow-sm"
                  : "hover:bg-slate-200"
              }`}
              title="Gallery view"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>

          </div>

          {/* IMPORT */}

          {canImport && (
            <KnowledgeArticleImport />
          )}

          {/* NEW ARTICLE */}

          {canEditArticles && (
            <Link
              to={createPageUrl(
                "KnowledgeArticleDetail?new=true"
              )}
            >
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                New Article
              </Button>
            </Link>
          )}

        </div>

      </div>

      {/* SEARCH */}

      <Card className="border-none shadow-lg">

        <CardContent className="p-4">

          <div className="relative">

            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />

            <Input
              placeholder="Search articles, chapters, tags..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="pl-10"
            />

          </div>

        </CardContent>

      </Card>

      {/* ARTICLE LIST */}

      {filteredArticles.length === 0 ? (

        <Card className="border-2 border-dashed border-slate-300 bg-slate-50">

          <CardContent className="p-12 text-center">

            <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />

            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Knowledge Articles
            </h3>

            <p className="text-slate-600 mb-6">
              Create your first article to capture framework knowledge
            </p>

            {canEditArticles && (
              <Link
                to={createPageUrl(
                  "KnowledgeArticleDetail?new=true"
                )}
              >
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Article
                </Button>
              </Link>
            )}

          </CardContent>

        </Card>

      ) : viewMode === "gallery" ? (

        <KnowledgeGalleryView
          articles={filteredArticles}
          frameworks={frameworks}
          onView={handleView}
          canEdit={canEditArticles}
        />

      ) : (

        <KnowledgeTreeView
          articles={filteredArticles}
          frameworks={frameworks}
          onView={handleView}
          onDelete={
            canEditArticles
              ? (id) =>
                  deleteMutation.mutate(id)
              : undefined
          }
          canEdit={canEditArticles}
          onPrintFramework={handlePrintFramework}
        />

      )}

      {/* ARTICLE VIEW DIALOG */}

      <Dialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      >

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">

          <DialogHeader>

            <div className="flex items-center justify-between gap-4 pr-8">

              <DialogTitle>
                {selectedArticle?.title}
              </DialogTitle>

              <div className="flex gap-2">

                {selectedArticle &&
                isWikiArticle(selectedArticle) ? (

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    disabled={
                      !selectedArticle.source_url
                    }
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>

                ) : (

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintArticle}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>

                )}

              </div>

            </div>

          </DialogHeader>

          {selectedArticle && (

            <div className="space-y-6">

              {/* CHAPTER / DOMAIN */}

              {selectedArticle.chapter && (

                <div>

                  <h3 className="font-semibold text-slate-900 mb-1">
                    Chapter/Domain
                  </h3>

                  <p className="text-slate-600">
                    {selectedArticle.chapter}
                  </p>

                </div>

              )}

              {/* DESCRIPTION */}

              {selectedArticle.description && (

                <div>

                  <h3 className="font-semibold text-slate-900 mb-1">
                    Description
                  </h3>

                  <p className="text-slate-600">
                    {selectedArticle.description}
                  </p>

                </div>

              )}

              {/* KEY STEPS */}

              {selectedArticle.key_steps &&
                selectedArticle.key_steps.length >
                  0 && (

                <div>

                  <h3 className="font-semibold text-slate-900 mb-3">
                    Key Steps
                  </h3>

                  <div className="space-y-3">

                    {selectedArticle.key_steps
                      .sort(
                        (a, b) =>
                          (a.order || 0) -
                          (b.order || 0)
                      )
                      .map(
                        (step, idx) => (

                          <div
                            key={idx}
                            className="flex gap-3 p-3 bg-slate-50 rounded-lg"
                          >

                            <div className="flex flex-col items-center gap-1 flex-shrink-0">

                              <div className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold text-[10px]">
                                {step.order ||
                                  idx + 1}
                              </div>

                              {step.reference_number && (
                                <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                                  {
                                    step.reference_number
                                  }
                                </span>
                              )}

                            </div>

                            <div className="flex-1">

                              <p className="font-medium text-slate-900">
                                {step.step}
                              </p>

                              {step.description && (
                                <p className="text-sm text-slate-600 mt-1">
                                  {
                                    step.description
                                  }
                                </p>
                              )}

                              {step.expected_artefacts &&
                                step
                                  .expected_artefacts
                                  .length >
                                  0 && (

                                <div className="mt-2">

                                  <p className="text-xs font-medium text-slate-500 mb-1">
                                    Expected Artefacts/Evidence:
                                  </p>

                                  <div className="flex flex-wrap gap-1">

                                    {step.expected_artefacts.map(
                                      (
                                        artefact,
                                        artefactIdx
                                      ) => (

                                        <span
                                          key={
                                            artefactIdx
                                          }
                                          className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full"
                                        >
                                          {
                                            artefact
                                          }
                                        </span>

                                      )
                                    )}

                                  </div>

                                </div>

                              )}

                            </div>

                          </div>

                        )
                      )}

                  </div>

                </div>

              )}

              {/* ARTICLE CONTENT */}

              {selectedArticle.content && (

                <div>

                  <h3 className="font-semibold text-slate-900 mb-2">
                    Content
                  </h3>

                  <div className="prose prose-sm max-w-none">

                    <p className="text-slate-600 whitespace-pre-wrap">
                      {selectedArticle.content}
                    </p>

                  </div>

                </div>

              )}

              {/* DISCLAIMER */}

              {selectedArticle.disclaimer && (

                <div className="border-t border-slate-200 pt-5">

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">

                    <div className="flex items-start gap-3">

                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

                      <div className="flex-1">

                        <h3 className="font-semibold text-slate-900 mb-2">
                          Disclaimer
                        </h3>

                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                          {selectedArticle.disclaimer}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              )}

              {/* SOURCE ARTICLE */}

              {selectedArticle.source_url && (

                <div>

                  <h3 className="font-semibold text-slate-900 mb-2">
                    Source Article
                  </h3>

                  <a
                    href={selectedArticle.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:underline break-all"
                  >

                    <ExternalLink className="w-4 h-4 flex-shrink-0" />

                    {selectedArticle.source_url}

                  </a>

                </div>

              )}

              {/* PDF DOCUMENTATION */}

              {selectedArticle.pdf_url && (

                <div>

                  <h3 className="font-semibold text-slate-900 mb-2">
                    Documentation
                  </h3>

                  <Button
                    onClick={() =>
                      window.open(
                        selectedArticle.pdf_url,
                        "_blank"
                      )
                    }
                  >

                    <FileText className="w-4 h-4 mr-2" />

                    View PDF Documentation

                  </Button>

                </div>

              )}

              {/* ATTACHMENTS */}

              {selectedArticle.attachments &&
                selectedArticle.attachments
                  .length > 0 && (

                <div>

                  <h3 className="font-semibold text-slate-900 mb-2">
                    Attachments
                  </h3>

                  <div className="space-y-2">

                    {selectedArticle.attachments.map(
                      (
                        attachment,
                        idx
                      ) => (

                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded"
                        >

                          <span className="text-sm text-slate-700">
                            {attachment.name}
                          </span>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(
                                attachment.url,
                                "_blank"
                              )
                            }
                          >

                            <Download className="w-4 h-4" />

                          </Button>

                        </div>

                      )
                    )}

                  </div>

                </div>

              )}

            </div>

          )}

        </DialogContent>

      </Dialog>

    </div>
  );
}

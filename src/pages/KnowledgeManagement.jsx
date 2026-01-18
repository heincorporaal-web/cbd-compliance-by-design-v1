import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Plus, Search, FileText, Download, Eye, Edit2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function KnowledgeManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data: articles = [] } = useQuery({
    queryKey: ['knowledgeArticles'],
    queryFn: () => base44.entities.KnowledgeArticle.list('-created_date'),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.KnowledgeArticle.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['knowledgeArticles']);
      toast.success('Article deleted');
    },
  });

  const filteredArticles = articles.filter(article => 
    article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.chapter?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCategoryColor = (category) => {
    const colors = {
      implementation_guide: 'bg-blue-100 text-blue-700',
      best_practice: 'bg-green-100 text-green-700',
      policy_template: 'bg-purple-100 text-purple-700',
      procedure: 'bg-amber-100 text-amber-700',
      checklist: 'bg-pink-100 text-pink-700'
    };
    return colors[category] || 'bg-slate-100 text-slate-700';
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      published: 'bg-green-100 text-green-700',
      archived: 'bg-slate-100 text-slate-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const handleView = (article) => {
    setSelectedArticle(article);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Knowledge Management</h1>
              <p className="text-slate-600">Framework guides, best practices, and documentation</p>
            </div>
          </div>
        </div>
        <Link to={createPageUrl("KnowledgeArticleDetail?new=true")}>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </Link>
      </div>

      <Card className="border-none shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search articles, chapters, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {filteredArticles.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Knowledge Articles</h3>
            <p className="text-slate-600 mb-6">Create your first article to capture framework knowledge</p>
            <Link to={createPageUrl("KnowledgeArticleDetail?new=true")}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Article
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map(article => {
            const framework = frameworks.find(f => f.id === article.framework_id);
            
            return (
              <Card key={article.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">{article.title}</h3>
                      {article.chapter && (
                        <p className="text-sm text-slate-600">{article.chapter}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.category && (
                      <Badge className={getCategoryColor(article.category)}>
                        {article.category.replace(/_/g, ' ')}
                      </Badge>
                    )}
                    <Badge className={getStatusColor(article.status)}>
                      {article.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {framework && (
                    <div className="mb-3 text-sm">
                      <span className="text-slate-600">Framework: </span>
                      <span className="font-medium text-slate-900">{framework.name}</span>
                    </div>
                  )}
                  {article.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">{article.description}</p>
                  )}
                  {article.key_steps && article.key_steps.length > 0 && (
                    <div className="text-xs text-slate-500 mb-3">
                      {article.key_steps.length} key steps
                    </div>
                  )}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {article.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{article.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(article)}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-2" />
                      View
                    </Button>
                    {article.pdf_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(article.pdf_url, '_blank')}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    )}
                    <Link to={createPageUrl(`KnowledgeArticleDetail?id=${article.id}`)}>
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(article.id)}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.title}</DialogTitle>
          </DialogHeader>
          {selectedArticle && (
            <div className="space-y-6">
              {selectedArticle.chapter && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Chapter/Domain</h3>
                  <p className="text-slate-600">{selectedArticle.chapter}</p>
                </div>
              )}
              
              {selectedArticle.description && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Description</h3>
                  <p className="text-slate-600">{selectedArticle.description}</p>
                </div>
              )}

              {selectedArticle.key_steps && selectedArticle.key_steps.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Key Steps</h3>
                  <div className="space-y-3">
                    {selectedArticle.key_steps
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((step, idx) => (
                        <div key={idx} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                          <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                            {step.order || idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{step.step}</p>
                            {step.description && (
                              <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {selectedArticle.content && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Content</h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-slate-600 whitespace-pre-wrap">{selectedArticle.content}</p>
                  </div>
                </div>
              )}

              {selectedArticle.pdf_url && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Documentation</h3>
                  <Button onClick={() => window.open(selectedArticle.pdf_url, '_blank')}>
                    <FileText className="w-4 h-4 mr-2" />
                    View PDF Documentation
                  </Button>
                </div>
              )}

              {selectedArticle.attachments && selectedArticle.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {selectedArticle.attachments.map((attachment, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm text-slate-700">{attachment.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(attachment.url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
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
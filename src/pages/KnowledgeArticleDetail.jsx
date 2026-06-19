import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plus, Trash2, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";
import UnsavedChangesDialog from "@/components/UnsavedChangesDialog";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export default function KnowledgeArticleDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';

  const CATEGORY_CODES = {
    implementation_guide: "IG",
    best_practice: "BP",
    policy_template: "POL",
    procedure: "PROC",
    checklist: "CHL",
  };

  const [formData, setFormData] = useState({
    shortcode: "",
    reference_number: "",
    title: "",
    framework_id: "",
    chapter: "",
    description: "",
    content: "",
    category: "implementation_guide",
    tags: [],
    key_steps: [],
    pdf_url: "",
    attachments: [],
    status: "draft"
  });

  const { data: allArticles = [] } = useQuery({
    queryKey: ['knowledgeArticles'],
    queryFn: () => base44.entities.KnowledgeArticle.list(),
  });

  // Compute next sequence number for a given shortcode+category combo
  const getNextSeqNumber = (shortcode, category) => {
    if (!shortcode || !category) return 1;
    const catCode = CATEGORY_CODES[category];
    const prefix = `${shortcode.toUpperCase()}-${catCode}-`;
    const existing = allArticles
      .filter(a => a.reference_number?.startsWith(prefix))
      .map(a => parseInt(a.reference_number.replace(prefix, ""), 10))
      .filter(n => !isNaN(n));
    const max = existing.length > 0 ? Math.max(...existing) : 0;
    return max + 1;
  };

  const buildReferenceNumber = (shortcode, category, seq) => {
    if (!shortcode || !category) return "";
    const catCode = CATEGORY_CODES[category];
    return `${shortcode.toUpperCase()}-${catCode}-${String(seq).padStart(3, "0")}`;
  };

  const [newTag, setNewTag] = useState("");
  const [newStep, setNewStep] = useState({ step: "", description: "", order: 1 });
  const { isDirty, checkDirty, initSnapshot, markClean, guardedNavigate, showDialog, confirmDiscard, confirmSave, cancelDialog } = useUnsavedChangesGuard(navigate);

  const { data: existingArticle } = useQuery({
    queryKey: ['knowledgeArticle', articleId],
    queryFn: () => base44.entities.KnowledgeArticle.filter({ id: articleId }).then(res => res[0]),
    enabled: !!articleId && !isNew,
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  useEffect(() => {
    if (existingArticle) {
      setFormData(existingArticle);
      initSnapshot(existingArticle);
    } else if (isNew) {
      initSnapshot(formData);
    }
  }, [existingArticle]);

  // Track dirty state
  useEffect(() => { checkDirty(formData); }, [formData]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.KnowledgeArticle.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['knowledgeArticles']);
      navigate(createPageUrl(`KnowledgeArticleDetail?id=${data.id}`));
      toast.success('Article created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.KnowledgeArticle.update(articleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['knowledgeArticles']);
      queryClient.invalidateQueries(['knowledgeArticle', articleId]);
      toast.success('Article updated');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.shortcode || formData.shortcode.trim().length === 0) {
      toast.error("Shortcode is required");
      return;
    }
    if (formData.shortcode.trim().length > 4) {
      toast.error("Shortcode must be 4 characters or fewer");
      return;
    }
    let dataToSave = { ...formData, shortcode: formData.shortcode.toUpperCase() };
    markClean();
    if (isNew || !articleId) {
      const seq = getNextSeqNumber(formData.shortcode, formData.category);
      dataToSave.reference_number = buildReferenceNumber(formData.shortcode, formData.category, seq);
      await createMutation.mutateAsync(dataToSave);
    } else {
      await updateMutation.mutateAsync(dataToSave);
    }
  };

  const addTag = () => {
    if (newTag) {
      const newTags = newTag.split(";").map(t => t.trim()).filter(t => t && !formData.tags.includes(t));
      if (newTags.length > 0) {
        setFormData({ ...formData, tags: [...formData.tags, ...newTags] });
      }
      setNewTag("");
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const addStep = () => {
    if (newStep.step) {
      const stepOrder = formData.key_steps.length + 1;
      const stepRef = formData.shortcode && formData.category
        ? `${formData.shortcode.toUpperCase()}-${CATEGORY_CODES[formData.category]}-${String(stepOrder).padStart(3, "0")}`
        : "";
      const steps = [...formData.key_steps, { ...newStep, order: stepOrder, reference_number: stepRef }];
      setFormData({ ...formData, key_steps: steps });
      setNewStep({ step: "", description: "", order: formData.key_steps.length + 2 });
    }
  };

  const removeStep = (index) => {
    setFormData({
      ...formData,
      key_steps: formData.key_steps.filter((_, idx) => idx !== index)
    });
  };

  const handlePdfUploaded = (url, name) => {
    setFormData({ ...formData, pdf_url: url });
    toast.success('PDF uploaded');
  };

  const handleAttachmentUploaded = (url, name) => {
    const newAttachments = [...(formData.attachments || []), { url, name, type: 'document' }];
    setFormData({ ...formData, attachments: newAttachments });
  };

  const removeAttachment = (index) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, idx) => idx !== index)
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => guardedNavigate(createPageUrl("KnowledgeManagement"))}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">
            {isNew ? 'New Knowledge Article' : formData.title || 'Edit Article'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => guardedNavigate(createPageUrl("KnowledgeManagement"))}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4 mr-2" />
            {isNew || !articleId ? 'Create Article' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shortcode">Shortcode * <span className="text-slate-400 font-normal text-xs">(max 4 chars, e.g. EDM)</span></Label>
                <Input
                  id="shortcode"
                  value={formData.shortcode}
                  onChange={(e) => setFormData({ ...formData, shortcode: e.target.value.toUpperCase().slice(0, 4) })}
                  placeholder="e.g. EDM"
                  maxLength={4}
                  required
                />
              </div>

              {formData.reference_number && (
                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <div className="h-9 px-3 flex items-center rounded-md border border-slate-200 bg-slate-50 text-sm font-mono text-slate-700">
                    {formData.reference_number}
                  </div>
                </div>
              )}

              <div className={`space-y-2 ${formData.reference_number ? "md:col-span-2" : ""}`}>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="framework_id">Framework (Optional)</Label>
                <Select value={formData.framework_id} onValueChange={(value) => setFormData({ ...formData, framework_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {frameworks.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chapter">Chapter/Domain</Label>
                <Input
                  id="chapter"
                  value={formData.chapter}
                  onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                  placeholder="e.g., Access Control, Cryptography"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="implementation_guide">Implementation Guide</SelectItem>
                    <SelectItem value="best_practice">Best Practice</SelectItem>
                    <SelectItem value="policy_template">Policy Template</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                    <SelectItem value="checklist">Checklist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="content">Full Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Key Steps</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              {formData.key_steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      {step.order || idx + 1}
                    </div>
                    {step.reference_number && (
                      <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded whitespace-nowrap">{step.reference_number}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{step.step}</p>
                    {step.description && <p className="text-sm text-slate-600 mt-1">{step.description}</p>}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(idx)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-3 p-4 border border-slate-200 rounded-lg">
              <div className="space-y-2">
                <Label>Step</Label>
                <Input
                  value={newStep.step}
                  onChange={(e) => setNewStep({ ...newStep, step: e.target.value })}
                  placeholder="Step title"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newStep.description}
                  onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                  rows={2}
                  placeholder="Step description"
                />
              </div>
              <Button type="button" onClick={addStep} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag, idx) => (
                <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                  <span className="text-sm">{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag or multiple tags separated by ;"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>PDF Documentation</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <FileUpload
              onFileUploaded={handlePdfUploaded}
              existingFiles={formData.pdf_url ? [{ url: formData.pdf_url, name: 'Framework PDF' }] : []}
              onFileRemoved={() => setFormData({ ...formData, pdf_url: "" })}
              acceptedTypes=".pdf"
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Additional Attachments</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <FileUpload
              onFileUploaded={handleAttachmentUploaded}
              existingFiles={formData.attachments || []}
              onFileRemoved={removeAttachment}
            />
          </CardContent>
        </Card>
      </form>

      <UnsavedChangesDialog
        open={showDialog}
        onDiscard={confirmDiscard}
        onSave={() => confirmSave(handleSubmit.bind(null, { preventDefault: () => {} }))}
        onClose={cancelDialog}
      />
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import UnsavedChangesDialog from "@/components/UnsavedChangesDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Save, Plus, Trash2, Paperclip } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WorkflowPanel from "@/components/workflows/WorkflowPanel";
import EditableOptionSelect from "@/components/ui/EditableOptionSelect";

const FRAMEWORK_CATEGORY_SEEDED = [
  { value: "information_security", label: "Information Security" },
  { value: "privacy", label: "Privacy" },
  { value: "compliance", label: "Compliance" },
  { value: "operational_risk", label: "Operational Risk" },
  { value: "enterprise_risk", label: "Enterprise Risk" },
  { value: "financial", label: "Financial" },
  { value: "financial_reporting", label: "Financial Reporting" },
  { value: "regulatory", label: "Regulatory" },
  { value: "resilience", label: "Resilience" },
  { value: "process", label: "Process" },
  { value: "quality", label: "Quality" },
  { value: "service_management", label: "Service Management" },
  { value: "software_development", label: "Software Development" },
  { value: "cyber_security", label: "Cyber Security" },
  { value: "3rd_party", label: "3rd Party" },
  { value: "digital_assets", label: "Digital Assets" },
  { value: "fraud", label: "Fraud" },
  { value: "engagement", label: "Engagement" },
  { value: "other", label: "Other" },
];

export default function FrameworkDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const frameworkId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';

  const { isDirty, checkDirty, initSnapshot, markClean, guardedNavigate, showDialog, confirmDiscard, confirmSave, cancelDialog } = useUnsavedChangesGuard(navigate);

  const [formData, setFormData] = useState({
    name: "",
    version: "",
    description: "",
    category: "information_security",
    status: "active",
    end_date: "",
    tags: []
  });

  const [newTag, setNewTag] = useState("");

  const addTag = () => {
    if (!newTag.trim()) return;
    const newTags = newTag.split(";").map(t => t.trim()).filter(t => t && !(formData.tags || []).includes(t));
    if (newTags.length > 0) setFormData(f => ({ ...f, tags: [...(f.tags || []), ...newTags] }));
    setNewTag("");
  };

  const removeTag = (tag) => setFormData(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const { data: existingFramework } = useQuery({
    queryKey: ['framework', frameworkId],
    queryFn: () => base44.entities.Framework.filter({ id: frameworkId }),
    enabled: !!frameworkId && !isNew,
  });

  useEffect(() => {
    if (existingFramework?.[0]) {
      setFormData(existingFramework[0]);
      initSnapshot(existingFramework[0]);
    } else if (isNew) {
      initSnapshot(formData);
    }
  }, [existingFramework]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Framework.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['frameworks']);
      navigate(createPageUrl(`FrameworkDetail?id=${data.id}`));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Framework.update(frameworkId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['frameworks']);
      queryClient.invalidateQueries(['framework', frameworkId]);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    markClean();
    const dataToSave = { ...formData };
    if (dataToSave.end_date) {
      dataToSave.status = "archived";
    }
    if (isNew || !frameworkId) {
      await createMutation.mutateAsync(dataToSave);
    } else {
      await updateMutation.mutateAsync(dataToSave);
      if (dataToSave.status === "archived") {
        queryClient.invalidateQueries(['frameworks']);
        navigate(createPageUrl("Frameworks"));
      }
    }
  };

  // Track dirty state
  useEffect(() => { checkDirty(formData); }, [formData]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => guardedNavigate(createPageUrl("Frameworks"))}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isNew ? 'New Framework' : formData.name || 'Framework Details'}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => guardedNavigate(createPageUrl("Frameworks"))}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {isNew || !frameworkId ? 'Create Framework' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Framework Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Framework Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({...formData, version: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <EditableOptionSelect
                  storageKey="cbd_framework_categories"
                  seededOptions={FRAMEWORK_CATEGORY_SEEDED}
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value})}
                  placeholder="Select category..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date || ""}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
                <p className="text-xs text-slate-400">Setting an end date will archive this framework and remove it from active views on save</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {(formData.tags || []).map((tag, idx) => (
                <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  <span className="text-sm">{tag}</span>
                  <button type="button" onClick={() => removeTag(tag)} className="hover:bg-blue-200 rounded-full p-0.5">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {(formData.tags || []).length === 0 && (
                <p className="text-sm text-slate-400">No tags added yet</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag or multiple tags separated by ;"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              />
              <Button type="button" onClick={addTag} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-slate-600" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <FileUpload
              existingFiles={formData.attachments || []}
              onFileUploaded={(url, name) => {
                const updated = [...(formData.attachments || []), { url, name }];
                const newData = { ...formData, attachments: updated };
                setFormData(newData);
                if (frameworkId && !isNew) updateMutation.mutate(newData);
              }}
              onFileRemoved={(idx) => {
                const updated = (formData.attachments || []).filter((_, i) => i !== idx);
                const newData = { ...formData, attachments: updated };
                setFormData(newData);
                if (frameworkId && !isNew) updateMutation.mutate(newData);
              }}
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

      {frameworkId && !isNew && (
        <WorkflowPanel
          entityType="Framework"
          entityId={frameworkId}
          entityName={formData.name || "Framework"}
          record={existingFramework?.[0]}
          onInstanceCreated={() => queryClient.invalidateQueries(['framework', frameworkId])}
        />
      )}

    </div>
  );
}
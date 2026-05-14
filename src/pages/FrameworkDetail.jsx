import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Save, Plus, X, Target, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WorkflowPanel from "@/components/workflows/WorkflowPanel";

export default function FrameworkDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const frameworkId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';

  const [isObjectiveDialogOpen, setIsObjectiveDialogOpen] = useState(false);
  const [isPrincipleRiskDialogOpen, setIsPrincipleRiskDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    version: "",
    description: "",
    category: "information_security",
    status: "active",
    linked_objective_ids: [],
    linked_principle_risk_ids: []
  });

  const { data: existingFramework } = useQuery({
    queryKey: ['framework', frameworkId],
    queryFn: () => base44.entities.Framework.filter({ id: frameworkId }),
    enabled: !!frameworkId && !isNew,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  React.useEffect(() => {
    if (existingFramework?.[0]) {
      setFormData(existingFramework[0]);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isNew || !frameworkId) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const availableObjectives = selectedCompany?.objectives || [];
  const availablePrincipleRisks = selectedCompany?.principle_risks || [];

  const linkedObjectives = companies.flatMap(c => 
    (c.objectives || []).filter(obj => formData.linked_objective_ids?.includes(obj.id))
      .map(obj => ({ ...obj, companyName: c.name }))
  );

  const linkedPrincipleRisks = companies.flatMap(c => 
    (c.principle_risks || []).filter(risk => formData.linked_principle_risk_ids?.includes(risk.id))
      .map(risk => ({ ...risk, companyName: c.name }))
  );

  const addObjective = (objectiveId) => {
    if (!formData.linked_objective_ids?.includes(objectiveId)) {
      const updated = [...(formData.linked_objective_ids || []), objectiveId];
      setFormData({ ...formData, linked_objective_ids: updated });
      if (frameworkId) updateMutation.mutate({ ...formData, linked_objective_ids: updated });
    }
    setIsObjectiveDialogOpen(false);
  };

  const removeObjective = (objectiveId) => {
    const updated = formData.linked_objective_ids.filter(id => id !== objectiveId);
    setFormData({ ...formData, linked_objective_ids: updated });
    if (frameworkId) updateMutation.mutate({ ...formData, linked_objective_ids: updated });
  };

  const addPrincipleRisk = (riskId) => {
    if (!formData.linked_principle_risk_ids?.includes(riskId)) {
      const updated = [...(formData.linked_principle_risk_ids || []), riskId];
      setFormData({ ...formData, linked_principle_risk_ids: updated });
      if (frameworkId) updateMutation.mutate({ ...formData, linked_principle_risk_ids: updated });
    }
    setIsPrincipleRiskDialogOpen(false);
  };

  const removePrincipleRisk = (riskId) => {
    const updated = formData.linked_principle_risk_ids.filter(id => id !== riskId);
    setFormData({ ...formData, linked_principle_risk_ids: updated });
    if (frameworkId) updateMutation.mutate({ ...formData, linked_principle_risk_ids: updated });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Frameworks")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isNew ? 'New Framework' : formData.name || 'Framework Details'}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("Frameworks")}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
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
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="information_security">Information Security</SelectItem>
                    <SelectItem value="privacy">Privacy</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="operational_risk">Operational Risk</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Company Objectives
                </CardTitle>
                <Dialog open={isObjectiveDialogOpen} onOpenChange={setIsObjectiveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Link Company Objective</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {availableObjectives.filter(obj => !formData.linked_objective_ids?.includes(obj.id)).map(obj => (
                          <div
                            key={obj.id}
                            className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                            onClick={() => addObjective(obj.id)}
                          >
                            <p className="font-medium text-sm">{obj.title}</p>
                            {obj.description && <p className="text-xs text-slate-600 mt-1">{obj.description}</p>}
                          </div>
                        ))}
                        {selectedCompanyId && availableObjectives.filter(obj => !formData.linked_objective_ids?.includes(obj.id)).length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-4">No objectives available</p>
                        )}
                        {!selectedCompanyId && (
                          <p className="text-sm text-slate-500 text-center py-4">Select a company first</p>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {linkedObjectives.length > 0 ? (
                <div className="space-y-2">
                  {linkedObjectives.map(obj => (
                    <div key={obj.id} className="flex items-start justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-slate-900">{obj.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{obj.companyName}</p>
                        {obj.description && <p className="text-xs text-slate-600 mt-1">{obj.description}</p>}
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeObjective(obj.id)}>
                        <X className="w-3 h-3 text-slate-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No objectives linked</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Principle Risks
                </CardTitle>
                <Dialog open={isPrincipleRiskDialogOpen} onOpenChange={setIsPrincipleRiskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Link Principle Risk</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {availablePrincipleRisks.filter(risk => !formData.linked_principle_risk_ids?.includes(risk.id)).map(risk => (
                          <div
                            key={risk.id}
                            className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                            onClick={() => addPrincipleRisk(risk.id)}
                          >
                            <p className="font-medium text-sm">{risk.title}</p>
                            {risk.description && <p className="text-xs text-slate-600 mt-1">{risk.description}</p>}
                          </div>
                        ))}
                        {selectedCompanyId && availablePrincipleRisks.filter(risk => !formData.linked_principle_risk_ids?.includes(risk.id)).length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-4">No principle risks available</p>
                        )}
                        {!selectedCompanyId && (
                          <p className="text-sm text-slate-500 text-center py-4">Select a company first</p>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {linkedPrincipleRisks.length > 0 ? (
                <div className="space-y-2">
                  {linkedPrincipleRisks.map(risk => (
                    <div key={risk.id} className="flex items-start justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-slate-900">{risk.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{risk.companyName}</p>
                        {risk.description && <p className="text-xs text-slate-600 mt-1">{risk.description}</p>}
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePrincipleRisk(risk.id)}>
                        <X className="w-3 h-3 text-slate-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No principle risks linked</p>
              )}
            </CardContent>
          </Card>
        </div>
      </form>

      {frameworkId && !isNew && (
        <WorkflowPanel
          entityType="Framework"
          entityId={frameworkId}
          entityName={formData.name || "Framework"}
          companyId={selectedCompanyId}
          record={existingFramework?.[0]}
          onInstanceCreated={() => queryClient.invalidateQueries(['framework', frameworkId])}
        />
      )}
    </div>
  );
}
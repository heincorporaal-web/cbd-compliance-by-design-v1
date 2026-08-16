import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Plus, Trash2, Network, Shield, AlertTriangle, AlertCircle, Target, ClipboardCheck, Link as LinkIcon, X, Link2, ListChecks } from "lucide-react";
import ActionsMenu from "@/components/ui/ActionsMenu";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import CompanyField from "@/components/CompanyField";

export default function ProcessDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const processId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';
  const [globalCompany, , { locked, assignedCompanyId }] = useCompanyFilter();

  const [formData, setFormData] = useState({
    process_code: "",
    name: "",
    description: "",
    company_id: locked ? assignedCompanyId : (globalCompany && globalCompany !== "all" ? globalCompany : ""),
    level: 0,
    parent_id: "",
    value_chain: "",
    process_owner: "",
    global_control_owner: "",
    workstream: "",
    status: "active",
    linked_risk_ids: [],
    linked_control_ids: [],
    linked_issue_ids: [],
    linked_goal_ids: [],
    linked_assessment_ids: [],
    linked_objective_ids: [],
    linked_principle_risk_ids: [],
    documentation_url: "",
    frequency: "ad_hoc",
    estimated_duration: "",
    automation_level: "manual",
    criticality: "medium",
    inputs: "",
    outputs: "",
    key_performance_indicators: "",
    notes: ""
  });

  const [activeDialog, setActiveDialog] = useState(null);
  const [isObjectiveDialogOpen, setIsObjectiveDialogOpen] = useState(false);
  const [isPrincipleRiskDialogOpen, setIsPrincipleRiskDialogOpen] = useState(false);
  const [isLinksDialogOpen, setIsLinksDialogOpen] = useState(false);
  const [isExecutionDialogOpen, setIsExecutionDialogOpen] = useState(false);

  const { data: existingProcess } = useQuery({
    queryKey: ['businessProcess', processId],
    queryFn: () => base44.entities.BusinessProcess.filter({ id: processId }),
    enabled: !!processId && !isNew,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: processes = [] } = useQuery({
    queryKey: ['businessProcesses'],
    queryFn: () => base44.entities.BusinessProcess.list(),
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.Risk.list(),
  });

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list(),
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues'],
    queryFn: () => base44.entities.Issue.list(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['grcGoals'],
    queryFn: () => base44.entities.GRCGoal.list(),
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list(),
  });

  useEffect(() => {
    if (existingProcess?.[0]) {
      setFormData(existingProcess[0]);
    }
  }, [existingProcess]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BusinessProcess.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['businessProcesses']);
      navigate(createPageUrl(`ProcessDetail?id=${data.id}`));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.BusinessProcess.update(processId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['businessProcesses']);
      queryClient.invalidateQueries(['businessProcess', processId]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isNew || !processId) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const addLink = (type, id) => {
    const field = `linked_${type}_ids`;
    if (!formData[field].includes(id)) {
      const updated = [...formData[field], id];
      const newData = { ...formData, [field]: updated };
      setFormData(newData);
      if (processId) updateMutation.mutate(newData);
    }
    setActiveDialog(null);
  };

  const removeLink = (type, id) => {
    const field = `linked_${type}_ids`;
    const updated = formData[field].filter(linkId => linkId !== id);
    const newData = { ...formData, [field]: updated };
    setFormData(newData);
    if (processId) updateMutation.mutate(newData);
  };

  const addObjective = (objectiveId) => {
    if (!formData.linked_objective_ids?.includes(objectiveId)) {
      const updated = [...(formData.linked_objective_ids || []), objectiveId];
      setFormData({ ...formData, linked_objective_ids: updated });
      if (processId) updateMutation.mutate({ ...formData, linked_objective_ids: updated });
    }
    setIsObjectiveDialogOpen(false);
  };

  const removeObjective = (objectiveId) => {
    const updated = formData.linked_objective_ids.filter(id => id !== objectiveId);
    setFormData({ ...formData, linked_objective_ids: updated });
    if (processId) updateMutation.mutate({ ...formData, linked_objective_ids: updated });
  };

  const addPrincipleRisk = (riskId) => {
    if (!formData.linked_principle_risk_ids?.includes(riskId)) {
      const updated = [...(formData.linked_principle_risk_ids || []), riskId];
      setFormData({ ...formData, linked_principle_risk_ids: updated });
      if (processId) updateMutation.mutate({ ...formData, linked_principle_risk_ids: updated });
    }
    setIsPrincipleRiskDialogOpen(false);
  };

  const removePrincipleRisk = (riskId) => {
    const updated = formData.linked_principle_risk_ids.filter(id => id !== riskId);
    setFormData({ ...formData, linked_principle_risk_ids: updated });
    if (processId) updateMutation.mutate({ ...formData, linked_principle_risk_ids: updated });
  };

  const levelLabels = {
    0: "Value Chain",
    1: "Process Group",
    2: "Process",
    3: "Sub-Process",
    4: "Procedure",
    5: "Task",
    6: "Activity/Keystroke"
  };

  const potentialParents = processes.filter(p => 
    p.level < formData.level && 
    p.id !== processId &&
    p.company_id === formData.company_id
  );

  const linkedRisks = risks.filter(r => formData.linked_risk_ids?.includes(r.id));
  const linkedControls = controls.filter(c => formData.linked_control_ids?.includes(c.id));
  const linkedIssues = issues.filter(i => formData.linked_issue_ids?.includes(i.id));
  const linkedGoals = goals.filter(g => formData.linked_goal_ids?.includes(g.id));
  const linkedAssessments = assessments.filter(a => formData.linked_assessment_ids?.includes(a.id));

  const { data: orgObjectives = [] } = useQuery({
    queryKey: ['orgObjectives'],
    queryFn: () => base44.entities.OrgObjective.list(),
  });

  const company = companies.find(c => c.id === formData.company_id);
  const availableObjectives = company?.objectives || [];
  const availablePrincipleRisks = company?.principle_risks || [];
  const linkedObjectives = availableObjectives.filter(obj => formData.linked_objective_ids?.includes(obj.id));
  const linkedPrincipleRisks = availablePrincipleRisks.filter(risk => formData.linked_principle_risk_ids?.includes(risk.id));

  // OrgObjective entity linkage
  const companyOrgObjectives = orgObjectives.filter(o => !formData.company_id || o.company_id === formData.company_id);
  const linkedOrgObjectiveIds = formData.linked_org_objective_ids || [];
  const linkedOrgObjectives = orgObjectives.filter(o => linkedOrgObjectiveIds.includes(o.id));

  const toggleOrgObjective = (id, add) => {
    const next = add ? [...linkedOrgObjectiveIds, id] : linkedOrgObjectiveIds.filter(x => x !== id);
    const newData = { ...formData, linked_org_objective_ids: next };
    setFormData(newData);
    if (processId) updateMutation.mutate(newData);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("iHPOM")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isNew ? 'New Business Process' : formData.name || 'Process Details'}
            </h1>
            <p className="text-slate-600">iHPOM Process Management</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {!isNew && processId && (
            <ActionsMenu
              actions={[
                { label: 'Manage Links', icon: Link2, onClick: () => setIsLinksDialogOpen(true) },
                { label: 'Execution Details', icon: ListChecks, onClick: () => setIsExecutionDialogOpen(true) },
              ]}
            />
          )}
          <Link to={createPageUrl("iHPOM")}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
            <Save className="w-4 h-4 mr-2" />
            {isNew || !processId ? 'Create Process' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="process_code">Process Code *</Label>
                    <Input
                      id="process_code"
                      value={formData.process_code}
                      onChange={(e) => setFormData({...formData, process_code: e.target.value})}
                      placeholder="e.g., P1.1.2.1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">Hierarchy Level *</Label>
                    <Select value={formData.level.toString()} onValueChange={(value) => setFormData({...formData, level: parseInt(value), parent_id: ""})} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(levelLabels).map(([level, label]) => (
                          <SelectItem key={level} value={level}>L{level}: {label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <CompanyField value={formData.company_id} onChange={(value) => setFormData({...formData, company_id: value, parent_id: ""})} companies={companies} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Process Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.level > 0 && potentialParents.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="parent_id">Parent Process</Label>
                      <Select value={formData.parent_id} onValueChange={(value) => setFormData({...formData, parent_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>None</SelectItem>
                          {potentialParents.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              L{p.level}: {p.process_code} - {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {formData.level === 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="value_chain">Value Chain</Label>
                      <Input
                        id="value_chain"
                        value={formData.value_chain}
                        onChange={(e) => setFormData({...formData, value_chain: e.target.value})}
                        placeholder="e.g., Customer Service, Operations"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="criticality">Criticality</Label>
                    <Select value={formData.criticality} onValueChange={(value) => setFormData({...formData, criticality: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="process_owner">Process Owner</Label>
                    <Input
                      id="process_owner"
                      value={formData.process_owner}
                      onChange={(e) => setFormData({...formData, process_owner: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="global_control_owner">Global Control Owner</Label>
                    <Input
                      id="global_control_owner"
                      value={formData.global_control_owner}
                      onChange={(e) => setFormData({...formData, global_control_owner: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workstream">Workstream</Label>
                    <Input
                      id="workstream"
                      value={formData.workstream}
                      onChange={(e) => setFormData({...formData, workstream: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documentation_url">Documentation URL</Label>
                    <Input
                      id="documentation_url"
                      type="url"
                      value={formData.documentation_url}
                      onChange={(e) => setFormData({...formData, documentation_url: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Dialog open={isLinksDialogOpen} onOpenChange={setIsLinksDialogOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage Links</DialogTitle>
              </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risks */}
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Linked Risks
                    </CardTitle>
                    <Dialog open={activeDialog === 'risk'} onOpenChange={(open) => setActiveDialog(open ? 'risk' : null)}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Link Risk</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {risks.filter(r => !formData.linked_risk_ids?.includes(r.id)).map(risk => (
                            <div
                              key={risk.id}
                              className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                              onClick={() => addLink('risk', risk.id)}
                            >
                              <p className="font-medium">{risk.title}</p>
                              <p className="text-sm text-slate-600">{risk.category?.replace('_', ' ')}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {linkedRisks.length > 0 ? (
                    <div className="space-y-2">
                      {linkedRisks.map(risk => (
                        <div key={risk.id} className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                          <span className="text-sm">{risk.title}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLink('risk', risk.id)}>
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No risks linked</p>
                  )}
                </CardContent>
              </Card>

              {/* Controls */}
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      Linked Controls
                    </CardTitle>
                    <Dialog open={activeDialog === 'control'} onOpenChange={(open) => setActiveDialog(open ? 'control' : null)}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Link Control</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {controls.filter(c => !formData.linked_control_ids?.includes(c.id)).map(control => (
                            <div
                              key={control.id}
                              className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                              onClick={() => addLink('control', control.id)}
                            >
                              <p className="font-medium">{control.control_id} - {control.title}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {linkedControls.length > 0 ? (
                    <div className="space-y-2">
                      {linkedControls.map(control => (
                        <div key={control.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                          <span className="text-sm">{control.control_id} - {control.title}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLink('control', control.id)}>
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No controls linked</p>
                  )}
                </CardContent>
              </Card>

              {/* Issues */}
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      Linked Issues
                    </CardTitle>
                    <Dialog open={activeDialog === 'issue'} onOpenChange={(open) => setActiveDialog(open ? 'issue' : null)}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Link Issue</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {issues.filter(i => !formData.linked_issue_ids?.includes(i.id)).map(issue => (
                            <div
                              key={issue.id}
                              className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                              onClick={() => addLink('issue', issue.id)}
                            >
                              <p className="font-medium">{issue.title}</p>
                              <p className="text-sm text-slate-600">{issue.issue_type?.replace('_', ' ')}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {linkedIssues.length > 0 ? (
                    <div className="space-y-2">
                      {linkedIssues.map(issue => (
                        <div key={issue.id} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                          <span className="text-sm">{issue.title}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLink('issue', issue.id)}>
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No issues linked</p>
                  )}
                </CardContent>
              </Card>

              {/* Goals */}
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      Linked GRC Goals
                    </CardTitle>
                    <Dialog open={activeDialog === 'goal'} onOpenChange={(open) => setActiveDialog(open ? 'goal' : null)}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Link GRC Goal</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {goals.filter(g => !formData.linked_goal_ids?.includes(g.id)).map(goal => (
                            <div
                              key={goal.id}
                              className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                              onClick={() => addLink('goal', goal.id)}
                            >
                              <p className="font-medium">{goal.title}</p>
                              <p className="text-sm text-slate-600">{goal.category?.replace('_', ' ')}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {linkedGoals.length > 0 ? (
                    <div className="space-y-2">
                      {linkedGoals.map(goal => (
                        <div key={goal.id} className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-200">
                          <span className="text-sm">{goal.title}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLink('goal', goal.id)}>
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No goals linked</p>
                  )}
                </CardContent>
              </Card>

              {/* Objectives */}
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Company Objectives
                    </CardTitle>
                    <Dialog open={isObjectiveDialogOpen} onOpenChange={setIsObjectiveDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm" disabled={!formData.company_id}>
                          <Plus className="w-4 h-4 mr-2" />
                          Link
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Link Company Objective</DialogTitle>
                        </DialogHeader>
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
                          {availableObjectives.filter(obj => !formData.linked_objective_ids?.includes(obj.id)).length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No objectives available. Define them in the company settings.</p>
                          )}
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

              {/* Principle Risks */}
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Principle Risks
                    </CardTitle>
                    <Dialog open={isPrincipleRiskDialogOpen} onOpenChange={setIsPrincipleRiskDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm" disabled={!formData.company_id}>
                          <Plus className="w-4 h-4 mr-2" />
                          Link
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Link Principle Risk</DialogTitle>
                        </DialogHeader>
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
                          {availablePrincipleRisks.filter(risk => !formData.linked_principle_risk_ids?.includes(risk.id)).length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No principle risks available. Define them in the company settings.</p>
                          )}
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

              {/* Assessments */}
              <Card className="border-none shadow-lg lg:col-span-2">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-green-600" />
                      Linked Assessments
                    </CardTitle>
                    <Dialog open={activeDialog === 'assessment'} onOpenChange={(open) => setActiveDialog(open ? 'assessment' : null)}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Link Assessment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {assessments.filter(a => !formData.linked_assessment_ids?.includes(a.id)).map(assessment => (
                            <div
                              key={assessment.id}
                              className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                              onClick={() => addLink('assessment', assessment.id)}
                            >
                              <p className="font-medium">{assessment.name}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {linkedAssessments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {linkedAssessments.map(assessment => (
                        <div key={assessment.id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                          <span className="text-sm">{assessment.name}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLink('assessment', assessment.id)}>
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No assessments linked</p>
                  )}
                </CardContent>
              </Card>

              {/* Org Objectives (new entity) */}
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-indigo-600" />
                      Org. Objectives
                    </CardTitle>
                    <Dialog open={activeDialog === 'org_obj'} onOpenChange={open => setActiveDialog(open ? 'org_obj' : null)}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Link Org. Objective</DialogTitle></DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {companyOrgObjectives.filter(o => !linkedOrgObjectiveIds.includes(o.id)).map(o => (
                            <div key={o.id} className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => { toggleOrgObjective(o.id, true); setActiveDialog(null); }}>
                              <p className="font-medium text-sm">{o.title}</p>
                              <p className="text-xs text-slate-500 capitalize">{o.category} · {o.status}</p>
                            </div>
                          ))}
                          {companyOrgObjectives.filter(o => !linkedOrgObjectiveIds.includes(o.id)).length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No objectives available for this company.</p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {linkedOrgObjectives.length > 0 ? (
                    <div className="space-y-2">
                      {linkedOrgObjectives.map(o => (
                        <div key={o.id} className="flex items-center justify-between p-2 bg-indigo-50 rounded border border-indigo-200">
                          <div>
                            <p className="text-sm font-medium">{o.title}</p>
                            <p className="text-xs text-slate-500 capitalize">{o.category}</p>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleOrgObjective(o.id, false)}>
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No org. objectives linked</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Company Objectives
                    </CardTitle>
                    <Dialog open={isObjectiveDialogOpen} onOpenChange={setIsObjectiveDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm" disabled={!formData.company_id}>
                          <Plus className="w-4 h-4 mr-2" />
                          Link Objective
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Link Company Objective</DialogTitle>
                        </DialogHeader>
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
                          {availableObjectives.filter(obj => !formData.linked_objective_ids?.includes(obj.id)).length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No objectives available. Define them in the company settings.</p>
                          )}
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
                            {obj.description && <p className="text-xs text-slate-600 mt-1">{obj.description}</p>}
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeObjective(obj.id)}>
                            <X className="w-3 h-3 text-slate-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No company objectives linked</p>
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
                        <Button type="button" variant="outline" size="sm" disabled={!formData.company_id}>
                          <Plus className="w-4 h-4 mr-2" />
                          Link Principle Risk
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Link Principle Risk</DialogTitle>
                        </DialogHeader>
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
                          {availablePrincipleRisks.filter(risk => !formData.linked_principle_risk_ids?.includes(risk.id)).length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No principle risks available. Define them in the company settings.</p>
                          )}
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
            </DialogContent>
          </Dialog>

          <Dialog open={isExecutionDialogOpen} onOpenChange={setIsExecutionDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Execution Details</DialogTitle>
              </DialogHeader>
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Execution Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={formData.frequency} onValueChange={(value) => setFormData({...formData, frequency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="continuous">Continuous</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                        <SelectItem value="ad_hoc">Ad Hoc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_duration">Estimated Duration</Label>
                    <Input
                      id="estimated_duration"
                      value={formData.estimated_duration}
                      onChange={(e) => setFormData({...formData, estimated_duration: e.target.value})}
                      placeholder="e.g., 2 hours, 30 minutes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="automation_level">Automation Level</Label>
                    <Select value={formData.automation_level} onValueChange={(value) => setFormData({...formData, automation_level: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="semi_automated">Semi-Automated</SelectItem>
                        <SelectItem value="fully_automated">Fully Automated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inputs">Process Inputs</Label>
                  <Textarea
                    id="inputs"
                    value={formData.inputs}
                    onChange={(e) => setFormData({...formData, inputs: e.target.value})}
                    rows={2}
                    placeholder="What inputs does this process require?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outputs">Process Outputs</Label>
                  <Textarea
                    id="outputs"
                    value={formData.outputs}
                    onChange={(e) => setFormData({...formData, outputs: e.target.value})}
                    rows={2}
                    placeholder="What outputs does this process produce?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="key_performance_indicators">Key Performance Indicators</Label>
                  <Textarea
                    id="key_performance_indicators"
                    value={formData.key_performance_indicators}
                    onChange={(e) => setFormData({...formData, key_performance_indicators: e.target.value})}
                    rows={2}
                    placeholder="How is this process measured?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            </DialogContent>
          </Dialog>

        </form>
    </div>
  );
}
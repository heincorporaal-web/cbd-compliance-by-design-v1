import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Shield, CheckCircle, AlertTriangle, Plus, Trash2, History, Target, Pencil, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import LifecycleActions from "@/components/lifecycle/LifecycleActions";
import LifecycleHistory from "@/components/lifecycle/LifecycleHistory";
import LifecycleNotifications from "@/components/lifecycle/LifecycleNotifications";
import WorkflowPanel from "@/components/workflows/WorkflowPanel";
import StakeholderOwnerPicker from "@/components/stakeholders/StakeholderOwnerPicker";
import CompensatingControlPicker from "@/components/controls/CompensatingControlPicker";
import TestPlanPanel from "@/components/controls/TestPlanPanel";

export default function ControlDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const controlId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';

  const [formData, setFormData] = useState({
    framework_id: "",
    control_id: "",
    title: "",
    description: "",
    category: "",
    priority: "medium",
    status: "draft",
    compensating_control_ids: [],
    linked_objective_ids: [],
    owner_stakeholder_id: "",
    reviewer_stakeholder_id: "",
    // Library fields from Excel schema
    global: false,
    control_ccm: false,
    self_assessment: false,
    control_criticality: "Should Have",
    control_owner: "",
    key_control: false,
    control_execution_type: "Manual",
    control_type: "Preventive",
    finance_control_consideration: false,
    control_frequency: "Monthly",
    compensating_control: false,
    compensating_control_risk: "",
    control_narrative_url: "",
    upload_document: "0",
    control_objective_id: "",
    process_phase: "Process - Input",
    risk_id: "",
    is_library_control: false,
  });

  const [isAddingCompensating, setIsAddingCompensating] = useState(false);
  const [isAmending, setIsAmending] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState("");
  const [amendOriginalData, setAmendOriginalData] = useState(null);
  const [showAmendSubmitDialog, setShowAmendSubmitDialog] = useState(false);

  const { data: existingControl } = useQuery({
    queryKey: ['control', controlId],
    queryFn: () => base44.entities.Control.filter({ id: controlId }),
    enabled: !!controlId && !isNew,
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const { data: controlAssessments = [] } = useQuery({
    queryKey: ['controlAssessments', controlId],
    queryFn: () => base44.entities.ControlAssessment.filter({ control_id: controlId }),
    enabled: !!controlId && !isNew,
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list(),
  });

  const { data: allControls = [] } = useQuery({
    queryKey: ['allControls'],
    queryFn: () => base44.entities.Control.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  useEffect(() => {
    if (existingControl?.[0]) {
      setFormData({
        ...existingControl[0],
        global: existingControl[0].global ?? false,
        control_ccm: existingControl[0].control_ccm ?? false,
        self_assessment: existingControl[0].self_assessment ?? false,
        control_criticality: existingControl[0].control_criticality || "Should Have",
        control_owner: existingControl[0].control_owner || "",
        key_control: existingControl[0].key_control ?? false,
        control_execution_type: existingControl[0].control_execution_type || "Manual",
        control_type: existingControl[0].control_type || "Preventive",
        finance_control_consideration: existingControl[0].finance_control_consideration ?? false,
        control_frequency: existingControl[0].control_frequency || "Monthly",
        compensating_control: existingControl[0].compensating_control ?? false,
        compensating_control_risk: existingControl[0].compensating_control_risk || "",
        control_narrative_url: existingControl[0].control_narrative_url || "",
        upload_document: existingControl[0].upload_document || "0",
        control_objective_id: existingControl[0].control_objective_id || "",
        process_phase: existingControl[0].process_phase || "Process - Input",
        risk_id: existingControl[0].risk_id || "",
        is_library_control: existingControl[0].is_library_control ?? false,
      });
    }
  }, [existingControl]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Control.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['controls']);
      navigate(createPageUrl(`ControlDetail?id=${data.id}`));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Control.update(controlId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['controls']);
      queryClient.invalidateQueries(['control', controlId]);
      toast.success('Control updated successfully');
    },
  });

  const addLifecycleEvent = (status, comments = "") => {
    const event = {
      status,
      actor: "Current User",
      timestamp: new Date().toISOString(),
      comments
    };
    const history = [...(existingControl?.[0]?.lifecycle_history || []), event];
    return history;
  };

  const submitForReview = async () => {
    await updateMutation.mutateAsync({
      status: "pending_review",
      lifecycle_history: addLifecycleEvent("pending_review", "Submitted for review")
    });
    toast.success("Control submitted for review");
  };

  const returnControl = async (comments) => {
    await updateMutation.mutateAsync({
      status: "returned",
      return_comments: comments,
      lifecycle_history: addLifecycleEvent("returned", comments)
    });
    toast.success("Control returned");
  };

  const approveControl = async () => {
    const user = await base44.auth.me();
    await updateMutation.mutateAsync({
      status: "approved",
      approver: user.full_name,
      approval_date: new Date().toISOString(),
      lifecycle_history: addLifecycleEvent("approved", "Control approved")
    });
    toast.success("Control approved");
  };

  const startAmendment = () => {
    setAmendOriginalData({ ...formData });
    setAmendmentReason("");
    setIsAmending(true);
  };

  const cancelAmendment = () => {
    if (amendOriginalData) setFormData(amendOriginalData);
    setIsAmending(false);
    setAmendmentReason("");
    setAmendOriginalData(null);
  };

  const submitAmendmentMutation = useMutation({
    mutationFn: async () => {
      const me = await base44.auth.me();
      const changes = [];
      if (formData.title !== amendOriginalData?.title) changes.push(`Title changed`);
      if (formData.description !== amendOriginalData?.description) changes.push(`Description updated`);
      if (formData.priority !== amendOriginalData?.priority) changes.push(`Priority: ${amendOriginalData?.priority} → ${formData.priority}`);
      if (formData.control_type !== amendOriginalData?.control_type) changes.push(`Control type: ${amendOriginalData?.control_type} → ${formData.control_type}`);
      if (formData.control_frequency !== amendOriginalData?.control_frequency) changes.push(`Frequency: ${amendOriginalData?.control_frequency} → ${formData.control_frequency}`);
      if (formData.control_execution_type !== amendOriginalData?.control_execution_type) changes.push(`Execution type: ${amendOriginalData?.control_execution_type} → ${formData.control_execution_type}`);
      const changeSummary = changes.length > 0 ? changes.join("; ") : "Minor updates";

      const amendmentRecord = {
        amended_by: me.email,
        amended_at: new Date().toISOString(),
        reason: amendmentReason,
        changes: changeSummary,
      };

      const allWorkflows = await base44.entities.Workflow.list();
      const allStakeholders = await base44.entities.Stakeholder.list();
      const reviewerEmails = allStakeholders
        .filter(s => s.job_title?.toLowerCase().includes("audit") || s.job_title?.toLowerCase().includes("compliance"))
        .map(s => s.email).filter(Boolean);

      let workflow = allWorkflows.find(w => w.entity_type === "Control" && w.status === "active");
      if (!workflow) {
        workflow = await base44.entities.Workflow.create({
          name: "Control - Review and Approval",
          entity_type: "Control",
          trigger_condition: "manual",
          status: "active",
          allow_originator_resubmit: true,
          steps: [
            { id: "step_review", name: "Control Review", type: "approval", order: 1, assignee_type: "named_emails", approvers: reviewerEmails, comment_required: true },
            { id: "step_approve", name: "Control Approval", type: "approval", order: 2, assignee_type: "named_emails", approvers: reviewerEmails, comment_required: false },
          ],
        });
      }

      const submissionNote = `AMENDMENT — ${changeSummary}. Reason: ${amendmentReason}`;
      const instance = await base44.entities.WorkflowInstance.create({
        workflow_id: workflow.id,
        entity_type: "Control",
        entity_id: controlId,
        entity_name: formData.title,
        status: "in_progress",
        current_step: 0,
        originator_email: me.email,
        step_history: [{ step_id: "amendment_submitted", step_name: "Amendment Submitted", action: "approved", actor: me.email, timestamp: new Date().toISOString(), comments: submissionNote }],
        pending_approvers: workflow.steps?.[0]?.approvers || reviewerEmails,
      });

      const ctrl = existingControl?.[0];
      await base44.entities.Control.update(controlId, {
        ...formData,
        status: "pending_review",
        workflow_instance_id: instance.id,
        amendment_history: [...(ctrl?.amendment_history || []), amendmentRecord],
        workflow_status_history: [...(ctrl?.workflow_status_history || []), { status: "pending_review", actor: me.email, timestamp: new Date().toISOString(), comments: submissionNote }],
        lifecycle_history: [...(ctrl?.lifecycle_history || []), { status: "pending_review", actor: me.email, timestamp: new Date().toISOString(), comments: submissionNote }],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["controls"]);
      queryClient.invalidateQueries(["control", controlId]);
      toast.success("Amendment submitted for re-approval.");
      setIsAmending(false);
      setAmendmentReason("");
      setAmendOriginalData(null);
      setShowAmendSubmitDialog(false);
    },
    onError: (err) => toast.error(err.message || "Failed to submit amendment"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isNew || !controlId) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return colors[priority] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      compliant: 'bg-green-100 text-green-700',
      partial: 'bg-yellow-100 text-yellow-700',
      non_compliant: 'bg-red-100 text-red-700',
      not_applicable: 'bg-slate-100 text-slate-700',
      not_assessed: 'bg-blue-100 text-blue-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const framework = frameworks.find(f => f.id === formData.framework_id);

  const complianceRate = controlAssessments.length > 0
    ? Math.round((controlAssessments.filter(ca => ca.status === 'compliant').length / controlAssessments.length) * 100)
    : 0;

  const addCompensatingControl = (compensatingControlId) => {
    if (!formData.compensating_control_ids?.includes(compensatingControlId)) {
      const updated = [...(formData.compensating_control_ids || []), compensatingControlId];
      const newData = { ...formData, compensating_control_ids: updated };
      setFormData(newData);
      if (controlId) updateMutation.mutate(newData);
    }
    setIsAddingCompensating(false);
  };

  const removeCompensatingControl = (compensatingControlId) => {
    const updated = formData.compensating_control_ids?.filter(id => id !== compensatingControlId) || [];
    const newData = { ...formData, compensating_control_ids: updated };
    setFormData(newData);
    if (controlId) updateMutation.mutate(newData);
  };

  const compensatingControlIds = formData.compensating_control_ids || [];

  const allObjectives = companies.flatMap(company => 
    (company.objectives || []).map(obj => ({ ...obj, companyName: company.name, companyId: company.id }))
  );
  const linkedObjectives = allObjectives.filter(obj => formData.linked_objective_ids?.includes(obj.id));
  const availableObjectives = allObjectives.filter(obj => !formData.linked_objective_ids?.includes(obj.id));

  const addObjective = (objectiveId) => {
    const updated = [...(formData.linked_objective_ids || []), objectiveId];
    const newData = { ...formData, linked_objective_ids: updated };
    setFormData(newData);
    if (controlId) updateMutation.mutate(newData);
  };

  const removeObjective = (objectiveId) => {
    const updated = formData.linked_objective_ids?.filter(id => id !== objectiveId) || [];
    const newData = { ...formData, linked_objective_ids: updated };
    setFormData(newData);
    if (controlId) updateMutation.mutate(newData);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Controls")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isNew ? 'New Control' : formData.title || 'Control Details'}
            </h1>
            <p className="text-slate-600">
              {framework ? `${framework.name} • ` : ''}Control Management
            </p>
          </div>
          </div>
          <div className="flex gap-2">
          {isAmending && (
            <>
              <Button variant="outline" onClick={cancelAmendment}>Cancel</Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => setShowAmendSubmitDialog(true)}
                disabled={!amendmentReason.trim()}
              >
                <Send className="w-4 h-4 mr-2" /> Submit Amendment
              </Button>
            </>
          )}
          {!isAmending && !isNew && existingControl?.[0] && (existingControl[0].status === "approved" || existingControl[0].status === "active") && (
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={startAmendment}>
              <Pencil className="w-4 h-4 mr-2" /> Amend Control
            </Button>
          )}
          {!isNew && existingControl?.[0] && (
            <LifecycleActions
              entity={existingControl[0]}
              onSubmitForReview={submitForReview}
              onReturn={returnControl}
              onApprove={approveControl}
            />
          )}
          <Link to={createPageUrl("Controls")}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {isNew || !controlId ? 'Create Control' : 'Save Changes'}
          </Button>
          </div>
      </div>

      {isAmending && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-amber-800">Amendment Mode — you may edit any control fields. Changes will be re-submitted for approval.</p>
            <div className="space-y-1">
              <Label className="text-amber-800">Motivation / Reason for Amendment *</Label>
              <Textarea
                value={amendmentReason}
                onChange={e => setAmendmentReason(e.target.value)}
                placeholder="Explain why this approved control needs to be changed..."
                rows={3}
                className="border-amber-300 focus:border-amber-500"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {existingControl?.[0]?.amendment_history?.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4" /> Amendment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {existingControl[0].amendment_history.slice().reverse().map((a, i) => (
                <div key={i} className="p-4 text-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-slate-800">{a.amended_by}</span>
                    <span className="text-xs text-slate-400">{a.amended_at ? new Date(a.amended_at).toLocaleDateString() : ""}</span>
                  </div>
                  <p className="text-slate-600 mb-1"><span className="font-medium">Changes:</span> {a.changes}</p>
                  <p className="text-slate-500 italic">Reason: {a.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="library">Library Fields</TabsTrigger>
            {!isNew && controlId && (
              <TabsTrigger value="test_plan" className="gap-2">
                <span>Test Plan</span>
              </TabsTrigger>
            )}
            {!isNew && controlId && (
              <TabsTrigger value="assessments">
                Assessments
                {controlAssessments.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {controlAssessments.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="objectives">
              Strategic Objectives
              {linkedObjectives.length > 0 && (
                <Badge variant="secondary" className="ml-2">{linkedObjectives.length}</Badge>
              )}
            </TabsTrigger>
            {!isNew && controlId && (
              <TabsTrigger value="history">
                <History className="w-4 h-4 mr-2" />
                Lifecycle
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {!isNew && existingControl?.[0] && <LifecycleNotifications entity={existingControl[0]} />}
            
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Control Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="framework_id">Framework *</Label>
                    <Select value={formData.framework_id} onValueChange={(value) => setFormData({...formData, framework_id: value})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select framework" />
                      </SelectTrigger>
                      <SelectContent>
                        {frameworks.map(f => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.framework_code || f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="control_id">Control ID *</Label>
                    <Input
                      id="control_id"
                      value={formData.control_id}
                      onChange={(e) => setFormData({...formData, control_id: e.target.value})}
                      placeholder="e.g., A.5.1"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Control Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="e.g., Access Control, Cryptography"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
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

                  <div className="space-y-2">
                    <StakeholderOwnerPicker
                      groupName="Control Owner"
                      companyId={frameworks.find(f => f.id === formData.framework_id)?.company_id}
                      value={formData.owner_stakeholder_id}
                      onChange={(id, s) => setFormData({ ...formData, owner_stakeholder_id: id, approver: s?.full_name || "" })}
                      label="Control Owner"
                      placeholder="Select control owner…"
                    />
                  </div>

                  <div className="space-y-2">
                    <StakeholderOwnerPicker
                      groupName="Risk Owner"
                      companyId={frameworks.find(f => f.id === formData.framework_id)?.company_id}
                      value={formData.reviewer_stakeholder_id}
                      onChange={(id, s) => setFormData({ ...formData, reviewer_stakeholder_id: id, reviewer: s?.full_name || "" })}
                      label="Reviewer"
                      placeholder="Select reviewer…"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <TabsContent value="library" className="space-y-6">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle>Control Library Fields</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Control Criticality</Label>
                      <Select value={formData.control_criticality} onValueChange={(v) => setFormData({...formData, control_criticality: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Must Have">Must Have</SelectItem>
                          <SelectItem value="Should Have">Should Have</SelectItem>
                          <SelectItem value="Nice to Have">Nice to Have</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Control Execution Type</Label>
                      <Select value={formData.control_execution_type} onValueChange={(v) => setFormData({...formData, control_execution_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="Automated">Automated</SelectItem>
                          <SelectItem value="Semi-Automated">Semi-Automated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Control Type</Label>
                      <Select value={formData.control_type} onValueChange={(v) => setFormData({...formData, control_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Preventive">Preventive</SelectItem>
                          <SelectItem value="Detective">Detective</SelectItem>
                          <SelectItem value="Corrective">Corrective</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Control Frequency</Label>
                      <Select value={formData.control_frequency} onValueChange={(v) => setFormData({...formData, control_frequency: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Quarterly">Quarterly</SelectItem>
                          <SelectItem value="Annually">Annually</SelectItem>
                          <SelectItem value="Continuous">Continuous</SelectItem>
                          <SelectItem value="Ad-hoc">Ad-hoc</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Process Phase</Label>
                      <Select value={formData.process_phase} onValueChange={(v) => setFormData({...formData, process_phase: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pre-Input">Pre-Input</SelectItem>
                          <SelectItem value="Process - Input">Process - Input</SelectItem>
                          <SelectItem value="Process - Output">Process - Output</SelectItem>
                          <SelectItem value="Post-Output">Post-Output</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Control Owner</Label>
                      <Input
                        value={formData.control_owner}
                        onChange={(e) => setFormData({...formData, control_owner: e.target.value})}
                        placeholder="e.g., OpCo - Treasury Analyst"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.global}
                          onChange={(e) => setFormData({...formData, global: e.target.checked})}
                          className="rounded border-slate-300"
                        />
                        Global Control
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.control_ccm}
                          onChange={(e) => setFormData({...formData, control_ccm: e.target.checked})}
                          className="rounded border-slate-300"
                        />
                        Control CCM
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.self_assessment}
                          onChange={(e) => setFormData({...formData, self_assessment: e.target.checked})}
                          className="rounded border-slate-300"
                        />
                        Self Assessment
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.key_control}
                          onChange={(e) => setFormData({...formData, key_control: e.target.checked})}
                          className="rounded border-slate-300"
                        />
                        Key Control
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.finance_control_consideration}
                          onChange={(e) => setFormData({...formData, finance_control_consideration: e.target.checked})}
                          className="rounded border-slate-300"
                        />
                        Finance Control
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.compensating_control}
                          onChange={(e) => setFormData({...formData, compensating_control: e.target.checked})}
                          className="rounded border-slate-300"
                        />
                        Compensating Control
                      </Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Compensating Control Risk</Label>
                      <Input
                        value={formData.compensating_control_risk}
                        onChange={(e) => setFormData({...formData, compensating_control_risk: e.target.value})}
                        placeholder="Risk description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Control Narrative URL</Label>
                      <Input
                        value={formData.control_narrative_url}
                        onChange={(e) => setFormData({...formData, control_narrative_url: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Document</Label>
                      <Input
                        value={formData.upload_document}
                        onChange={(e) => setFormData({...formData, upload_document: e.target.value})}
                        placeholder="Document reference"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Control Objective ID</Label>
                      <Input
                        value={formData.control_objective_id}
                        onChange={(e) => setFormData({...formData, control_objective_id: e.target.value})}
                        placeholder="Objective ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Risk ID</Label>
                      <Input
                        value={formData.risk_id}
                        onChange={(e) => setFormData({...formData, risk_id: e.target.value})}
                        placeholder="Associated Risk ID"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {!isNew && (
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2">
                    Compensating Controls
                    {formData.key_control && compensatingControlIds.length > 0 && (
                      <Badge variant="secondary">{compensatingControlIds.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <CompensatingControlPicker
                    keyControlId={controlId}
                    isKeyControl={!!formData.key_control}
                    assignedIds={compensatingControlIds}
                    allControls={allControls}
                    frameworks={frameworks}
                    onAdd={addCompensatingControl}
                    onRemove={removeCompensatingControl}
                  />
                </CardContent>
              </Card>
            )}

            {!isNew && controlAssessments.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle>Compliance Overview</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-slate-900">{complianceRate}%</div>
                      <p className="text-sm text-slate-600 mt-1">Compliance Rate</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                      <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-slate-900">{controlAssessments.length}</div>
                      <p className="text-sm text-slate-600 mt-1">Total Assessments</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
                      <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-slate-900">
                        {controlAssessments.filter(ca => ca.status === 'non_compliant').length}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Non-Compliant</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {!isNew && controlId && (
            <TabsContent value="assessments" className="space-y-6">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle>Assessment History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {controlAssessments.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {controlAssessments.map((ca) => {
                        const assessment = assessments.find(a => a.id === ca.assessment_id);
                        return (
                          <div key={ca.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-900">
                                  {assessment?.name || 'Assessment'}
                                </h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className={getStatusColor(ca.status)}>
                                    {ca.status?.replace('_', ' ')}
                                  </Badge>
                                  {ca.risk_level && ca.risk_level !== 'none' && (
                                    <Badge variant="outline" className={getPriorityColor(ca.risk_level)}>
                                      {ca.risk_level} risk
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {ca.notes && (
                              <p className="text-sm text-slate-600 mt-2">{ca.notes}</p>
                            )}
                            {ca.remediation_plan && (
                              <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-sm font-medium text-amber-900">Remediation Plan:</p>
                                <p className="text-sm text-amber-700 mt-1">{ca.remediation_plan}</p>
                                {ca.remediation_date && (
                                  <p className="text-xs text-amber-600 mt-1">
                                    Target: {new Date(ca.remediation_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-500">
                      <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p>No assessments for this control yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            )}

            <TabsContent value="objectives">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle>Linked Strategic Objectives</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {linkedObjectives.length > 0 && (
                    <div className="space-y-2">
                      {linkedObjectives.map(obj => (
                        <div key={obj.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <Target className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="font-medium text-slate-900">{obj.title}</p>
                              <p className="text-xs text-slate-500">{obj.companyName}</p>
                              {obj.description && (
                                <p className="text-sm text-slate-600 mt-1">{obj.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeObjective(obj.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {availableObjectives.length > 0 && (
                    <div className="space-y-2">
                      <Label>Add Strategic Objective</Label>
                      <Select onValueChange={addObjective}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select objective to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableObjectives.map(obj => (
                            <SelectItem key={obj.id} value={obj.id}>
                              {obj.companyName} - {obj.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {linkedObjectives.length === 0 && availableObjectives.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No objectives available. Add objectives in company settings.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {!isNew && controlId && (
            <TabsContent value="test_plan">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle>Test Plan</CardTitle>
                  <p className="text-sm text-slate-500">Define the testing steps and workpapers assessors must follow to validate this control.</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <TestPlanPanel controlId={controlId} />
                </CardContent>
              </Card>
            </TabsContent>
            )}

            {!isNew && controlId && existingControl?.[0] && (
            <TabsContent value="history">
              <LifecycleHistory history={existingControl[0]?.lifecycle_history} />
            </TabsContent>
            )}
            </Tabs>

            </form>

            {controlId && !isNew && (
              <WorkflowPanel
                entityType="Control"
                entityId={controlId}
                entityName={formData.title || "Control"}
                companyId={frameworks.find(f => f.id === formData.framework_id)?.company_id}
                record={existingControl?.[0]}
                onInstanceCreated={() => queryClient.invalidateQueries(['control', controlId])}
              />
            )}
      <Dialog open={showAmendSubmitDialog} onOpenChange={o => { if (!o) setShowAmendSubmitDialog(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Control Amendment for Approval</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800 font-medium mb-2">Amendment summary:</p>
              {amendOriginalData && (
                <ul className="text-xs text-amber-700 space-y-1">
                  {formData.title !== amendOriginalData.title && <li>• Title changed</li>}
                  {formData.description !== amendOriginalData.description && <li>• Description updated</li>}
                  {formData.priority !== amendOriginalData.priority && <li>• Priority: <strong>{amendOriginalData.priority}</strong> → <strong>{formData.priority}</strong></li>}
                  {formData.control_type !== amendOriginalData.control_type && <li>• Control type: <strong>{amendOriginalData.control_type}</strong> → <strong>{formData.control_type}</strong></li>}
                  {formData.control_frequency !== amendOriginalData.control_frequency && <li>• Frequency: <strong>{amendOriginalData.control_frequency}</strong> → <strong>{formData.control_frequency}</strong></li>}
                  {formData.control_execution_type !== amendOriginalData.control_execution_type && <li>• Execution type: <strong>{amendOriginalData.control_execution_type}</strong> → <strong>{formData.control_execution_type}</strong></li>}
                </ul>
              )}
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Reason for amendment:</p>
              <p className="text-sm text-slate-800">{amendmentReason}</p>
            </div>
            <p className="text-xs text-slate-500">The control will be returned to <strong>Pending Review</strong> and sent to reviewers/approvers.</p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowAmendSubmitDialog(false)}>Cancel</Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => submitAmendmentMutation.mutate()}
                disabled={submitAmendmentMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {submitAmendmentMutation.isPending ? "Submitting..." : "Submit Amendment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    );
    }
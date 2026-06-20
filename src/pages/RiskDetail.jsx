import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import UnsavedChangesDialog from "@/components/UnsavedChangesDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, X, Shield, Target, BookOpen, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";
import ObjectiveSelector from "@/components/objectives/ObjectiveSelector";
import WorkflowPanel from "@/components/workflows/WorkflowPanel";
import StakeholderOwnerPicker from "@/components/stakeholders/StakeholderOwnerPicker";
import RiskSignOffPanel from "@/components/risks/RiskSignOffPanel";

const RISK_TYPES = ["Financial", "Operational", "Strategic", "Governance & Compliance", "Governance", "Unspecified"];

const VALUE_CHAINS = [
  "FIN -Order to Cash (O2C)",
  "FIN - Record-to-Report (R2R)",
  "FIN -Procure-to-Pay P2P",
  "FIN - Management & Performance Reporting",
  "HCM-Hire-to-Retire",
  "GRC - Delegation, Independence & Segregation",
  "SCM - Supply Chain Management",
  "EAM - Enterprise Asset Management",
  "EIT - Enterprise IT",
];

const WORKSTREAMS = [
  "FIN - R2R - Cash Management",
  "EPM - FR - Financials Capital Planning",
  "EPM - FR - Financials Cash Flow",
  "EPM - FR - Financials Expense",
  "SCM - P2P - Expense Management",
  "SCM - P2P - Payables Management",
  "FIN - R2R - Period-End processing and Closure",
  "EPM - FR - Financials Balance Sheet",
  "EPM - FR - Financials Close Financials Consolidation",
  "FIN - R2R - Tax",
  "EPM - FR - Tax Reporting",
  "SCM - O2C-Order Management",
  "SCM - O2C - Incentive Compensation",
  "SCM - O2C-Customer Billing to Receivables",
  "SCM - MDM Manage Customer Records and Data",
  "SCM - O2C Point of Sales, Cash Receipts and Retail Operations",
  "SCM - O2C-Advanced Collections",
  "FIN - R2R - General Ledger",
  "HCM - MDM Manage Employee Master Records and Documentation",
  "HCM - PRM Manage Enterprise and Bureau Payroll",
  "HCM - H2R - HCM Core",
  "HCM - H2R - Compensation Management",
  "HCM - H2R Human Resource Strategy & Objective setting",
  "HCM - H2R Employee Tax, Legal and Statutory",
  "EIT - MDM -End User Master Records Management",
];

export default function RiskDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const riskId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';
  const queryClient = useQueryClient();

  const [isControlDialogOpen, setIsControlDialogOpen] = useState(false);
  const [isFrameworkDialogOpen, setIsFrameworkDialogOpen] = useState(false);
  const [isObjectiveDialogOpen, setIsObjectiveDialogOpen] = useState(false);
  const { isDirty, checkDirty, initSnapshot, markClean, guardedNavigate, showDialog, confirmDiscard, confirmSave, cancelDialog } = useUnsavedChangesGuard(navigate);

  const { data: risk } = useQuery({
    queryKey: ['risk', riskId],
    queryFn: () => base44.entities.Risk.filter({ id: riskId }).then(res => res[0]),
    enabled: !!riskId && !isNew,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company_id: "",
    category: "operational",
    likelihood: "medium",
    impact: "medium",
    status: "identified",
    owner: "",
    owner_stakeholder_id: "",
    control_ids: [],
    framework_ids: [],
    linked_objective_ids: [],
    mitigation_plan: "",
    review_date: "",
    identified_date: new Date().toISOString().split('T')[0],
    // Library fields
    risk_reference_nr: "",
    risk_type: "",
    racm_risk_type: "",
    risk_statement: "",
    root_cause: "",
    root_cause_category_id: "",
    root_cause_type: "",
    value_chain: "",
    sub_process: "",
    workstream: "",
    ihpom_node_id: "",
    racm_l3: "",
    process_activity: "",
    framework_reference: "",
    is_library_risk: false,
  });

  const { data: rootCauseCategories = [] } = useQuery({
    queryKey: ["root-cause-categories"],
    queryFn: () => base44.entities.RootCauseCategory.list("sort_order"),
  });

  const { data: orgObjectives = [] } = useQuery({
    queryKey: ['orgObjectives', formData.company_id],
    queryFn: () => base44.entities.OrgObjective.filter({ company_id: formData.company_id }),
    enabled: !!formData.company_id,
  });

  const linkedObjectives = orgObjectives.filter(obj => formData.linked_objective_ids?.includes(obj.id));

  useEffect(() => {
    if (risk) {
      const loaded = {
        title: risk.title || "",
        description: risk.description || "",
        company_id: risk.company_id || "",
        category: risk.category || "operational",
        likelihood: risk.likelihood || "medium",
        impact: risk.impact || "medium",
        status: risk.status || "identified",
        owner: risk.owner || "",
        owner_stakeholder_id: risk.owner_stakeholder_id || "",
        control_ids: risk.control_ids || [],
        framework_ids: risk.framework_ids || [],
        linked_objective_ids: risk.linked_objective_ids || [],
        mitigation_plan: risk.mitigation_plan || "",
        review_date: risk.review_date || "",
        identified_date: risk.identified_date || new Date().toISOString().split('T')[0],
        risk_reference_nr: risk.risk_reference_nr || "",
        risk_type: risk.risk_type || "",
        racm_risk_type: risk.racm_risk_type || "",
        risk_statement: risk.risk_statement || "",
        root_cause: risk.root_cause || "",
        root_cause_category_id: risk.root_cause_category_id || "",
        root_cause_type: risk.root_cause_type || "",
        value_chain: risk.value_chain || "",
        sub_process: risk.sub_process || "",
        workstream: risk.workstream || "",
        ihpom_node_id: risk.ihpom_node_id || "",
        racm_l3: risk.racm_l3 || "",
        process_activity: risk.process_activity || "",
        framework_reference: risk.framework_reference || "",
        is_library_risk: risk.is_library_risk || false,
      };
      setFormData(loaded);
      initSnapshot(loaded);
    } else if (isNew) {
      initSnapshot(formData);
    }
  }, [risk]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Risk.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['risks']);
      navigate(createPageUrl(`RiskDetail?id=${data.id}`));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Risk.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['risks']);
      queryClient.invalidateQueries(['risk', riskId]);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const riskScore = getRiskLevel(formData.likelihood, formData.impact);
    const dataToSave = { ...formData, inherent_risk_score: riskScore };
    markClean();
    if (isNew || !riskId) {
      await createMutation.mutateAsync(dataToSave);
    } else {
      await updateMutation.mutateAsync({ id: riskId, data: dataToSave });
    }
  };

  // Track dirty state
  useEffect(() => { checkDirty(formData); }, [formData]);

  const getRiskLevel = (likelihood, impact) => {
    const values = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
    return (values[likelihood] || 3) * (values[impact] || 3);
  };

  const addControl = (controlId) => {
    if (!formData.control_ids.includes(controlId)) {
      const newControlIds = [...formData.control_ids, controlId];
      setFormData({ ...formData, control_ids: newControlIds });
      if (riskId) {
        updateMutation.mutate({ id: riskId, data: { control_ids: newControlIds } });
      }
    }
    setIsControlDialogOpen(false);
  };

  const removeControl = (controlId) => {
    const newControlIds = formData.control_ids.filter(id => id !== controlId);
    setFormData({ ...formData, control_ids: newControlIds });
    if (riskId) {
      updateMutation.mutate({ id: riskId, data: { control_ids: newControlIds } });
    }
  };

  const addFramework = (frameworkId) => {
    if (!formData.framework_ids.includes(frameworkId)) {
      const newFrameworkIds = [...formData.framework_ids, frameworkId];
      setFormData({ ...formData, framework_ids: newFrameworkIds });
      if (riskId) {
        updateMutation.mutate({ id: riskId, data: { framework_ids: newFrameworkIds } });
      }
    }
    setIsFrameworkDialogOpen(false);
  };

  const removeFramework = (frameworkId) => {
    const newFrameworkIds = formData.framework_ids.filter(id => id !== frameworkId);
    setFormData({ ...formData, framework_ids: newFrameworkIds });
    if (riskId) {
      updateMutation.mutate({ id: riskId, data: { framework_ids: newFrameworkIds } });
    }
  };

  const addObjective = (objectiveId) => {
    const updated = [...(formData.linked_objective_ids || []), objectiveId];
    setFormData({ ...formData, linked_objective_ids: updated });
    if (riskId) {
      updateMutation.mutate({ id: riskId, data: { linked_objective_ids: updated } });
    }
  };

  const removeObjective = (objectiveId) => {
    const updated = formData.linked_objective_ids.filter(id => id !== objectiveId);
    setFormData({ ...formData, linked_objective_ids: updated });
    if (riskId) {
      updateMutation.mutate({ id: riskId, data: { linked_objective_ids: updated } });
    }
  };

  const linkedControls = controls.filter(c => formData.control_ids?.includes(c.id));
  const linkedFrameworks = frameworks.filter(f => formData.framework_ids?.includes(f.id));
  const company = companies.find(c => c.id === formData.company_id);
  const riskScore = getRiskLevel(formData.likelihood, formData.impact);

  // Group root cause categories for cascading picker
  const rootCauseCategoryGroups = rootCauseCategories.reduce((acc, rc) => {
    if (!acc[rc.category]) acc[rc.category] = [];
    acc[rc.category].push(rc);
    return acc;
  }, {});

  // When root_cause_category_id changes, auto-fill root_cause_type label
  const handleRootCatChange = (id) => {
    const found = rootCauseCategories.find(r => r.id === id);
    setFormData(p => ({ ...p, root_cause_category_id: id, root_cause_type: found?.root_cause_type || "" }));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => guardedNavigate(createPageUrl("RiskRegister"))}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              {isNew ? 'Add New Risk' : risk?.title || 'Risk Details'}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => guardedNavigate(createPageUrl("RiskRegister"))}>Cancel</Button>
          {!isNew && riskId && (
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (confirm('Are you sure you want to delete this risk? This action cannot be undone.')) {
                  await base44.entities.Risk.delete(riskId);
                  queryClient.invalidateQueries(['risks']);
                  navigate(createPageUrl("RiskRegister"));
                }
              }}
            >
              Delete Risk
            </Button>
          )}
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            {isNew ? 'Create Risk' : 'Update Risk'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Risk Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Risk Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
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
              <div className="space-y-2">
                <Label htmlFor="company_id">Company *</Label>
                <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="strategic">Strategic</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="cyber_security">Cyber Security</SelectItem>
                    <SelectItem value="third_party">Third Party</SelectItem>
                    <SelectItem value="reputational">Reputational</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="likelihood">Likelihood</Label>
                <Select value={formData.likelihood} onValueChange={(value) => setFormData({...formData, likelihood: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very_low">Very Low (1)</SelectItem>
                    <SelectItem value="low">Low (2)</SelectItem>
                    <SelectItem value="medium">Medium (3)</SelectItem>
                    <SelectItem value="high">High (4)</SelectItem>
                    <SelectItem value="very_high">Very High (5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="impact">Impact</Label>
                <Select value={formData.impact} onValueChange={(value) => setFormData({...formData, impact: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very_low">Very Low (1)</SelectItem>
                    <SelectItem value="low">Low (2)</SelectItem>
                    <SelectItem value="medium">Medium (3)</SelectItem>
                    <SelectItem value="high">High (4)</SelectItem>
                    <SelectItem value="very_high">Very High (5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Risk Score</Label>
                <div className="text-2xl font-bold text-slate-900">{riskScore}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="auto_assigned">Auto Assigned</SelectItem>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="assessed">Assessed</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <StakeholderOwnerPicker
                  groupName="Risk Owner"
                  companyId={formData.company_id}
                  value={formData.owner_stakeholder_id}
                  onChange={(id, s) => setFormData({ ...formData, owner_stakeholder_id: id, owner: s?.full_name || "" })}
                  label="Risk Owner"
                  placeholder="Select risk owner…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="identified_date">Identified Date</Label>
                <Input
                  id="identified_date"
                  type="date"
                  value={formData.identified_date}
                  onChange={(e) => setFormData({...formData, identified_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review_date">Review Date</Label>
                <Input
                  id="review_date"
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => setFormData({...formData, review_date: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mitigation_plan">Mitigation Plan</Label>
              <Textarea
                id="mitigation_plan"
                value={formData.mitigation_plan}
                onChange={(e) => setFormData({...formData, mitigation_plan: e.target.value})}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Library Details ─────────────────────────────────────── */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Risk Library Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Row 1 – Reference, Risk Type, RACM Risk Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Risk Reference Nr</Label>
                <Input
                  value={formData.risk_reference_nr}
                  onChange={e => setFormData(p => ({ ...p, risk_reference_nr: e.target.value }))}
                  placeholder="e.g. RTCM.FINMC.1.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Risk Type</Label>
                <Select value={formData.risk_type || "__none__"} onValueChange={v => setFormData(p => ({ ...p, risk_type: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {RISK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>RACM Risk Type</Label>
                <Select value={formData.racm_risk_type || "__none__"} onValueChange={v => setFormData(p => ({ ...p, racm_risk_type: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {RISK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2 – Risk Statement */}
            <div className="space-y-2">
              <Label>Risk Statement</Label>
              <Textarea
                value={formData.risk_statement}
                onChange={e => setFormData(p => ({ ...p, risk_statement: e.target.value }))}
                rows={2}
                placeholder="Formal description of what could go wrong…"
              />
            </div>

            {/* Row 3 – Root Cause narrative */}
            <div className="space-y-2">
              <Label>Root Cause</Label>
              <Textarea
                value={formData.root_cause}
                onChange={e => setFormData(p => ({ ...p, root_cause: e.target.value }))}
                rows={2}
                placeholder="Describe the underlying cause…"
              />
            </div>

            {/* Row 4 – Root Cause Category (linked) + Root Cause Type (auto-filled) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Root Cause Category</Label>
                <Select value={formData.root_cause_category_id || "__none__"} onValueChange={v => handleRootCatChange(v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {Object.entries(rootCauseCategoryGroups).map(([cat, items]) => (
                      <React.Fragment key={cat}>
                        <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">{cat}</div>
                        {items.map(rc => (
                          <SelectItem key={rc.id} value={rc.id}>{rc.root_cause_type}</SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Root Cause Type</Label>
                <Input
                  value={formData.root_cause_type}
                  onChange={e => setFormData(p => ({ ...p, root_cause_type: e.target.value }))}
                  placeholder="Auto-filled from category selection"
                />
              </div>
            </div>

            {/* Row 5 – Value Chain, Sub-Process */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Value Chain</Label>
                <Select value={formData.value_chain || "__none__"} onValueChange={v => setFormData(p => ({ ...p, value_chain: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select value chain…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {VALUE_CHAINS.map(vc => <SelectItem key={vc} value={vc}>{vc}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sub-Process</Label>
                <Input
                  value={formData.sub_process}
                  onChange={e => setFormData(p => ({ ...p, sub_process: e.target.value }))}
                  placeholder="e.g. Treasury and Cash Management"
                />
              </div>
            </div>

            {/* Row 6 – Workstream, RACM L3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Workstream</Label>
                <Select value={formData.workstream || "__none__"} onValueChange={v => setFormData(p => ({ ...p, workstream: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select workstream…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {WORKSTREAMS.map(ws => <SelectItem key={ws} value={ws}>{ws}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>RACM L3 (Process Step)</Label>
                <Input
                  value={formData.racm_l3}
                  onChange={e => setFormData(p => ({ ...p, racm_l3: e.target.value }))}
                  placeholder="e.g. Manage Cash"
                />
              </div>
            </div>

            {/* Row 7 – Process Activity, iHPOM Node ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Process Activity</Label>
                <Input
                  value={formData.process_activity}
                  onChange={e => setFormData(p => ({ ...p, process_activity: e.target.value }))}
                  placeholder="Activity name (no reference number)"
                />
              </div>
              <div className="space-y-2">
                <Label>iHPOM Node ID</Label>
                <Input
                  value={formData.ihpom_node_id}
                  onChange={e => setFormData(p => ({ ...p, ihpom_node_id: e.target.value }))}
                  placeholder="e.g. 1352"
                />
              </div>
            </div>

            {/* Row 8 – Applicable Frameworks (multi-select from master library) */}
            <div className="space-y-2">
              <Label>Applicable Frameworks</Label>
              <p className="text-xs text-slate-500">Select all frameworks this risk applies to. Companies can then filter and assign risks based on their chosen frameworks.</p>
              <div className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto">
                {frameworks.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6 italic">No master frameworks loaded yet.</p>
                ) : (
                  Object.entries(
                    frameworks
                      .filter(f => f.is_master && (!f.end_date || new Date(f.end_date) >= new Date()))
                      .reduce((acc, f) => {
                        const grp = f.category || "Other";
                        if (!acc[grp]) acc[grp] = [];
                        acc[grp].push(f);
                        return acc;
                      }, {})
                  ).map(([category, items]) => (
                    <div key={category}>
                      <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 sticky top-0">{category.replace(/_/g, ' ')}</div>
                      {items.map(f => {
                        const checked = formData.framework_ids?.includes(f.id);
                        return (
                          <label key={f.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? formData.framework_ids.filter(id => id !== f.id)
                                  : [...(formData.framework_ids || []), f.id];
                                setFormData(p => ({ ...p, framework_ids: next }));
                              }}
                              className="rounded border-slate-300 text-primary"
                            />
                            <span className="text-xs font-medium text-slate-700">{f.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
              {formData.framework_ids?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.framework_ids.map(id => {
                    const f = frameworks.find(fw => fw.id === id);
                    return f ? (
                      <Badge key={id} variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 gap-1 cursor-default">
                        {f.name}
                        <button type="button" onClick={() => setFormData(p => ({ ...p, framework_ids: p.framework_ids.filter(i => i !== id) }))}>
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Strategic Objectives
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsObjectiveDialogOpen(true)}
                disabled={!formData.company_id}
              >
                <Plus className="w-4 h-4 mr-2" />
                Link
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {linkedObjectives.length > 0 ? (
              <div className="space-y-2">
                {linkedObjectives.map(obj => (
                  <div key={obj.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{obj.title}</p>
                        {obj.description && (
                          <p className="text-xs text-slate-600 mt-1">{obj.description}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeObjective(obj.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No objectives linked</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Linked Controls
                </CardTitle>
                <Dialog open={isControlDialogOpen} onOpenChange={setIsControlDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Control</DialogTitle>
                    </DialogHeader>
                    <div className="mb-4">
                      <Link to={createPageUrl("ControlDetail?new=true")} target="_blank">
                        <Button type="button" variant="outline" size="sm" className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Create New Control
                        </Button>
                      </Link>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {controls.map(control => (
                        <div
                          key={control.id}
                          className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                          onClick={() => addControl(control.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{control.control_id}</p>
                              <p className="text-sm text-slate-600">{control.title}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {linkedControls.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No controls linked</p>
              ) : (
                <div className="space-y-2">
                  {linkedControls.map(control => (
                    <div key={control.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                      <div>
                        <p className="text-sm font-medium">{control.control_id}</p>
                        <p className="text-xs text-slate-600">{control.title}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeControl(control.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Linked Frameworks
                </CardTitle>
                <Dialog open={isFrameworkDialogOpen} onOpenChange={setIsFrameworkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Framework</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {frameworks.map(framework => (
                        <div
                          key={framework.id}
                          className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                          onClick={() => addFramework(framework.id)}
                        >
                          <div className="flex items-center gap-2">
                            {framework.framework_code && (
                              <Badge variant="outline" className="text-xs shrink-0">{framework.framework_code}</Badge>
                            )}
                            <p className="font-medium text-sm">{framework.name}</p>
                          </div>
                          {framework.framework_family && (
                            <p className="text-xs text-slate-400 mt-0.5">{framework.framework_family}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {linkedFrameworks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No frameworks linked</p>
              ) : (
                <div className="space-y-2">
                  {linkedFrameworks.map(framework => (
                    <div key={framework.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium">{framework.framework_code || framework.name}</p>
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-default" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">{framework.name}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFramework(framework.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <ObjectiveSelector
          company={company || { id: formData.company_id }}
          linkedObjectiveIds={formData.linked_objective_ids}
          onAdd={addObjective}
          onRemove={removeObjective}
          isOpen={isObjectiveDialogOpen}
          onClose={() => setIsObjectiveDialogOpen(false)}
        />
      </form>

      {riskId && !isNew && (
        <RiskSignOffPanel risk={risk || { id: riskId, status: formData.status, workflow_status_history: [] }} companyId={formData.company_id} />
      )}

      <UnsavedChangesDialog
        open={showDialog}
        onDiscard={confirmDiscard}
        onSave={() => confirmSave(handleSubmit.bind(null, { preventDefault: () => {} }))}
        onClose={cancelDialog}
      />

      {riskId && !isNew && (
        <WorkflowPanel
          entityType="Risk"
          entityId={riskId}
          entityName={risk?.title || "Risk"}
          companyId={formData.company_id}
          record={risk}
          onInstanceCreated={() => queryClient.invalidateQueries(['risk', riskId])}
        />
      )}
    </div>
  );
}
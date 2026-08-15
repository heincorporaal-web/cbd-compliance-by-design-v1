import React, { useState, useEffect, useRef } from "react";
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
import {
  ArrowLeft, Save, Plus, Trash2, Shield, AlertTriangle, AlertCircle,
  Target, ClipboardCheck, X, User, Server, Users, GitBranch, Search, ChevronsUpDown, ListChecks, Network
} from "lucide-react";
import ProcessFlowChart from "@/components/processmanagement/ProcessFlowChart";
import StakeholderPickerDialog from "@/components/processmanagement/StakeholderPickerDialog";
import IHPOMNodeLinkDialog from "@/components/processmanagement/IHPOMNodeLinkDialog";
import WorkflowPanel from "@/components/workflows/WorkflowPanel";
import { applyAutoNumber } from "@/lib/autoNumbering";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const levelLabels = {
  0: "Entity Level", 1: "Functional Area", 2: "Process Groups",
  3: "Process", 4: "Sub Process", 5: "Activity"
};

export default function ProcessManagementDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const processId = urlParams.get("id");
  const isNew = urlParams.get("new") === "true";

  const [formData, setFormData] = useState({
    process_code: "", name: "", description: "", company_id: "",
    level: 0, parent_id: "", value_chain: "",
    process_owner: "", process_owner_id: "", process_owner_stakeholder_id: "", deputy_owner: "",
    global_control_owner: "", workstream: "", status: "active",
    linked_system_ids: [], linked_it_capability_ids: [], linked_risk_ids: [], linked_control_ids: [],
    linked_issue_ids: [], linked_goal_ids: [], linked_assessment_ids: [],
    linked_objective_ids: [], linked_principle_risk_ids: [], linked_org_objective_ids: [],
    linked_ihpom_ids: [],
    documentation_url: "", frequency: "ad_hoc", estimated_duration: "",
    automation_level: "manual", criticality: "medium",
    inputs: "", outputs: "", key_performance_indicators: "", notes: ""
  });

  const [activeDialog, setActiveDialog] = useState(null);
  const [parentSearch, setParentSearch] = useState("");
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [stakeholderPickerTarget, setStakeholderPickerTarget] = useState(null); // 'owner' | 'deputy' | 'gco'
  const [userSearchOwner, setUserSearchOwner] = useState("");
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const parentPickerRef = useRef(null);
  const userPickerRef = useRef(null);

  useEffect(() => {
    if (!parentPickerOpen) return;
    const handler = (e) => {
      if (parentPickerRef.current && !parentPickerRef.current.contains(e.target)) setParentPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [parentPickerOpen]);

  useEffect(() => {
    if (!userPickerOpen) return;
    const handler = (e) => {
      if (userPickerRef.current && !userPickerRef.current.contains(e.target)) setUserPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userPickerOpen]);

  const { data: existingProcess } = useQuery({
    queryKey: ["orgProcess", processId],
    queryFn: () => base44.entities.OrgProcess.filter({ id: processId }),
    enabled: !!processId && !isNew,
  });

  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const { data: processes = [] } = useQuery({ queryKey: ["orgProcesses"], queryFn: () => base44.entities.OrgProcess.list() });
  const { data: risks = [] } = useQuery({ queryKey: ["risks"], queryFn: () => base44.entities.Risk.list() });
  const { data: controls = [] } = useQuery({ queryKey: ["controls"], queryFn: () => base44.entities.Control.list() });
  const { data: issues = [] } = useQuery({ queryKey: ["issues"], queryFn: () => base44.entities.Issue.list() });
  const { data: goals = [] } = useQuery({ queryKey: ["grcGoals"], queryFn: () => base44.entities.GRCGoal.list() });
  const { data: assessments = [] } = useQuery({ queryKey: ["assessments"], queryFn: () => base44.entities.Assessment.list() });
  const { data: systems = [] } = useQuery({ queryKey: ["ictSystems"], queryFn: () => base44.entities.ICTSystem.list() });
  const { data: itCapabilities = [] } = useQuery({ queryKey: ["itCapabilities"], queryFn: () => base44.entities.ITCapability.list() });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => base44.entities.User.list() });
  const { data: orgObjectives = [] } = useQuery({ queryKey: ["orgObjectives"], queryFn: () => base44.entities.OrgObjective.list() });
  const { data: stakeholders = [] } = useQuery({ queryKey: ["stakeholders"], queryFn: () => base44.entities.Stakeholder.list() });
  const { data: stakeholderGroups = [] } = useQuery({ queryKey: ["stakeholderGroups"], queryFn: () => base44.entities.StakeholderGroup.list() });
  const { data: ihpomNodes = [] } = useQuery({ queryKey: ["ihpomNodes"], queryFn: () => base44.entities.IHPOMNode.list("node_code") });
  const { data: companyPrefs = [] } = useQuery({ queryKey: ["companyPrefs"], queryFn: () => base44.entities.CompanyPreference.list() });
  const { data: workstreams = [] } = useQuery({ queryKey: ["workstreams"], queryFn: () => base44.entities.Workstream.list() });

  useEffect(() => {
    if (existingProcess?.[0]) setFormData(existingProcess[0]);
  }, [existingProcess]);

  const createMutation = useMutation({
    mutationFn: (data) => {
      const pref = companyPrefs.find(p => p.company_id === data.company_id) || null;
      const ws = workstreams.find(w => w.workstream_code === data.workstream || w.name === data.workstream || w.id === data.workstream);
      const withAuto = applyAutoNumber("process", data, pref, processes, { workstreamCode: ws?.workstream_code || data.workstream || "" });
      return base44.entities.OrgProcess.create(withAuto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["orgProcesses"]);
      navigate(createPageUrl(`ProcessManagementDetail?id=${data.id}`));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.OrgProcess.update(processId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["orgProcesses"]);
      queryClient.invalidateQueries(["orgProcess", processId]);
    },
  });

  const blankForm = {
    process_code: "", name: "", description: "", company_id: "",
    level: 0, parent_id: "", value_chain: "",
    process_owner: "", process_owner_id: "", process_owner_stakeholder_id: "", deputy_owner: "",
    global_control_owner: "", workstream: "", status: "active",
    linked_system_ids: [], linked_it_capability_ids: [], linked_risk_ids: [], linked_control_ids: [],
    linked_issue_ids: [], linked_goal_ids: [], linked_assessment_ids: [],
    linked_objective_ids: [], linked_principle_risk_ids: [], linked_org_objective_ids: [],
    linked_ihpom_ids: [],
    documentation_url: "", frequency: "ad_hoc", estimated_duration: "",
    automation_level: "manual", criticality: "medium",
    inputs: "", outputs: "", key_performance_indicators: "", notes: "",
    minimum_requirements: []
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    isNew || !processId ? createMutation.mutate(formData) : updateMutation.mutate(formData);
  };

  const handleSaveAndNew = (e) => {
    e.preventDefault();
    const afterSave = () => {
      queryClient.invalidateQueries(["orgProcesses"]);
      setFormData({ ...blankForm });
      navigate(createPageUrl("ProcessManagementDetail?new=true"));
    };
    if (isNew || !processId) {
      createMutation.mutate(formData, { onSuccess: afterSave });
    } else {
      updateMutation.mutate(formData, { onSuccess: afterSave });
    }
  };

  const addRequirement = () => {
    const reqs = formData.minimum_requirements || [];
    if (reqs.length >= 10) return;
    setFormData({ ...formData, minimum_requirements: [...reqs, { id: crypto.randomUUID(), requirement: "", description: "" }] });
  };

  const updateRequirement = (id, field, value) => {
    setFormData({
      ...formData,
      minimum_requirements: (formData.minimum_requirements || []).map(r => r.id === id ? { ...r, [field]: value } : r)
    });
  };

  const removeRequirement = (id) => {
    setFormData({
      ...formData,
      minimum_requirements: (formData.minimum_requirements || []).filter(r => r.id !== id)
    });
  };


  const addLink = (field, id) => {
    if (!formData[field]?.includes(id)) {
      const updated = [...(formData[field] || []), id];
      const newData = { ...formData, [field]: updated };
      setFormData(newData);
      if (processId) updateMutation.mutate(newData);
    }
    setActiveDialog(null);
  };

  const removeLink = (field, id) => {
    const updated = (formData[field] || []).filter(x => x !== id);
    const newData = { ...formData, [field]: updated };
    setFormData(newData);
    if (processId) updateMutation.mutate(newData);
  };

  const potentialParents = processes.filter(p =>
    p.level < formData.level && p.id !== processId && p.company_id === formData.company_id
  );

  const company = companies.find(c => c.id === formData.company_id);
  const availableObjectives = company?.objectives || [];
  const availablePrincipleRisks = company?.principle_risks || [];

  const linkedSystems = systems.filter(s => formData.linked_system_ids?.includes(s.id));
  const linkedCapabilities = itCapabilities.filter(c => formData.linked_it_capability_ids?.includes(c.id));
  const linkedRisks = risks.filter(r => formData.linked_risk_ids?.includes(r.id));
  const linkedControls = controls.filter(c => formData.linked_control_ids?.includes(c.id));
  const linkedIssues = issues.filter(i => formData.linked_issue_ids?.includes(i.id));
  const linkedGoals = goals.filter(g => formData.linked_goal_ids?.includes(g.id));
  const linkedAssessments = assessments.filter(a => formData.linked_assessment_ids?.includes(a.id));
  const linkedObjectives = availableObjectives.filter(o => formData.linked_objective_ids?.includes(o.id));
  const linkedPrincipleRisks = availablePrincipleRisks.filter(r => formData.linked_principle_risk_ids?.includes(r.id));

  const companyOrgObjectives = orgObjectives.filter(o => !formData.company_id || o.company_id === formData.company_id);
  const linkedOrgObjectiveIds = formData.linked_org_objective_ids || [];
  const linkedOrgObjectives = orgObjectives.filter(o => linkedOrgObjectiveIds.includes(o.id));
  const linkedIHPOMNodes = ihpomNodes.filter(n => formData.linked_ihpom_ids?.includes(n.id));

  const selectedOwnerUser = users.find(u => u.id === formData.process_owner_id);
  const selectedOwnerStakeholder = stakeholders.find(s => s.id === formData.process_owner_stakeholder_id);

  const handleSelectStakeholder = (stakeholder, target) => {
    if (target === "owner") {
      setFormData(prev => ({
        ...prev,
        process_owner_stakeholder_id: stakeholder.id,
        process_owner: stakeholder.full_name,
        process_owner_id: "", // clear user link when stakeholder selected
      }));
    } else if (target === "deputy") {
      setFormData(prev => ({ ...prev, deputy_owner: stakeholder.full_name }));
    } else if (target === "gco") {
      setFormData(prev => ({ ...prev, global_control_owner: stakeholder.full_name }));
    }
  };

  const filteredUsersForOwner = users.filter(u => {
    const q = userSearchOwner.toLowerCase();
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("ProcessManagement")}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isNew ? "New Process" : formData.name || "Process Details"}
            </h1>
            <p className="text-slate-600">Process Management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("ProcessManagement")}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSaveAndNew} variant="outline" className="border-teal-600 text-teal-700 hover:bg-teal-50">
            <Plus className="w-4 h-4 mr-2" />
            Save and New
          </Button>
          <Button onClick={handleSubmit} className="bg-teal-600 hover:bg-teal-700">
            <Save className="w-4 h-4 mr-2" />
            {isNew || !processId ? "Create Process" : "Save Changes"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="ownership">
              Ownership
              {(formData.process_owner || formData.process_owner_id) && (
                <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700">Assigned</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="systems">
              Systems & Capabilities
              {((formData.linked_system_ids?.length || 0) + (formData.linked_it_capability_ids?.length || 0)) > 0 && (
                <Badge variant="secondary" className="ml-2">{(formData.linked_system_ids?.length || 0) + (formData.linked_it_capability_ids?.length || 0)}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="links">
              Links
              {(formData.linked_risk_ids?.length || 0) + (formData.linked_control_ids?.length || 0) +
               (formData.linked_issue_ids?.length || 0) + (formData.linked_goal_ids?.length || 0) +
               (formData.linked_assessment_ids?.length || 0) + (formData.linked_org_objective_ids?.length || 0) +
               (formData.linked_ihpom_ids?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {(formData.linked_risk_ids?.length || 0) + (formData.linked_control_ids?.length || 0) +
                   (formData.linked_issue_ids?.length || 0) + (formData.linked_goal_ids?.length || 0) +
                   (formData.linked_assessment_ids?.length || 0) + (formData.linked_org_objective_ids?.length || 0) +
                   (formData.linked_ihpom_ids?.length || 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="execution">Execution</TabsTrigger>
            {formData.level === 3 && (
              <TabsTrigger value="min_requirements">
                <ListChecks className="w-3.5 h-3.5 mr-1" />
                Min. Requirements
                {(formData.minimum_requirements?.length || 0) > 0 && (
                  <Badge variant="secondary" className="ml-2">{formData.minimum_requirements.length}</Badge>
                )}
              </TabsTrigger>
            )}
            {!isNew && processId && (
              <TabsTrigger value="flowchart">
                <GitBranch className="w-3.5 h-3.5 mr-1" />
                Flow Chart
              </TabsTrigger>
            )}
          </TabsList>

          {/* DETAILS TAB */}
          <TabsContent value="details" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100"><CardTitle>Basic Information</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Process Code *</Label>
                    <Input value={formData.process_code} onChange={e => setFormData({ ...formData, process_code: e.target.value })} placeholder="e.g., P1.1.2.1" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Hierarchy Level *</Label>
                    <Select value={formData.level.toString()} onValueChange={v => setFormData({ ...formData, level: parseInt(v), parent_id: "" })} required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(levelLabels).map(([l, label]) => (
                          <SelectItem key={l} value={l}>L{l}: {label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Company *</Label>
                    <Select value={formData.company_id} onValueChange={v => setFormData({ ...formData, company_id: v, parent_id: "" })} required>
                      <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                      <SelectContent>
                        {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Process Name *</Label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.level > 0 && (
                    <div className="space-y-2">
                      <Label>Parent Process</Label>
                      <div className="relative" ref={parentPickerRef}>
                        <button
                          type="button"
                          onClick={() => { setParentPickerOpen(v => !v); setParentSearch(""); }}
                          className="w-full flex items-center justify-between border border-input bg-background rounded-md px-3 py-2 text-sm shadow-sm hover:bg-accent transition-colors"
                        >
                          <span className={formData.parent_id ? "text-foreground" : "text-muted-foreground"}>
                            {formData.parent_id
                              ? (() => { const p = processes.find(x => x.id === formData.parent_id); return p ? `${p.process_code} – ${p.name}` : "Select parent"; })()
                              : "Search by code or name…"}
                          </span>
                          <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                        </button>
                        {parentPickerOpen && (
                          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-border rounded-md shadow-lg">
                            <div className="p-2 border-b border-border">
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                  autoFocus
                                  className="w-full pl-7 pr-3 py-1.5 text-sm border border-input rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                  placeholder="Search process code or name…"
                                  value={parentSearch}
                                  onChange={e => setParentSearch(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="max-h-56 overflow-y-auto py-1">
                              <div
                                className="px-3 py-2 text-sm text-muted-foreground hover:bg-accent cursor-pointer"
                                onClick={() => { setFormData({ ...formData, parent_id: "" }); setParentPickerOpen(false); }}
                              >
                                — None —
                              </div>
                              {potentialParents
                                .filter(p => {
                                  const q = parentSearch.toLowerCase();
                                  return !q || p.process_code?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q);
                                })
                                .map(p => (
                                  <div
                                    key={p.id}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent ${formData.parent_id === p.id ? "bg-primary/10 font-medium" : ""}`}
                                    onClick={() => { setFormData({ ...formData, parent_id: p.id }); setParentPickerOpen(false); setParentSearch(""); }}
                                  >
                                    <span className="font-mono text-xs text-primary mr-2">{p.process_code}</span>
                                    {p.name}
                                    <span className="ml-2 text-xs text-muted-foreground">(L{p.level})</span>
                                  </div>
                                ))
                              }
                              {potentialParents.filter(p => {
                                const q = parentSearch.toLowerCase();
                                return !q || p.process_code?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q);
                              }).length === 0 && (
                                <p className="px-3 py-3 text-sm text-muted-foreground text-center">No matching processes</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {formData.parent_id && (
                        <button type="button" className="text-xs text-red-500 hover:underline mt-1" onClick={() => setFormData({ ...formData, parent_id: "" })}>
                          Clear parent
                        </button>
                      )}
                    </div>
                  )}
                  {formData.level === 0 && (
                    <div className="space-y-2">
                      <Label>Value Chain</Label>
                      <Input value={formData.value_chain} onChange={e => setFormData({ ...formData, value_chain: e.target.value })} placeholder="e.g., Customer Service, Operations" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Criticality</Label>
                    <Select value={formData.criticality} onValueChange={v => setFormData({ ...formData, criticality: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Workstream</Label>
                    <Input value={formData.workstream} onChange={e => setFormData({ ...formData, workstream: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Documentation URL</Label>
                    <Input type="url" value={formData.documentation_url} onChange={e => setFormData({ ...formData, documentation_url: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OWNERSHIP TAB */}
          <TabsContent value="ownership" className="space-y-6">
            <StakeholderPickerDialog
              open={!!stakeholderPickerTarget}
              onOpenChange={open => !open && setStakeholderPickerTarget(null)}
              stakeholders={formData.company_id ? stakeholders.filter(s => s.company_id === formData.company_id) : stakeholders}
              stakeholderGroups={stakeholderGroups}
              onSelect={s => handleSelectStakeholder(s, stakeholderPickerTarget)}
            />

            {/* Process Owner */}
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-indigo-600" />Process Owner</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {/* Stakeholder link */}
                <div className="space-y-2">
                  <Label>Assign from Stakeholder Register</Label>
                  <div className="flex items-center gap-2">
                    {selectedOwnerStakeholder ? (
                      <div className="flex-1 flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                          {(selectedOwnerStakeholder.full_name || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm">{selectedOwnerStakeholder.full_name}</p>
                          <p className="text-xs text-slate-500">{selectedOwnerStakeholder.job_title}{selectedOwnerStakeholder.department ? ` · ${selectedOwnerStakeholder.department}` : ""}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setFormData(prev => ({ ...prev, process_owner_stakeholder_id: "", process_owner: "" }))}>
                          <X className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" className="flex-1 justify-start text-slate-500" onClick={() => setStakeholderPickerTarget("owner")}>
                        <Search className="w-4 h-4 mr-2 text-slate-400" />
                        Search stakeholders by name or job title…
                      </Button>
                    )}
                  </div>
                </div>

                {/* User profile link */}
                <div className="space-y-2">
                  <Label>Assign from User Profiles</Label>
                  <div className="relative" ref={userPickerRef}>
                    <button
                      type="button"
                      onClick={() => setUserPickerOpen(v => !v)}
                      className="w-full flex items-center justify-between border border-input bg-background rounded-md px-3 py-2 text-sm shadow-sm hover:bg-accent transition-colors"
                    >
                      <span className={formData.process_owner_id ? "text-foreground" : "text-muted-foreground"}>
                        {selectedOwnerUser ? `${selectedOwnerUser.full_name || selectedOwnerUser.email} (${selectedOwnerUser.email})` : "Search and select a user profile…"}
                      </span>
                      <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                    </button>
                    {userPickerOpen && (
                      <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-border rounded-md shadow-lg">
                        <div className="p-2 border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                              autoFocus
                              className="w-full pl-7 pr-3 py-1.5 text-sm border border-input rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                              placeholder="Search name or email…"
                              value={userSearchOwner}
                              onChange={e => setUserSearchOwner(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto py-1">
                          <div className="px-3 py-2 text-sm text-muted-foreground hover:bg-accent cursor-pointer"
                            onClick={() => { setFormData(prev => ({ ...prev, process_owner_id: "" })); setUserPickerOpen(false); setUserSearchOwner(""); }}>
                            — Not assigned —
                          </div>
                          {filteredUsersForOwner.map(u => (
                            <div key={u.id}
                              className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent ${formData.process_owner_id === u.id ? "bg-primary/10 font-medium" : ""}`}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, process_owner_id: u.id, process_owner: u.full_name || u.email, process_owner_stakeholder_id: "" }));
                                setUserPickerOpen(false);
                                setUserSearchOwner("");
                              }}>
                              <span className="font-medium">{u.full_name || u.email}</span>
                              <span className="ml-2 text-xs text-muted-foreground">{u.email}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedOwnerUser && (
                    <p className="text-xs text-slate-500">{selectedOwnerUser.email} · <Badge className="text-xs bg-indigo-100 text-indigo-700">{selectedOwnerUser.role}</Badge></p>
                  )}
                </div>

                {/* Free text fallback */}
                <div className="space-y-2">
                  <Label>Process Owner (Free Text)</Label>
                  <p className="text-xs text-slate-400">Use this for third parties or external owners not in the system</p>
                  <Input
                    value={formData.process_owner}
                    onChange={e => setFormData({ ...formData, process_owner: e.target.value, process_owner_id: "", process_owner_stakeholder_id: "" })}
                    placeholder="e.g. Third Party Vendor Name"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Deputy & GCO */}
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-slate-500" />Deputy & Control Ownership</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Deputy Owner</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.deputy_owner}
                        onChange={e => setFormData({ ...formData, deputy_owner: e.target.value })}
                        placeholder="Deputy or backup owner"
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="icon" title="Search stakeholders" onClick={() => setStakeholderPickerTarget("deputy")}>
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Global Control Owner</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.global_control_owner}
                        onChange={e => setFormData({ ...formData, global_control_owner: e.target.value })}
                        placeholder="Global control owner"
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="icon" title="Search stakeholders" onClick={() => setStakeholderPickerTarget("gco")}>
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SYSTEMS TAB */}
          <TabsContent value="systems" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Server className="w-5 h-5 text-teal-600" />ICT Systems</CardTitle>
                  <Dialog open={activeDialog === "system"} onOpenChange={open => setActiveDialog(open ? "system" : null)}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Link System</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Link ICT System</DialogTitle></DialogHeader>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {systems.filter(s => !formData.linked_system_ids?.includes(s.id)).map(sys => (
                          <div key={sys.id} className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => addLink("linked_system_ids", sys.id)}>
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{sys.name}</p>
                              <Badge variant="outline" className={sys.criticality === "critical" ? "text-red-700 border-red-200" : "text-slate-600"}>
                                {sys.criticality}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500">{sys.system_type?.replace(/_/g, " ")} • {sys.hosting_type?.replace(/_/g, " ")}</p>
                            {sys.owner && <p className="text-xs text-slate-400 mt-1">Owner: {sys.owner}</p>}
                          </div>
                        ))}
                        {systems.filter(s => !formData.linked_system_ids?.includes(s.id)).length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-4">All systems are already linked.</p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {linkedSystems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {linkedSystems.map(sys => (
                      <div key={sys.id} className="flex items-start justify-between p-4 bg-teal-50 rounded-lg border border-teal-200">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Server className="w-4 h-4 text-teal-600 shrink-0" />
                            <p className="font-semibold text-slate-900 text-sm">{sys.name}</p>
                            <Badge variant="outline" className={sys.criticality === "critical" ? "text-red-700 border-red-200 text-xs" : "text-slate-600 text-xs"}>
                              {sys.criticality}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{sys.system_type?.replace(/_/g, " ")} • {sys.hosting_type?.replace(/_/g, " ")}</p>
                          {sys.owner && <p className="text-xs text-slate-500">Owner: {sys.owner}</p>}
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeLink("linked_system_ids", sys.id)}>
                          <X className="w-3 h-3 text-slate-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Server className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm">No systems allocated yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* IT Capabilities — available for all levels */}
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-purple-600" />IT Capabilities
                    {formData.level === 3 && <Badge className="ml-2 text-xs bg-purple-100 text-purple-700">Sub-Process</Badge>}
                  </CardTitle>
                  <Dialog open={activeDialog === "capability"} onOpenChange={open => setActiveDialog(open ? "capability" : null)}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Link Capability</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Link IT Capability</DialogTitle></DialogHeader>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {itCapabilities
                          .filter(c => (!formData.company_id || c.company_id === formData.company_id) && !formData.linked_it_capability_ids?.includes(c.id))
                          .map(cap => (
                            <div key={cap.id} className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => addLink("linked_it_capability_ids", cap.id)}>
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{cap.name}</p>
                                <Badge variant="outline" className="text-xs text-slate-600 capitalize">{cap.category?.replace(/_/g, " ")}</Badge>
                              </div>
                              {cap.maturity_level && <p className="text-xs text-slate-500 mt-1">Maturity: {cap.maturity_level}</p>}
                            </div>
                          ))}
                        {itCapabilities.filter(c => (!formData.company_id || c.company_id === formData.company_id) && !formData.linked_it_capability_ids?.includes(c.id)).length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-4">No IT capabilities available to link.</p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {linkedCapabilities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {linkedCapabilities.map(cap => (
                      <div key={cap.id} className="flex items-start justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm">{cap.name}</p>
                          <p className="text-xs text-slate-500 capitalize mt-0.5">{cap.category?.replace(/_/g, " ")}{cap.maturity_level ? ` · ${cap.maturity_level}` : ""}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeLink("linked_it_capability_ids", cap.id)}>
                          <X className="w-3 h-3 text-slate-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Server className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm">No IT capabilities linked yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* LINKS TAB */}
          <TabsContent value="links" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risks */}
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-600" />Linked Risks</CardTitle>
                    <Dialog open={activeDialog === "risk"} onOpenChange={open => setActiveDialog(open ? "risk" : null)}>
                      <DialogTrigger asChild><Button type="button" variant="outline" size="sm"><Plus className="w-4 h-4" /></Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Link Risk</DialogTitle></DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {risks.filter(r => !formData.linked_risk_ids?.includes(r.id)).map(risk => (
                            <div key={risk.id} className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => addLink("linked_risk_ids", risk.id)}>
                              <p className="font-medium">{risk.title}</p>
                              <p className="text-sm text-slate-600">{risk.category?.replace("_", " ")}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {linkedRisks.length > 0 ? linkedRisks.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200 mb-2">
                      <span className="text-sm">{r.title}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLink("linked_risk_ids", r.id)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                    </div>
                  )) : <p className="text-sm text-slate-500 text-center py-4">No risks linked</p>}
                </CardContent>
              </Card>

              {/* Controls */}
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600" />Linked Controls</CardTitle>
                    <Dialog open={activeDialog === "control"} onOpenChange={open => setActiveDialog(open ? "control" : null)}>
                      <DialogTrigger asChild><Button type="button" variant="outline" size="sm"><Plus className="w-4 h-4" /></Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Link Control</DialogTitle></DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {controls.filter(c => !formData.linked_control_ids?.includes(c.id)).map(ctrl => (
                            <div key={ctrl.id} className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => addLink("linked_control_ids", ctrl.id)}>
                              <p className="font-medium">{ctrl.control_id} – {ctrl.title}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {linkedControls.length > 0 ? linkedControls.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200 mb-2">
                      <span className="text-sm">{c.control_id} – {c.title}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLink("linked_control_ids", c.id)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                    </div>
                  )) : <p className="text-sm text-slate-500 text-center py-4">No controls linked</p>}
                </CardContent>
              </Card>

              {/* Issues */}
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-600" />Linked Issues</CardTitle>
                    <Dialog open={activeDialog === "issue"} onOpenChange={open => setActiveDialog(open ? "issue" : null)}>
                      <DialogTrigger asChild><Button type="button" variant="outline" size="sm"><Plus className="w-4 h-4" /></Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Link Issue</DialogTitle></DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {issues.filter(i => !formData.linked_issue_ids?.includes(i.id)).map(issue => (
                            <div key={issue.id} className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => addLink("linked_issue_ids", issue.id)}>
                              <p className="font-medium">{issue.title}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {linkedIssues.length > 0 ? linkedIssues.map(i => (
                    <div key={i.id} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200 mb-2">
                      <span className="text-sm">{i.title}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLink("linked_issue_ids", i.id)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                    </div>
                  )) : <p className="text-sm text-slate-500 text-center py-4">No issues linked</p>}
                </CardContent>
              </Card>

              {/* Goals */}
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-purple-600" />Linked GRC Goals</CardTitle>
                    <Dialog open={activeDialog === "goal"} onOpenChange={open => setActiveDialog(open ? "goal" : null)}>
                      <DialogTrigger asChild><Button type="button" variant="outline" size="sm"><Plus className="w-4 h-4" /></Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Link GRC Goal</DialogTitle></DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {goals.filter(g => !formData.linked_goal_ids?.includes(g.id)).map(goal => (
                            <div key={goal.id} className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => addLink("linked_goal_ids", goal.id)}>
                              <p className="font-medium">{goal.title}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {linkedGoals.length > 0 ? linkedGoals.map(g => (
                    <div key={g.id} className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-200 mb-2">
                      <span className="text-sm">{g.title}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLink("linked_goal_ids", g.id)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                    </div>
                  )) : <p className="text-sm text-slate-500 text-center py-4">No goals linked</p>}
                </CardContent>
              </Card>

              {/* Org Objectives */}
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-indigo-600" />Org. Objectives</CardTitle>
                    <Dialog open={activeDialog === "org_obj"} onOpenChange={open => setActiveDialog(open ? "org_obj" : null)}>
                      <DialogTrigger asChild><Button type="button" variant="outline" size="sm"><Plus className="w-4 h-4" /></Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Link Org. Objective</DialogTitle></DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {companyOrgObjectives.filter(o => !linkedOrgObjectiveIds.includes(o.id)).map(o => (
                            <div key={o.id} className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => addLink("linked_org_objective_ids", o.id)}>
                              <p className="font-medium text-sm">{o.title}</p>
                              <p className="text-xs text-slate-500 capitalize">{o.category} · {o.status}</p>
                            </div>
                          ))}
                          {companyOrgObjectives.filter(o => !linkedOrgObjectiveIds.includes(o.id)).length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No objectives available.</p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {linkedOrgObjectives.length > 0 ? linkedOrgObjectives.map(o => (
                    <div key={o.id} className="flex items-center justify-between p-2 bg-indigo-50 rounded border border-indigo-200 mb-2">
                      <div>
                        <p className="text-sm font-medium">{o.title}</p>
                        <p className="text-xs text-slate-500 capitalize">{o.category}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLink("linked_org_objective_ids", o.id)}>
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  )) : <p className="text-sm text-slate-500 text-center py-4">No org. objectives linked</p>}
                </CardContent>
              </Card>

              {/* Assessments */}
              <Card className="border-none shadow-lg lg:col-span-2">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-green-600" />Linked Assessments</CardTitle>
                    <Dialog open={activeDialog === "assessment"} onOpenChange={open => setActiveDialog(open ? "assessment" : null)}>
                      <DialogTrigger asChild><Button type="button" variant="outline" size="sm"><Plus className="w-4 h-4" /></Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Link Assessment</DialogTitle></DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {assessments.filter(a => !formData.linked_assessment_ids?.includes(a.id)).map(a => (
                            <div key={a.id} className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => addLink("linked_assessment_ids", a.id)}>
                              <p className="font-medium">{a.name}</p>
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
                      {linkedAssessments.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                          <span className="text-sm">{a.name}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLink("linked_assessment_ids", a.id)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-500 text-center py-4">No assessments linked</p>}
                </CardContent>
              </Card>

              {/* iHPOM Nodes */}
              <Card className="border-none shadow-lg lg:col-span-2">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Network className="w-5 h-5 text-purple-600" />Linked iHPOM Nodes</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => setActiveDialog("ihpom")}>
                      <Plus className="w-4 h-4 mr-1" />Link Node
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {linkedIHPOMNodes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {linkedIHPOMNodes.map(n => (
                        <div key={n.id} className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-200">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge className="bg-purple-100 text-purple-700 shrink-0 text-xs">L{n.level}</Badge>
                            {n.symbol && <span className="text-xs font-bold text-slate-700 uppercase shrink-0">{n.symbol}</span>}
                            <span className="font-mono text-xs text-slate-500 shrink-0">{n.node_code}</span>
                            <span className="text-sm truncate">{n.name}</span>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeLink("linked_ihpom_ids", n.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-500 text-center py-4">No iHPOM nodes linked</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* EXECUTION TAB */}
          <TabsContent value="execution" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100"><CardTitle>Execution Details</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={formData.frequency} onValueChange={v => setFormData({ ...formData, frequency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["continuous","daily","weekly","monthly","quarterly","annually","ad_hoc"].map(f => (
                          <SelectItem key={f} value={f}>{f.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Duration</Label>
                    <Input value={formData.estimated_duration} onChange={e => setFormData({ ...formData, estimated_duration: e.target.value })} placeholder="e.g., 2 hours, 30 minutes" />
                  </div>
                  <div className="space-y-2">
                    <Label>Automation Level</Label>
                    <Select value={formData.automation_level} onValueChange={v => setFormData({ ...formData, automation_level: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="semi_automated">Semi-Automated</SelectItem>
                        <SelectItem value="fully_automated">Fully Automated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Process Inputs</Label>
                  <Textarea value={formData.inputs} onChange={e => setFormData({ ...formData, inputs: e.target.value })} rows={2} placeholder="What inputs does this process require?" />
                </div>
                <div className="space-y-2">
                  <Label>Process Outputs</Label>
                  <Textarea value={formData.outputs} onChange={e => setFormData({ ...formData, outputs: e.target.value })} rows={2} placeholder="What outputs does this process produce?" />
                </div>
                <div className="space-y-2">
                  <Label>Key Performance Indicators</Label>
                  <Textarea value={formData.key_performance_indicators} onChange={e => setFormData({ ...formData, key_performance_indicators: e.target.value })} rows={2} placeholder="How is this process measured?" />
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* MINIMUM REQUIREMENTS TAB */}
          {formData.level === 3 && (
            <TabsContent value="min_requirements" className="space-y-6">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-teal-600" />
                        Minimum Requirements
                      </CardTitle>
                      <p className="text-sm text-slate-500 mt-1">Define up to 10 minimum requirements for this sub-process.</p>
                    </div>
                    {(formData.minimum_requirements?.length || 0) < 10 && (
                      <Button type="button" variant="outline" size="sm" onClick={addRequirement}>
                        <Plus className="w-4 h-4 mr-1" />Add Requirement
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {(formData.minimum_requirements?.length || 0) === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                      <ListChecks className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm">No requirements added yet</p>
                      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addRequirement}>
                        <Plus className="w-4 h-4 mr-1" />Add First Requirement
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 px-3 font-semibold text-slate-700 w-8">#</th>
                            <th className="text-left py-2 px-3 font-semibold text-slate-700 w-1/3">Requirement</th>
                            <th className="text-left py-2 px-3 font-semibold text-slate-700">Description</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(formData.minimum_requirements || []).map((req, idx) => (
                            <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2 px-3">
                                <Input
                                  value={req.requirement}
                                  onChange={e => updateRequirement(req.id, "requirement", e.target.value)}
                                  placeholder="Requirement title"
                                  className="h-8 text-sm"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Textarea
                                  value={req.description}
                                  onChange={e => updateRequirement(req.id, "description", e.target.value)}
                                  placeholder="Describe the requirement..."
                                  rows={2}
                                  className="text-sm resize-none"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRequirement(req.id)}>
                                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(formData.minimum_requirements?.length || 0) < 10 && (
                        <Button type="button" variant="ghost" size="sm" className="mt-3 text-teal-600 hover:text-teal-700" onClick={addRequirement}>
                          <Plus className="w-4 h-4 mr-1" />Add Row
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* FLOW CHART TAB */}
          {!isNew && processId && (
            <TabsContent value="flowchart" className="space-y-4">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-primary" />
                    Process Flow Chart
                  </CardTitle>
                  <p className="text-sm text-slate-500">Interactive view of child processes and associated systems. Click a node to inspect details.</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <ProcessFlowChart
                    rootProcess={existingProcess?.[0]}
                    allProcesses={processes}
                    systems={systems}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </form>

      <IHPOMNodeLinkDialog
        open={activeDialog === "ihpom"}
        onOpenChange={open => setActiveDialog(open ? "ihpom" : null)}
        nodes={ihpomNodes}
        linkedIds={formData.linked_ihpom_ids || []}
        onAdd={id => addLink("linked_ihpom_ids", id)}
      />

      {processId && !isNew && (
        <WorkflowPanel
          entityType="OrgProcess"
          entityId={processId}
          entityName={formData.name || "Process"}
          companyId={formData.company_id}
          record={existingProcess?.[0]}
          onInstanceCreated={() => queryClient.invalidateQueries(["orgProcess", processId])}
        />
      )}
    </div>
  );
}
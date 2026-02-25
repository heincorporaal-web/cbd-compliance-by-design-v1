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
import {
  ArrowLeft, Save, Plus, Trash2, Shield, AlertTriangle, AlertCircle,
  Target, ClipboardCheck, X, User, Server, Users
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const levelLabels = {
  0: "Value Chain", 1: "Process Group", 2: "Process",
  3: "Sub-Process", 4: "Procedure", 5: "Task", 6: "Activity/Keystroke"
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
    process_owner: "", process_owner_id: "", deputy_owner: "",
    global_control_owner: "", workstream: "", status: "active",
    linked_system_ids: [], linked_risk_ids: [], linked_control_ids: [],
    linked_issue_ids: [], linked_goal_ids: [], linked_assessment_ids: [],
    linked_objective_ids: [], linked_principle_risk_ids: [],
    documentation_url: "", frequency: "ad_hoc", estimated_duration: "",
    automation_level: "manual", criticality: "medium",
    inputs: "", outputs: "", key_performance_indicators: "", notes: ""
  });

  const [activeDialog, setActiveDialog] = useState(null);

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
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => base44.entities.User.list() });

  useEffect(() => {
    if (existingProcess?.[0]) setFormData(existingProcess[0]);
  }, [existingProcess]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OrgProcess.create(data),
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

  const handleSubmit = (e) => {
    e.preventDefault();
    isNew || !processId ? createMutation.mutate(formData) : updateMutation.mutate(formData);
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
  const linkedRisks = risks.filter(r => formData.linked_risk_ids?.includes(r.id));
  const linkedControls = controls.filter(c => formData.linked_control_ids?.includes(c.id));
  const linkedIssues = issues.filter(i => formData.linked_issue_ids?.includes(i.id));
  const linkedGoals = goals.filter(g => formData.linked_goal_ids?.includes(g.id));
  const linkedAssessments = assessments.filter(a => formData.linked_assessment_ids?.includes(a.id));
  const linkedObjectives = availableObjectives.filter(o => formData.linked_objective_ids?.includes(o.id));
  const linkedPrincipleRisks = availablePrincipleRisks.filter(r => formData.linked_principle_risk_ids?.includes(r.id));

  const selectedOwnerUser = users.find(u => u.id === formData.process_owner_id);

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
              Systems
              {(formData.linked_system_ids?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-2">{formData.linked_system_ids.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="links">
              Links
              {(formData.linked_risk_ids?.length || 0) + (formData.linked_control_ids?.length || 0) +
               (formData.linked_issue_ids?.length || 0) + (formData.linked_goal_ids?.length || 0) +
               (formData.linked_assessment_ids?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {(formData.linked_risk_ids?.length || 0) + (formData.linked_control_ids?.length || 0) +
                   (formData.linked_issue_ids?.length || 0) + (formData.linked_goal_ids?.length || 0) +
                   (formData.linked_assessment_ids?.length || 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="execution">Execution</TabsTrigger>
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
                  {formData.level > 0 && potentialParents.length > 0 && (
                    <div className="space-y-2">
                      <Label>Parent Process</Label>
                      <Select value={formData.parent_id || ""} onValueChange={v => setFormData({ ...formData, parent_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>None</SelectItem>
                          {potentialParents.map(p => (
                            <SelectItem key={p.id} value={p.id}>L{p.level}: {p.process_code} – {p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-indigo-600" />Process Ownership</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Process Owner (User)</Label>
                    <Select value={formData.process_owner_id || ""} onValueChange={v => {
                      const user = users.find(u => u.id === v);
                      setFormData({ ...formData, process_owner_id: v, process_owner: user ? user.full_name || user.email : formData.process_owner });
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Not assigned</SelectItem>
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.full_name || u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedOwnerUser && (
                      <p className="text-xs text-slate-500">{selectedOwnerUser.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Process Owner (Free Text)</Label>
                    <Input value={formData.process_owner} onChange={e => setFormData({ ...formData, process_owner: e.target.value })} placeholder="Name if not a system user" />
                  </div>
                  <div className="space-y-2">
                    <Label>Deputy Owner</Label>
                    <Input value={formData.deputy_owner} onChange={e => setFormData({ ...formData, deputy_owner: e.target.value })} placeholder="Deputy or backup owner" />
                  </div>
                  <div className="space-y-2">
                    <Label>Global Control Owner</Label>
                    <Input value={formData.global_control_owner} onChange={e => setFormData({ ...formData, global_control_owner: e.target.value })} />
                  </div>
                </div>

                {selectedOwnerUser && (
                  <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {(selectedOwnerUser.full_name || selectedOwnerUser.email || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{selectedOwnerUser.full_name || selectedOwnerUser.email}</p>
                        <p className="text-sm text-slate-600">{selectedOwnerUser.email}</p>
                        <Badge className="mt-1 text-xs bg-indigo-100 text-indigo-700">{selectedOwnerUser.role}</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SYSTEMS TAB */}
          <TabsContent value="systems" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Server className="w-5 h-5 text-teal-600" />Allocated Systems</CardTitle>
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
        </Tabs>
      </form>
    </div>
  );
}
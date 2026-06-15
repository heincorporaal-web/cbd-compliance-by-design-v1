import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target, Plus, Search, Building2, Calendar, User,
  Pencil, Trash2, Link2, ChevronDown, ChevronUp
} from "lucide-react";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { toast } from "sonner";

const CATEGORIES = ["Compliance", "IT Compliance", "Operational", "Financial", "Client Relations", "Resilience", "Data", "Fundamentals"];
const OBJ_TYPES = ["Strategic", "Tactical", "Regulatory", "Operational"];
const TIME_HORIZONS = ["Annual", "3 Year", "5 Year", "Continuous"];
const STATUSES = ["Draft", "Approved", "Active", "Under Review", "Retired"];
const APPROVAL_STATUSES = ["Pending", "Approved", "Rejected"];
const CRITICALITIES = ["Must Have", "Should Have", "Could Have", "Won't Have"];
const PRIORITY_LABELS = ["Low", "Medium", "High", "Critical", "Imperative"];
const KPI_TYPES = ["Numeric", "Judgemental", "Logic"];

const EMPTY_KPI = () => ({ id: crypto.randomUUID(), measurement_name: "", measurement_type: "Numeric", measurement_description: "", calculation_method: "", data_source_link: "" });

const EMPTY_FORM = {
  title: "", description: "", company_id: "", category: "Operational",
  strategic_theme: "", objective_type: "Strategic",
  priority_rating_numeric: "", priority_rating_label: "Medium",
  criticality: "Must Have", time_horizon: "Annual",
  valid_from: "", valid_to: "", status: "Draft",
  approval_status: "Pending", rejection_reason: "", approved_by: "",
  next_review_date: "", objective_owner: "", performance_owner: "",
  compliance_owner: "", it_owner: "", notes: "",
  parent_objective_id: "", linked_framework_ids: [], linked_risk_ids: [],
  linked_control_ids: [], linked_process_ids: [], linked_ihpom_ids: [],
  linked_capability_ids: [], linked_value_chain_ids: [], linked_business_unit_ids: [],
  kpis: [], progress_pct: 0, key_results: [],
};

const STATUS_COLORS = {
  Draft: "bg-slate-100 text-slate-600",
  Approved: "bg-green-100 text-green-700",
  Active: "bg-blue-100 text-blue-700",
  "Under Review": "bg-yellow-100 text-yellow-700",
  Retired: "bg-red-100 text-red-700",
};

const CAT_COLORS = {
  Compliance: "bg-orange-100 text-orange-700",
  "IT Compliance": "bg-cyan-100 text-cyan-700",
  Operational: "bg-blue-100 text-blue-700",
  Financial: "bg-green-100 text-green-700",
  "Client Relations": "bg-pink-100 text-pink-700",
  Resilience: "bg-purple-100 text-purple-700",
  Data: "bg-indigo-100 text-indigo-700",
  Fundamentals: "bg-slate-100 text-slate-700",
};

export default function OrgObjectives() {
  const queryClient = useQueryClient();
  const { selectedCompany } = useCompanyFilter();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);

  const { data: objectives = [], isLoading } = useQuery({
    queryKey: ["orgObjectives"],
    queryFn: () => base44.entities.OrgObjective.list("-created_date"),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ["frameworks"],
    queryFn: () => base44.entities.Framework.list(),
  });

  const { data: businessUnits = [] } = useQuery({
    queryKey: ["businessUnits"],
    queryFn: () => base44.entities.BusinessUnit.list(),
  });

  const { data: valueChains = [] } = useQuery({
    queryKey: ["valueChains"],
    queryFn: () => base44.entities.ValueChain.list(),
  });

  const { data: capabilities = [] } = useQuery({
    queryKey: ["capabilities"],
    queryFn: () => base44.entities.ITCapability.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OrgObjective.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["orgObjectives"]); closeDialog(); toast.success("Objective created"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OrgObjective.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["orgObjectives"]); closeDialog(); toast.success("Objective updated"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OrgObjective.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["orgObjectives"]); toast.success("Objective deleted"); },
  });

  const closeDialog = () => { setDialogOpen(false); setEditId(null); setForm(EMPTY_FORM); };

  const openEdit = (obj) => {
    setForm({ ...EMPTY_FORM, ...obj });
    setEditId(obj.id);
    setDialogOpen(true);
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.title || !form.company_id) { toast.error("Title and company are required"); return; }
    if (editId) updateMutation.mutate({ id: editId, data: form });
    else createMutation.mutate(form);
  };

  const toggleId = (field, id) => {
    const current = form[field] || [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    set(field, next);
  };

  const addKpi = () => set("kpis", [...(form.kpis || []), EMPTY_KPI()]);
  const removeKpi = (idx) => set("kpis", form.kpis.filter((_, i) => i !== idx));
  const updateKpi = (idx, field, value) => {
    const updated = [...form.kpis];
    updated[idx] = { ...updated[idx], [field]: value };
    set("kpis", updated);
  };

  const filtered = objectives.filter(o => {
    const matchCompany = !selectedCompany || o.company_id === selectedCompany;
    const matchSearch = !search || o.title?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || o.category === catFilter;
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchCompany && matchSearch && matchCat && matchStatus;
  });

  const stats = {
    total: filtered.length,
    active: filtered.filter(o => o.status === "Active").length,
    approved: filtered.filter(o => o.status === "Approved").length,
    avgProgress: filtered.length ? Math.round(filtered.reduce((s, o) => s + (o.progress_pct || 0), 0) / filtered.length) : 0,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Organisational Objectives</h1>
            <p className="text-slate-600">Strategic goals linked to risks, controls, frameworks & more</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-slate-900" },
          { label: "Active", value: stats.active, color: "text-blue-600" },
          { label: "Approved", value: stats.approved, color: "text-green-600" },
          { label: "Avg. Progress", value: `${stats.avgProgress}%`, color: "text-indigo-600" },
        ].map(s => (
          <Card key={s.label} className="border-none shadow-lg">
            <CardContent className="pt-5 pb-4">
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search objectives…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No objectives found</p>
          <Button onClick={() => setDialogOpen(true)}>Create First Objective</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(obj => {
            const company = companies.find(c => c.id === obj.company_id);
            return (
              <Card key={obj.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {obj.reference_number && <span className="font-mono text-xs text-primary">{obj.reference_number}</span>}
                        <h3 className="font-semibold text-slate-900">{obj.title}</h3>
                        <Badge className={CAT_COLORS[obj.category] || "bg-slate-100 text-slate-600"}>{obj.category}</Badge>
                        <Badge className={STATUS_COLORS[obj.status] || "bg-slate-100 text-slate-600"}>{obj.status}</Badge>
                        {obj.objective_type && <Badge variant="outline" className="text-xs">{obj.objective_type}</Badge>}
                      </div>
                      {obj.description && <p className="text-sm text-slate-500 mb-2 line-clamp-2">{obj.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        {company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{company.name}</span>}
                        {obj.objective_owner && <span className="flex items-center gap-1"><User className="w-3 h-3" />{obj.objective_owner}</span>}
                        {obj.time_horizon && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{obj.time_horizon}</span>}
                        {obj.criticality && <span className="text-purple-600 font-medium">{obj.criticality}</span>}
                      </div>
                      {obj.progress_pct !== undefined && (
                        <div className="mt-3 flex items-center gap-3">
                          <Progress value={obj.progress_pct || 0} className="h-2 flex-1" />
                          <span className="text-xs text-slate-500 w-10 text-right">{obj.progress_pct || 0}%</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(obj)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => deleteMutation.mutate(obj.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add New button at bottom */}
      <div className="flex justify-center pt-2">
        <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Plus className="w-4 h-4" /> New Objective
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Objective" : "New Organisational Objective"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="governance">Governance</TabsTrigger>
              <TabsTrigger value="owners">Owners</TabsTrigger>
              <TabsTrigger value="linkages">Linkages</TabsTrigger>
              <TabsTrigger value="kpis">KPIs</TabsTrigger>
            </TabsList>

            {/* ── Details Tab ── */}
            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Objective title" />
                </div>
                <div>
                  <Label>Company *</Label>
                  <Select value={form.company_id} onValueChange={v => set("company_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reference Number</Label>
                  <Input value={form.reference_number || ""} onChange={e => set("reference_number", e.target.value)} placeholder="e.g. OBJ-001" />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => set("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Strategic Theme</Label>
                  <Input value={form.strategic_theme} onChange={e => set("strategic_theme", e.target.value)} placeholder="Free text strategic theme" />
                </div>
                <div>
                  <Label>Objective Type</Label>
                  <Select value={form.objective_type} onValueChange={v => set("objective_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{OBJ_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time Horizon</Label>
                  <Select value={form.time_horizon} onValueChange={v => set("time_horizon", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIME_HORIZONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority Rating (1–5)</Label>
                  <Select value={String(form.priority_rating_numeric || "")} onValueChange={v => set("priority_rating_numeric", Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Select 1-5" /></SelectTrigger>
                    <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority Rating Scale</Label>
                  <Select value={form.priority_rating_label} onValueChange={v => set("priority_rating_label", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITY_LABELS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Criticality (MoSCoW)</Label>
                  <Select value={form.criticality} onValueChange={v => set("criticality", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CRITICALITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valid From</Label>
                  <Input type="date" value={form.valid_from} onChange={e => set("valid_from", e.target.value)} />
                </div>
                <div>
                  <Label>Valid To</Label>
                  <Input type="date" value={form.valid_to} onChange={e => set("valid_to", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} />
                </div>
                <div>
                  <Label>Progress %</Label>
                  <Input type="number" min={0} max={100} value={form.progress_pct || 0} onChange={e => set("progress_pct", parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Parent Objective</Label>
                  <Select value={form.parent_objective_id || ""} onValueChange={v => set("parent_objective_id", v)}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {objectives.filter(o => o.id !== editId).map(o => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* ── Governance Tab ── */}
            <TabsContent value="governance" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Approval Status</Label>
                  <Select value={form.approval_status} onValueChange={v => set("approval_status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{APPROVAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {form.approval_status === "Rejected" && (
                  <div className="col-span-2">
                    <Label>Rejection Reason</Label>
                    <Textarea value={form.rejection_reason} onChange={e => set("rejection_reason", e.target.value)} rows={2} placeholder="Reason for rejection…" />
                  </div>
                )}
                <div>
                  <Label>Approved By</Label>
                  <Input value={form.approved_by} onChange={e => set("approved_by", e.target.value)} placeholder="Approver name" />
                </div>
                <div>
                  <Label>Next Review Date</Label>
                  <Input type="date" value={form.next_review_date} onChange={e => set("next_review_date", e.target.value)} />
                </div>
              </div>
            </TabsContent>

            {/* ── Owners Tab ── */}
            <TabsContent value="owners" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Objective Owner</Label>
                  <Input value={form.objective_owner} onChange={e => set("objective_owner", e.target.value)} placeholder="Objective owner" />
                </div>
                <div>
                  <Label>Performance Owner</Label>
                  <Input value={form.performance_owner} onChange={e => set("performance_owner", e.target.value)} placeholder="Performance owner" />
                </div>
                <div>
                  <Label>Compliance Owner (Optional)</Label>
                  <Input value={form.compliance_owner} onChange={e => set("compliance_owner", e.target.value)} placeholder="Compliance owner" />
                </div>
                <div>
                  <Label>IT Owner (Optional)</Label>
                  <Input value={form.it_owner} onChange={e => set("it_owner", e.target.value)} placeholder="IT owner" />
                </div>
              </div>
            </TabsContent>

            {/* ── Linkages Tab ── */}
            <TabsContent value="linkages" className="space-y-5 pt-4">
              <LinkMultiSelect label="Frameworks" items={frameworks} field="linked_framework_ids" form={form} toggleId={toggleId} labelKey="name" />
              <LinkMultiSelect label="Business Units" items={businessUnits} field="linked_business_unit_ids" form={form} toggleId={toggleId} labelKey="name" />
              <LinkMultiSelect label="Value Chains" items={valueChains} field="linked_value_chain_ids" form={form} toggleId={toggleId} labelKey="name" />
              <LinkMultiSelect label="IT Capabilities" items={capabilities} field="linked_capability_ids" form={form} toggleId={toggleId} labelKey="name" />
            </TabsContent>

            {/* ── KPIs Tab ── */}
            <TabsContent value="kpis" className="space-y-4 pt-4">
              {(form.kpis || []).map((kpi, idx) => (
                <Card key={kpi.id} className="border border-slate-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-700 text-sm">KPI #{idx + 1}</p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => removeKpi(idx)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Measurement Name</Label>
                        <Input value={kpi.measurement_name} onChange={e => updateKpi(idx, "measurement_name", e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Measurement Type</Label>
                        <Select value={kpi.measurement_type} onValueChange={v => updateKpi(idx, "measurement_type", v)}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>{KPI_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Measurement Description</Label>
                        <Textarea value={kpi.measurement_description} onChange={e => updateKpi(idx, "measurement_description", e.target.value)} rows={2} className="text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Calculation Method</Label>
                        <Input value={kpi.calculation_method} onChange={e => updateKpi(idx, "calculation_method", e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Data Source Link (blank if manual)</Label>
                        <Input value={kpi.data_source_link} onChange={e => updateKpi(idx, "data_source_link", e.target.value)} className="h-8 text-sm" placeholder="https://…" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" onClick={addKpi} className="gap-2 w-full">
                <Plus className="w-4 h-4" /> Add KPI / Measurement
              </Button>
            </TabsContent>
          </Tabs>

          {/* Save / Cancel at bottom */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {editId ? "Save Changes" : "Create Objective"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LinkMultiSelect({ label, items, field, form, toggleId, labelKey = "name" }) {
  const [open, setOpen] = useState(false);
  const selected = form[field] || [];
  const selectedItems = items.filter(i => selected.includes(i.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm font-medium text-slate-700">{label}</Label>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setOpen(v => !v)}>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {open ? "Hide" : "Select"}
        </Button>
      </div>
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedItems.map(i => (
            <Badge key={i.id} className="bg-indigo-100 text-indigo-700 gap-1 cursor-pointer" onClick={() => toggleId(field, i.id)}>
              {i[labelKey]} ×
            </Badge>
          ))}
        </div>
      )}
      {open && (
        <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-50">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-3">No items available.</p>
          ) : items.map(i => (
            <label key={i.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" checked={selected.includes(i.id)} onChange={() => toggleId(field, i.id)} className="rounded" />
              <span className="text-sm text-slate-700">{i[labelKey]}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Plus, Copy, CheckCircle, X, Trash2, Save,
  ShieldCheck, Table2, AlertCircle, Settings
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const ACTIVITY_TYPES = ["Control", "Process", "Approval", "Review", "Authorization", "Other"];
const ENFORCEMENT_OPTIONS = ["Mandatory", "Advisory", "Informational"];
const REVIEW_FREQUENCIES = ["Weekly", "Monthly", "Quarterly", "Bi-Annually", "Annually", "Ad-hoc"];

function useDoaId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

export default function DelegationOfAuthorityDetail() {
  const doaId = useDoaId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Header form state ─────────────────────────────────────────────────────
  const [header, setHeader] = useState({
    title: "", company_id: "", business_unit: "", business_unit_id: "", review_frequency: "Annually",
    reminder_date: "", owner_stakeholder_id: "", owner_name: "", valid_from: "", valid_to: "",
    scope_notes: "", status: "draft",
  });

  // ── Activity state ────────────────────────────────────────────────────────
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [activityTab, setActivityTab] = useState("detail");
  const [showMatrix, setShowMatrix] = useState(false);
  const [activityForm, setActivityForm] = useState(null); // edit buffer for inline editing
  const [dirtyHeader, setDirtyHeader] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: doa, isLoading: doaLoading } = useQuery({
    queryKey: ["doa-detail", doaId],
    queryFn: () => base44.entities.DelegationOfAuthority.get(doaId),
    enabled: !!doaId,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["doa-activities", doaId],
    queryFn: () => base44.entities.DOAActivity.filter({ doa_id: doaId }, "sort_order"),
    enabled: !!doaId,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders"],
    queryFn: () => base44.entities.Stakeholder.list(),
  });

  const { data: businessUnits = [] } = useQuery({
    queryKey: ["business-units"],
    queryFn: () => base44.entities.BusinessUnit.list(),
  });

  const { data: valueChains = [] } = useQuery({
    queryKey: ["value-chains"],
    queryFn: () => base44.entities.ValueChain.list("sort_order"),
  });

  const { data: workstreams = [] } = useQuery({
    queryKey: ["workstreams-all"],
    queryFn: () => base44.entities.Workstream.list("sort_order"),
  });

  // Load header when DOA loads
  useEffect(() => {
    if (doa) {
      setHeader({
        title: doa.title || "",
        company_id: doa.company_id || "",
        business_unit: doa.business_unit || "",
        business_unit_id: doa.business_unit_id || "",
        review_frequency: doa.review_frequency || "Annually",
        reminder_date: doa.reminder_date || "",
        owner_stakeholder_id: doa.owner_stakeholder_id || "",
        owner_name: doa.owner_name || "",
        valid_from: doa.valid_from || "",
        valid_to: doa.valid_to || "",
        scope_notes: doa.scope_notes || "",
        status: doa.status || "draft",
      });
      setDirtyHeader(false);
    }
  }, [doa]);

  // When activities load, select first one
  useEffect(() => {
    if (activities.length > 0 && !selectedActivityId) {
      setSelectedActivityId(activities[0].id);
    }
  }, [activities]);

  // Sync activity form when selection changes
  useEffect(() => {
    const act = activities.find(a => a.id === selectedActivityId);
    if (act) setActivityForm(JSON.parse(JSON.stringify(act)));
    else setActivityForm(null);
  }, [selectedActivityId, activities]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateDoaMutation = useMutation({
    mutationFn: (data) => base44.entities.DelegationOfAuthority.update(doaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["doa-detail", doaId]);
      queryClient.invalidateQueries(["doa"]);
      setDirtyHeader(false);
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.DOAActivity.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries(["doa-activities", doaId]);
      setSelectedActivityId(created.id);
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DOAActivity.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(["doa-activities", doaId]),
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (id) => base44.entities.DOAActivity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["doa-activities", doaId]);
      setSelectedActivityId(activities.find(a => a.id !== selectedActivityId)?.id || null);
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleHeaderChange = (field, value) => {
    setHeader(p => ({ ...p, [field]: value }));
    setDirtyHeader(true);
    // Auto-fill owner name from stakeholder
    if (field === "owner_stakeholder_id") {
      const sh = stakeholders.find(s => s.id === value);
      if (sh) setHeader(p => ({ ...p, owner_stakeholder_id: value, owner_name: sh.full_name }));
    }
  };

  const saveHeader = () => updateDoaMutation.mutate(header);

  const addActivity = () => {
    createActivityMutation.mutate({
      doa_id: doaId,
      activity_name: "New Activity",
      is_active: true,
      type: "Control",
      sort_order: activities.length,
      value_range_rules: [],
      approvers: [],
    });
  };

  const duplicateActivity = () => {
    if (!activityForm) return;
    const { id, ...rest } = activityForm;
    createActivityMutation.mutate({ ...rest, activity_name: activityForm.activity_name + " (Copy)" });
  };

  const deactivateActivity = () => {
    if (!activityForm) return;
    updateActivityMutation.mutate({ id: activityForm.id, data: { is_active: !activityForm.is_active } });
  };

  const saveActivity = () => {
    if (!activityForm) return;
    updateActivityMutation.mutate({ id: activityForm.id, data: activityForm });
  };

  // Value range rule helpers
  const addValueRule = () => {
    setActivityForm(f => ({
      ...f,
      value_range_rules: [...(f.value_range_rules || []), { currency: "USD", value_min: 0, value_max: null, enforcement: "Mandatory", notes: "" }],
    }));
  };
  const removeValueRule = (idx) => setActivityForm(f => ({ ...f, value_range_rules: f.value_range_rules.filter((_, i) => i !== idx) }));
  const updateValueRule = (idx, field, val) => setActivityForm(f => ({
    ...f,
    value_range_rules: f.value_range_rules.map((r, i) => i === idx ? { ...r, [field]: val } : r),
  }));

  // Approver helpers
  const addApprover = () => {
    const nextLevel = Math.max(0, ...(activityForm.approvers || []).map(a => a.level || 0)) + 1;
    setActivityForm(f => ({
      ...f,
      approvers: [...(f.approvers || []), { level: nextLevel, role: "", stakeholder_id: "", stakeholder_name: "", required: true, delegatable: false, valid_till: "", notes: "" }],
    }));
  };
  const removeApprover = (idx) => setActivityForm(f => ({ ...f, approvers: f.approvers.filter((_, i) => i !== idx) }));
  const updateApprover = (idx, field, val) => {
    setActivityForm(f => {
      const approvers = f.approvers.map((a, i) => {
        if (i !== idx) return a;
        const updated = { ...a, [field]: val };
        if (field === "stakeholder_id") {
          const sh = stakeholders.find(s => s.id === val);
          if (sh) updated.stakeholder_name = sh.full_name;
        }
        return updated;
      });
      return { ...f, approvers };
    });
  };

  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  if (doaLoading) {
    return <div className="p-8 text-center text-slate-400">Loading…</div>;
  }
  if (!doa) {
    return <div className="p-8 text-center text-slate-400">DOA not found.</div>;
  }

  // ── Matrix view ───────────────────────────────────────────────────────────
  const maxLevels = Math.max(0, ...activities.map(a => (a.approvers || []).length));

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/DelegationOfAuthority" className="flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Delegation of Authority
        </Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-600 truncate">{header.title}</span>
      </div>

      {/* ── Header form ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Maintain Delegation of Authority
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`border text-xs ${header.status === "active" ? "bg-green-100 text-green-700 border-green-200" : header.status === "archived" ? "bg-red-100 text-red-600 border-red-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
              {header.status}
            </Badge>
            {dirtyHeader && (
              <Button size="sm" onClick={saveHeader} disabled={updateDoaMutation.isPending} className="gap-1 bg-primary hover:bg-primary/90">
                <Save className="w-3.5 h-3.5" /> Save
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowMatrix(true)} className="gap-1">
              <Table2 className="w-3.5 h-3.5" /> DOA Matrix
            </Button>
          </div>
        </div>

        {/* Row 1 */}
        <div className="space-y-1">
          <Label>DOA Title *</Label>
          <Input value={header.title} onChange={e => handleHeaderChange("title", e.target.value)} placeholder="e.g. Annual Delegation for 2026 - Finance Operations" />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 space-y-1">
            <Label>Company *</Label>
            <Select value={header.company_id} onValueChange={v => handleHeaderChange("company_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select company…" /></SelectTrigger>
              <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Business Unit</Label>
            <Select
              value={header.business_unit_id || "none"}
              onValueChange={v => {
                const bu = businessUnits.find(b => b.id === v);
                handleHeaderChange("business_unit_id", v === "none" ? "" : v);
                if (bu) setHeader(p => ({ ...p, business_unit: bu.name, business_unit_id: v }));
                else setHeader(p => ({ ...p, business_unit: "", business_unit_id: "" }));
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select business unit…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {businessUnits
                  .filter(b => !header.company_id || b.company_id === header.company_id)
                  .map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)
                }
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={header.status} onValueChange={v => handleHeaderChange("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label>Review Frequency</Label>
            <Select value={header.review_frequency} onValueChange={v => handleHeaderChange("review_frequency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REVIEW_FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Reminder Date</Label>
            <Input type="date" value={header.reminder_date} onChange={e => handleHeaderChange("reminder_date", e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label>DOA Owner *</Label>
            <Select value={header.owner_stakeholder_id} onValueChange={v => handleHeaderChange("owner_stakeholder_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select owner…" /></SelectTrigger>
              <SelectContent>{stakeholders.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label>Valid From</Label>
            <Input type="date" value={header.valid_from} onChange={e => handleHeaderChange("valid_from", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Valid To</Label>
            <Input type="date" value={header.valid_to} onChange={e => handleHeaderChange("valid_to", e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label>Scope Notes</Label>
            <Textarea value={header.scope_notes} onChange={e => handleHeaderChange("scope_notes", e.target.value)} rows={2} placeholder="Describe the scope of this DOA…" />
          </div>
        </div>
      </div>

      {/* ── Activities table ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold uppercase tracking-wider">
          <div className="col-span-4">Activity</div>
          <div className="col-span-1 text-center">Active</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Process Node</div>
          <div className="col-span-2">Value Chain</div>
          <div className="col-span-1">Workstream</div>
        </div>

        {/* Activity rows */}
        <div className="divide-y divide-slate-100">
          {activitiesLoading ? (
            <div className="p-8 text-center text-slate-400">Loading activities…</div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No activities yet. Click "New Activity" to add one.</div>
          ) : activities.map(act => (
            <div
              key={act.id}
              onClick={() => setSelectedActivityId(act.id)}
              className={`grid grid-cols-12 gap-2 px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                selectedActivityId === act.id ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-slate-50"
              }`}
            >
              <div className="col-span-4 font-medium text-slate-900 truncate">{act.activity_name}</div>
              <div className="col-span-1 flex justify-center">
                <div className={`w-3.5 h-3.5 rounded border-2 mt-0.5 ${act.is_active ? "bg-primary border-primary" : "border-slate-300"}`} />
              </div>
              <div className="col-span-2 text-slate-600">{act.type || "—"}</div>
              <div className="col-span-2 text-slate-500 font-mono text-xs">{act.process_node_code || "—"}</div>
              <div className="col-span-2 text-slate-500 truncate text-xs">
                {valueChains.find(v => v.id === act.value_chain_id)?.name || "—"}
              </div>
              <div className="col-span-1 text-slate-500 truncate text-xs">
                {workstreams.find(w => w.id === act.workstream_id)?.workstream_code || "—"}
              </div>
            </div>
          ))}
        </div>

        {/* Activity action buttons */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-slate-200 bg-slate-50">
          <Button size="sm" onClick={addActivity} disabled={createActivityMutation.isPending} className="gap-1 bg-primary hover:bg-primary/90 text-xs h-7">
            <Plus className="w-3 h-3" /> New Activity
          </Button>
          <Button size="sm" variant="outline" onClick={duplicateActivity} disabled={!selectedActivity} className="text-xs h-7">
            <Copy className="w-3 h-3 mr-1" /> Duplicate
          </Button>
          <Button size="sm" variant="outline" onClick={deactivateActivity} disabled={!selectedActivity} className="text-xs h-7">
            {selectedActivity?.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => selectedActivity && deleteActivityMutation.mutate(selectedActivity.id)} disabled={!selectedActivity} className="text-xs h-7 text-red-500 hover:text-red-700">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* ── Activity detail panel ── */}
      {activityForm && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <Tabs value={activityTab} onValueChange={setActivityTab}>
            <div className="flex items-center justify-between px-4 pt-3 border-b border-slate-200 bg-slate-50">
              <TabsList className="bg-transparent border-none gap-2 p-0">
                <TabsTrigger value="detail" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded px-3 py-1 text-xs">Activity Detail</TabsTrigger>
                <TabsTrigger value="rules" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded px-3 py-1 text-xs">Rules</TabsTrigger>
                <TabsTrigger value="approvers" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded px-3 py-1 text-xs">Approver(s)</TabsTrigger>
              </TabsList>
              <Button size="sm" onClick={saveActivity} disabled={updateActivityMutation.isPending} className="gap-1 h-7 text-xs bg-primary hover:bg-primary/90">
                <Save className="w-3 h-3" /> Save Activity
              </Button>
            </div>

            {/* Tab: Activity Detail */}
            <TabsContent value="detail" className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <Label>Activity Name *</Label>
                  <Input value={activityForm.activity_name} onChange={e => setActivityForm(f => ({ ...f, activity_name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={activityForm.type} onValueChange={v => setActivityForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Process Node Code</Label>
                  <Input value={activityForm.process_node_code || ""} onChange={e => setActivityForm(f => ({ ...f, process_node_code: e.target.value }))} placeholder="e.g. 1313" />
                </div>
                <div className="space-y-1">
                  <Label>Value Chain</Label>
                  <Select value={activityForm.value_chain_id || "none"} onValueChange={v => setActivityForm(f => ({ ...f, value_chain_id: v === "none" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {valueChains.map(vc => <SelectItem key={vc.id} value={vc.id}>{vc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Workstream</Label>
                  <Select value={activityForm.workstream_id || "none"} onValueChange={v => setActivityForm(f => ({ ...f, workstream_id: v === "none" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {workstreams.map(ws => <SelectItem key={ws.id} value={ws.id}>{ws.full_label || ws.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Checkbox checked={activityForm.is_active} onCheckedChange={v => setActivityForm(f => ({ ...f, is_active: !!v }))} id="is_active" />
                  <Label htmlFor="is_active" className="cursor-pointer">Is Active</Label>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Rules (Value Range) */}
            <TabsContent value="rules" className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 font-medium">Value Range Rules</p>
                <Button size="sm" onClick={addValueRule} className="gap-1 h-7 text-xs bg-primary hover:bg-primary/90">
                  <Plus className="w-3 h-3" /> Add Rule
                </Button>
              </div>
              {(activityForm.value_range_rules || []).length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No value range rules. Click "Add Rule" to define monetary thresholds.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                    <div className="col-span-2">Currency</div>
                    <div className="col-span-2">Value Min</div>
                    <div className="col-span-2">Value Max</div>
                    <div className="col-span-3">Enforcement</div>
                    <div className="col-span-2">Notes</div>
                    <div className="col-span-1"></div>
                  </div>
                  {(activityForm.value_range_rules || []).map((rule, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-lg p-2">
                      <div className="col-span-2">
                        <Input value={rule.currency || ""} onChange={e => updateValueRule(idx, "currency", e.target.value)} placeholder="USD" className="h-8 text-sm" />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" value={rule.value_min ?? ""} onChange={e => updateValueRule(idx, "value_min", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" value={rule.value_max ?? ""} onChange={e => updateValueRule(idx, "value_max", parseFloat(e.target.value) || null)} placeholder="Unlimited" className="h-8 text-sm" />
                      </div>
                      <div className="col-span-3">
                        <Select value={rule.enforcement || "Mandatory"} onValueChange={v => updateValueRule(idx, "enforcement", v)}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>{ENFORCEMENT_OPTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input value={rule.notes || ""} onChange={e => updateValueRule(idx, "notes", e.target.value)} placeholder="Notes…" className="h-8 text-sm" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button onClick={() => removeValueRule(idx)} className="text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Approvers */}
            <TabsContent value="approvers" className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 font-medium">Approval Chain</p>
                <Button size="sm" onClick={addApprover} className="gap-1 h-7 text-xs bg-primary hover:bg-primary/90">
                  <Plus className="w-3 h-3" /> Add Approver
                </Button>
              </div>
              {(activityForm.approvers || []).length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No approvers defined. Click "Add Approver" to build the approval chain.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                    <div className="col-span-1">Level</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-3">Stakeholder</div>
                    <div className="col-span-1 text-center">Reqd?</div>
                    <div className="col-span-1 text-center">Deleg?</div>
                    <div className="col-span-2">Valid Till</div>
                    <div className="col-span-1">Notes</div>
                    <div className="col-span-1"></div>
                  </div>
                  {(activityForm.approvers || []).map((appr, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-lg p-2">
                      <div className="col-span-1">
                        <Input type="number" value={appr.level ?? idx + 1} onChange={e => updateApprover(idx, "level", parseInt(e.target.value) || idx + 1)} className="h-8 text-sm text-center" />
                      </div>
                      <div className="col-span-2">
                        <Input value={appr.role || ""} onChange={e => updateApprover(idx, "role", e.target.value)} placeholder="Role…" className="h-8 text-sm" />
                      </div>
                      <div className="col-span-3">
                        <Select value={appr.stakeholder_id || "none"} onValueChange={v => updateApprover(idx, "stakeholder_id", v === "none" ? "" : v)}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">— None —</SelectItem>
                            {stakeholders.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Checkbox checked={!!appr.required} onCheckedChange={v => updateApprover(idx, "required", !!v)} />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Checkbox checked={!!appr.delegatable} onCheckedChange={v => updateApprover(idx, "delegatable", !!v)} />
                      </div>
                      <div className="col-span-2">
                        <Input type="date" value={appr.valid_till || ""} onChange={e => updateApprover(idx, "valid_till", e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div className="col-span-1">
                        <Input value={appr.notes || ""} onChange={e => updateApprover(idx, "notes", e.target.value)} placeholder="…" className="h-8 text-sm" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button onClick={() => removeApprover(idx)} className="text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* ── DOA Matrix Dialog ── */}
      <Dialog open={showMatrix} onOpenChange={setShowMatrix}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Table2 className="w-5 h-5 text-primary" /> DOA Matrix — {header.title}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="text-left px-3 py-2 border border-primary/30 font-semibold min-w-[200px]">Activity</th>
                  <th className="text-left px-3 py-2 border border-primary/30 font-semibold">Type</th>
                  <th className="text-left px-3 py-2 border border-primary/30 font-semibold">Process Node</th>
                  {Array.from({ length: maxLevels || 1 }, (_, i) => (
                    <th key={i} className="text-center px-3 py-2 border border-primary/30 font-semibold min-w-[140px]">
                      Level {i + 1} Approver
                    </th>
                  ))}
                  <th className="text-left px-3 py-2 border border-primary/30 font-semibold">Value Rules</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={3 + (maxLevels || 1) + 1} className="text-center py-8 text-slate-400 italic">
                      No activities defined yet.
                    </td>
                  </tr>
                ) : activities.map((act, rowIdx) => {
                  const sortedApprovers = [...(act.approvers || [])].sort((a, b) => (a.level || 0) - (b.level || 0));
                  return (
                    <tr key={act.id} className={rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-3 py-2 border border-slate-200 font-medium text-slate-900">
                        {act.activity_name}
                        {!act.is_active && <Badge variant="outline" className="ml-2 text-xs">Inactive</Badge>}
                      </td>
                      <td className="px-3 py-2 border border-slate-200 text-slate-600">{act.type || "—"}</td>
                      <td className="px-3 py-2 border border-slate-200 text-slate-500 font-mono text-xs">{act.process_node_code || "—"}</td>
                      {Array.from({ length: maxLevels || 1 }, (_, levelIdx) => {
                        const appr = sortedApprovers[levelIdx];
                        return (
                          <td key={levelIdx} className="px-3 py-2 border border-slate-200 text-center">
                            {appr ? (
                              <div>
                                <div className="font-medium text-slate-900 text-xs">{appr.stakeholder_name || appr.role || "—"}</div>
                                <div className="flex items-center justify-center gap-1 mt-0.5">
                                  {appr.required && <Badge variant="outline" className="text-xs px-1 py-0 bg-red-50 text-red-600 border-red-200">Req</Badge>}
                                  {appr.delegatable && <Badge variant="outline" className="text-xs px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">Del</Badge>}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 border border-slate-200">
                        {(act.value_range_rules || []).length > 0 ? (
                          <div className="space-y-1">
                            {act.value_range_rules.map((r, ri) => (
                              <div key={ri} className="text-xs text-slate-600">
                                {r.currency} {r.value_min?.toLocaleString()} – {r.value_max ? r.value_max.toLocaleString() : "∞"}
                                <span className="ml-1 text-slate-400">({r.enforcement})</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert, Plus, Search, Building2, User, Pencil, Trash2, Calendar } from "lucide-react";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { toast } from "sonner";
import SearchableStakeholderSelect from "@/components/risks/SearchableStakeholderSelect";
import CalendarPromptDialog from "@/components/risks/CalendarPromptDialog";

const CATEGORIES = ["Strategic", "Compliance", "IT", "Operational", "Cyber", "Data", "Third Party", "Financial Crime", "Reputational Risk", "Financial Risk", "Compliance / Conduct Risk", "Third-Party / Supplier Risk", "Technology / Information Security Risk"];
const STATUSES = ["Draft", "Active", "Under Review", "Retired"];
const PRIORITIES = ["High", "Medium", "Low"];
const CRITICALITIES = ["Critical", "High", "Medium", "Low"];
const REVIEW_FREQS = ["Monthly", "Quarterly", "Annually"];

const EMPTY_FORM = {
  risk_reference: "", risk_title: "", risk_statement: "", risk_description: "",
  company_id: "", risk_category: "Operational", risk_sub_category: "",
  risk_owner_id: "", risk_owner_name: "", risk_manager_id: "", risk_manager_name: "",
  risk_function_owner_id: "", risk_function_owner_name: "",
  business_area_id: "", business_area_name: "",
  status: "Draft", priority: "Medium", criticality: "Medium",
  valid_from: "", valid_to: "", review_frequency: "Quarterly",
  last_review_date: "", next_review_date: "", notes: "",
};

const STATUS_COLORS = {
  Draft: "bg-slate-100 text-slate-600",
  Active: "bg-green-100 text-green-700",
  "Under Review": "bg-yellow-100 text-yellow-700",
  Retired: "bg-red-100 text-red-700",
};

const PRIORITY_COLORS = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-slate-100 text-slate-600",
};

const CRIT_COLORS = {
  Critical: "bg-red-100 text-red-800",
  High: "bg-orange-100 text-orange-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-slate-100 text-slate-600",
};

export default function PrincipalRisks() {
  const queryClient = useQueryClient();
  const { selectedCompany } = useCompanyFilter();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [calendarPromptRisk, setCalendarPromptRisk] = useState(null);

  const { data: principalRisks = [], isLoading } = useQuery({
    queryKey: ["principalRisks"],
    queryFn: () => base44.entities.PrincipalRisk.list("-created_date"),
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
    queryKey: ["businessUnits"],
    queryFn: () => base44.entities.BusinessUnit.list(),
  });

  const { data: stakeholderGroups = [] } = useQuery({
    queryKey: ["stakeholderGroups"],
    queryFn: () => base44.entities.StakeholderGroup.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PrincipalRisk.create(data),
    onSuccess: (saved, submitted) => {
      queryClient.invalidateQueries(["principalRisks"]);
      closeDialog();
      toast.success("Principal Risk created");
      const record = saved || submitted;
      if (record?.next_review_date) setCalendarPromptRisk(record);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PrincipalRisk.update(id, data),
    onSuccess: (_saved, { id, data, prevNextReviewDate }) => {
      queryClient.invalidateQueries(["principalRisks"]);
      closeDialog();
      toast.success("Principal Risk updated");
      // Prompt if next_review_date was set or changed
      const newDate = (data?.next_review_date || "").split("T")[0];
      const oldDate = (prevNextReviewDate || "").split("T")[0];
      if (newDate && newDate !== oldDate) {
        setCalendarPromptRisk({ ...data, id });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PrincipalRisk.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["principalRisks"]); toast.success("Principal Risk deleted"); },
  });

  const closeDialog = () => { setDialogOpen(false); setEditId(null); setForm(EMPTY_FORM); };

  const openEdit = (r) => {
    setForm({ ...EMPTY_FORM, ...r });
    setEditId(r.id);
    setDialogOpen(true);
  };

  const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setDialogOpen(true); };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.risk_title || !form.company_id) { toast.error("Risk Title and Company are required"); return; }
    if (editId) {
      const existing = principalRisks.find(r => r.id === editId);
      updateMutation.mutate({ id: editId, data: form, prevNextReviewDate: existing?.next_review_date });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = principalRisks.filter(r => {
    const matchCompany = !selectedCompany || r.company_id === selectedCompany;
    const matchSearch = !search || r.risk_title?.toLowerCase().includes(search.toLowerCase()) || r.risk_reference?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || r.risk_category === catFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchCompany && matchSearch && matchCat && matchStatus;
  });

  const stats = {
    total: filtered.length,
    active: filtered.filter(r => r.status === "Active").length,
    high: filtered.filter(r => r.priority === "High").length,
    critical: filtered.filter(r => r.criticality === "Critical").length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
          <ShieldAlert className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Principal Risks</h1>
          <p className="text-slate-600">Enterprise-level principal risk register</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-slate-900" },
          { label: "Active", value: stats.active, color: "text-green-600" },
          { label: "High Priority", value: stats.high, color: "text-red-600" },
          { label: "Critical", value: stats.critical, color: "text-orange-600" },
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
          <Input placeholder="Search principal risks…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No principal risks found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const company = companies.find(c => c.id === r.company_id);
            return (
              <Card key={r.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {r.risk_reference && <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{r.risk_reference}</span>}
                        <h3 className="font-semibold text-slate-900">{r.risk_title}</h3>
                        <Badge className="bg-blue-100 text-blue-700">{r.risk_category}</Badge>
                        <Badge className={STATUS_COLORS[r.status] || ""}>{r.status}</Badge>
                        <Badge className={PRIORITY_COLORS[r.priority] || ""}>{r.priority}</Badge>
                        <Badge className={CRIT_COLORS[r.criticality] || ""}>{r.criticality}</Badge>
                      </div>
                      {r.risk_statement && <p className="text-sm text-slate-600 mb-1 italic line-clamp-2">"{r.risk_statement}"</p>}
                      {r.risk_description && <p className="text-sm text-slate-500 mb-2 line-clamp-2">{r.risk_description}</p>}
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        {company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{company.name}</span>}
                        {r.risk_owner_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />Owner: {r.risk_owner_name}</span>}
                        {r.review_frequency && <span>{r.review_frequency}</span>}
                        {r.next_review_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Review: {r.next_review_date}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => setConfirmDeleteId(r.id)}>
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

      {/* New button at bottom */}
      <div className="flex justify-center pt-2">
        <Button onClick={openNew} className="bg-red-600 hover:bg-red-700 gap-2">
          <Plus className="w-4 h-4" /> New Principal Risk
        </Button>
      </div>

      {/* Confirm delete */}
      <Dialog open={!!confirmDeleteId} onOpenChange={v => { if (!v) setConfirmDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Principal Risk?</DialogTitle>
            <DialogDescription>This action cannot be undone. The principal risk will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { deleteMutation.mutate(confirmDeleteId); setConfirmDeleteId(null); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar prompt after save */}
      <CalendarPromptDialog
        open={!!calendarPromptRisk}
        onClose={() => setCalendarPromptRisk(null)}
        risk={calendarPromptRisk}
      />

      {/* Dialog — single scrollable form, no tabs */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Principal Risk" : "New Principal Risk"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Core Details */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Core Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Risk Reference</Label>
                  <Input value={form.risk_reference} onChange={e => set("risk_reference", e.target.value)} placeholder="e.g. PR-001" />
                </div>
                <div>
                  <Label>Company *</Label>
                  {editId ? (
                    <Input value={companies.find(c => c.id === form.company_id)?.name || form.company_id} disabled className="bg-slate-50 text-slate-500" />
                  ) : (
                    <Select value={form.company_id} onValueChange={v => set("company_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                      <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <div>
                <Label>Risk Title *</Label>
                <Input value={form.risk_title} onChange={e => set("risk_title", e.target.value)} placeholder='e.g. "IT Compliance & Control Risk"' />
              </div>
              <div>
                <Label>Risk Statement</Label>
                <Textarea value={form.risk_statement} onChange={e => set("risk_statement", e.target.value)} rows={2} placeholder="Full cause-event-impact statement…" />
              </div>
              <div>
                <Label>Risk Description</Label>
                <Textarea value={form.risk_description} onChange={e => set("risk_description", e.target.value)} rows={2} placeholder="Longer explanation of the risk…" />
              </div>
            </div>

            {/* Classification */}
            <div className="space-y-3 border-t pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Classification</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Risk Category</Label>
                  <Select value={form.risk_category} onValueChange={v => set("risk_category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Risk Sub-Category</Label>
                  <Input value={form.risk_sub_category} onChange={e => set("risk_sub_category", e.target.value)} placeholder="More granular classification" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => set("priority", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Criticality</Label>
                  <Select value={form.criticality} onValueChange={v => set("criticality", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CRITICALITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Business Area</Label>
                  <Select value={form.business_area_id || ""} onValueChange={v => {
                    const bu = businessUnits.find(b => b.id === v);
                    set("business_area_id", v);
                    set("business_area_name", bu?.name || "");
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select business area" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {businessUnits.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Ownership */}
            <div className="space-y-3 border-t pt-4">
              {(() => {
                const companyStakeholders = form.company_id
                  ? stakeholders.filter(s => s.company_id === form.company_id && s.status !== "inactive")
                  : stakeholders.filter(s => s.status !== "inactive");

                // Risk Owner: only stakeholders in a group named "Risk Owners"
                const riskOwnerGroupIds = stakeholderGroups
                  .filter(g => g.name?.toLowerCase() === "risk owners")
                  .map(g => g.id);
                const riskOwnerStakeholders = riskOwnerGroupIds.length > 0
                  ? companyStakeholders.filter(s => (s.group_ids || []).some(gid => riskOwnerGroupIds.includes(gid)))
                  : companyStakeholders;

                return (
                  <>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ownership</p>
                    {riskOwnerGroupIds.length > 0 && (
                      <p className="text-xs text-slate-400 -mt-1">Risk Owner list is filtered to members of the <span className="font-medium text-slate-500">Risk Owners</span> group.</p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Risk Owner (Executive)</Label>
                        <SearchableStakeholderSelect
                          value={form.risk_owner_id}
                          stakeholders={riskOwnerStakeholders}
                          placeholder="Select stakeholder"
                          onValueChange={v => {
                            const s = stakeholders.find(x => x.id === v);
                            set("risk_owner_id", v);
                            set("risk_owner_name", s?.full_name || "");
                          }}
                        />
                      </div>
                      <div>
                        <Label>Risk Manager (Day-to-day)</Label>
                        <SearchableStakeholderSelect
                          value={form.risk_manager_id}
                          stakeholders={companyStakeholders}
                          placeholder="Select stakeholder"
                          onValueChange={v => {
                            const s = stakeholders.find(x => x.id === v);
                            set("risk_manager_id", v);
                            set("risk_manager_name", s?.full_name || "");
                          }}
                        />
                      </div>
                      <div>
                        <Label>Risk Function Owner (2LoD)</Label>
                        <SearchableStakeholderSelect
                          value={form.risk_function_owner_id}
                          stakeholders={companyStakeholders}
                          placeholder="Select stakeholder"
                          onValueChange={v => {
                            const s = stakeholders.find(x => x.id === v);
                            set("risk_function_owner_id", v);
                            set("risk_function_owner_name", s?.full_name || "");
                          }}
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Lifecycle */}
            <div className="space-y-3 border-t pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lifecycle</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valid From</Label>
                  <Input type="date" value={form.valid_from} onChange={e => set("valid_from", e.target.value)} />
                </div>
                <div>
                  <Label>Valid To</Label>
                  <Input type="date" value={form.valid_to} onChange={e => set("valid_to", e.target.value)} />
                </div>
                <div>
                  <Label>Review Frequency</Label>
                  <Select value={form.review_frequency} onValueChange={v => set("review_frequency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{REVIEW_FREQS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Last Review Date</Label>
                  <Input type="date" value={form.last_review_date} onChange={e => set("last_review_date", e.target.value)} />
                </div>
                <div>
                  <Label>Next Review Date</Label>
                  <Input type="date" value={form.next_review_date} onChange={e => set("next_review_date", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t pt-4">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" />
            </div>
          </div>

          {/* Save actions at bottom */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="bg-red-600 hover:bg-red-700">
              {editId ? "Save Changes" : "Create Principal Risk"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
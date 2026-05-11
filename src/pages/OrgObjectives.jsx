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
import {
  Target, Plus, Search, Building2, Calendar, User,
  Pencil, Trash2, ChevronRight, Link2, Network, Layers
} from "lucide-react";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { toast } from "sonner";
import ObjLinksPanel from "@/components/objectives/ObjLinksPanel";

const CATEGORY_COLORS = {
  strategic: "bg-purple-100 text-purple-700",
  operational: "bg-blue-100 text-blue-700",
  financial: "bg-green-100 text-green-700",
  compliance: "bg-orange-100 text-orange-700",
  technology: "bg-cyan-100 text-cyan-700",
  people: "bg-pink-100 text-pink-700",
};

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-600",
  active: "bg-blue-100 text-blue-700",
  achieved: "bg-green-100 text-green-700",
  on_hold: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};

const PRIORITY_COLORS = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const EMPTY_FORM = {
  title: "", description: "", company_id: "", category: "strategic",
  status: "active", priority: "medium", owner: "", target_date: "",
  progress_pct: 0, notes: "", linked_process_ids: [], linked_ihpom_ids: [],
  linked_risk_ids: [], linked_control_ids: [], key_results: []
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
  const [linksObjectiveId, setLinksObjectiveId] = useState(null);

  const { data: objectives = [], isLoading } = useQuery({
    queryKey: ["orgObjectives"],
    queryFn: () => base44.entities.OrgObjective.list("-created_date"),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
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

  const handleSave = () => {
    if (!form.title || !form.company_id) { toast.error("Title and company are required"); return; }
    if (editId) updateMutation.mutate({ id: editId, data: form });
    else createMutation.mutate(form);
  };

  const filtered = objectives.filter(o => {
    const matchCompany = !selectedCompany || o.company_id === selectedCompany;
    const matchSearch = !search || o.title?.toLowerCase().includes(search.toLowerCase()) || o.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || o.category === catFilter;
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchCompany && matchSearch && matchCat && matchStatus;
  });

  const stats = {
    total: filtered.length,
    active: filtered.filter(o => o.status === "active").length,
    achieved: filtered.filter(o => o.status === "achieved").length,
    avgProgress: filtered.length ? Math.round(filtered.reduce((s, o) => s + (o.progress_pct || 0), 0) / filtered.length) : 0,
  };

  const openLinksPanel = (id) => setLinksObjectiveId(id);

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
            <p className="text-slate-600">Strategic goals linked to processes, iHPOM, risks & controls</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> New Objective
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-slate-900" },
          { label: "Active", value: stats.active, color: "text-blue-600" },
          { label: "Achieved", value: stats.achieved, color: "text-green-600" },
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
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {["strategic","operational","financial","compliance","technology","people"].map(c => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["draft","active","achieved","on_hold","cancelled"].map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
            ))}
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
            const linkCount = (obj.linked_process_ids?.length || 0) + (obj.linked_ihpom_ids?.length || 0);
            return (
              <Card key={obj.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold text-slate-900">{obj.title}</h3>
                        <Badge className={CATEGORY_COLORS[obj.category] || ""}>{obj.category}</Badge>
                        <Badge className={STATUS_COLORS[obj.status] || ""}>{obj.status?.replace("_", " ")}</Badge>
                        <Badge className={PRIORITY_COLORS[obj.priority] || ""}>{obj.priority}</Badge>
                      </div>
                      {obj.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{obj.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        {company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{company.name}</span>}
                        {obj.owner && <span className="flex items-center gap-1"><User className="w-3 h-3" />{obj.owner}</span>}
                        {obj.target_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{obj.target_date}</span>}
                        {linkCount > 0 && (
                          <span className="flex items-center gap-1 text-indigo-600">
                            <Link2 className="w-3 h-3" />{linkCount} process link{linkCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      {obj.progress_pct !== undefined && (
                        <div className="mt-3 flex items-center gap-3">
                          <Progress value={obj.progress_pct || 0} className="h-2 flex-1" />
                          <span className="text-xs text-slate-500 w-10 text-right">{obj.progress_pct || 0}%</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-500 hover:text-indigo-700" onClick={() => openLinksPanel(obj.id)} title="Manage linkages">
                        <Link2 className="w-4 h-4" />
                      </Button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Objective" : "New Organisational Objective"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Objective title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company *</Label>
                <Select value={form.company_id} onValueChange={v => setForm(f => ({ ...f, company_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["strategic","operational","financial","compliance","technology","people"].map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe this objective…" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["draft","active","achieved","on_hold","cancelled"].map(s => (
                      <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low","medium","high","critical"].map(p => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Progress %</Label>
                <Input type="number" min={0} max={100} value={form.progress_pct || 0} onChange={e => setForm(f => ({ ...f, progress_pct: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Owner</Label>
                <Input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="Responsible person" />
              </div>
              <div>
                <Label>Target Date</Label>
                <Input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {editId ? "Save Changes" : "Create Objective"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Links panel */}
      {linksObjectiveId && (
        <ObjLinksPanel
          objectiveId={linksObjectiveId}
          onClose={() => setLinksObjectiveId(null)}
        />
      )}
    </div>
  );
}
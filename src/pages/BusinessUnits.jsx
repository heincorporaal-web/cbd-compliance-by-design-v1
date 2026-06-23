import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Building2, ChevronRight, Network } from "lucide-react";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import SearchableStakeholderSelect from "@/components/risks/SearchableStakeholderSelect";

const BU_TYPES = [
  "Profit & Loss Unit", "Department", "Capability", "Center of Excellence",
  "Division", "Business Line", "Function", "Region", "Country",
  "Legal Entity", "Shared Services", "Project Office", "Team", "Other",
];

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
  archived: "bg-red-100 text-red-600 border-red-200",
};

const TYPE_COLORS = {
  "Profit & Loss Unit": "bg-purple-100 text-purple-700",
  "Department": "bg-blue-100 text-blue-700",
  "Capability": "bg-teal-100 text-teal-700",
  "Center of Excellence": "bg-amber-100 text-amber-700",
  "Division": "bg-indigo-100 text-indigo-700",
  "Business Line": "bg-cyan-100 text-cyan-700",
  "Function": "bg-pink-100 text-pink-700",
  "Region": "bg-orange-100 text-orange-700",
};

const EMPTY_FORM = {
  name: "", description: "", type: "Department", company_id: "",
  parent_id: "", value_chain_id: "", workstream_id: "",
  owner_stakeholder_id: "", owner_name: "", cost_center_code: "", status: "active",
};

export default function BusinessUnits() {
  const queryClient = useQueryClient();
  const [selectedCompanyId] = useCompanyFilter();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState(null);

  const { data: allUnits = [], isLoading } = useQuery({
    queryKey: ["business-units", selectedCompanyId],
    queryFn: () =>
      selectedCompanyId
        ? base44.entities.BusinessUnit.filter({ company_id: selectedCompanyId }, "sort_order")
        : base44.entities.BusinessUnit.list("sort_order"),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: valueChains = [] } = useQuery({
    queryKey: ["value-chains"],
    queryFn: () => base44.entities.ValueChain.list("sort_order"),
  });

  const { data: workstreams = [] } = useQuery({
    queryKey: ["workstreams-all"],
    queryFn: () => base44.entities.Workstream.list("sort_order"),
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders"],
    queryFn: () => base44.entities.Stakeholder.list(),
  });

  // Filter workstreams by selected value chain in form
  const filteredWorkstreams = form.value_chain_id
    ? workstreams.filter(ws => ws.value_chain_id === form.value_chain_id)
    : workstreams;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BusinessUnit.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["business-units"]); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BusinessUnit.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["business-units"]); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BusinessUnit.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["business-units"]); setDeleteId(null); },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, company_id: selectedCompanyId || companies[0]?.id || "" });
    setDialogOpen(true);
  };

  const openEdit = (bu) => {
    setEditingId(bu.id);
    setForm({
      name: bu.name || "", description: bu.description || "", type: bu.type || "Department",
      company_id: bu.company_id || "", parent_id: bu.parent_id || "",
      value_chain_id: bu.value_chain_id || "", workstream_id: bu.workstream_id || "",
      owner_stakeholder_id: bu.owner_stakeholder_id || "", owner_name: bu.owner_name || "",
      cost_center_code: bu.cost_center_code || "", status: bu.status || "active",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleChange = (field, value) => {
    setForm(f => {
      const updated = { ...f, [field]: value };
      // Clear workstream if value chain changes
      if (field === "value_chain_id") updated.workstream_id = "";
      // Auto-fill owner name
      if (field === "owner_stakeholder_id") {
        const sh = stakeholders.find(s => s.id === value);
        if (sh) updated.owner_name = sh.full_name;
      }
      return updated;
    });
  };

  const handleSubmit = () => {
    const data = { ...form };
    if (!data.parent_id) delete data.parent_id;
    if (!data.value_chain_id) delete data.value_chain_id;
    if (!data.workstream_id) delete data.workstream_id;
    if (!data.owner_stakeholder_id) delete data.owner_stakeholder_id;

    if (editingId) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate(data);
  };

  // Build parent options (same company, exclude self)
  const parentOptions = allUnits.filter(bu => bu.id !== editingId);

  const filtered = allUnits.filter(bu =>
    !search ||
    bu.name?.toLowerCase().includes(search.toLowerCase()) ||
    bu.type?.toLowerCase().includes(search.toLowerCase()) ||
    bu.cost_center_code?.toLowerCase().includes(search.toLowerCase())
  );

  const getParentName = (pid) => allUnits.find(b => b.id === pid)?.name;
  const getVCName = (id) => valueChains.find(v => v.id === id)?.name;
  const getWSName = (id) => workstreams.find(w => w.id === id)?.name;
  const getCompanyName = (id) => companies.find(c => c.id === id)?.name || "—";

  // Group by type for display
  const grouped = BU_TYPES.reduce((acc, type) => {
    const items = filtered.filter(bu => bu.type === type);
    if (items.length) acc[type] = items;
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Business Units
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Define organizational units — departments, capabilities, CoEs, regions and more.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Business Unit
        </Button>
      </div>

      {/* Stats + search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-primary">{allUnits.length}</span>
          <span className="text-sm text-slate-500">Total</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-green-600">{allUnits.filter(b => b.status === "active").length}</span>
          <span className="text-sm text-slate-500">Active</span>
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search business units…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-3">No business units found.</p>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Create First Business Unit</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[type] || "bg-slate-100 text-slate-600"}`}>{type}</span>
                <span className="text-xs text-slate-400">{items.length} unit{items.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="text-left px-4 py-2 font-semibold">Name</th>
                      <th className="text-left px-4 py-2 font-semibold hidden md:table-cell">Parent</th>
                      <th className="text-left px-4 py-2 font-semibold hidden lg:table-cell">Value Chain</th>
                      <th className="text-left px-4 py-2 font-semibold hidden lg:table-cell">Workstream</th>
                      <th className="text-left px-4 py-2 font-semibold hidden md:table-cell">Cost Centre</th>
                      <th className="text-left px-4 py-2 font-semibold">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map(bu => (
                      <tr key={bu.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{bu.name}</div>
                          {bu.description && <div className="text-xs text-slate-400 line-clamp-1">{bu.description}</div>}
                          {bu.owner_name && <div className="text-xs text-slate-500 mt-0.5">Owner: {bu.owner_name}</div>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {bu.parent_id ? (
                            <span className="flex items-center gap-1 text-slate-600 text-xs">
                              <ChevronRight className="w-3 h-3" />{getParentName(bu.parent_id)}
                            </span>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-600">
                          {getVCName(bu.value_chain_id) || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-600">
                          {getWSName(bu.workstream_id) || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs font-mono text-slate-500">
                          {bu.cost_center_code || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs border ${STATUS_COLORS[bu.status] || STATUS_COLORS.active}`}>
                            {bu.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => openEdit(bu)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteId(bu.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {editingId ? "Edit Business Unit" : "New Business Unit"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name + Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="e.g. Finance Department" />
              </div>
              <div className="space-y-1">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={v => handleChange("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BU_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => handleChange("description", e.target.value)} rows={2} placeholder="Brief description…" />
            </div>

            {/* Company + Parent */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Company *</Label>
                <Select value={form.company_id} onValueChange={v => handleChange("company_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select company…" /></SelectTrigger>
                  <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Parent Unit</Label>
                <Select value={form.parent_id || "none"} onValueChange={v => handleChange("parent_id", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {parentOptions
                      .filter(bu => !form.company_id || bu.company_id === form.company_id)
                      .map(bu => <SelectItem key={bu.id} value={bu.id}>{bu.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Value Chain + Workstream */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Value Chain</Label>
                <Select value={form.value_chain_id || "none"} onValueChange={v => handleChange("value_chain_id", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {valueChains.map(vc => <SelectItem key={vc.id} value={vc.id}>{vc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Workstream</Label>
                <Select
                  value={form.workstream_id || "none"}
                  onValueChange={v => handleChange("workstream_id", v === "none" ? "" : v)}
                  disabled={!form.value_chain_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={form.value_chain_id ? "Select…" : "Select value chain first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {filteredWorkstreams.map(ws => (
                      <SelectItem key={ws.id} value={ws.id}>{ws.full_label || ws.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.value_chain_id && filteredWorkstreams.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No workstreams linked to this value chain.</p>
                )}
              </div>
            </div>

            {/* Owner + Cost Centre */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Owner</Label>
                <SearchableStakeholderSelect
                  value={form.owner_stakeholder_id}
                  onValueChange={v => handleChange("owner_stakeholder_id", v)}
                  stakeholders={form.company_id ? stakeholders.filter(s => s.company_id === form.company_id) : stakeholders}
                  placeholder="Select owner…"
                />
              </div>
              <div className="space-y-1">
                <Label>Cost Centre Code</Label>
                <Input value={form.cost_center_code} onChange={e => handleChange("cost_center_code", e.target.value)} placeholder="e.g. CC-1001" />
              </div>
            </div>

            {/* End Date + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={e => handleChange("end_date", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => handleChange("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name || !form.company_id || createMutation.isPending || updateMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {editingId ? "Save Changes" : "Create Business Unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Business Unit?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">This cannot be undone. Any child units will not be automatically re-parented.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
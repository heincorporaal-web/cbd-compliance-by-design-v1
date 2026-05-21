import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Edit2, Trash2, Cpu, Users, ChevronDown, ChevronUp, CalendarOff } from "lucide-react";
import EndDateBadge from "@/components/ui/EndDateBadge";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";

const CATEGORIES = [
  { value: "infrastructure", label: "Infrastructure" },
  { value: "security", label: "Security" },
  { value: "data_management", label: "Data Management" },
  { value: "application_development", label: "Application Development" },
  { value: "service_management", label: "Service Management" },
  { value: "networking", label: "Networking" },
  { value: "cloud", label: "Cloud" },
  { value: "analytics", label: "Analytics" },
  { value: "integration", label: "Integration" },
  { value: "other", label: "Other" },
];

const MATURITY_LEVELS = [
  { value: "initial", label: "Initial" },
  { value: "developing", label: "Developing" },
  { value: "defined", label: "Defined" },
  { value: "managed", label: "Managed" },
  { value: "optimising", label: "Optimising" },
];

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "planned", label: "Planned" },
  { value: "retired", label: "Retired" },
];

const maturityColor = (m) => ({
  initial: "bg-red-100 text-red-700 border-red-200",
  developing: "bg-orange-100 text-orange-700 border-orange-200",
  defined: "bg-yellow-100 text-yellow-700 border-yellow-200",
  managed: "bg-blue-100 text-blue-700 border-blue-200",
  optimising: "bg-green-100 text-green-700 border-green-200",
}[m] || "bg-slate-100 text-slate-700");

const statusColor = (s) => ({
  active: "bg-green-100 text-green-700 border-green-200",
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  retired: "bg-slate-100 text-slate-600 border-slate-200",
}[s] || "bg-slate-100 text-slate-700");

const EMPTY_FORM = {
  name: "", description: "", company_id: "", category: "other",
  maturity_level: "initial", status: "active", end_date: "", owner: "", stakeholder_ids: [], notes: ""
};

export default function ITCapabilities() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState(null);
  const [stakeholderSearch, setStakeholderSearch] = useState("");
  const { selectedCompanyId } = useCompanyFilter();
  const queryClient = useQueryClient();

  const { data: capabilities = [] } = useQuery({
    queryKey: ["itCapabilities"],
    queryFn: () => base44.entities.ITCapability.list("-created_date"),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders"],
    queryFn: () => base44.entities.Stakeholder.list(),
  });

  const { data: stakeholderGroups = [] } = useQuery({
    queryKey: ["stakeholderGroups"],
    queryFn: () => base44.entities.StakeholderGroup.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ITCapability.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["itCapabilities"]); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ITCapability.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["itCapabilities"]); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ITCapability.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["itCapabilities"]),
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, company_id: selectedCompanyId || "" });
    setStakeholderSearch("");
    setDialogOpen(true);
  };

  const openEdit = (cap) => {
    setEditItem(cap);
    setForm({
      name: cap.name || "",
      description: cap.description || "",
      company_id: cap.company_id || "",
      category: cap.category || "other",
      maturity_level: cap.maturity_level || "initial",
      status: cap.status || "active",
      end_date: cap.end_date || "",
      owner: cap.owner || "",
      stakeholder_ids: cap.stakeholder_ids || [],
      notes: cap.notes || "",
    });
    setStakeholderSearch("");
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditItem(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editItem) updateMutation.mutate({ id: editItem.id, data: form });
    else createMutation.mutate(form);
  };

  const toggleStakeholder = (id) => {
    setForm(f => ({
      ...f,
      stakeholder_ids: f.stakeholder_ids.includes(id)
        ? f.stakeholder_ids.filter(s => s !== id)
        : [...f.stakeholder_ids, id],
    }));
  };

  const filtered = capabilities.filter(cap => {
    const matchesCompany = !selectedCompanyId || cap.company_id === selectedCompanyId;
    const matchesSearch = !search ||
      cap.name?.toLowerCase().includes(search.toLowerCase()) ||
      cap.description?.toLowerCase().includes(search.toLowerCase());
    return matchesCompany && matchesSearch;
  });

  // Group stakeholders by group for display in the selector
  const getGroupName = (stakeholder) => {
    const groupId = stakeholder.group_ids?.[0];
    return stakeholderGroups.find(g => g.id === groupId)?.name || "Ungrouped";
  };

  const filteredStakeholders = stakeholders.filter(s =>
    !stakeholderSearch ||
    s.full_name?.toLowerCase().includes(stakeholderSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(stakeholderSearch.toLowerCase())
  );

  // Group them
  const stakeholdersByGroup = filteredStakeholders.reduce((acc, s) => {
    const grp = getGroupName(s);
    if (!acc[grp]) acc[grp] = [];
    acc[grp].push(s);
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">IT Capabilities</h1>
          <p className="text-slate-600">Manage IT capabilities per company and assign responsible stakeholders</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Capability
        </Button>
      </div>

      {/* Search */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search capabilities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
          <CardContent className="p-12 text-center">
            <Cpu className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No IT Capabilities Yet</h3>
            <p className="text-slate-600 mb-6">Add IT capabilities to track and assign them to stakeholders</p>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add First Capability</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(cap => {
            const company = companies.find(c => c.id === cap.company_id);
            const assignedStakeholders = stakeholders.filter(s => cap.stakeholder_ids?.includes(s.id));
            const isExpanded = expandedId === cap.id;
            return (
              <Card key={cap.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                <CardHeader className="border-b border-slate-100 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base mb-1">{cap.name}</CardTitle>
                      {company && <p className="text-xs text-slate-500">{company.name}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className={`border text-xs ${statusColor(cap.status)}`}>
                        {cap.status}
                      </Badge>
                      <EndDateBadge endDate={cap.end_date} />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cap)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => deleteMutation.mutate(cap.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-3">
                  {cap.description && <p className="text-sm text-slate-600 line-clamp-2">{cap.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-slate-50">{CATEGORIES.find(c => c.value === cap.category)?.label || cap.category}</Badge>
                    <Badge variant="outline" className={`text-xs border ${maturityColor(cap.maturity_level)}`}>
                      {MATURITY_LEVELS.find(m => m.value === cap.maturity_level)?.label || cap.maturity_level}
                    </Badge>
                  </div>
                  {assignedStakeholders.length > 0 && (
                    <div>
                      <button
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                        onClick={() => setExpandedId(isExpanded ? null : cap.id)}
                      >
                        <Users className="w-3.5 h-3.5" />
                        {assignedStakeholders.length} stakeholder{assignedStakeholders.length !== 1 ? "s" : ""}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-1">
                          {assignedStakeholders.map(s => (
                            <div key={s.id} className="flex items-center gap-2 text-xs text-slate-700">
                              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                                {s.full_name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <span>{s.full_name}</span>
                              {s.job_title && <span className="text-slate-400">— {s.job_title}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit IT Capability" : "Add IT Capability"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Company *</Label>
                <Select value={form.company_id} onValueChange={v => setForm({ ...form, company_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select company..." /></SelectTrigger>
                  <SelectContent>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Maturity Level</Label>
                <Select value={form.maturity_level} onValueChange={v => setForm({ ...form, maturity_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MATURITY_LEVELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Owner</Label>
                <Input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} placeholder="Owner name" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><CalendarOff className="w-3.5 h-3.5 text-slate-400" /> End Date</Label>
                <Input type="date" value={form.end_date || ""} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                <p className="text-xs text-slate-400">Set to mark this capability as retired on that date</p>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
            </div>

            {/* Stakeholder Assignment */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Assign Stakeholders ({form.stakeholder_ids.length} selected)
              </Label>
              <Input
                placeholder="Search stakeholders..."
                value={stakeholderSearch}
                onChange={e => setStakeholderSearch(e.target.value)}
                className="mb-2"
              />
              <div className="border rounded-lg max-h-52 overflow-y-auto divide-y">
                {Object.keys(stakeholdersByGroup).length === 0 ? (
                  <p className="text-sm text-slate-500 p-3">No stakeholders found.</p>
                ) : (
                  Object.entries(stakeholdersByGroup).map(([group, members]) => (
                    <div key={group}>
                      <div className="px-3 py-1.5 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {group}
                      </div>
                      {members.map(s => (
                        <label
                          key={s.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                        >
                          <Checkbox
                            checked={form.stakeholder_ids.includes(s.id)}
                            onCheckedChange={() => toggleStakeholder(s.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">{s.full_name}</p>
                            <p className="text-xs text-slate-500">{s.job_title || s.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editItem ? "Save Changes" : "Create Capability"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
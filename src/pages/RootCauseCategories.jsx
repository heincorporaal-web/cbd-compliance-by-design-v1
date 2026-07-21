import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, AlertCircle, ChevronDown, ChevronRight, CalendarOff } from "lucide-react";
import EndDateBadge from "@/components/ui/EndDateBadge";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import PageHeader from "@/components/layout/PageHeader";

const CATEGORIES = [
  "Human-Related",
  "Process-Related",
  "Technology-Related",
  "Governance & Management",
  "External",
  "Unspecified",
];

const CATEGORY_COLORS = {
  "Human-Related": "bg-rose-100 text-rose-700",
  "Process-Related": "bg-orange-100 text-orange-700",
  "Technology-Related": "bg-blue-100 text-blue-700",
  "Governance & Management": "bg-violet-100 text-violet-700",
  "External": "bg-amber-100 text-amber-700",
  "Unspecified": "bg-slate-100 text-slate-600",
};

const EMPTY_FORM = {
  company_id: "",
  category: "",
  root_cause_type: "",
  example: "",
  sort_order: 0,
  is_active: true,
  end_date: "",
};

export default function RootCauseCategories() {
  const queryClient = useQueryClient();
  const [selectedCompanyId] = useCompanyFilter();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [collapsed, setCollapsed] = useState({});

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["root-cause-categories", selectedCompanyId],
    queryFn: () =>
      selectedCompanyId
        ? base44.entities.RootCauseCategory.filter({ company_id: selectedCompanyId }, "sort_order")
        : base44.entities.RootCauseCategory.list("sort_order"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RootCauseCategory.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["root-cause-categories"]); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RootCauseCategory.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["root-cause-categories"]); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RootCauseCategory.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["root-cause-categories"]),
  });

  const closeForm = () => { setShowForm(false); setEditingItem(null); setFormData(EMPTY_FORM); };

  const openCreate = () => {
    setFormData({ ...EMPTY_FORM, company_id: selectedCompanyId || (companies[0]?.id ?? "") });
    setEditingItem(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      company_id: item.company_id || "",
      category: item.category || "",
      root_cause_type: item.root_cause_type || "",
      example: item.example || "",
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active !== false,
      end_date: item.end_date || "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) updateMutation.mutate({ id: editingItem.id, data: formData });
    else createMutation.mutate(formData);
  };

  const filtered = items.filter(item =>
    !search ||
    item.root_cause_type?.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase()) ||
    item.example?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, item) => {
    const key = item.category || "Unspecified";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const toggleCollapse = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          navItemId="root_cause_categories"
          icon={AlertCircle}
          title="Root Cause Categories"
          tagline="Manage root cause types grouped by category for issue and incident analysis."
          gradient="from-orange-600 to-red-700"
        />
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Root Cause Type
        </Button>
      </div>

      {/* Stats + Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-primary">{items.length}</span>
          <span className="text-sm text-slate-500">Total</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-slate-600">{Object.keys(grouped).length}</span>
          <span className="text-sm text-slate-500">Categories</span>
        </div>
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search root cause types…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">No root cause types found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.filter(cat => grouped[cat]).map(cat => {
            const catItems = grouped[cat] || [];
            const isOpen = !collapsed[cat];
            const badgeCls = CATEGORY_COLORS[cat] || "bg-slate-100 text-slate-700";
            return (
              <div key={cat} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <button
                  onClick={() => toggleCollapse(cat)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                  <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${badgeCls}`}>{cat}</span>
                  <span className="text-xs text-slate-400 ml-auto">{catItems.length} type{catItems.length !== 1 ? "s" : ""}</span>
                </button>
                {isOpen && (
                  <div className="divide-y divide-slate-100">
                    {catItems.map(item => {
                      const company = companies.find(c => c.id === item.company_id);
                      return (
                        <div key={item.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm text-slate-900">{item.root_cause_type}</span>
                                {!item.is_active && (
                                  <Badge variant="outline" className="text-xs">Inactive</Badge>
                                )}
                                <EndDateBadge endDate={item.end_date} />
                              </div>
                              {item.example && (
                                <p className="text-xs text-slate-500 mt-0.5 italic">e.g. {item.example}</p>
                              )}
                              {company && (
                                <p className="text-xs text-slate-400 mt-0.5">{company.name}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(item.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={o => { if (!o) closeForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Root Cause Type" : "New Root Cause Type"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Company *</Label>
              <Select value={formData.company_id} onValueChange={v => setFormData(p => ({ ...p, company_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select company…" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={v => setFormData(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Root Cause Type *</Label>
              <Input
                value={formData.root_cause_type}
                onChange={e => setFormData(p => ({ ...p, root_cause_type: e.target.value }))}
                required
                placeholder="e.g. Human Error"
              />
            </div>
            <div className="space-y-1">
              <Label>Example</Label>
              <Textarea
                value={formData.example}
                onChange={e => setFormData(p => ({ ...p, example: e.target.value }))}
                rows={2}
                placeholder="Describe a typical example of this root cause…"
              />
            </div>
            <div className="space-y-1">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={e => setFormData(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5"><CalendarOff className="w-3.5 h-3.5 text-slate-400" /> End Date</Label>
              <Input type="date" value={formData.end_date || ""} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} />
              <p className="text-xs text-slate-400">Set to retire this root cause type on that date</p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {editingItem ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
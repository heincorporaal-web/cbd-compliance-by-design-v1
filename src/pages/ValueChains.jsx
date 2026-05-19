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
import { Plus, Pencil, Trash2, Search, Network, ChevronDown, ChevronRight } from "lucide-react";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import WorkstreamPanel from "@/components/valuechains/WorkstreamPanel";

const EMPTY_FORM = {
  value_chain_code: "",
  name: "",
  management_chain: "",
  description: "",
  company_id: "",
  sort_order: 0,
  is_active: true,
  status: "active",
};

const MANAGEMENT_CHAINS = [
  "Customer Relationship Management",
  "Enterprise Asset Management",
  "Enterprise Governance and Shareholder",
  "Enterprise IT Management",
  "Enterprise Perfomance Management",
  "Financial Management",
  "Governance, Risk & Compliance",
  "Human Capital Management",
  "Inventory Management",
  "Product Management",
  "Strategic Planning & Direction",
];

export default function ValueChains() {
  const queryClient = useQueryClient();
  const [selectedCompanyId] = useCompanyFilter();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [collapsed, setCollapsed] = useState({});
  const [expandedWS, setExpandedWS] = useState({});

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: valueChains = [], isLoading } = useQuery({
    queryKey: ["value-chains", selectedCompanyId],
    queryFn: () =>
      selectedCompanyId
        ? base44.entities.ValueChain.filter({ company_id: selectedCompanyId }, "sort_order")
        : base44.entities.ValueChain.list("sort_order"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ValueChain.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["value-chains"]); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ValueChain.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["value-chains"]); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ValueChain.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["value-chains"]),
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
      value_chain_code: item.value_chain_code || "",
      name: item.name || "",
      management_chain: item.management_chain || "",
      description: item.description || "",
      company_id: item.company_id || "",
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active !== false,
      status: item.status || "active",
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) updateMutation.mutate({ id: editingItem.id, data: formData });
    else createMutation.mutate(formData);
  };

  const filtered = valueChains.filter(vc =>
    !search || vc.name?.toLowerCase().includes(search.toLowerCase()) ||
    vc.value_chain_code?.toLowerCase().includes(search.toLowerCase()) ||
    vc.management_chain?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by management_chain
  const grouped = filtered.reduce((acc, vc) => {
    const key = vc.management_chain || "Uncategorised";
    if (!acc[key]) acc[key] = [];
    acc[key].push(vc);
    return acc;
  }, {});

  const toggleCollapse = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }));
  const toggleWS = (id) => setExpandedWS(p => ({ ...p, [id]: !p[id] }));

  const chainColors = {
    "Customer Relationship Management": "bg-cyan-100 text-cyan-700",
    "Enterprise Asset Management": "bg-indigo-100 text-indigo-700",
    "Enterprise Governance and Shareholder": "bg-slate-100 text-slate-700",
    "Enterprise IT Management": "bg-blue-100 text-blue-700",
    "Enterprise Perfomance Management": "bg-violet-100 text-violet-700",
    "Financial Management": "bg-green-100 text-green-700",
    "Governance, Risk & Compliance": "bg-orange-100 text-orange-700",
    "Human Capital Management": "bg-pink-100 text-pink-700",
    "Inventory Management": "bg-amber-100 text-amber-700",
    "Product Management": "bg-teal-100 text-teal-700",
    "Strategic Planning & Direction": "bg-purple-100 text-purple-700",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Network className="w-6 h-6 text-primary" /> Value Chains
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage organisational value chains grouped by management domain.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Value Chain
        </Button>
      </div>

      {/* Stats + Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-primary">{valueChains.length}</span>
          <span className="text-sm text-slate-500">Total</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-green-600">{valueChains.filter(v => v.status === 'active').length}</span>
          <span className="text-sm text-slate-500">Active</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-slate-600">{Object.keys(grouped).length}</span>
          <span className="text-sm text-slate-500">Domains</span>
        </div>
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search value chains…"
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
          <Network className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">No value chains found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([chain, items]) => {
            const isOpen = !collapsed[chain];
            const badgeCls = chainColors[chain] || "bg-slate-100 text-slate-700";
            return (
              <div key={chain} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <button
                  onClick={() => toggleCollapse(chain)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                  <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${badgeCls}`}>{chain}</span>
                  <span className="text-xs text-slate-400 ml-auto">{items.length} item{items.length !== 1 ? "s" : ""}</span>
                </button>
                {isOpen && (
                  <div className="divide-y divide-slate-100">
                    {items.map(vc => {
                      const company = companies.find(c => c.id === vc.company_id);
                      return (
                        <div key={vc.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => toggleWS(vc.id)}
                                  className="flex items-center gap-1 text-left"
                                >
                                  {expandedWS[vc.id] ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                  <span className="font-medium text-sm text-slate-900">{vc.name}</span>
                                </button>
                                <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{vc.value_chain_code}</span>
                                {vc.status !== "active" && (
                                  <Badge variant="outline" className="text-xs capitalize">{vc.status}</Badge>
                                )}
                              </div>
                              {vc.description && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{vc.description}</p>
                              )}
                              {company && (
                                <p className="text-xs text-slate-400 mt-0.5">{company.name}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(vc)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(vc.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </Button>
                            </div>
                          </div>
                          {expandedWS[vc.id] && (
                            <WorkstreamPanel valueChainId={vc.id} companyId={vc.company_id} />
                          )}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Value Chain" : "New Value Chain"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label>Code *</Label>
              <Input value={formData.value_chain_code} onChange={e => setFormData(p => ({ ...p, value_chain_code: e.target.value }))} required placeholder="e.g. EAM-Acquire-to-Decommission" />
            </div>
            <div className="space-y-1">
              <Label>Management Chain</Label>
              <Select value={formData.management_chain} onValueChange={v => setFormData(p => ({ ...p, management_chain: v }))}>
                <SelectTrigger><SelectValue placeholder="Select domain…" /></SelectTrigger>
                <SelectContent>
                  {MANAGEMENT_CHAINS.map(mc => <SelectItem key={mc} value={mc}>{mc}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Sort Order</Label>
              <Input type="number" value={formData.sort_order} onChange={e => setFormData(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">{editingItem ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
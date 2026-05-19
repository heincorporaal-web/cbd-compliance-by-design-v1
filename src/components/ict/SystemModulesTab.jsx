import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Pencil, Trash2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { getICTModuleErrors } from "@/utils/validationErrors.jsx";

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

const EMPTY_MODULE = {
  module_name: "",
  description: "",
  is_active: true,
  module_owner_stakeholder_id: "",
  module_owner_name: "",
  active_from: "",
  active_to: "",
  domain: "",
  ict_scope: "",
  workstream_id: "",
  workstream_name: "",
};

export default function SystemModulesTab({ systemId, companyId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [formData, setFormData] = useState(EMPTY_MODULE);

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["ict-modules", systemId],
    queryFn: () => base44.entities.ICTModule.filter({ ict_system_id: systemId }),
    enabled: !!systemId,
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders", companyId],
    queryFn: () => base44.entities.Stakeholder.filter({ company_id: companyId, status: "active" }),
    enabled: !!companyId,
  });

  const { data: workstreams = [] } = useQuery({
    queryKey: ["workstreams", companyId],
    queryFn: () => base44.entities.Workstream.filter({ company_id: companyId, status: "active" }),
    enabled: !!companyId,
  });

  // Filter workstreams by selected domain
  const filteredWorkstreams = formData.domain
    ? workstreams.filter(ws => {
        // Match workstreams whose management chain or domain_code relates to the selected domain
        const domainLower = formData.domain.toLowerCase();
        return ws.full_label?.toLowerCase().includes(domainLower.split(" ")[0].toLowerCase()) ||
               ws.name?.toLowerCase().includes(domainLower.split(" ")[0].toLowerCase());
      })
    : workstreams;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ICTModule.create({ ...data, ict_system_id: systemId, company_id: companyId }),
    onSuccess: () => { queryClient.invalidateQueries(["ict-modules", systemId]); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ICTModule.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["ict-modules", systemId]); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ICTModule.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["ict-modules", systemId]),
  });

  const closeForm = () => { setShowForm(false); setEditingModule(null); setFormData(EMPTY_MODULE); };

  const openCreate = () => { setFormData(EMPTY_MODULE); setEditingModule(null); setShowForm(true); };

  const openEdit = (mod) => {
    setEditingModule(mod);
    setFormData({
      module_name: mod.module_name || "",
      description: mod.description || "",
      is_active: mod.is_active !== false,
      module_owner_stakeholder_id: mod.module_owner_stakeholder_id || "",
      module_owner_name: mod.module_owner_name || "",
      active_from: mod.active_from || "",
      active_to: mod.active_to || "",
      domain: mod.domain || "",
      ict_scope: mod.ict_scope || "",
      workstream_id: mod.workstream_id || "",
      workstream_name: mod.workstream_name || "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const stakeholder = stakeholders.find(s => s.id === formData.module_owner_stakeholder_id);
    const workstream = workstreams.find(ws => ws.id === formData.workstream_id);
    const data = {
      ...formData,
      module_owner_name: stakeholder?.full_name || formData.module_owner_name,
      workstream_name: workstream?.name || formData.workstream_name,
    };
    if (editingModule) {
      updateMutation.mutate({ id: editingModule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDomainChange = (domain) => {
    setFormData(p => ({ ...p, domain, workstream_id: "", workstream_name: "" }));
  };

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading modules…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{modules.length} module{modules.length !== 1 ? "s" : ""} registered</p>
        <Button size="sm" onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-1.5" /> Add Module
        </Button>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-slate-400 text-sm">No modules added yet.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>Add First Module</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {modules.map(mod => (
            <Card key={mod.id} className="border border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-900 text-sm">{mod.module_name}</span>
                      {(() => {
                        const errors = getICTModuleErrors(mod);
                        if (errors.length > 0) {
                          return (
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-semibold text-red-600">{errors.length} error{errors.length !== 1 ? 's' : ''}</p>
                                    <ul className="text-xs space-y-0.5">
                                      {errors.map((err, idx) => (
                                        <li key={idx} className="text-slate-700">• {err.message}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        }
                        return null;
                      })()}
                      {mod.is_active ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs border gap-1">
                          <CheckCircle className="w-3 h-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-slate-500 gap-1">
                          <XCircle className="w-3 h-3" /> Inactive
                        </Badge>
                      )}
                      {mod.domain && (
                        <Badge variant="outline" className="text-xs">{mod.domain.split(" ").slice(0, 2).join(" ")}</Badge>
                      )}
                    </div>
                    {mod.description && <p className="text-xs text-slate-500 mb-1 line-clamp-2">{mod.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
                      {mod.module_owner_name && <span>Owner: {mod.module_owner_name}</span>}
                      {mod.workstream_name && <span>Workstream: {mod.workstream_name}</span>}
                      {mod.ict_scope && <span>Scope: {mod.ict_scope}</span>}
                      {mod.active_from && <span>From: {mod.active_from}</span>}
                      {mod.active_to && <span>To: {mod.active_to}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(mod)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(mod.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={o => { if (!o) closeForm(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingModule ? "Edit Module" : "Add Module"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Module Name *</Label>
              <Input value={formData.module_name} onChange={e => setFormData(p => ({ ...p, module_name: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Is Active</Label>
                <Select value={formData.is_active ? "true" : "false"} onValueChange={v => setFormData(p => ({ ...p, is_active: v === "true" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Module Owner</Label>
                <Select value={formData.module_owner_stakeholder_id || "__none__"} onValueChange={v => setFormData(p => ({ ...p, module_owner_stakeholder_id: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select owner…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {stakeholders.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Active From</Label>
                <Input type="date" value={formData.active_from} onChange={e => setFormData(p => ({ ...p, active_from: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Active To</Label>
                <Input type="date" value={formData.active_to} onChange={e => setFormData(p => ({ ...p, active_to: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Domain (Management Chain)</Label>
              <Select value={formData.domain || "__none__"} onValueChange={v => handleDomainChange(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select domain…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {MANAGEMENT_CHAINS.map(mc => <SelectItem key={mc} value={mc}>{mc}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>ICT Scope</Label>
              <Textarea value={formData.ict_scope} onChange={e => setFormData(p => ({ ...p, ict_scope: e.target.value }))} rows={2} placeholder="Describe the ICT scope…" />
            </div>

            <div className="space-y-1">
              <Label>Assign to Workstream</Label>
              <Select value={formData.workstream_id || "__none__"} onValueChange={v => setFormData(p => ({ ...p, workstream_id: v === "__none__" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Select workstream…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {(formData.domain ? filteredWorkstreams : workstreams).map(ws => (
                    <SelectItem key={ws.id} value={ws.id}>{ws.full_label || ws.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.domain && filteredWorkstreams.length === 0 && (
                <p className="text-xs text-slate-400 mt-1">No active workstreams found for this domain.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{editingModule ? "Update" : "Add Module"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
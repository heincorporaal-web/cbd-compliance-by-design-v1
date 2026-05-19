import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Layers, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getWorkstreamErrors } from "@/utils/validationErrors.jsx";

const EMPTY_FORM = {
  workstream_code: "",
  name: "",
  full_label: "",
  description: "",
  domain_code: "",
  e2e_code: "",
  sort_order: 0,
  is_active: true,
  status: "active",
};

export default function WorkstreamPanel({ valueChainId, companyId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data: workstreams = [], isLoading } = useQuery({
    queryKey: ["workstreams", valueChainId],
    queryFn: () => base44.entities.Workstream.filter({ value_chain_id: valueChainId, company_id: companyId }, "sort_order"),
    enabled: !!valueChainId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Workstream.create({ ...data, value_chain_id: valueChainId, company_id: companyId }),
    onSuccess: () => { queryClient.invalidateQueries(["workstreams", valueChainId]); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Workstream.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["workstreams", valueChainId]); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Workstream.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["workstreams", valueChainId]),
  });

  const closeForm = () => { setShowForm(false); setEditing(null); setFormData(EMPTY_FORM); };

  const openCreate = () => { setFormData(EMPTY_FORM); setEditing(null); setShowForm(true); };

  const openEdit = (ws) => {
    setEditing(ws);
    setFormData({
      workstream_code: ws.workstream_code || "",
      name: ws.name || "",
      full_label: ws.full_label || "",
      description: ws.description || "",
      domain_code: ws.domain_code || "",
      e2e_code: ws.e2e_code || "",
      sort_order: ws.sort_order ?? 0,
      is_active: ws.is_active !== false,
      status: ws.status || "active",
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: formData });
    else createMutation.mutate(formData);
  };

  return (
    <div className="mt-3 ml-4 border-l-2 border-slate-100 pl-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <Layers className="w-3 h-3" />
          Workstreams
          {workstreams.length > 0 && (
            <span className="bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 text-xs">{workstreams.length}</span>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 px-2" onClick={openCreate}>
          <Plus className="w-3 h-3" /> Add
        </Button>
      </div>

      {isLoading ? (
        <div className="text-xs text-slate-400 py-1">Loading…</div>
      ) : workstreams.length === 0 ? (
        <div className="text-xs text-slate-400 italic py-1">No workstreams yet.</div>
      ) : (
        <div className="space-y-1">
          {workstreams.map(ws => (
            <div key={ws.id} className="flex items-center gap-2 group rounded px-2 py-1 hover:bg-slate-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-medium text-slate-800">{ws.name}</span>
                  {(() => {
                    const errors = getWorkstreamErrors(ws);
                    if (errors.length > 0) {
                      return (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent 
                              side="top" 
                              className="max-w-xs bg-white border-2"
                              style={{ borderColor: '#5C7F99' }}
                            >
                              <div className="space-y-1">
                                <p className="font-semibold text-red-600">{errors.length} error{errors.length !== 1 ? 's' : ''}</p>
                                <ul className="text-xs space-y-0.5">
                                  {errors.map((err, idx) => (
                                    <li key={idx} className="text-blue-700">• {err.message}</li>
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
                  {ws.workstream_code && (
                    <span className="text-xs font-mono bg-slate-100 text-slate-500 px-1 rounded">{ws.workstream_code}</span>
                  )}
                  {ws.e2e_code && (
                    <Badge variant="outline" className="text-xs px-1 py-0 h-4">{ws.e2e_code}</Badge>
                  )}
                </div>
                {ws.description && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ws.description}</p>
                )}
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEdit(ws)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteMutation.mutate(ws.id)}>
                  <Trash2 className="w-3 h-3 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={o => { if (!o) closeForm(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Workstream" : "New Workstream"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Code</Label>
                <Input value={formData.workstream_code} onChange={e => setFormData(p => ({ ...p, workstream_code: e.target.value }))} placeholder="e.g. ORDM" />
              </div>
              <div className="space-y-1">
                <Label>E2E Code</Label>
                <Input value={formData.e2e_code} onChange={e => setFormData(p => ({ ...p, e2e_code: e.target.value }))} placeholder="e.g. O2C" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Domain Code</Label>
                <Input value={formData.domain_code} onChange={e => setFormData(p => ({ ...p, domain_code: e.target.value }))} placeholder="e.g. SCM" />
              </div>
              <div className="space-y-1">
                <Label>Sort Order</Label>
                <Input type="number" value={formData.sort_order} onChange={e => setFormData(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Full Label</Label>
              <Input value={formData.full_label} onChange={e => setFormData(p => ({ ...p, full_label: e.target.value }))} placeholder="e.g. SCM - O2C-Order Management" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">{editing ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
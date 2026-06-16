import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Pencil, Trash2, ShieldAlert } from "lucide-react";

const SEVERITY_COLORS = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Low: "bg-blue-100 text-blue-700 border-blue-200",
};

const emptyForm = {
  name: "", description: "", company_id: "", combination_type: "doa_conflict",
  status: "active", severity: "High",
  doa_id: "", doa_name: "",
  doa_activity_a_id: "", doa_activity_a_name: "",
  doa_activity_b_id: "", doa_activity_b_name: "",
  notes: "",
};

export default function ToxicCombinationsDOAPanel({ doaId, doaName, companyId, activities, stakeholders }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: allCombinations = [] } = useQuery({
    queryKey: ["toxicCombinations"],
    queryFn: () => base44.entities.ToxicCombination.list(),
  });

  // Only show DOA-type combos for this specific DOA
  const combinations = allCombinations.filter(c => c.combination_type === "doa_conflict" && c.doa_id === doaId);

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.ToxicCombination.create(d),
    onSuccess: () => { qc.invalidateQueries(["toxicCombinations"]); setOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ToxicCombination.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["toxicCombinations"]); setOpen(false); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ToxicCombination.delete(id),
    onSuccess: () => qc.invalidateQueries(["toxicCombinations"]),
  });

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, combination_type: "doa_conflict", doa_id: doaId, doa_name: doaName, company_id: companyId });
    setOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ ...emptyForm, ...c });
    setOpen(true);
  };

  const handleActivityAChange = (id) => {
    const a = activities.find(a => a.id === id);
    setForm(f => ({ ...f, doa_activity_a_id: id, doa_activity_a_name: a?.activity_name || "" }));
  };
  const handleActivityBChange = (id) => {
    const a = activities.find(a => a.id === id);
    setForm(f => ({ ...f, doa_activity_b_id: id, doa_activity_b_name: a?.activity_name || "" }));
  };

  // Find violations: same stakeholder appears as approver in both activities
  const getViolations = (c) => {
    if (!c.doa_activity_a_id || !c.doa_activity_b_id) return [];
    const actA = activities.find(a => a.id === c.doa_activity_a_id);
    const actB = activities.find(a => a.id === c.doa_activity_b_id);
    if (!actA || !actB) return [];
    const idsA = new Set((actA.approvers || []).map(a => a.stakeholder_id).filter(Boolean));
    const idsB = new Set((actB.approvers || []).map(a => a.stakeholder_id).filter(Boolean));
    const overlap = [...idsA].filter(id => idsB.has(id));
    return overlap.map(id => stakeholders.find(s => s.id === id)).filter(Boolean);
  };

  const handleSave = () => {
    editing
      ? updateMutation.mutate({ id: editing.id, data: form })
      : createMutation.mutate(form);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">DOA Toxic Combinations</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Define activity pairs where the same person must not both execute and approve. The system detects violations automatically.
          </p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1 bg-orange-600 hover:bg-orange-700 text-xs h-7">
          <Plus className="w-3 h-3" /> New Rule
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          No activities defined on this DOA yet. Add activities first before defining toxic combinations.
        </div>
      ) : combinations.length === 0 ? (
        <div className="text-center py-10 bg-white border border-slate-200 rounded-xl">
          <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No toxic combination rules defined for this DOA.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {combinations.map(c => {
            const violations = getViolations(c);
            return (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0" />
                      <span className="font-semibold text-slate-900">{c.name}</span>
                      <Badge className={`text-xs border ${SEVERITY_COLORS[c.severity] || SEVERITY_COLORS.High}`}>
                        {c.severity}
                      </Badge>
                    </div>
                    <div className="mt-1.5 text-sm flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-700">{c.doa_activity_a_name || "—"}</span>
                      <span className="text-slate-400 text-xs">cannot be combined with</span>
                      <span className="font-medium text-slate-700">{c.doa_activity_b_name || "—"}</span>
                    </div>
                    {c.description && <p className="mt-1 text-xs text-slate-500">{c.description}</p>}
                    {violations.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> {violations.length} violation{violations.length > 1 ? "s" : ""} detected
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {violations.map(s => (
                            <Badge key={s.id} variant="outline" className="text-xs border-red-200 text-red-600 bg-white">
                              {s.full_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {violations.length === 0 && (
                      <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> No violations detected
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                      <Pencil className="w-3.5 h-3.5 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(c.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              {editing ? "Edit DOA Conflict Rule" : "New DOA Conflict Rule"}
            </DialogTitle>
            <DialogDescription>
              Specify two activities that the same person must not both execute and approve (Segregation of Duties).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1">
              <Label>Rule Name *</Label>
              <Input value={form.name} onChange={e => setField("name", e.target.value)} placeholder="e.g. Cannot process and approve same payment" />
            </div>
            <div className="space-y-1">
              <Label>Severity</Label>
              <Select value={form.severity} onValueChange={v => setField("severity", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Critical", "High", "Medium", "Low"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Activity A (Execute) *</Label>
                <Select value={form.doa_activity_a_id || "none"} onValueChange={v => handleActivityAChange(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select activity…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Select —</SelectItem>
                    {activities.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.activity_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Activity B (Approve) *</Label>
                <Select value={form.doa_activity_b_id || "none"} onValueChange={v => handleActivityBChange(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select activity…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Select —</SelectItem>
                    {activities.filter(a => a.id !== form.doa_activity_a_id).map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.activity_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setField("description", e.target.value)} rows={2} placeholder="Why is this combination a segregation of duties risk?" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSave}
                className="bg-orange-600 hover:bg-orange-700"
                disabled={!form.name}
              >
                {editing ? "Save Changes" : "Create Rule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
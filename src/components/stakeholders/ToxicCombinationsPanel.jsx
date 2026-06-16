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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Plus, Pencil, Trash2, ShieldAlert, GitFork, Users } from "lucide-react";

const SEVERITY_COLORS = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Low: "bg-blue-100 text-blue-700 border-blue-200",
};

const LEVEL_LABELS = { 4: "L4 – Procedure", 5: "L5 – Task" };

const emptyForm = {
  name: "", description: "", company_id: "", combination_type: "group_conflict",
  status: "active", severity: "High",
  group_a_id: "", group_a_name: "", group_b_id: "", group_b_name: "",
  process_a_id: "", process_a_code: "", process_a_name: "",
  process_b_id: "", process_b_code: "", process_b_name: "",
  notes: "",
};

export default function ToxicCombinationsPanel({ groups, stakeholders, companies }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState("group_conflict");

  const { data: combinations = [] } = useQuery({
    queryKey: ["toxicCombinations"],
    queryFn: () => base44.entities.ToxicCombination.list(),
  });

  const { data: processes = [] } = useQuery({
    queryKey: ["orgProcesses-l45"],
    queryFn: () => base44.entities.OrgProcess.list(),
  });

  // Only L4 and L5 processes
  const l45Processes = processes.filter(p => p.level === 4 || p.level === 5);

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

  const openNew = (type) => {
    setEditing(null);
    setForm({ ...emptyForm, combination_type: type });
    setOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ ...emptyForm, ...c });
    setOpen(true);
  };

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleGroupAChange = (id) => {
    const g = groups.find(g => g.id === id);
    setForm(f => ({ ...f, group_a_id: id, group_a_name: g?.name || "" }));
  };
  const handleGroupBChange = (id) => {
    const g = groups.find(g => g.id === id);
    setForm(f => ({ ...f, group_b_id: id, group_b_name: g?.name || "" }));
  };
  const handleProcessAChange = (id) => {
    const p = l45Processes.find(p => p.id === id);
    setForm(f => ({ ...f, process_a_id: id, process_a_code: p?.process_code || "", process_a_name: p?.name || "" }));
  };
  const handleProcessBChange = (id) => {
    const p = l45Processes.find(p => p.id === id);
    setForm(f => ({ ...f, process_b_id: id, process_b_code: p?.process_code || "", process_b_name: p?.name || "" }));
  };

  const handleSave = () => {
    // Compute live violations for group_conflict
    let payload = { ...form };
    if (form.combination_type === "group_conflict" && form.group_a_id && form.group_b_id) {
      const violations = stakeholders.filter(
        s => s.group_ids?.includes(form.group_a_id) && s.group_ids?.includes(form.group_b_id)
      ).map(s => s.id);
      payload.conflicting_stakeholder_ids = violations;
    }
    editing
      ? updateMutation.mutate({ id: editing.id, data: payload })
      : createMutation.mutate(payload);
  };

  // Split combinations by type
  const groupCombos = combinations.filter(c => c.combination_type === "group_conflict");
  const processCombos = combinations.filter(c => c.combination_type === "process_step_conflict");

  // Compute live violations
  const getViolations = (c) => {
    if (c.combination_type !== "group_conflict" || !c.group_a_id || !c.group_b_id) return [];
    return stakeholders.filter(s => s.group_ids?.includes(c.group_a_id) && s.group_ids?.includes(c.group_b_id));
  };

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="group_conflict" className="gap-1.5">
              <Users className="w-3.5 h-3.5" /> Group Conflicts
              {groupCombos.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{groupCombos.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="process_step_conflict" className="gap-1.5">
              <GitFork className="w-3.5 h-3.5" /> Process Step Conflicts
              {processCombos.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{processCombos.length}</Badge>}
            </TabsTrigger>
          </TabsList>
          <Button
            size="sm"
            onClick={() => openNew(tab)}
            className="bg-orange-600 hover:bg-orange-700 gap-1"
          >
            <Plus className="w-4 h-4" /> New Rule
          </Button>
        </div>

        {/* Group Conflicts */}
        <TabsContent value="group_conflict" className="mt-4 space-y-3">
          <p className="text-xs text-slate-500">
            Define which stakeholder group combinations are incompatible (Segregation of Duties). The system will flag any member assigned to both groups.
          </p>
          {groupCombos.length === 0 ? (
            <EmptyState icon={<Users className="w-8 h-8 text-slate-300" />} label="No group conflict rules defined" />
          ) : groupCombos.map(c => {
            const violations = getViolations(c);
            return (
              <CombinationCard
                key={c.id}
                combo={c}
                onEdit={() => openEdit(c)}
                onDelete={() => deleteMutation.mutate(c.id)}
                extra={
                  violations.length > 0 && (
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
                  )
                }
                primaryLabel={
                  <span className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">{c.group_a_name || "—"}</span>
                    <span className="text-slate-400 text-xs">conflicts with</span>
                    <span className="font-semibold text-slate-800">{c.group_b_name || "—"}</span>
                  </span>
                }
              />
            );
          })}
        </TabsContent>

        {/* Process Step Conflicts */}
        <TabsContent value="process_step_conflict" className="mt-4 space-y-3">
          <p className="text-xs text-slate-500">
            Define which L4 (Procedure) and L5 (Task) process steps cannot be performed by the same person.
          </p>
          {processCombos.length === 0 ? (
            <EmptyState icon={<GitFork className="w-8 h-8 text-slate-300" />} label="No process step conflict rules defined" />
          ) : processCombos.map(c => (
            <CombinationCard
              key={c.id}
              combo={c}
              onEdit={() => openEdit(c)}
              onDelete={() => deleteMutation.mutate(c.id)}
              primaryLabel={
                <span className="flex items-center gap-1.5">
                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">{c.process_a_code}</code>
                  <span className="text-slate-600 text-xs truncate">{c.process_a_name}</span>
                  <span className="text-slate-400 text-xs">⟷</span>
                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">{c.process_b_code}</code>
                  <span className="text-slate-600 text-xs truncate">{c.process_b_name}</span>
                </span>
              }
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              {editing ? "Edit Toxic Combination Rule" : "New Toxic Combination Rule"}
            </DialogTitle>
            <DialogDescription>
              {form.combination_type === "group_conflict"
                ? "Prevent the same stakeholder from belonging to two conflicting groups."
                : "Prevent the same person from performing two incompatible process steps (L4/L5 only)."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-1">
              <Label>Rule Name *</Label>
              <Input value={form.name} onChange={e => setField("name", e.target.value)} placeholder="e.g. Preparer cannot approve" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Company *</Label>
                <Select value={form.company_id || "none"} onValueChange={v => setField("company_id", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Select —</SelectItem>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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
            </div>

            {/* Group conflict fields */}
            {form.combination_type === "group_conflict" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Group A *</Label>
                  <Select value={form.group_a_id || "none"} onValueChange={v => handleGroupAChange(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Select group…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Select —</SelectItem>
                      {groups.filter(g => g.status !== "inactive").map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Group B *</Label>
                  <Select value={form.group_b_id || "none"} onValueChange={v => handleGroupBChange(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Select group…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Select —</SelectItem>
                      {groups.filter(g => g.status !== "inactive" && g.id !== form.group_a_id).map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Process step conflict fields */}
            {form.combination_type === "process_step_conflict" && (
              <>
                {l45Processes.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    No L4 or L5 processes found. Please create L4 (Procedure) or L5 (Task) processes in Process Management first.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Process Step A *</Label>
                      <Select value={form.process_a_id || "none"} onValueChange={v => handleProcessAChange(v === "none" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder="Select step…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Select —</SelectItem>
                          {l45Processes.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              [{LEVEL_LABELS[p.level]}] {p.process_code} – {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.process_a_id && (
                        <p className="text-xs text-slate-500 font-mono">{form.process_a_code} · {form.process_a_name}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Process Step B *</Label>
                      <Select value={form.process_b_id || "none"} onValueChange={v => handleProcessBChange(v === "none" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder="Select step…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Select —</SelectItem>
                          {l45Processes.filter(p => p.id !== form.process_a_id).map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              [{LEVEL_LABELS[p.level]}] {p.process_code} – {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.process_b_id && (
                        <p className="text-xs text-slate-500 font-mono">{form.process_b_code} · {form.process_b_name}</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setField("description", e.target.value)} rows={2} placeholder="Why is this combination toxic? What risk does it create?" />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSave}
                className="bg-orange-600 hover:bg-orange-700"
                disabled={!form.name || !form.company_id}
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

function CombinationCard({ combo, onEdit, onDelete, primaryLabel, extra }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="font-semibold text-slate-900">{combo.name}</span>
            <Badge className={`text-xs border ${SEVERITY_COLORS[combo.severity] || SEVERITY_COLORS.High}`}>
              {combo.severity}
            </Badge>
            {combo.status === "inactive" && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
          </div>
          <div className="mt-1.5 flex items-center gap-1 flex-wrap text-sm">
            {primaryLabel}
          </div>
          {combo.description && <p className="mt-1 text-xs text-slate-500">{combo.description}</p>}
          {extra}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5 text-slate-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, label }) {
  return (
    <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}
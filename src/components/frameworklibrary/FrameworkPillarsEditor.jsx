import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function FrameworkPillarsEditor({ frameworkId, frameworkName, pillars, onChanged }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(null); // { id?, pillar_ref, pillar_name, pillar_desc }
  const [saving, setSaving] = useState(false);

  const openNew = () => setEditing({ pillar_ref: "", pillar_name: "", pillar_desc: "" });
  const openEdit = (p) => setEditing({ ...p });
  const set = (k, v) => setEditing((e) => ({ ...e, [k]: v }));

  const save = async () => {
    if (!editing.pillar_name.trim()) { toast({ title: "Pillar name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = {
        pillar_ref: editing.pillar_ref || "",
        pillar_name: editing.pillar_name,
        pillar_desc: editing.pillar_desc || "",
        framework_id: frameworkId,
        framework_name: frameworkName,
      };
      if (editing.id) await base44.entities.FrameworkPillar.update(editing.id, payload);
      else await base44.entities.FrameworkPillar.create(payload);
      toast({ title: editing.id ? "Pillar updated" : "Pillar added" });
      setEditing(null);
      onChanged?.();
    } catch (e) {
      toast({ title: "Save failed", description: e?.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete pillar "${p.pillar_name}"?`)) return;
    try {
      await base44.entities.FrameworkPillar.delete(p.id);
      toast({ title: "Pillar deleted" });
      onChanged?.();
    } catch (e) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{pillars.length} pillar{pillars.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Add pillar</Button>
      </div>
      {pillars.length === 0 ? (
        <p className="text-sm text-slate-400 italic text-center py-6">No pillars yet. Pillars group the framework into high-level themes.</p>
      ) : (
        <div className="space-y-2">
          {pillars.map((p) => (
            <div key={p.id} className="group flex items-start gap-3 p-3 rounded-lg border bg-white">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {p.pillar_ref && <span className="font-mono text-xs text-indigo-700 font-semibold">{p.pillar_ref}</span>}
                  <span className="text-sm font-medium text-slate-800">{p.pillar_name}</span>
                </div>
                {p.pillar_desc && <p className="text-xs text-slate-500 mt-1">{p.pillar_desc}</p>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-slate-100"><Pencil className="w-4 h-4 text-slate-600" /></button>
                <button onClick={() => remove(p)} className="p-1.5 rounded hover:bg-red-100"><Trash2 className="w-4 h-4 text-red-600" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing.id ? "Edit pillar" : "Add pillar"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Pillar reference</Label>
                <Input value={editing.pillar_ref} onChange={(e) => set("pillar_ref", e.target.value)} placeholder="e.g. P.DRA.IRM" />
              </div>
              <div className="space-y-1.5">
                <Label>Pillar name *</Label>
                <Input value={editing.pillar_name} onChange={(e) => set("pillar_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={3} value={editing.pillar_desc} onChange={(e) => set("pillar_desc", e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : editing.id ? "Save" : "Add pillar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
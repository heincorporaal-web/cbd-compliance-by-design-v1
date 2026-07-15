import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const blank = (frameworkId, parentId, parentLevel) => ({
  framework_id: frameworkId,
  parent_id: parentId || null,
  legacy_node_type_id: null,
  node_type_name: "",
  node_code: "",
  node_title: "",
  node_text: "",
  guidance_text: "",
  key_aspects: "",
  external_ref: "",
  reference_url: "",
  sort_order: 0,
  level_no: parentId ? (parentLevel || 2) + 1 : 2,
  is_leaf: true,
  is_mandatory: false,
});

export default function FrameworkNodeFormDialog({ initial, frameworkId, nodes, nodeTypes, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(initial);
  useEffect(() => { setForm(initial); }, [initial]);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const parentOptions = useMemo(() => {
    const blocked = new Set();
    if (initial.id) {
      blocked.add(initial.id);
      const byParent = {};
      nodes.forEach((n) => { (byParent[n.parent_id] ||= []).push(n); });
      const stack = [initial.id];
      while (stack.length) {
        const cur = stack.pop();
        (byParent[cur] || []).forEach((c) => { if (!blocked.has(c.id)) { blocked.add(c.id); stack.push(c.id); } });
      }
    }
    return nodes.filter((n) => !blocked.has(n.id)).sort((a, b) => String(a.node_code || "").localeCompare(String(b.node_code || "")));
  }, [initial, nodes]);

  const save = async () => {
    if (!form.node_title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = { ...form, framework_id: frameworkId, sort_order: Number(form.sort_order) || 0, level_no: Number(form.level_no) || 2 };
      const nt = nodeTypes.find((t) => t.node_type_name === form.node_type_name);
      if (nt) payload.legacy_node_type_id = nt.legacy_node_type_id;
      if (form.id) await base44.entities.FrameworkNode.update(form.id, payload);
      else await base44.entities.FrameworkNode.create(payload);
      toast({ title: form.id ? "Node updated" : "Node added" });
      onSaved?.();
      onClose();
    } catch (e) {
      toast({ title: "Save failed", description: e?.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{form.id ? "Edit node" : "Add node"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Parent</Label>
            <Select value={form.parent_id || "root"} onValueChange={(v) => set("parent_id", v === "root" ? null : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root (top level)</SelectItem>
                {parentOptions.map((n) => (
                  <SelectItem key={n.id} value={n.id}>{(n.node_code ? n.node_code + " — " : "") + (n.node_title || "")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Node type</Label>
            {nodeTypes.length ? (
              <Select value={form.node_type_name || ""} onValueChange={(v) => set("node_type_name", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {nodeTypes.map((t) => <SelectItem key={t.id} value={t.node_type_name}>{t.node_type_name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : <Input value={form.node_type_name || ""} onChange={(e) => set("node_type_name", e.target.value)} placeholder="e.g. Clause" />}
          </div>
          <div className="space-y-1.5">
            <Label>Node code</Label>
            <Input value={form.node_code || ""} onChange={(e) => set("node_code", e.target.value)} placeholder="e.g. 5.1, A.5.9.a" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Title *</Label>
            <Input value={form.node_title || ""} onChange={(e) => set("node_title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>External ref</Label>
            <Input value={form.external_ref || ""} onChange={(e) => set("external_ref", e.target.value)} placeholder="e.g. Art. 5(1)" />
          </div>
          <div className="space-y-1.5">
            <Label>Sort order</Label>
            <Input type="number" value={form.sort_order ?? 0} onChange={(e) => set("sort_order", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Text / requirement body</Label>
            <Textarea rows={3} value={form.node_text || ""} onChange={(e) => set("node_text", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Guidance text</Label>
            <Textarea rows={2} value={form.guidance_text || ""} onChange={(e) => set("guidance_text", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Key aspects</Label>
            <Textarea rows={2} value={form.key_aspects || ""} onChange={(e) => set("key_aspects", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Reference URL</Label>
            <Input value={form.reference_url || ""} onChange={(e) => set("reference_url", e.target.value)} />
          </div>
          <div className="flex items-center gap-6 sm:col-span-2 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={!!form.is_mandatory} onCheckedChange={(v) => set("is_mandatory", v)} /> Mandatory
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={!!form.is_leaf} onCheckedChange={(v) => set("is_leaf", v)} /> Leaf node
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}><Plus className="w-4 h-4 mr-1" />{form.id ? "Save changes" : "Add node"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
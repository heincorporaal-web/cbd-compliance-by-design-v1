import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const EMPTY_FORM = {
  node_code: "", name: "", description: "", level: 1, parent_id: "",
  process_owner: "", criticality: "medium", status: "active",
  documentation_url: "", notes: "",
};

const levelLabels = {
  1: "Process Group", 2: "Process", 3: "Sub-Process",
  4: "Procedure", 5: "Task", 6: "Activity/Keystroke",
};

export default function IHPOMNodeDialog({ open, onOpenChange, editNode, allNodes, onSaved }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    if (editNode) setForm({ ...EMPTY_FORM, ...editNode });
    else setForm(EMPTY_FORM);
  }, [open, editNode]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = { ...form };
      if (!data.parent_id) delete data.parent_id;
      return editNode
        ? base44.entities.IHPOMNode.update(editNode.id, data)
        : base44.entities.IHPOMNode.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries(["ihpomNodes"]);
      toast.success(editNode ? "Node updated" : "Node created");
      onSaved?.();
      onOpenChange(false);
    },
    onError: e => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.node_code || !form.name) { toast.error("Node code and name are required"); return; }
    saveMutation.mutate();
  };

  const potentialParents = allNodes.filter(n =>
    n.level < form.level && (!editNode || n.id !== editNode.id)
  );

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onOpenChange(false); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editNode ? "Edit iHPOM Node" : "New iHPOM Node"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Node Code *</Label>
              <Input value={form.node_code} onChange={e => set("node_code", e.target.value)} placeholder="e.g. N1.2.1" />
            </div>
            <div className="space-y-1.5">
              <Label>Level *</Label>
              <Select value={form.level.toString()} onValueChange={v => { set("level", parseInt(v)); set("parent_id", ""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(levelLabels).map(([lvl, label]) => (
                    <SelectItem key={lvl} value={lvl}>L{lvl}: {label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Invoice Processing" />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} placeholder="Brief description…" />
          </div>

          {form.level > 1 && potentialParents.length > 0 && (
            <div className="space-y-1.5">
              <Label>Parent Node</Label>
              <Select value={form.parent_id || "none"} onValueChange={v => set("parent_id", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level)</SelectItem>
                  {potentialParents.map(n => (
                    <SelectItem key={n.id} value={n.id}>L{n.level}: {n.node_code} — {n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Process Owner</Label>
              <Input value={form.process_owner} onChange={e => set("process_owner", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Criticality</Label>
              <Select value={form.criticality} onValueChange={v => set("criticality", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="na">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Documentation URL</Label>
              <Input value={form.documentation_url} onChange={e => set("documentation_url", e.target.value)} placeholder="https://…" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saveMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
            {saveMutation.isPending ? "Saving…" : editNode ? "Save Changes" : "Create Node"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function CIRelationshipDialog({ open, onOpenChange, ci, companyId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [parentSearch, setParentSearch] = useState("");
  const [childSearch, setChildSearch] = useState("");
  const [form, setForm] = useState({ parent_ci_id: "", child_ci_id: "", relationship_type: "", effective_date: "", notes: "", manually_confirmed: true });

  const { data: relTypes = [] } = useQuery({ queryKey: ["relTypes", "ci_to_ci"], queryFn: () => base44.entities.RelationshipType.filter({ category: "ci_to_ci" }) });
  const { data: allCIs = [] } = useQuery({ queryKey: ["configurationItems", companyId], queryFn: () => base44.entities.ConfigurationItem.filter({ company_id: companyId }), enabled: !!companyId });

  useEffect(() => { if (open) setForm({ parent_ci_id: ci?.id || "", child_ci_id: "", relationship_type: "", effective_date: "", notes: "", manually_confirmed: true }); }, [open, ci]);

  const parentResults = parentSearch.trim()
    ? allCIs.filter(c => (c.ci_name || c.ci_id || "").toLowerCase().includes(parentSearch.toLowerCase()) && c.id !== form.child_ci_id).slice(0, 8)
    : [];
  const childResults = childSearch.trim()
    ? allCIs.filter(c => (c.ci_name || c.ci_id || "").toLowerCase().includes(childSearch.toLowerCase()) && c.id !== form.parent_ci_id).slice(0, 8)
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.parent_ci_id || !form.child_ci_id || !form.relationship_type) { toast.error("Parent CI, Child CI and Relationship Type are required"); return; }
    if (form.parent_ci_id === form.child_ci_id) { toast.error("Parent and Child cannot be the same CI"); return; }
    try {
      await base44.entities.CIRelationship.create({
        ...form,
        company_id: companyId,
        manually_confirmed: true,
        automatically_discovered: false,
      });
      await base44.entities.CIAuditHistory.create({
        configuration_item_id: ci?.id, action: "other", object_type: "CIRelationship",
        object_id: form.parent_ci_id, source: "manual", user: user?.full_name || user?.email || "unknown",
        timestamp: new Date().toISOString(), company_id: companyId,
        reason: `CI relationship created: ${form.relationship_type}`,
      });
      toast.success("Relationship created");
      queryClient.invalidateQueries(["ciRelationships"]);
      queryClient.invalidateQueries(["ciAuditHistory"]);
      onOpenChange(false);
    } catch (err) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add CI-to-CI Relationship</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Parent CI *</Label>
            <Input placeholder="Search by name or CI ID…" value={parentSearch} onChange={e => setParentSearch(e.target.value)} />
            {parentResults.length > 0 && (
              <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto divide-y">
                {parentResults.map(c => (
                  <button type="button" key={c.id} onClick={() => { setForm(f => ({ ...f, parent_ci_id: c.id })); setParentSearch(`${c.ci_id || ""} ${c.ci_name}`); }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm">
                    <span className="font-mono text-xs text-slate-500">{c.ci_id}</span> {c.ci_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label>Child CI *</Label>
            <Input placeholder="Search by name or CI ID…" value={childSearch} onChange={e => setChildSearch(e.target.value)} />
            {childResults.length > 0 && (
              <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto divide-y">
                {childResults.map(c => (
                  <button type="button" key={c.id} onClick={() => { setForm(f => ({ ...f, child_ci_id: c.id })); setChildSearch(`${c.ci_id || ""} ${c.ci_name}`); }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm">
                    <span className="font-mono text-xs text-slate-500">{c.ci_id}</span> {c.ci_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label>Relationship Type *</Label>
            <Select value={form.relationship_type} onValueChange={v => setForm(f => ({ ...f, relationship_type: v }))}>
              <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
              <SelectContent>{relTypes.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Effective Date</Label>
            <Input type="date" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Create Relationship</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CATEGORY_OPTIONS = [
  { value: "information_security", label: "Information Security" },
  { value: "privacy", label: "Privacy" },
  { value: "compliance", label: "Compliance" },
  { value: "operational_risk", label: "Operational Risk" },
  { value: "financial", label: "Financial" },
  { value: "other", label: "Other" },
];
const STATUS_OPTIONS = ["draft", "pending_review", "returned", "approved", "active", "archived"];

export default function FrameworkMetadataEditor({ framework, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: framework.name || "",
    version: framework.version || "",
    description: framework.description || "",
    category: framework.category || "other",
    framework_code: framework.framework_code || "",
    framework_family: framework.framework_family || "",
    issuing_body: framework.issuing_body || "",
    status: framework.status || "draft",
    sort_order: framework.sort_order ?? "",
    end_date: framework.end_date || "",
    tags: framework.tags || [],
  });
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const addTag = () => {
    const parts = newTag.split(";").map((t) => t.trim()).filter(Boolean);
    const merged = [...form.tags];
    parts.forEach((p) => { if (!merged.includes(p)) merged.push(p); });
    set("tags", merged);
    setNewTag("");
  };
  const removeTag = (t) => set("tags", form.tags.filter((x) => x !== t));

  const save = async () => {
    if (!form.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = { ...form, sort_order: form.sort_order === "" ? undefined : Number(form.sort_order) };
      if (payload.end_date) payload.status = "archived";
      await base44.entities.Framework.update(framework.id, payload);
      toast({ title: "Framework updated" });
      onSaved?.();
    } catch (e) {
      toast({ title: "Update failed", description: e?.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Framework Name *</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Version</Label>
          <Input value={form.version} onChange={(e) => set("version", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Framework code</Label>
          <Input value={form.framework_code} onChange={(e) => set("framework_code", e.target.value)} placeholder="e.g. ISO27001, DORA" />
        </div>
        <div className="space-y-1.5">
          <Label>Framework family</Label>
          <Input value={form.framework_family} onChange={(e) => set("framework_family", e.target.value)} placeholder="e.g. GRC/Audit Management" />
        </div>
        <div className="space-y-1.5">
          <Label>Issuing body</Label>
          <Input value={form.issuing_body} onChange={(e) => set("issuing_body", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Sort order</Label>
          <Input type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>End date</Label>
          <Input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
          <p className="text-xs text-slate-400">Setting an end date archives this framework on save.</p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Description</Label>
          <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {form.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:bg-blue-200 rounded-full p-0.5"><Trash2 className="w-3 h-3" /></button>
            </span>
          ))}
          {form.tags.length === 0 && <p className="text-sm text-slate-400">No tags</p>}
        </div>
        <div className="flex gap-2">
          <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add tag (or several separated by ;)" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
          <Button type="button" variant="outline" onClick={addTag}><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t">
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" />{saving ? "Saving…" : "Save changes"}</Button>
      </div>
    </div>
  );
}
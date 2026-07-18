import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, PlusCircle, X } from "lucide-react";
import { ADMIN_PLAYBOOK_CATEGORIES } from "@/lib/adminPlaybooks";

const empty = (category) => ({
  playbook_key: "",
  title: "",
  category: category || "General",
  summary: "",
  content: "",
  format_spec: "",
  steps: [],
  sort_order: 100,
  is_active: true,
});

export default function AdminPlaybookEditor({ open, onClose, onSave, onDelete, initial, lockCategory }) {
  const [draft, setDraft] = useState(empty(lockCategory));
  const isNew = !initial?.id && !initial?.playbook_key;
  const isCuratedOverride = !initial?.id && !!initial?.playbook_key;

  useEffect(() => {
    if (open) {
      setDraft({
        ...empty(lockCategory),
        ...(initial || {}),
        steps: Array.isArray(initial?.steps) ? initial.steps.map((s) => ({ ...s })) : [],
      });
    }
  }, [open, initial, lockCategory]);

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const setStep = (i, k, v) =>
    setDraft((d) => {
      const steps = d.steps.map((s) => ({ ...s }));
      steps[i] = { ...steps[i], [k]: v };
      return { ...d, steps };
    });
  const addStep = () =>
    setDraft((d) => ({
      ...d,
      steps: [...d.steps, { id: `s${Date.now()}`, title: "", detail: "" }],
    }));
  const removeStep = (i) =>
    setDraft((d) => ({ ...d, steps: d.steps.filter((_, idx) => idx !== i) }));

  const canSave = draft.title?.trim() && draft.category;

  const submit = () => {
    if (!canSave) return;
    onSave({
      ...draft,
      steps: draft.steps.filter((s) => s.title?.trim() || s.detail?.trim()),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew && !isCuratedOverride && "New playbook"}
            {isCuratedOverride && "Edit curated playbook (override)"}
            {initial?.id && "Edit playbook"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={draft.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="Playbook title" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={draft.category || "General"}
                disabled={!!lockCategory}
                onChange={(e) => set("category", e.target.value)}
              >
                {ADMIN_PLAYBOOK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Summary</Label>
            <Input value={draft.summary || ""} onChange={(e) => set("summary", e.target.value)} placeholder="One-line summary" />
          </div>

          <div className="space-y-1.5">
            <Label>Format / specification</Label>
            <Input value={draft.format_spec || ""} onChange={(e) => set("format_spec", e.target.value)} placeholder="e.g. 32×32 px • SVG 1.1 • two-tone" />
          </div>

          <div className="space-y-1.5">
            <Label>Content (Markdown)</Label>
            <Textarea
              rows={8}
              value={draft.content || ""}
              onChange={(e) => set("content", e.target.value)}
              placeholder="Markdown body — headings, bullets, code"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Steps</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                <PlusCircle className="w-4 h-4 mr-1" /> Add step
              </Button>
            </div>
            {draft.steps.map((s, i) => (
              <div key={s.id || i} className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 w-6">{i + 1}.</span>
                  <Input
                    value={s.title || ""}
                    onChange={(e) => setStep(i, "title", e.target.value)}
                    placeholder="Step title"
                    className="h-8"
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeStep(i)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  value={s.detail || ""}
                  onChange={(e) => setStep(i, "detail", e.target.value)}
                  placeholder="Step detail / guidance"
                  className="bg-white"
                />
              </div>
            ))}
            {draft.steps.length === 0 && (
              <p className="text-xs text-slate-400 italic">No steps yet — add optional ordered steps.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input type="number" value={draft.sort_order ?? 100} onChange={(e) => set("sort_order", Number(e.target.value))} />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.is_active !== false} onChange={(e) => set("is_active", e.target.checked)} />
                Active (visible)
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {initial?.id && (
            <Button variant="destructive" onClick={() => onDelete(initial)} className="mr-auto">
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!canSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
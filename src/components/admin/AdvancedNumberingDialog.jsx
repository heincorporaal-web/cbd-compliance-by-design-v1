import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowUp, ArrowDown, Eye } from "lucide-react";
import { SEGMENT_TYPES, TRAILING_CHARS, buildSegmentsPrefix, buildRefNumber } from "@/lib/autoNumbering";

const TRAILING_SELECT = [
  { value: "none", label: "No trailing char" },
  { value: "-",    label: "-  (Hyphen)" },
  { value: ".",    label: ".  (Period)" },
  { value: ",",    label: ",  (Comma)" },
  { value: "/",    label: "/  (Slash)" },
  { value: ":",    label: ":  (Colon)" },
];

function newSegment(type = "static_text", value = "") {
  return {
    id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    value,
    trailing_char: "-",
  };
}

export default function AdvancedNumberingDialog({ open, onClose, entityKey, entityLabel, cfg, onChange }) {
  const [segments, setSegments] = useState([]);
  const [zeroPad, setZeroPad] = useState(4);

  useEffect(() => {
    if (open) {
      let initial = Array.isArray(cfg.segments) ? segmentsClone(cfg.segments) : [];
      if (initial.length === 0 && entityKey === "risk") {
        initial = [newSegment("static_text", "R")];
      }
      setSegments(initial);
      setZeroPad(cfg.zero_pad ?? 4);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function segmentsClone(segs) {
    return segs.map(s => ({ ...s, id: s.id || `seg_${Math.random().toString(36).slice(2, 7)}` }));
  }

  const update = (id, patch) =>
    setSegments(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));

  const remove = (id) => setSegments(prev => prev.filter(s => s.id !== id));

  const move = (idx, dir) => {
    setSegments(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const addSegment = () => setSegments(prev => [...prev, newSegment("static_text", "")]);

  const previewCfg = { ...cfg, segments, zero_pad: zeroPad };
  const preview = buildRefNumber(previewCfg, 1) || "—";

  const save = () => {
    onChange({ segments, zero_pad: zeroPad });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Numbering — {entityLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Build a custom reference format from segments. The auto-incrementing sequence number is always appended at the end.
            {entityKey === "risk" && " Risk references must start with an “R”."}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Sequence digits</Label>
              <Select value={String(zeroPad)} onValueChange={v => setZeroPad(Number(v))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} digits</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Preview</Label>
              <div className="h-8 flex items-center gap-1.5 px-3 rounded-md border border-slate-200 bg-slate-50">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-mono text-primary">{preview}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Segments</Label>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={addSegment}>
                <Plus className="w-3.5 h-3.5" /> Add Segment
              </Button>
            </div>

            {segments.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-4 text-center border border-dashed rounded-lg">
                No segments yet. The sequence number will be used on its own.
              </div>
            ) : (
              <div className="space-y-2">
                {segments.map((seg, idx) => (
                  <div key={seg.id} className="flex items-start gap-2 p-2 border border-slate-200 rounded-lg bg-slate-50/60">
                    <div className="flex flex-col gap-0.5 pt-1">
                      <button type="button" className="text-slate-400 hover:text-primary disabled:opacity-30" onClick={() => move(idx, -1)} disabled={idx === 0}>
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" className="text-slate-400 hover:text-primary disabled:opacity-30" onClick={() => move(idx, 1)} disabled={idx === segments.length - 1}>
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-slate-400">Type</Label>
                        <Select value={seg.type} onValueChange={v => update(seg.id, { type: v, value: v === "static_text" ? (seg.value || "") : "" })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SEGMENT_TYPES.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-slate-400">
                          {seg.type === "static_text" ? "Value" : "Value"}
                        </Label>
                        {seg.type === "static_text" ? (
                          <Input
                            className="h-8 text-xs"
                            value={seg.value || ""}
                            onChange={e => update(seg.id, { value: e.target.value })}
                            placeholder="e.g. R"
                          />
                        ) : (
                          <div className="h-8 flex items-center px-2 text-xs text-slate-400 italic border border-transparent">
                            {SEGMENT_TYPES.find(t => t.value === seg.type)?.label || ""}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-slate-400">Trailing</Label>
                        <Select value={seg.trailing_char || "none"} onValueChange={v => update(seg.id, { trailing_char: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TRAILING_SELECT.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 mt-5" onClick={() => remove(seg.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Format: </span>
            <span className="font-mono text-primary">
              {segments.length > 0
                ? `${segments.map(s => {
                    const v = s.type === "static_text" ? (s.value || "□") : `[${SEGMENT_TYPES.find(t => t.value === s.type)?.label || s.type}]`;
                    const tc = s.trailing_char && s.trailing_char !== "none" ? s.trailing_char : "";
                    return `${v}${tc}`;
                  }).join("")}${"0".repeat(zeroPad)}`
                : `${"0".repeat(zeroPad)}`}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={save}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
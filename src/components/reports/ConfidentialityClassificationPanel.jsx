/**
 * ConfidentialityClassificationPanel
 * Manages company-defined confidentiality levels and their default.
 * Used inside CompanyBranding.
 */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Lock, GripVertical, Star } from "lucide-react";

const DEFAULT_COLORS = ["#dc2626", "#d97706", "#ca8a04", "#16a34a", "#2563eb", "#7c3aed", "#0f172a"];

const PRESET_LEVELS = [
  { label: "Public", color: "#16a34a" },
  { label: "Internal", color: "#2563eb" },
  { label: "Confidential", color: "#d97706" },
  { label: "Highly Confidential", color: "#dc2626" },
  { label: "Crown Jewels", color: "#7c3aed" },
];

export default function ConfidentialityClassificationPanel({ levels = [], defaultClassification = "", onChange, onDefaultChange }) {
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#dc2626");

  const addLevel = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    const existing = levels.find(l => l.label.toLowerCase() === trimmed.toLowerCase());
    if (existing) return;
    const updated = [...levels, { id: crypto.randomUUID(), label: trimmed, color: newColor, sort_order: levels.length }];
    onChange(updated);
    setNewLabel("");
  };

  const removeLevel = (id) => {
    const updated = levels.filter(l => l.id !== id);
    onChange(updated);
    if (defaultClassification === levels.find(l => l.id === id)?.label) {
      onDefaultChange("");
    }
  };

  const addPreset = (preset) => {
    if (levels.find(l => l.label === preset.label)) return;
    const updated = [...levels, { id: crypto.randomUUID(), label: preset.label, color: preset.color, sort_order: levels.length }];
    onChange(updated);
  };

  const setDefault = (label) => {
    onDefaultChange(defaultClassification === label ? "" : label);
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="w-4 h-4 text-violet-500" /> Confidentiality Classifications
        </CardTitle>
        <p className="text-xs text-slate-400">Define the classification levels used on reports for this company. Mark one as the default.</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Presets */}
        <div>
          <Label className="text-xs text-slate-500 mb-2 block">Quick Add from Presets</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_LEVELS.map(p => {
              const exists = levels.find(l => l.label === p.label);
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => addPreset(p)}
                  disabled={!!exists}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors
                    ${exists ? "opacity-40 cursor-not-allowed border-slate-200 text-slate-400" : "border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-600 cursor-pointer"}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current levels */}
        {levels.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-slate-500 block">Defined Levels</Label>
            {levels.map(level => (
              <div key={level.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                <span className="w-4 h-4 rounded-full shrink-0 border border-white shadow-sm" style={{ backgroundColor: level.color }} />
                <span className="flex-1 text-sm font-medium text-slate-700">{level.label}</span>
                {defaultClassification === level.label && (
                  <Badge className="bg-violet-100 text-violet-700 text-xs shrink-0">Default</Badge>
                )}
                <button
                  type="button"
                  onClick={() => setDefault(level.label)}
                  title={defaultClassification === level.label ? "Remove as default" : "Set as default"}
                  className={`p-1 rounded transition-colors ${defaultClassification === level.label ? "text-amber-500" : "text-slate-300 hover:text-amber-400"}`}
                >
                  <Star className="w-4 h-4" fill={defaultClassification === level.label ? "currentColor" : "none"} />
                </button>
                <button
                  type="button"
                  onClick={() => removeLevel(level.id)}
                  className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {levels.length === 0 && (
          <p className="text-sm text-slate-400 italic">No classification levels defined yet. Add one below or use a preset.</p>
        )}

        {/* Add custom */}
        <div className="border-t border-slate-100 pt-4">
          <Label className="text-xs text-slate-500 mb-2 block">Add Custom Level</Label>
          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer overflow-hidden" style={{ backgroundColor: newColor }}>
                <input
                  type="color"
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            </div>
            <Input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="e.g. Restricted, Top Secret…"
              className="flex-1 h-9"
              onKeyDown={e => e.key === "Enter" && addLevel()}
            />
            <Button type="button" size="sm" onClick={addLevel} disabled={!newLabel.trim()} className="gap-1 shrink-0">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {DEFAULT_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${newColor === c ? "border-slate-700 scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
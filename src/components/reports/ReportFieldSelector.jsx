import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ReportFieldSelector({ fields, selected, onChange }) {
  const toggleField = (key) => {
    onChange(
      selected.includes(key)
        ? selected.filter(k => k !== key)
        : [...selected, key]
    );
  };

  const selectAll = () => onChange(fields.map(f => f.key));
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Select columns to include</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll}>Select All</Button>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearAll}>Clear</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
        {fields.map(f => (
          <div key={f.key} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 border border-slate-100">
            <Checkbox
              id={`field-${f.key}`}
              checked={selected.includes(f.key)}
              onCheckedChange={() => toggleField(f.key)}
            />
            <Label htmlFor={`field-${f.key}`} className="text-sm cursor-pointer flex-1">{f.label}</Label>
            {f.required && <Badge variant="secondary" className="text-xs px-1 py-0">req</Badge>}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">{selected.length} of {fields.length} columns selected</p>
    </div>
  );
}
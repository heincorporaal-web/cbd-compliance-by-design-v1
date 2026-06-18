/**
 * ConfidentialitySelector
 * Used inside DataListReportPage before an export is triggered.
 * Shows a dropdown of company classification levels + a warning if none is chosen.
 */
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Lock } from "lucide-react";

export default function ConfidentialitySelector({ levels = [], value, onChange, showWarning = false }) {
  if (levels.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5 text-slate-500" /> Confidentiality Classification
      </Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className={`w-full ${showWarning && !value ? "border-amber-400 ring-1 ring-amber-300" : ""}`}>
          <SelectValue placeholder="Select classification…" />
        </SelectTrigger>
        <SelectContent>
          {levels.map(l => (
            <SelectItem key={l.id} value={l.label}>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showWarning && !value && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Please select a confidentiality classification before exporting.
        </p>
      )}
    </div>
  );
}
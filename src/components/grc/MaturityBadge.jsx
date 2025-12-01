import React from "react";
import { Badge } from "@/components/ui/badge";

const maturityLevels = {
  1: { label: "Initial", color: "bg-red-100 text-red-700 border-red-200", description: "Ad hoc, unpredictable" },
  2: { label: "Developing", color: "bg-orange-100 text-orange-700 border-orange-200", description: "Repeatable but informal" },
  3: { label: "Defined", color: "bg-yellow-100 text-yellow-700 border-yellow-200", description: "Documented processes" },
  4: { label: "Managed", color: "bg-blue-100 text-blue-700 border-blue-200", description: "Measured and controlled" },
  5: { label: "Optimized", color: "bg-green-100 text-green-700 border-green-200", description: "Continuous improvement" }
};

export default function MaturityBadge({ level, showLabel = true, showDescription = false }) {
  if (!level) return <span className="text-xs text-slate-400">Not assessed</span>;
  
  const maturity = maturityLevels[level];
  if (!maturity) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`${maturity.color} border font-semibold`}>
        {level} {showLabel && `- ${maturity.label}`}
      </Badge>
      {showDescription && (
        <span className="text-xs text-slate-500">{maturity.description}</span>
      )}
    </div>
  );
}
import React from "react";
import { cn } from "@/lib/utils";

const levels = [
  { value: 1, label: "Initial", color: "bg-red-500" },
  { value: 2, label: "Developing", color: "bg-orange-500" },
  { value: 3, label: "Defined", color: "bg-yellow-500" },
  { value: 4, label: "Managed", color: "bg-blue-500" },
  { value: 5, label: "Optimized", color: "bg-green-500" }
];

export default function MaturityScale({ value, onChange, disabled = false }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {levels.map((level) => (
          <button
            key={level.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(level.value)}
            className={cn(
              "flex-1 h-10 rounded-lg border-2 transition-all font-medium text-sm",
              value === level.value
                ? `${level.color} text-white border-transparent`
                : "bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {level.value}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        {levels.map((level) => (
          <span key={level.value} className={cn("flex-1 text-center", value === level.value && "font-semibold text-slate-700")}>
            {level.label}
          </span>
        ))}
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { ChevronDown, ChevronRight, Power } from "lucide-react";
import { Switch } from "@/components/ui/switch";

/**
 * Compact, collapsible add-on toggle strip. Collapsed by default so it stays
 * out of the way of the working area; expands on click to reveal the full
 * enable/disable control and description.
 */
export default function ModuleToggleStrip({
  brand,
  moduleName,
  moduleEnabled,
  onToggle,
  enabledLabel,
  disabledLabel,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-lg border ${brand.border} ${brand.softBg} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white/40 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        )}
        <Power className={`w-3.5 h-3.5 shrink-0 ${moduleEnabled ? brand.softText : "text-slate-400"}`} />
        <span className="text-xs font-semibold text-slate-700 truncate">{moduleName} add-on</span>
        <span className="text-slate-300">·</span>
        <span className={`text-xs font-medium ${moduleEnabled ? brand.softText : "text-slate-400"}`}>
          {moduleEnabled ? "Enabled" : "Disabled"}
        </span>
        <span className="ml-auto text-[11px] text-slate-400 hidden sm:inline">
          {open ? "Hide" : "Manage"}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 flex items-start justify-between gap-4 bg-white/60">
          <p className="text-xs text-slate-500 leading-relaxed">
            {moduleEnabled ? enabledLabel : disabledLabel}
          </p>
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <span className={`text-xs font-medium ${moduleEnabled ? brand.softText : "text-slate-400"}`}>
              {moduleEnabled ? "Enabled" : "Disabled"}
            </span>
            <Switch checked={moduleEnabled} onCheckedChange={onToggle} />
          </div>
        </div>
      )}
    </div>
  );
}
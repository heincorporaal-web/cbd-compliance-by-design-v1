import React, { useState } from "react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function CollapsibleSection({ icon: Icon, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border border-slate-200 rounded-lg mb-3">
      <CollapsibleTrigger asChild>
        <button type="button" className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-slate-50 rounded-t-lg transition-colors">
          {Icon && <Icon className="w-4 h-4 text-slate-500 shrink-0" />}
          <h4 className="text-sm font-semibold text-slate-700 flex-1">{title}</h4>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 pt-1 border-t border-slate-100">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
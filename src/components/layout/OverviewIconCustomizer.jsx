import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { NAV_ICON_POOL, resolveIcon, nameForDefaultIcon } from "@/lib/navIconStore";

export default function OverviewIconCustomizer({
  open,
  onClose,
  groups,
  customIcons,
  onSetIcon,
  onResetIcon,
}) {
  const [openItemId, setOpenItemId] = useState(null);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Menu Icons</DialogTitle>
          <DialogDescription>
            Expand a menu item, then pick an icon. Each item gets a unique icon,
            applied app-wide for everyone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 mt-2">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="px-2 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = resolveIcon(customIcons, item.id, item.icon);
                const isCustom = !!customIcons?.[item.id];
                const expanded = openItemId === item.id;
                const activeName =
                  customIcons?.[item.id] || nameForDefaultIcon(item.icon);

                return (
                  <div key={item.id} className="rounded-lg">
                    <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg">
                      <button
                        onClick={() => setOpenItemId(expanded ? null : item.id)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-sm text-slate-700"
                      >
                        {expanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="truncate">{item.title}</span>
                        {isCustom && (
                          <span className="ml-1 text-[10px] uppercase tracking-wide text-primary">
                            custom
                          </span>
                        )}
                      </button>
                      {isCustom && (
                        <button
                          onClick={() => onResetIcon(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600"
                          title="Reset to default icon"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {expanded && (
                      <div className="grid grid-cols-10 gap-1.5 px-2 pb-2 pt-1">
                        {NAV_ICON_POOL.map(({ name, Icon: Opt }) => {
                          const active = activeName === name;
                          return (
                            <button
                              key={name}
                              title={name}
                              onClick={() => onSetIcon(item.id, name)}
                              className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${
                                active
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <Opt className="w-3.5 h-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
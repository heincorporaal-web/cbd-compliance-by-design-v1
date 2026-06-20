import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Settings2, Pencil } from "lucide-react";

/**
 * Icon shown next to custom (non-seeded) option values.
 * Import and use this on list pages to indicate a custom category.
 */
export function CustomOptionIcon({ className = "" }) {
  return (
    <Pencil
      className={`inline-block w-3 h-3 text-violet-500 ${className}`}
      title="Custom option"
    />
  );
}

/**
 * A select dropdown that allows users to add/remove custom options on the fly.
 * Seeded options are protected (cannot be deleted).
 * Custom options are persisted in the CustomOptionList entity (database).
 *
 * Props:
 *  - storageKey: string — unique key to identify the option list in the DB
 *  - seededOptions: [{ value, label }] — built-in options, not deletable
 *  - value: string
 *  - onValueChange: fn(value)
 *  - placeholder: string
 */
export default function EditableOptionSelect({ storageKey, seededOptions = [], value, onValueChange, placeholder = "Select..." }) {
  const [customOptions, setCustomOptions] = useState([]);
  const [recordId, setRecordId] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const records = await base44.entities.CustomOptionList.filter({ storage_key: storageKey });
      if (records?.[0]) {
        setCustomOptions(records[0].options || []);
        setRecordId(records[0].id);
      }
    } catch {}
    setLoading(false);
  }, [storageKey]);

  useEffect(() => { load(); }, [load]);

  // Also listen for updates dispatched by the hook (cross-component sync)
  useEffect(() => {
    const onUpdate = (e) => {
      if (e.detail?.storageKey === storageKey) setCustomOptions(e.detail.options);
    };
    window.addEventListener("customOptionsUpdated", onUpdate);
    return () => window.removeEventListener("customOptionsUpdated", onUpdate);
  }, [storageKey]);

  const persist = async (opts) => {
    setCustomOptions(opts);
    // Notify other components on the same page
    window.dispatchEvent(new CustomEvent("customOptionsUpdated", { detail: { storageKey, options: opts } }));
    try {
      if (recordId) {
        await base44.entities.CustomOptionList.update(recordId, { options: opts });
      } else {
        const created = await base44.entities.CustomOptionList.create({ storage_key: storageKey, options: opts });
        setRecordId(created.id);
      }
    } catch {}
  };

  const addOption = async () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    const val = trimmed.toLowerCase().replace(/\s+/g, "_");
    const all = [...seededOptions, ...customOptions];
    if (all.some(o => o.value === val)) return;
    await persist([...customOptions, { value: val, label: trimmed }]);
    setNewLabel("");
  };

  const removeOption = async (val) => {
    const updated = customOptions.filter(o => o.value !== val);
    await persist(updated);
    if (value === val) onValueChange("");
  };

  const isCustom = (val) => customOptions.some(o => o.value === val);
  const allOptions = [...seededOptions, ...customOptions];

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allOptions.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              <span className="flex items-center gap-1.5">
                {opt.label}
                {isCustom(opt.value) && <CustomOptionIcon />}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="icon" title="Manage options">
            <Settings2 className="w-4 h-4 text-slate-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4 space-y-4" align="end">
          <p className="text-sm font-semibold text-slate-800">Manage Options</p>

          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Built-in (locked)</p>
            {seededOptions.map(opt => (
              <div key={opt.value} className="flex items-center justify-between px-2 py-1 rounded bg-slate-50 text-sm text-slate-600">
                <span>{opt.label}</span>
                <span className="text-xs text-slate-400 italic">locked</span>
              </div>
            ))}
          </div>

          {customOptions.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Custom</p>
              {customOptions.map(opt => (
                <div key={opt.value} className="flex items-center justify-between px-2 py-1 rounded bg-violet-50 text-sm text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <CustomOptionIcon />
                    {opt.label}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-400 hover:text-red-600"
                    onClick={() => removeOption(opt.value)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <p className="text-xs text-slate-400">Loading...</p>
          ) : (
            <div className="flex gap-2 pt-1 border-t border-slate-100">
              <Input
                placeholder="New option label..."
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                className="text-sm h-8"
              />
              <Button type="button" size="sm" onClick={addOption} className="h-8 px-2">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
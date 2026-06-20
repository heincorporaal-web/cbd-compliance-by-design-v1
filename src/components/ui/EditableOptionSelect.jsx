import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Settings2 } from "lucide-react";

/**
 * A select dropdown that allows users to add/remove custom options on the fly.
 * Seeded options are protected (cannot be deleted).
 *
 * Props:
 *  - storageKey: string — unique key to persist custom options in localStorage
 *  - seededOptions: [{ value, label }] — built-in options, not deletable
 *  - value: string
 *  - onValueChange: fn(value)
 *  - placeholder: string
 */
export default function EditableOptionSelect({ storageKey, seededOptions = [], value, onValueChange, placeholder = "Select..." }) {
  const [customOptions, setCustomOptions] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setCustomOptions(JSON.parse(stored));
    } catch {}
  }, [storageKey]);

  const persist = (opts) => {
    setCustomOptions(opts);
    try { localStorage.setItem(storageKey, JSON.stringify(opts)); } catch {}
  };

  const addOption = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    const val = trimmed.toLowerCase().replace(/\s+/g, "_");
    const all = [...seededOptions, ...customOptions];
    if (all.some(o => o.value === val)) return;
    persist([...customOptions, { value: val, label: trimmed }]);
    setNewLabel("");
  };

  const removeOption = (val) => {
    const updated = customOptions.filter(o => o.value !== val);
    persist(updated);
    if (value === val) onValueChange("");
  };

  const allOptions = [...seededOptions, ...customOptions];

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allOptions.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
                <div key={opt.value} className="flex items-center justify-between px-2 py-1 rounded bg-blue-50 text-sm text-slate-700">
                  <span>{opt.label}</span>
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
        </PopoverContent>
      </Popover>
    </div>
  );
}
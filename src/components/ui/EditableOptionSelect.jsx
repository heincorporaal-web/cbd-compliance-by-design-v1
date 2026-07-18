import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Settings2, Pencil } from "lucide-react";
import { loadFromDB, writeToDB, subscribe } from "@/lib/customOptionsStore";

export function CustomOptionIcon({ className = "" }) {
  return (
    <Pencil
      className={`inline-block w-3 h-3 text-violet-500 ${className}`}
      title="Custom option"
    />
  );
}

export default function EditableOptionSelect({
  storageKey,
  seededOptions = [],
  value,
  onValueChange,
  placeholder = "Select...",
}) {
  const [options, setOptions] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadFromDB(storageKey);
      if (!cancelled) setOptions(loaded);
    })();
    const unsub = subscribe(storageKey, setOptions);
    return () => { cancelled = true; unsub(); };
  }, [storageKey]);

  const persist = async (opts) => {
    setSaving(true);
    await writeToDB(storageKey, opts);
    setSaving(false);
  };

  const isCustom = (val) => options.some(o => o.value === val);

  const allOptions = [...seededOptions, ...options];

  const addOption = async () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    const val = trimmed.toLowerCase().replace(/\s+/g, "_");
    if (allOptions.some(o => o.value === val)) return;
    await persist([...options, { value: val, label: trimmed }]);
    setNewLabel("");
  };

  const removeOption = async (val) => {
    await persist(options.filter(o => o.value !== val));
    if (value === val) onValueChange("");
  };

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
        <PopoverContent className="w-80 p-4 space-y-4" align="end">
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

          {options.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Custom</p>
              {options.map(opt => (
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
                    disabled={saving}
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
              disabled={saving}
            />
            <Button type="button" size="sm" onClick={addOption} className="h-8 px-2" disabled={saving}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
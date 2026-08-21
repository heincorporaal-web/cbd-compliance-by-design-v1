import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Settings, Pencil, Search, CalendarOff, RotateCcw } from "lucide-react";
import { loadFromDB, writeToDB, subscribe, setDisabledSeeded } from "@/lib/customOptionsStore";

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
  const [disabledSeeded, setDisabledSeededState] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadFromDB(storageKey);
    })();
    const unsub = subscribe(storageKey, (opts, disabled) => {
      if (cancelled) return;
      setOptions(opts || []);
      setDisabledSeededState(disabled || []);
    });
    return () => { cancelled = true; unsub(); };
  }, [storageKey]);

  const persist = async (opts) => {
    setSaving(true);
    await writeToDB(storageKey, opts);
    setSaving(false);
  };

  const toggleSeeded = async (val) => {
    setSaving(true);
    const next = disabledSeeded.includes(val)
      ? disabledSeeded.filter(v => v !== val)
      : [...disabledSeeded, val];
    await setDisabledSeeded(storageKey, next);
    // If the currently selected value was just disabled, clear it
    if (!disabledSeeded.includes(val) && value === val) onValueChange("");
    setSaving(false);
  };

  const isCustom = (val) => options.some(o => o.value === val);
  const isDisabledSeeded = (val) => disabledSeeded.includes(val);

  const allOptions = [...seededOptions, ...options].filter(o => !isDisabledSeeded(o.value));
  const filteredOptions = allOptions.filter(o =>
    (o.label || "").toLowerCase().includes(search.toLowerCase())
  );

  const addOption = async () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    if (allOptions.some(o => o.value.toLowerCase() === trimmed.toLowerCase() || o.label.toLowerCase() === trimmed.toLowerCase())) return;
    await persist([...options, { value: trimmed, label: trimmed }]);
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
          <div className="px-2 py-2 sticky top-0 bg-white z-10 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-7 pl-7 text-xs"
                onKeyDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
          {filteredOptions.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400">No results</div>
          )}
          {filteredOptions.map(opt => (
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
            <Settings className="w-4 h-4 text-slate-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 space-y-4 max-h-[60vh] overflow-y-auto" align="end">
          <p className="text-sm font-semibold text-slate-800">Manage Options</p>

          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Built-in</p>
            {seededOptions.map(opt => {
              const disabled = isDisabledSeeded(opt.value);
              return (
                <div
                  key={opt.value}
                  className={`flex items-center justify-between px-2 py-1 rounded text-sm ${disabled ? "bg-red-50 text-slate-400" : "bg-slate-50 text-slate-600"}`}
                >
                  <span className={`flex items-center gap-1.5 ${disabled ? "line-through" : ""}`}>
                    {opt.label}
                    {disabled && <CalendarOff className="w-3 h-3 text-red-400" />}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    title={disabled ? "Re-activate" : "End-date (hide from selection)"}
                    onClick={() => toggleSeeded(opt.value)}
                    disabled={saving}
                  >
                    {disabled
                      ? <RotateCcw className="w-3 h-3 text-green-500" />
                      : <CalendarOff className="w-3 h-3 text-orange-500" />}
                  </Button>
                </div>
              );
            })}
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
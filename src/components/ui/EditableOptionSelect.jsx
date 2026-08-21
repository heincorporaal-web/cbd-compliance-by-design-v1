import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Settings, Pencil, Search, CalendarOff, RotateCcw, CheckSquare, Square, X } from "lucide-react";
import { loadFromDB, writeToDB, subscribe, setDisabledSeeded } from "@/lib/customOptionsStore";
import { toast } from "sonner";

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
  const [selected, setSelected] = useState(new Set());

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

  const toggleSelect = (val) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val); else next.add(val);
      return next;
    });
  };

  const allSeededSelected = seededOptions.length > 0 && seededOptions.every(o => selected.has(o.value));
  const selectAllSeeded = () => setSelected(new Set(seededOptions.map(o => o.value)));
  const clearSelection = () => setSelected(new Set());

  const bulkEndDate = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    const toAdd = Array.from(selected).filter(v => !disabledSeeded.includes(v));
    if (toAdd.length === 0) {
      toast.info("All selected items are already end-dated.");
      setSelected(new Set());
      setSaving(false);
      return;
    }
    const next = [...new Set([...disabledSeeded, ...toAdd])];
    await setDisabledSeeded(storageKey, next);
    if (toAdd.some(v => value === v)) onValueChange("");
    toast.success(`End-dated ${toAdd.length} management chain${toAdd.length !== 1 ? "s" : ""}.`);
    setSelected(new Set());
    setSaving(false);
  };

  const bulkReactivate = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    const toRemove = Array.from(selected).filter(v => disabledSeeded.includes(v));
    if (toRemove.length === 0) {
      toast.info("None of the selected items are end-dated.");
      setSelected(new Set());
      setSaving(false);
      return;
    }
    const next = disabledSeeded.filter(v => !toRemove.includes(v));
    await setDisabledSeeded(storageKey, next);
    toast.success(`Re-activated ${toRemove.length} management chain${toRemove.length !== 1 ? "s" : ""}.`);
    setSelected(new Set());
    setSaving(false);
  };

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
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Built-in</p>
              <button
                type="button"
                onClick={() => allSeededSelected ? clearSelection() : selectAllSeeded()}
                className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1"
                disabled={saving}
              >
                {allSeededSelected
                  ? <><Square className="w-3 h-3" /> Clear</>
                  : <><CheckSquare className="w-3 h-3" /> Select all</>}
              </button>
            </div>

            {selected.size > 0 && (
              <div className="flex items-center gap-1.5 py-1.5 px-2 bg-slate-100 rounded text-xs">
                <span className="text-slate-600 font-medium">{selected.size} selected</span>
                <Button type="button" size="sm" onClick={bulkEndDate} disabled={saving} className="h-6 px-2 text-[11px] bg-orange-500 hover:bg-orange-600 text-white">
                  <CalendarOff className="w-3 h-3" /> End-date
                </Button>
                <Button type="button" size="sm" onClick={bulkReactivate} disabled={saving} className="h-6 px-2 text-[11px] bg-green-500 hover:bg-green-600 text-white">
                  <RotateCcw className="w-3 h-3" /> Re-activate
                </Button>
                <Button type="button" size="icon" onClick={clearSelection} disabled={saving} className="h-6 w-6 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}

            {seededOptions.map(opt => {
              const disabled = isDisabledSeeded(opt.value);
              const isChecked = selected.has(opt.value);
              return (
                <div
                  key={opt.value}
                  className={`flex items-center justify-between px-2 py-1 rounded text-sm ${disabled ? "bg-red-50 text-slate-400" : "bg-slate-50 text-slate-600"} ${isChecked ? "ring-1 ring-blue-300" : ""}`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleSelect(opt.value)}
                      className="shrink-0 text-slate-400 hover:text-blue-500"
                      title={isChecked ? "Deselect" : "Select for bulk action"}
                    >
                      {isChecked
                        ? <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                        : <Square className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`flex items-center gap-1.5 ${disabled ? "line-through" : ""}`}>
                      {opt.label}
                      {disabled && <CalendarOff className="w-3 h-3 text-red-400" />}
                    </span>
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
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronDown, ChevronUp } from "lucide-react";

/**
 * SearchableMultiPicker
 * Props:
 *   label        – section heading
 *   items        – array of objects
 *   field        – form field name (array of ids)
 *   selectedIds  – current array of selected ids
 *   onToggle     – (id) => void
 *   getLabel     – (item) => string  — display label for each item
 */
export default function SearchableMultiPicker({ label, items, selectedIds = [], onToggle, getLabel }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);

  const selected = items.filter(i => selectedIds.includes(i.id));
  const filtered = items.filter(i => {
    const lbl = getLabel(i).toLowerCase();
    return lbl.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</Label>
        <span className="text-xs text-slate-400">{selected.length} selected</span>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(item => (
            <Badge key={item.id} variant="secondary" className="gap-1 pr-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
              {getLabel(item)}
              <button onClick={() => onToggle(item.id)} className="ml-0.5 hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Expand / collapse toggle */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {expanded ? "Close" : `Browse & search ${label.toLowerCase()}`}
      </button>

      {expanded && (
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b bg-slate-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                className="pl-8 h-8 text-sm"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Results list */}
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <p className="p-3 text-xs text-slate-400 italic text-center">No results found</p>
            ) : filtered.map(item => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? "bg-indigo-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(item.id)}
                    className="rounded mt-0.5 shrink-0"
                  />
                  <span className={`text-sm leading-snug ${isSelected ? "text-indigo-700 font-medium" : "text-slate-700"}`}>
                    {getLabel(item)}
                  </span>
                </label>
              );
            })}
          </div>

          {filtered.length > 0 && (
            <div className="px-3 py-2 border-t bg-slate-50 text-xs text-slate-400 text-right">
              {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

/**
 * Generic Select dropdown with an inline search bar.
 *
 * Props:
 *  value         – current value id (or "")
 *  onValueChange – (id) => void  ("" when cleared)
 *  options       – array of { id, label }
 *  placeholder   – string
 *  noneLabel     – label for the "clear" option; omit to hide it
 *  disabled      – boolean
 *  triggerPlaceholder – placeholder text for the trigger
 */
export default function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  noneLabel,
  disabled = false,
}) {
  const [search, setSearch] = useState("");

  const filtered = options.filter(o =>
    (o.label || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Select
      value={value || (noneLabel ? "__none__" : "")}
      onValueChange={(v) => onValueChange(v === "__none__" ? "" : v)}
      disabled={disabled}
    >
      <SelectTrigger>
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
        {noneLabel && <SelectItem value="__none__">{noneLabel}</SelectItem>}
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-xs text-slate-400">No results</div>
        )}
        {filtered.map(o => (
          <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
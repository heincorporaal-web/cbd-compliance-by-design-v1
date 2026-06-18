import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

/**
 * A Select dropdown for picking a stakeholder with an inline search bar.
 *
 * Props:
 *  value        – current stakeholder id (or "")
 *  onValueChange – (id) => void
 *  stakeholders – array of { id, full_name }
 *  placeholder  – string
 */
export default function SearchableStakeholderSelect({ value, onValueChange, stakeholders, placeholder = "Select stakeholder" }) {
  const [search, setSearch] = useState("");

  const filtered = stakeholders.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Select
      value={value || ""}
      onValueChange={(v) => {
        onValueChange(v === "__none__" ? "" : v);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* Inline search */}
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
        <SelectItem value="__none__">None</SelectItem>
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-xs text-slate-400">No results</div>
        )}
        {filtered.map(s => (
          <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
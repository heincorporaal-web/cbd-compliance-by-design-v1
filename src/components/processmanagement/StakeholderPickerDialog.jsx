import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users } from "lucide-react";

export default function StakeholderPickerDialog({ open, onOpenChange, stakeholders, stakeholderGroups, onSelect }) {
  const [query, setQuery] = useState("");

  const filtered = stakeholders.filter(s => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.job_title?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  const getGroupName = (groupIds) => {
    if (!groupIds?.length) return null;
    return groupIds
      .map(id => stakeholderGroups.find(g => g.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  const initials = (name) => (name || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Find Stakeholder
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            autoFocus
            className="pl-9"
            placeholder="Search by name, job title, department…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm">No stakeholders found</p>
            </div>
          ) : (
            filtered.map(s => (
              <button
                key={s.id}
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors text-left"
                onClick={() => { onSelect(s); onOpenChange(false); setQuery(""); }}
              >
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {initials(s.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{s.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {s.job_title}{s.department ? ` · ${s.department}` : ""}
                  </p>
                  {getGroupName(s.group_ids) && (
                    <Badge className="mt-1 text-xs bg-indigo-100 text-indigo-700 border-indigo-200">
                      {getGroupName(s.group_ids)}
                    </Badge>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
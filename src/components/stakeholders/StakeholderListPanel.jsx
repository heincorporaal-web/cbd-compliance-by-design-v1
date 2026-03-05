import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pencil, Trash2, Mail, Phone, Building2, History } from "lucide-react";

const GROUP_COLORS = [
  "bg-blue-100 text-blue-800", "bg-purple-100 text-purple-800",
  "bg-green-100 text-green-800", "bg-orange-100 text-orange-800",
  "bg-teal-100 text-teal-800", "bg-rose-100 text-rose-800",
  "bg-indigo-100 text-indigo-800", "bg-amber-100 text-amber-800",
];

export default function StakeholderListPanel({ stakeholders, groups, onEdit, onDelete }) {
  const groupMap = Object.fromEntries(groups.map(g => [g.id, g]));

  if (!stakeholders.length) return (
    <div className="text-center py-16 text-slate-500 bg-white rounded-xl border border-slate-200">
      <p className="font-medium">No stakeholders found</p>
      <p className="text-sm mt-1">Add a stakeholder or adjust your filters.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stakeholders.map((s, idx) => (
        <Card key={s.id} className="border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {s.full_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{s.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{s.job_title || s.department || ""}</p>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(s)}>
                <Pencil className="w-3.5 h-3.5 text-slate-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(s.id)}>
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </Button>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {s.email && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{s.email}</span>
              </div>
            )}
            {s.department && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{s.department}</span>
              </div>
            )}
          </div>

          {s.group_ids?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.group_ids.map((gid, i) => {
                const g = groupMap[gid];
                if (!g) return null;
                return (
                  <Badge key={gid} className={`text-xs ${GROUP_COLORS[i % GROUP_COLORS.length]}`}>
                    {g.name}
                  </Badge>
                );
              })}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
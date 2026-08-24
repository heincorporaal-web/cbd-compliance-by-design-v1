import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Link2, AlertTriangle, ShieldCheck, GitBranch, Flag } from "lucide-react";

export default function IncidentLinksPanel({ incident, companyId }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(null); // 'risk' | 'control' | 'process' | 'issue' | null
  const [search, setSearch] = useState("");

  const { data: risks = [] } = useQuery({
    queryKey: ["risks-for-company", companyId],
    queryFn: () => base44.entities.Risk.filter({ company_id: companyId }, "-created_date", 50),
    enabled: !!companyId,
  });
  const { data: controls = [] } = useQuery({
    queryKey: ["controls-for-company", companyId],
    queryFn: () => base44.entities.Control.filter({ company_id: companyId }, "-created_date", 50),
    enabled: !!companyId,
  });
  const { data: processes = [] } = useQuery({
    queryKey: ["processes-for-company", companyId],
    queryFn: () => base44.entities.OrgProcess.filter({ company_id: companyId }, "-created_date", 50),
    enabled: !!companyId,
  });
  const { data: issues = [] } = useQuery({
    queryKey: ["issues-for-company", companyId],
    queryFn: () => base44.entities.Issue.filter({ company_id: companyId }, "-created_date", 50),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries(["incident", incident.id]);

  const toggleLink = (type, id) => {
    const field = `linked_${type}_ids`;
    const current = incident[field] || [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    base44.entities.Incident.update(incident.id, { [field]: next }).then(() => invalidate());
  };

  const LINK_CONFIGS = [
    { type: "risk", label: "Risks", icon: AlertTriangle, color: "text-amber-600", items: risks, getLabel: (r) => r.title, getId: (r) => r.id },
    { type: "control", label: "Controls", icon: ShieldCheck, color: "text-blue-600", items: controls, getLabel: (c) => c.title || c.control_id, getId: (c) => c.id },
    { type: "process", label: "Processes", icon: GitBranch, color: "text-indigo-600", items: processes, getLabel: (p) => p.name, getId: (p) => p.id },
    { type: "issue", label: "Issues", icon: Flag, color: "text-rose-600", items: issues, getLabel: (i) => i.title, getId: (i) => i.id },
  ];

  return (
    <div className="space-y-4">
      {LINK_CONFIGS.map((cfg) => {
        const Icon = cfg.icon;
        const linkedIds = incident[`linked_${cfg.type}_ids`] || [];
        const linkedItems = cfg.items.filter((item) => linkedIds.includes(cfg.getId(item)));
        const availableItems = cfg.items.filter((item) => !linkedIds.includes(cfg.getId(item)));
        const filtered = availableItems.filter((item) =>
          cfg.getLabel(item).toLowerCase().includes(search.toLowerCase())
        );

        return (
          <div key={cfg.type} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-4 h-4 ${cfg.color}`} />
                <span className="text-sm font-medium text-slate-700">{cfg.label}</span>
                <Badge variant="secondary" className="text-[10px]">{linkedIds.length}</Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setAdding(adding === cfg.type ? null : cfg.type); setSearch(""); }}
              >
                <Plus className="w-3.5 h-3.5" /> Link
              </Button>
            </div>

            {adding === cfg.type && (
              <div className="space-y-2 p-2 rounded-lg border border-slate-200 bg-slate-50">
                <Input
                  placeholder={`Search ${cfg.label.toLowerCase()}…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 text-sm"
                />
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filtered.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">No available items</p>
                  ) : (
                    filtered.slice(0, 20).map((item) => (
                      <button
                        key={cfg.getId(item)}
                        type="button"
                        onClick={() => toggleLink(cfg.type, cfg.getId(item))}
                        className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <Link2 className="w-3 h-3 inline mr-1 text-slate-400" />
                        {cfg.getLabel(item)}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {linkedItems.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {linkedItems.map((item) => (
                  <Badge key={cfg.getId(item)} variant="outline" className="gap-1 pr-1">
                    {cfg.getLabel(item)}
                    <button
                      onClick={() => toggleLink(cfg.type, cfg.getId(item))}
                      className="ml-1 hover:bg-slate-200 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
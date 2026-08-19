import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge2 } from "../CmdbShared";
import { ScrollText } from "lucide-react";

const ACTION_LABEL = {
  ci_created: "CI created", ci_updated: "CI updated", ci_deleted: "CI deleted", reconciliation: "Reconciliation",
  duplicate_merged: "Duplicate merged", classification_changed: "Classification changed", lifecycle_changed: "Lifecycle changed",
  application_relationship_created: "App relationship created", application_relationship_deleted: "App relationship deleted",
  source_precedence_override: "Source precedence override", manual_data_override: "Manual data override",
  administrative_config: "Administrative config", other: "Other",
};

export default function AuditTab({ ci }) {
  const { data: audit = [], isLoading } = useQuery({
    queryKey: ["ciAuditHistory", ci.id],
    queryFn: () => base44.entities.CIAuditHistory.filter({ configuration_item_id: ci.id }),
  });

  const sorted = [...audit].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  if (isLoading) return <p className="text-sm text-slate-400">Loading…</p>;
  if (sorted.length === 0) return (
    <div className="text-center py-8 text-slate-400">
      <ScrollText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
      <p className="text-sm">No audit history recorded for this CI.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {sorted.map(a => (
        <div key={a.id} className="flex items-start gap-3 border rounded-lg px-3 py-2.5">
          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${a.source === "automated_discovery" ? "bg-purple-500" : "bg-slate-400"}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge2 className={a.source === "automated_discovery" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-50 text-slate-700 border-slate-200"}>
                {ACTION_LABEL[a.action] || a.action}
              </Badge2>
              <Badge2 className="bg-slate-50 text-slate-500 border-slate-200">{a.source}</Badge2>
            </div>
            {a.previous_value && a.new_value && (
              <p className="text-sm mt-1"><span className="text-red-600">{a.previous_value}</span> <span className="text-slate-400">→</span> <span className="text-emerald-600">{a.new_value}</span></p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {a.timestamp ? new Date(a.timestamp).toLocaleString() : ""} · {a.user || "—"} {a.reason && `· ${a.reason}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
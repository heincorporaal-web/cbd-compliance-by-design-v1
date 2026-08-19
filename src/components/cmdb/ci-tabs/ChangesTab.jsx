import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge2 } from "../CmdbShared";
import { History } from "lucide-react";

const CHANGE_TYPE_LABEL = {
  hostname_changed: "Hostname changed", ip_address_changed: "IP address changed", os_changed: "OS changed",
  os_version_changed: "OS version changed", management_state_changed: "Management state changed", became_unmanaged: "Became unmanaged",
  device_disappeared: "Device disappeared", software_installed: "Software installed", software_removed: "Software removed",
  azure_resource_changed: "Azure resource changed", environment_changed: "Environment changed",
  application_relationship_changed: "Application relationship changed", lifecycle_changed: "Lifecycle changed", owner_changed: "Owner changed",
  other: "Other",
};

export default function ChangesTab({ ci }) {
  const { data: changes = [], isLoading } = useQuery({
    queryKey: ["ciChangeHistory", ci.id],
    queryFn: () => base44.entities.CIChangeHistory.filter({ configuration_item_id: ci.id }),
  });

  const sorted = [...changes].sort((a, b) => new Date(b.change_date || 0) - new Date(a.change_date || 0));

  if (isLoading) return <p className="text-sm text-slate-400">Loading…</p>;
  if (sorted.length === 0) return (
    <div className="text-center py-8 text-slate-400">
      <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
      <p className="text-sm">No configuration changes recorded for this CI.</p>
      <p className="text-xs mt-1">Changes are detected automatically during discovery runs (Phase 3/4).</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {sorted.map(ch => (
        <div key={ch.id} className="flex items-start gap-3 border rounded-lg px-3 py-2.5">
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge2 className="bg-blue-50 text-blue-700 border-blue-200">{CHANGE_TYPE_LABEL[ch.change_type] || ch.change_type}</Badge2>
              {ch.field_name && <span className="text-xs text-slate-400">{ch.field_name}</span>}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm">
              {ch.old_value && <span className="text-red-600 line-through">{ch.old_value}</span>}
              {ch.old_value && ch.new_value && <span className="text-slate-400">→</span>}
              {ch.new_value && <span className="text-emerald-600">{ch.new_value}</span>}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {ch.change_date ? new Date(ch.change_date).toLocaleString("en-GB") : ""} · {ch.discovery_source || "—"} · {ch.changed_by || "—"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
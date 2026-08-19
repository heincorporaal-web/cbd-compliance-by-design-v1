import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { InfoRow, Badge2 } from "../CmdbShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const SOURCES = [
  { value: "defender_for_endpoint", label: "Defender for Endpoint" },
  { value: "intune", label: "Intune" },
  { value: "entra_id", label: "Entra ID" },
  { value: "azure_resource_graph", label: "Azure Resource Graph" },
  { value: "defender_for_cloud", label: "Defender for Cloud" },
  { value: "manual", label: "Manual" },
];

export default function DiscoveryTab({ ci }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ source_system: "defender_for_endpoint", external_id: "", external_object_type: "", source_url: "" });

  const { data: extIds = [] } = useQuery({
    queryKey: ["ciExternalIds", ci.id],
    queryFn: () => base44.entities.CIExternalIdentifier.filter({ configuration_item_id: ci.id }),
  });

  const addMut = useMutation({
    mutationFn: (data) => base44.entities.CIExternalIdentifier.create({ ...data, configuration_item_id: ci.id, company_id: ci.company_id, active: true, first_seen: new Date().toISOString(), last_seen: new Date().toISOString() }),
    onSuccess: () => { queryClient.invalidateQueries(["ciExternalIds"]); setShowAdd(false); setForm({ source_system: "defender_for_endpoint", external_id: "", external_object_type: "", source_url: "" }); toast.success("External identifier added"); },
  });

  const delMut = useMutation({
    mutationFn: (id) => base44.entities.CIExternalIdentifier.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["ciExternalIds"]); toast.success("External identifier removed"); },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Discovery Metadata</h4>
          <InfoRow label="Primary Discovery Source" value={ci.discovery_source} />
          <InfoRow label="Source Record ID" value={ci.source_record_id} />
          <InfoRow label="First Seen" value={ci.first_seen ? new Date(ci.first_seen).toLocaleString("en-GB") : ""} />
          <InfoRow label="Last Seen" value={ci.last_seen ? new Date(ci.last_seen).toLocaleString("en-GB") : ""} />
          <InfoRow label="Last Successful Discovery" value={ci.last_successful_discovery ? new Date(ci.last_successful_discovery).toLocaleString("en-GB") : ""} />
          <InfoRow label="Discovery Confidence" value={ci.discovery_confidence != null ? `${ci.discovery_confidence}%` : ""} />
          <InfoRow label="Last Reconciled" value={ci.last_reconciled_date ? new Date(ci.last_reconciled_date).toLocaleString("en-GB") : ""} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">External Identifiers ({extIds.length})</h4>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(s => !s)} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Identifier</Button>
        </div>
        {showAdd && (
          <div className="border rounded-lg p-3 mb-3 space-y-3 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Source System</Label>
                <Select value={form.source_system} onValueChange={v => setForm(f => ({ ...f, source_system: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>External ID *</Label><Input value={form.external_id} onChange={e => setForm(f => ({ ...f, external_id: e.target.value }))} /></div>
              <div className="space-y-1"><Label>External Object Type</Label><Input value={form.external_object_type} onChange={e => setForm(f => ({ ...f, external_object_type: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Source URL</Label><Input value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} /></div>
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => form.external_id && addMut.mutate(form)}>Save Identifier</Button>
          </div>
        )}
        {extIds.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No external identifiers recorded. These link this CI to its source records in Microsoft discovery systems.</p>
        ) : (
          <div className="space-y-2">
            {extIds.map(ext => (
              <div key={ext.id} className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge2 className="bg-blue-50 text-blue-700 border-blue-200">{SOURCES.find(s => s.value === ext.source_system)?.label || ext.source_system}</Badge2>
                    <span className="font-mono text-sm text-slate-800 truncate">{ext.external_id}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{ext.external_object_type} {ext.last_seen && `· last seen ${new Date(ext.last_seen).toLocaleDateString("en-GB")}`}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ext.source_url && <a href={ext.source_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600"><ExternalLink className="w-4 h-4" /></a>}
                  <Badge2 className={ext.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}>{ext.active ? "active" : "inactive"}</Badge2>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => delMut.mutate(ext.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

export default function SoftwareTab({ ci }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ software_name: "", publisher: "", version: "", architecture: "", installation_location: "" });

  const { data: ciSoftwareRels = [] } = useQuery({
    queryKey: ["ciSoftwareRels", ci.id],
    queryFn: () => base44.entities.CISoftwareRelationship.filter({ configuration_item_id: ci.id }),
  });

  const { data: allSoftware = [] } = useQuery({
    queryKey: ["installedSoftware", ci.company_id],
    queryFn: () => base44.entities.InstalledSoftware.filter({ company_id: ci.company_id }),
  });

  const softwareMap = Object.fromEntries(allSoftware.map(s => [s.id, s]));
  const installed = ciSoftwareRels.map(r => ({ ...r, software: softwareMap[r.installed_software_id] })).filter(r => r.software);

  const addMut = useMutation({
    mutationFn: async (data) => {
      let sw = allSoftware.find(s => s.software_name === data.software_name && s.version === data.version && s.company_id === ci.company_id);
      if (!sw) sw = await base44.entities.InstalledSoftware.create({ ...data, company_id: ci.company_id, first_seen: new Date().toISOString(), last_seen: new Date().toISOString(), discovery_source: "manual" });
      return base44.entities.CISoftwareRelationship.create({ configuration_item_id: ci.id, installed_software_id: sw.id, company_id: ci.company_id, discovery_source: "manual", first_seen: new Date().toISOString(), last_seen: new Date().toISOString() });
    },
    onSuccess: () => { queryClient.invalidateQueries(["ciSoftwareRels"]); queryClient.invalidateQueries(["installedSoftware"]); setShowAdd(false); setForm({ software_name: "", publisher: "", version: "", architecture: "", installation_location: "" }); toast.success("Software added to CI"); },
  });

  const delMut = useMutation({
    mutationFn: (id) => base44.entities.CISoftwareRelationship.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["ciSoftwareRels"]); toast.success("Software removed from CI"); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Installed Software ({installed.length})</h4>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(s => !s)} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Software</Button>
      </div>
      {showAdd && (
        <div className="border rounded-lg p-3 mb-3 space-y-3 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Software Name *</Label><Input value={form.software_name} onChange={e => setForm(f => ({ ...f, software_name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Publisher</Label><Input value={form.publisher} onChange={e => setForm(f => ({ ...f, publisher: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Version</Label><Input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Architecture</Label><Input value={form.architecture} onChange={e => setForm(f => ({ ...f, architecture: e.target.value }))} /></div>
            <div className="space-y-1 md:col-span-2"><Label>Installation Location</Label><Input value={form.installation_location} onChange={e => setForm(f => ({ ...f, installation_location: e.target.value }))} /></div>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => form.software_name && addMut.mutate(form)}>Save Software</Button>
        </div>
      )}
      {installed.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No installed software recorded for this CI.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {installed.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2 hover:bg-slate-50">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{r.software.software_name}</p>
                <p className="text-xs text-slate-400">{r.software.publisher} {r.software.version && `· v${r.software.version}`} {r.software.architecture && `· ${r.software.architecture}`}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 shrink-0" onClick={() => delMut.mutate(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
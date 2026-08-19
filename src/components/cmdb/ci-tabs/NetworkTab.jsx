import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { InfoRow, Badge2 } from "../CmdbShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function NetworkTab({ ci }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ interface_name: "", ip_address: "", mac_address: "", subnet: "", vlan: "", dns_name: "", is_primary: false });

  const { data: interfaces = [] } = useQuery({
    queryKey: ["ciNetworkInterfaces", ci.id],
    queryFn: () => base44.entities.CINetworkInterface.filter({ configuration_item_id: ci.id }),
  });

  const addMut = useMutation({
    mutationFn: (data) => base44.entities.CINetworkInterface.create({ ...data, configuration_item_id: ci.id, company_id: ci.company_id, first_seen: new Date().toISOString(), last_seen: new Date().toISOString() }),
    onSuccess: () => { queryClient.invalidateQueries(["ciNetworkInterfaces"]); setShowAdd(false); setForm({ interface_name: "", ip_address: "", mac_address: "", subnet: "", vlan: "", dns_name: "", is_primary: false }); toast.success("Network interface added"); },
  });

  const delMut = useMutation({
    mutationFn: (id) => base44.entities.CINetworkInterface.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["ciNetworkInterfaces"]); toast.success("Interface removed"); },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Primary Network Info</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <InfoRow label="IP Address" value={ci.ip_address} />
          <InfoRow label="MAC Address" value={ci.mac_address} />
          <InfoRow label="DNS Name" value={ci.dns_name} />
          <InfoRow label="Domain" value={ci.domain} />
          <InfoRow label="Network / Subnet" value={ci.network_subnet} />
          <InfoRow label="VLAN" value={ci.vlan} />
        </div>
        {ci.additional_ip_addresses?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-slate-400">Additional IP Addresses</p>
            <div className="flex flex-wrap gap-1.5 mt-1">{ci.additional_ip_addresses.map((ip, i) => <Badge2 key={i} className="bg-slate-50 text-slate-700 border-slate-200 font-mono">{ip}</Badge2>)}</div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Network Interfaces ({interfaces.length})</h4>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(s => !s)} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Interface</Button>
        </div>
        {showAdd && (
          <div className="border rounded-lg p-3 mb-3 space-y-3 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Interface Name</Label><Input value={form.interface_name} onChange={e => setForm(f => ({ ...f, interface_name: e.target.value }))} /></div>
              <div className="space-y-1"><Label>IP Address</Label><Input value={form.ip_address} onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))} /></div>
              <div className="space-y-1"><Label>MAC Address</Label><Input value={form.mac_address} onChange={e => setForm(f => ({ ...f, mac_address: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Subnet</Label><Input value={form.subnet} onChange={e => setForm(f => ({ ...f, subnet: e.target.value }))} /></div>
              <div className="space-y-1"><Label>VLAN</Label><Input value={form.vlan} onChange={e => setForm(f => ({ ...f, vlan: e.target.value }))} /></div>
              <div className="space-y-1"><Label>DNS Name</Label><Input value={form.dns_name} onChange={e => setForm(f => ({ ...f, dns_name: e.target.value }))} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.is_primary} onCheckedChange={v => setForm(f => ({ ...f, is_primary: v }))} /> Primary interface</label>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => addMut.mutate(form)}>Save Interface</Button>
          </div>
        )}
        {interfaces.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No additional network interfaces recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-slate-400 border-b">{["Name","IP","MAC","Subnet","VLAN","DNS","Primary",""].map(h => <th key={h} className="text-left py-2 px-2 font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {interfaces.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50">
                    <td className="py-2 px-2">{n.interface_name || "—"}</td>
                    <td className="py-2 px-2 font-mono text-xs">{n.ip_address || "—"}</td>
                    <td className="py-2 px-2 font-mono text-xs">{n.mac_address || "—"}</td>
                    <td className="py-2 px-2 text-xs">{n.subnet || "—"}</td>
                    <td className="py-2 px-2 text-xs">{n.vlan || "—"}</td>
                    <td className="py-2 px-2 text-xs">{n.dns_name || "—"}</td>
                    <td className="py-2 px-2">{n.is_primary && <Badge2 className="bg-blue-50 text-blue-700 border-blue-200">primary</Badge2>}</td>
                    <td className="py-2 px-2"><Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => delMut.mutate(n.id)}><Trash2 className="w-3.5 h-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
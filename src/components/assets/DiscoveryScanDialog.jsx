import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Radar, Sparkles } from "lucide-react";
import { toast } from "sonner";

const SOURCES = [
  { value: "microsoft_intune", label: "Microsoft Intune" },
  { value: "azure_ad", label: "Azure AD" },
  { value: "microsoft_sccm", label: "Microsoft SCCM" },
  { value: "azure_resource_graph", label: "Azure Resource Graph" },
];

const SAMPLE = [
  { asset_name: "FIN-WS-014", asset_type: "device", hostname: "FIN-WS-014", ip_address: "10.0.4.21", operating_system: "Windows 11", os_version: "23H2", manufacturer: "Dell", model: "OptiPlex 7090", serial_number: "DL7090-0091", location: "HQ - Finance", owner: "J. van Dijk" },
  { asset_name: "AZ-VM-SQL01", asset_type: "virtual_machine", hostname: "az-vm-sql01", ip_address: "10.1.2.10", operating_system: "Windows Server 2022", manufacturer: "Microsoft", model: "Azure D4s v5", serial_number: "AZ-D4S-0042", location: "West Europe", owner: "Platform Team" },
  { asset_name: "NET-FW-CORE", asset_type: "network_device", hostname: "net-fw-core", ip_address: "10.0.0.1", manufacturer: "Fortinet", model: "FortiGate 100F", serial_number: "FG100F-2231", location: "Data Centre" },
  { asset_name: "Mobi-iPad-22", asset_type: "mobile_device", hostname: "mobi-ipad-22", operating_system: "iPadOS 17", manufacturer: "Apple", model: "iPad Air", serial_number: "IPAD-AIR-22", owner: "Audit Team" },
];

/**
 * Discovery scan dialog. Lets the user pick a native Microsoft discovery
 * source and paste the discovered items (JSON array or CSV with a header
 * row). Each item is imported into the CMDB as a DiscoveredAsset record.
 */
export default function DiscoveryScanDialog({ open, onOpenChange, companyId }) {
  const queryClient = useQueryClient();
  const [source, setSource] = useState("microsoft_intune");
  const [payload, setPayload] = useState("");

  const importMutation = useMutation({
    mutationFn: async (records) => base44.entities.DiscoveredAsset.bulkCreate(records),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["discoveredAssets"]);
      toast.success(`${Array.isArray(data) ? data.length : 1} discovered asset(s) imported`);
      setPayload("");
      onOpenChange(false);
    },
    onError: (e) => toast.error("Import failed: " + (e?.message || e)),
  });

  const parse = () => {
    const text = payload.trim();
    if (!text) return [];
    let items = [];
    try {
      const parsed = JSON.parse(text);
      items = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (!lines.length) return [];
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        const obj = {};
        header.forEach((h, idx) => { obj[h] = cols[idx]; });
        items.push(obj);
      }
    }
    return items.map((it) => ({
      company_id: companyId,
      asset_name: it.asset_name || it.name || it.hostname || "Discovered asset",
      asset_type: it.asset_type || it.type || "device",
      discovery_source: source,
      hostname: it.hostname || "",
      ip_address: it.ip_address || it.ip || "",
      mac_address: it.mac_address || "",
      manufacturer: it.manufacturer || "",
      model: it.model || "",
      serial_number: it.serial_number || it.serial || "",
      operating_system: it.operating_system || it.os || "",
      os_version: it.os_version || "",
      location: it.location || "",
      owner: it.owner || "",
      status: "discovered",
      last_discovered_at: new Date().toISOString(),
      raw_discovery_data: it,
    }));
  };

  const handleImport = () => {
    const records = parse();
    if (!records.length) {
      toast.error("Nothing to import — paste discovery data or load a sample");
      return;
    }
    importMutation.mutate(records);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-blue-600" /> Run discovery scan
          </DialogTitle>
          <DialogDescription>
            Choose the native Microsoft discovery source, then paste the discovered items
            (JSON array or CSV with a header row). Each item is imported into the CMDB as a
            discovered asset.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Microsoft discovery source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Discovered items</Label>
              <button
                type="button"
                onClick={() => setPayload(JSON.stringify(SAMPLE, null, 2))}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Sparkles className="w-3 h-3" /> Load sample
              </button>
            </div>
            <Textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={10}
              placeholder={'[\n  { "hostname": "FIN-WS-014", "ip_address": "10.0.4.21", "operating_system": "Windows 11", "manufacturer": "Dell", "model": "OptiPlex 7090" }\n]'}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400">
              Tip: export devices from your Microsoft tenant (Intune devices, Azure AD devices,
              SCCM inventory) and paste the output here. A live tenant connection can be configured
              per company.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleImport}
            disabled={importMutation.isPending}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            <Radar className="w-4 h-4" />
            {importMutation.isPending ? "Importing…" : "Import discovered items"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
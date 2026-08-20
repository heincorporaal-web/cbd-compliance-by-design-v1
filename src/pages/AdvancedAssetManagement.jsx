import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Boxes, Globe, Lock, Search, Radar, Server, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import ModuleToggleStrip from "@/components/branding/ModuleToggleStrip";
import { BRANDS } from "@/lib/moduleBrands";
import DiscoveryScanDialog from "@/components/assets/DiscoveryScanDialog";

const SOURCE_LABEL = {
  microsoft_intune: "Microsoft Intune",
  azure_ad: "Azure AD",
  microsoft_sccm: "SCCM",
  azure_resource_graph: "Azure Resource Graph",
  manual: "Manual",
};

const TYPE_LABEL = {
  device: "Device",
  software: "Software",
  cloud_resource: "Cloud resource",
  network_device: "Network device",
  virtual_machine: "Virtual machine",
  mobile_device: "Mobile device",
  other: "Other",
};

const STATUS_COLOR = {
  discovered: "bg-slate-100 text-slate-600 border-slate-200",
  linked: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ignored: "bg-amber-100 text-amber-700 border-amber-200",
  decommissioned: "bg-red-100 text-red-700 border-red-200",
};

export default function AdvancedAssetManagement() {
  const [companyId] = useCompanyFilter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");

  const effectiveCompanyId = companyId === "all" ? null : companyId;

  // Product owner = platform admin or a role flagged is_product_owner
  const { data: roles = [] } = useQuery({
    queryKey: ["userRoles"],
    queryFn: () => base44.entities.UserRole.list("-created_date", 2000),
    enabled: !!user?.custom_role_id,
  });
  const myRole = roles.find((r) => r.id === user?.custom_role_id);
  const isProductOwner = user?.role === "admin" || !!myRole?.is_product_owner;

  // Company preferences (Assets by Design on/off flag)
  const { data: prefs = [] } = useQuery({
    queryKey: ["companyPrefs", effectiveCompanyId],
    queryFn: () => base44.entities.CompanyPreference.filter({ company_id: effectiveCompanyId }),
    enabled: !!effectiveCompanyId,
  });
  const pref = prefs[0];
  const moduleEnabled = !!pref?.enable_assets_by_design;

  const enableModuleMutation = useMutation({
    mutationFn: async (enable) => {
      if (pref) {
        return base44.entities.CompanyPreference.update(pref.id, { enable_assets_by_design: enable });
      }
      return base44.entities.CompanyPreference.create({
        company_id: effectiveCompanyId,
        enable_assets_by_design: enable,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["companyPrefs", effectiveCompanyId]);
      toast.success(`Assets by Design ${moduleEnabled ? "disabled" : "enabled"}`);
    },
  });

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["discoveredAssets", effectiveCompanyId],
    queryFn: () => base44.entities.DiscoveredAsset.filter({ company_id: effectiveCompanyId }),
    enabled: !!effectiveCompanyId && moduleEnabled,
  });

  const { data: systems = [] } = useQuery({
    queryKey: ["ictSystems", effectiveCompanyId],
    queryFn: () => base44.entities.ICTSystem.filter({ company_id: effectiveCompanyId }),
    enabled: !!effectiveCompanyId && moduleEnabled,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      const matchesSearch =
        !q ||
        [a.asset_name, a.hostname, a.ip_address, a.manufacturer, a.model]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q));
      const matchesType = typeFilter === "all" || a.asset_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [assets, search, typeFilter]);

  const linkMutation = useMutation({
    mutationFn: async ({ assetId, systemId }) =>
      base44.entities.DiscoveredAsset.update(assetId, {
        linked_ict_system_id: systemId || "",
        status: systemId ? "linked" : "discovered",
      }),
    onSuccess: () => queryClient.invalidateQueries(["discoveredAssets"]),
  });

  const createSystemFromAssetMutation = useMutation({
    mutationFn: async (asset) => {
      const sys = await base44.entities.ICTSystem.create({
        name: asset.asset_name || asset.hostname || "Discovered asset",
        company_id: asset.company_id,
        system_type: "other",
        criticality: "supporting",
        vendor: asset.manufacturer || "",
        hosting_type: "on_premise",
        status: "active",
      });
      return base44.entities.DiscoveredAsset.update(asset.id, {
        linked_ict_system_id: sys.id,
        status: "linked",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["discoveredAssets"]);
      queryClient.invalidateQueries(["ictSystems"]);
      toast.success("ICT system created and asset linked");
    },
  });

  // No company selected (admin "all")
  if (!effectiveCompanyId) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <Card className="p-10 text-center text-slate-500">
          <Globe className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">Select a specific company to manage Assets by Design.</p>
          <p className="text-sm text-slate-400 mt-1">The add-on is switched on per company.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-4">
      {/* Module toggle strip — product owner only, collapsed by default */}
      {isProductOwner && (
        <ModuleToggleStrip
          brand={BRANDS.abd}
          moduleName="Assets by Design"
          moduleEnabled={moduleEnabled}
          onToggle={(v) => enableModuleMutation.mutate(v)}
          enabledLabel="Switched on — discover assets with native Microsoft tools and manage them in the CMDB."
          disabledLabel="Switched off — enable the add-on to run network discovery and build your CMDB."
        />
      )}

      {!moduleEnabled ? (
        <Card className="p-10 text-center text-slate-500">
          {isProductOwner ? (
            <>
              <Boxes className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Assets by Design is switched off.</p>
              <p className="text-sm text-slate-400 mt-1">Enable the add-on above to run network discovery and build your CMDB.</p>
              <Link to="/ICTSystems" className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 font-medium hover:underline">
                <Server className="w-4 h-4" /> Go to ICT Systems
              </Link>
            </>
          ) : (
            <>
              <Lock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Assets by Design is not enabled for your company.</p>
              <p className="text-sm text-slate-400 mt-1">
                Request activation using the Contact form in the{" "}
                <Link to="/about" className="text-blue-600 font-medium hover:underline">About section</Link>.
              </p>
              <Link to="/ICTSystems" className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 font-medium hover:underline">
                <Server className="w-4 h-4" /> Go to ICT Systems
              </Link>
            </>
          )}
        </Card>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets, hostname, IP…" className="pl-9" />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.entries(TYPE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary">{assets.length} assets</Badge>
              <Badge variant="outline">{assets.filter((a) => a.status === "linked").length} linked</Badge>
              <Button onClick={() => setScanOpen(true)} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                <Radar className="w-4 h-4" /> Run discovery scan
              </Button>
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="text-center text-slate-400 py-20">Loading…</div>
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center text-slate-500">
              <Radar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No discovered assets yet.</p>
              <p className="text-sm text-slate-400 mt-1 mb-4">Run a discovery scan with a native Microsoft tool to populate the CMDB.</p>
              <Button onClick={() => setScanOpen(true)} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                <Radar className="w-4 h-4" /> Run discovery scan
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((a) => {
                const linkedSystem = systems.find((s) => s.id === a.linked_ict_system_id);
                return (
                  <Card key={a.id} className="p-4 space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800 truncate">{a.asset_name || a.hostname || "Unnamed asset"}</h3>
                        <p className="text-xs text-slate-400">
                          {TYPE_LABEL[a.asset_type] || a.asset_type} · {SOURCE_LABEL[a.discovery_source] || a.discovery_source}
                        </p>
                      </div>
                      <Badge variant="outline" className={STATUS_COLOR[a.status] || ""}>{a.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
                      {a.hostname && <div><span className="text-slate-400">Host:</span> {a.hostname}</div>}
                      {a.ip_address && <div><span className="text-slate-400">IP:</span> {a.ip_address}</div>}
                      {a.operating_system && <div><span className="text-slate-400">OS:</span> {a.operating_system}</div>}
                      {a.manufacturer && <div><span className="text-slate-400">Mfr:</span> {a.manufacturer}</div>}
                      {a.model && <div><span className="text-slate-400">Model:</span> {a.model}</div>}
                      {a.serial_number && <div><span className="text-slate-400">S/N:</span> {a.serial_number}</div>}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="min-w-0">
                        {linkedSystem ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                            <Check className="w-3 h-3" /> {linkedSystem.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">Not linked to an ICT system</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={a.linked_ict_system_id || "__none__"}
                          onValueChange={(v) => linkMutation.mutate({ assetId: a.id, systemId: v === "__none__" ? "" : v })}
                        >
                          <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Link ICT system" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— Unlink —</SelectItem>
                            {systems.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => createSystemFromAssetMutation.mutate(a)}
                          className="gap-1.5"
                          title="Create a new ICT system from this asset and link it"
                        >
                          <Plus className="w-3.5 h-3.5" /> Create
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <DiscoveryScanDialog open={scanOpen} onOpenChange={setScanOpen} companyId={effectiveCompanyId} />
    </div>
  );
}
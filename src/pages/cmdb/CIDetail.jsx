import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit2, Boxes, Cpu, Globe, Shield, Network, Package, GitBranch, ScrollText, History } from "lucide-react";
import ModulePageHeader from "@/components/branding/ModulePageHeader";
import { BRANDS } from "@/lib/moduleBrands";
import CIFormDialog from "@/components/cmdb/CIFormDialog";
import OverviewTab from "@/components/cmdb/ci-tabs/OverviewTab";
import DiscoveryTab from "@/components/cmdb/ci-tabs/DiscoveryTab";
import NetworkTab from "@/components/cmdb/ci-tabs/NetworkTab";
import SoftwareTab from "@/components/cmdb/ci-tabs/SoftwareTab";
import RelationshipsTab from "@/components/cmdb/ci-tabs/RelationshipsTab";
import SecurityTab from "@/components/cmdb/ci-tabs/SecurityTab";
import ChangesTab from "@/components/cmdb/ci-tabs/ChangesTab";
import AuditTab from "@/components/cmdb/ci-tabs/AuditTab";

const MANAGED_COLOR = { managed: "bg-emerald-100 text-emerald-700 border-emerald-200", unmanaged: "bg-amber-100 text-amber-700 border-amber-200", unknown: "bg-slate-100 text-slate-500 border-slate-200" };

export default function CIDetail() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState("overview");

  const { data: ci, isLoading } = useQuery({
    queryKey: ["configurationItem", id],
    queryFn: () => base44.entities.ConfigurationItem.get(id),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading configuration item…</div>;
  if (!ci) return (
    <div className="p-8 text-center space-y-4">
      <Boxes className="w-12 h-12 mx-auto text-slate-300" />
      <p className="text-slate-500 font-medium">Configuration item not found.</p>
      <Link to="/CMDBInventory"><Button variant="outline" className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Back to CMDB</Button></Link>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <ModulePageHeader brand={BRANDS.abd} Icon={Boxes} title="CMDB — Configuration Item" subtitle="" landingPath="/AssetsByDesign" logoUrl={BRANDS.abd.logoUrl} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link to="/CMDBInventory"><Button variant="outline" size="sm" className="gap-1.5"><ArrowLeft className="w-4 h-4" /> CMDB</Button></Link>
        </div>
        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={() => setEditOpen(true)}><Edit2 className="w-4 h-4" /> Edit CI</Button>
      </div>

      {/* Header card */}
      <Card className="p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-slate-500">{ci.ci_id || "—"}</span>
              {ci.ci_class_name && <Badge variant="outline" className="text-xs">{ci.ci_class_name}</Badge>}
            </div>
            <h1 className="text-xl font-bold text-slate-900">{ci.ci_name}</h1>
            {ci.hostname && <p className="text-sm text-slate-500">{ci.hostname}{ci.fqdn && ` · ${ci.fqdn}`}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {ci.lifecycle_status && <Badge variant="outline" className="text-xs">{ci.lifecycle_status}</Badge>}
            {ci.environment && <Badge variant="outline" className="text-xs bg-blue-50">{ci.environment}</Badge>}
            <Badge variant="outline" className={`text-xs ${MANAGED_COLOR[ci.managed_unmanaged] || ""}`}>{ci.managed_unmanaged}</Badge>
            {ci.intrinsic_criticality && <Badge variant="outline" className="text-xs bg-slate-50">Criticality: {ci.intrinsic_criticality}</Badge>}
            {ci.last_seen && <span className="text-xs text-slate-400">Last seen: {new Date(ci.last_seen).toLocaleDateString("en-GB")}</span>}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview" className="gap-1.5"><Cpu className="w-3.5 h-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="discovery" className="gap-1.5"><Globe className="w-3.5 h-3.5" /> Discovery</TabsTrigger>
          <TabsTrigger value="network" className="gap-1.5"><Network className="w-3.5 h-3.5" /> Network</TabsTrigger>
          <TabsTrigger value="software" className="gap-1.5"><Package className="w-3.5 h-3.5" /> Software</TabsTrigger>
          <TabsTrigger value="relationships" className="gap-1.5"><GitBranch className="w-3.5 h-3.5" /> Relationships</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Shield className="w-3.5 h-3.5" /> Security</TabsTrigger>
          <TabsTrigger value="changes" className="gap-1.5"><History className="w-3.5 h-3.5" /> Changes</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5"><ScrollText className="w-3.5 h-3.5" /> Audit</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><Card className="p-5 shadow-sm"><OverviewTab ci={ci} /></Card></TabsContent>
        <TabsContent value="discovery" className="mt-4"><Card className="p-5 shadow-sm"><DiscoveryTab ci={ci} /></Card></TabsContent>
        <TabsContent value="network" className="mt-4"><Card className="p-5 shadow-sm"><NetworkTab ci={ci} /></Card></TabsContent>
        <TabsContent value="software" className="mt-4"><Card className="p-5 shadow-sm"><SoftwareTab ci={ci} /></Card></TabsContent>
        <TabsContent value="relationships" className="mt-4"><Card className="p-5 shadow-sm"><RelationshipsTab ci={ci} /></Card></TabsContent>
        <TabsContent value="security" className="mt-4"><Card className="p-5 shadow-sm"><SecurityTab ci={ci} /></Card></TabsContent>
        <TabsContent value="changes" className="mt-4"><Card className="p-5 shadow-sm"><ChangesTab ci={ci} /></Card></TabsContent>
        <TabsContent value="audit" className="mt-4"><Card className="p-5 shadow-sm"><AuditTab ci={ci} /></Card></TabsContent>
      </Tabs>

      <CIFormDialog open={editOpen} onOpenChange={setEditOpen} editItem={ci} companyId={ci.company_id} />
    </div>
  );
}
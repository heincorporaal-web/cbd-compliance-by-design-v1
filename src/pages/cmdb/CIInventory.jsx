import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Boxes, Search, Plus, Settings2, ArrowLeft, Radar } from "lucide-react";
import ModulePageHeader from "@/components/branding/ModulePageHeader";
import { BRANDS } from "@/lib/moduleBrands";
import CIFormDialog from "@/components/cmdb/CIFormDialog";
import CIClassManager from "@/components/cmdb/CIClassManager";
import CIStatCards from "@/components/cmdb/CIStatCards";

const MANAGED_COLOR = { managed: "bg-emerald-100 text-emerald-700 border-emerald-200", unmanaged: "bg-amber-100 text-amber-700 border-amber-200", unknown: "bg-slate-100 text-slate-500 border-slate-200" };
const CRIT_COLOR = { critical: "bg-red-100 text-red-700 border-red-200", high: "bg-orange-100 text-orange-700 border-orange-200", medium: "bg-yellow-100 text-yellow-700 border-yellow-200", low: "bg-blue-100 text-blue-700 border-blue-200", na: "bg-slate-100 text-slate-500 border-slate-200" };

export default function CIInventory() {
  const [companyId] = useCompanyFilter();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [envFilter, setEnvFilter] = useState("all");
  const [lifecycleFilter, setLifecycleFilter] = useState("all");
  const [managedFilter, setManagedFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [classMgrOpen, setClassMgrOpen] = useState(false);

  const effCo = companyId === "all" ? null : companyId;

  const { data: prefs = [] } = useQuery({ queryKey: ["companyPrefs", effCo], queryFn: () => base44.entities.CompanyPreference.filter({ company_id: effCo }), enabled: !!effCo });
  const moduleEnabled = !!prefs[0]?.enable_assets_by_design;

  const { data: cis = [], isLoading } = useQuery({
    queryKey: ["configurationItems", effCo],
    queryFn: () => base44.entities.ConfigurationItem.filter({ company_id: effCo }),
    enabled: !!effCo && moduleEnabled,
  });
  const { data: classes = [] } = useQuery({ queryKey: ["ciClasses"], queryFn: () => base44.entities.CIClass.list("sort_order", 500) });
  const { data: environments = [] } = useQuery({ queryKey: ["cmdbEnvironments"], queryFn: () => base44.entities.Environment.list("sort_order", 100) });
  const { data: lifecycles = [] } = useQuery({ queryKey: ["cmdbLifecycles"], queryFn: () => base44.entities.LifecycleStatus.list("sort_order", 100) });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cis.filter(c => {
      const ms = !q || [c.ci_id, c.ci_name, c.hostname, c.ip_address, c.mac_address, c.serial_number, c.azure_resource_id].filter(Boolean).some(v => v.toLowerCase().includes(q));
      const mc = classFilter === "all" || c.ci_class_name === classes.find(cl => cl.id === classFilter)?.name;
      const me = envFilter === "all" || c.environment === envFilter;
      const ml = lifecycleFilter === "all" || c.lifecycle_status === lifecycleFilter;
      const mm = managedFilter === "all" || c.managed_unmanaged === managedFilter;
      return ms && mc && me && ml && mm;
    });
  }, [cis, search, classFilter, envFilter, lifecycleFilter, managedFilter, classes]);

  const openEdit = (ci) => { setEditItem(ci); setFormOpen(true); };
  const openCreate = () => { setEditItem(null); setFormOpen(true); };

  if (!effCo) return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader />
      <Card className="p-10 text-center text-slate-500"><Boxes className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="font-medium">Select a specific company to manage the CMDB.</p></Card>
    </div>
  );

  if (!moduleEnabled) return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader />
      <Card className="p-10 text-center text-slate-500">
        <Radar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <p className="font-medium">Assets by Design is not enabled for this company.</p>
        <Link to="/AssetsByDesign" className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 font-medium hover:underline"><ArrowLeft className="w-4 h-4" /> Back to ABD</Link>
      </Card>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link to="/AssetsByDesign"><Button variant="outline" size="sm" className="gap-1.5"><ArrowLeft className="w-4 h-4" /> ABD</Button></Link>
          <h2 className="text-lg font-bold text-slate-800">CMDB — Configuration Items</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setClassMgrOpen(true)}><Settings2 className="w-4 h-4" /> CI Classes</Button>
          <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={openCreate}><Plus className="w-4 h-4" /> Add CI</Button>
        </div>
      </div>

      <CIStatCards cis={cis} />

      <Card className="p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search CI ID, name, hostname, IP, MAC, serial, Azure resource ID…" className="pl-9" />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}><SelectTrigger className="w-40"><SelectValue placeholder="All classes" /></SelectTrigger><SelectContent><SelectItem value="all">All classes</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
          <Select value={envFilter} onValueChange={setEnvFilter}><SelectTrigger className="w-36"><SelectValue placeholder="All envs" /></SelectTrigger><SelectContent><SelectItem value="all">All environments</SelectItem>{environments.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent></Select>
          <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}><SelectTrigger className="w-36"><SelectValue placeholder="All lifecycle" /></SelectTrigger><SelectContent><SelectItem value="all">All lifecycle</SelectItem>{lifecycles.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent></Select>
          <Select value={managedFilter} onValueChange={setManagedFilter}><SelectTrigger className="w-36"><SelectValue placeholder="Managed" /></SelectTrigger><SelectContent><SelectItem value="all">All managed</SelectItem><SelectItem value="managed">Managed</SelectItem><SelectItem value="unmanaged">Unmanaged</SelectItem><SelectItem value="unknown">Unknown</SelectItem></SelectContent></Select>
        </div>

        {isLoading ? (
          <p className="text-center text-slate-400 py-12">Loading configuration items…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Boxes className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">{cis.length === 0 ? "No configuration items yet." : "No CIs match your filters."}</p>
            {cis.length === 0 && <Button onClick={openCreate} className="mt-3 gap-1.5 bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4" /> Add First CI</Button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b">
                  <th className="text-left py-2 px-3 font-medium">CI ID</th>
                  <th className="text-left py-2 px-3 font-medium">Name</th>
                  <th className="text-left py-2 px-3 font-medium">Class</th>
                  <th className="text-left py-2 px-3 font-medium">Environment</th>
                  <th className="text-left py-2 px-3 font-medium">Lifecycle</th>
                  <th className="text-left py-2 px-3 font-medium">Managed</th>
                  <th className="text-left py-2 px-3 font-medium">Criticality</th>
                  <th className="text-left py-2 px-3 font-medium">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/CIDetail?id=${c.id}`)}>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{c.ci_id || "—"}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{c.ci_name}{c.hostname && <span className="text-xs text-slate-400 block">{c.hostname}</span>}</td>
                    <td className="py-2.5 px-3 text-xs">{c.ci_class_name || <span className="text-slate-300 italic">unclassified</span>}</td>
                    <td className="py-2.5 px-3 text-xs">{c.environment || "—"}</td>
                    <td className="py-2.5 px-3"><Badge variant="outline" className="text-xs">{c.lifecycle_status || "—"}</Badge></td>
                    <td className="py-2.5 px-3"><Badge variant="outline" className={`text-xs ${MANAGED_COLOR[c.managed_unmanaged] || ""}`}>{c.managed_unmanaged}</Badge></td>
                    <td className="py-2.5 px-3">{c.intrinsic_criticality && <Badge variant="outline" className={`text-xs ${CRIT_COLOR[c.intrinsic_criticality] || ""}`}>{c.intrinsic_criticality}</Badge>}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">{c.last_seen ? new Date(c.last_seen).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CIFormDialog open={formOpen} onOpenChange={setFormOpen} editItem={editItem} companyId={effCo} />
      <CIClassManager open={classMgrOpen} onOpenChange={setClassMgrOpen} />
    </div>
  );
}

function PageHeader() {
  return <ModulePageHeader brand={BRANDS.abd} Icon={Boxes} title="Assets by Design — CMDB" subtitle="Enterprise configuration management database — discover, reconcile and manage IT infrastructure configuration items" landingPath="/AssetsByDesign" logoUrl={BRANDS.abd.logoUrl} />;
}
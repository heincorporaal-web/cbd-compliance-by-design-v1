import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Boxes, ArrowLeft, Radar, LayoutDashboard } from "lucide-react";
import ModulePageHeader from "@/components/branding/ModulePageHeader";
import { BRANDS } from "@/lib/moduleBrands";
import CIStatCards from "@/components/cmdb/CIStatCards";
import LifecycleBreakdownChart from "@/components/cmdb/LifecycleBreakdownChart";
import EnvironmentBreakdownChart from "@/components/cmdb/EnvironmentBreakdownChart";

export default function CMDBDashboard() {
  const [companyId] = useCompanyFilter();
  const effCo = companyId === "all" ? null : companyId;

  const { data: prefs = [] } = useQuery({ queryKey: ["companyPrefs", effCo], queryFn: () => base44.entities.CompanyPreference.filter({ company_id: effCo }), enabled: !!effCo });
  const moduleEnabled = !!prefs[0]?.enable_assets_by_design;

  const { data: cis = [], isLoading } = useQuery({
    queryKey: ["configurationItems", effCo],
    queryFn: () => base44.entities.ConfigurationItem.filter({ company_id: effCo }),
    enabled: !!effCo && moduleEnabled,
  });
  const { data: environments = [] } = useQuery({ queryKey: ["cmdbEnvironments"], queryFn: () => base44.entities.Environment.list("sort_order", 100) });
  const { data: lifecycles = [] } = useQuery({ queryKey: ["cmdbLifecycles"], queryFn: () => base44.entities.LifecycleStatus.list("sort_order", 100) });

  const matrix = useMemo(() => {
    const envNames = environments.map(e => e.name);
    const lcNames = lifecycles.map(l => l.name);
    const allEnvs = [...new Set([...envNames, ...cis.map(c => c.environment).filter(Boolean)])];
    const allLcs = [...new Set([...lcNames, ...cis.map(c => c.lifecycle_status).filter(Boolean)])];
    const grid = {};
    allLcs.forEach(lc => { grid[lc] = {}; allEnvs.forEach(env => { grid[lc][env] = 0; }); });
    cis.forEach(c => {
      const lc = c.lifecycle_status || "Unknown";
      const env = c.environment || "Unassigned";
      if (!grid[lc]) grid[lc] = {};
      if (!grid[lc][env]) grid[lc][env] = 0;
      grid[lc][env] += 1;
    });
    return { allLcs, allEnvs, grid };
  }, [cis, environments, lifecycles]);

  if (!effCo) return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader />
      <Card className="p-10 text-center text-slate-500"><Boxes className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="font-medium">Select a specific company to view the CMDB dashboard.</p></Card>
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
          <h2 className="text-lg font-bold text-slate-800">CMDB Dashboard</h2>
        </div>
        <Link to="/CMDBInventory"><Button variant="outline" size="sm" className="gap-1.5"><Boxes className="w-4 h-4" /> View Inventory</Button></Link>
      </div>

      <CIStatCards cis={cis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1">CIs by Lifecycle Status</h3>
          <p className="text-xs text-slate-400 mb-3">Distribution across lifecycle stages</p>
          {isLoading ? <p className="text-center text-slate-400 py-8">Loading…</p> : <LifecycleBreakdownChart cis={cis} lifecycles={lifecycles} />}
        </Card>
        <Card className="p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1">CIs by Environment</h3>
          <p className="text-xs text-slate-400 mb-3">Distribution across environments</p>
          {isLoading ? <p className="text-center text-slate-400 py-8">Loading…</p> : <EnvironmentBreakdownChart cis={cis} environments={environments} />}
        </Card>
      </div>

      <Card className="p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-1">Lifecycle × Environment Matrix</h3>
        <p className="text-xs text-slate-400 mb-3">Count of CIs at each lifecycle stage per environment</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">Lifecycle</th>
                {matrix.allEnvs.map(env => <th key={env} className="text-center py-2 px-3 text-xs font-medium text-slate-400 whitespace-nowrap">{env}</th>)}
                <th className="text-center py-2 px-3 text-xs font-medium text-slate-400">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {matrix.allLcs.map(lc => {
                const rowTotal = matrix.allEnvs.reduce((s, env) => s + (matrix.grid[lc]?.[env] || 0), 0);
                if (rowTotal === 0) return null;
                return (
                  <tr key={lc} className="hover:bg-slate-50">
                    <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{lc}</Badge></td>
                    {matrix.allEnvs.map(env => {
                      const v = matrix.grid[lc]?.[env] || 0;
                      return <td key={env} className="text-center py-2 px-3 text-slate-600">{v > 0 ? v : <span className="text-slate-300">·</span>}</td>;
                    })}
                    <td className="text-center py-2 px-3 font-semibold text-slate-800">{rowTotal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PageHeader() {
  return <ModulePageHeader brand={BRANDS.abd} Icon={LayoutDashboard} title="Assets by Design — CMDB Dashboard" subtitle="Breakdown of configuration items by lifecycle status and environment" landingPath="/AssetsByDesign" logoUrl={BRANDS.abd.logoUrl} />;
}
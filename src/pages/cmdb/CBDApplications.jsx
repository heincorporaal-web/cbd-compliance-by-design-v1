import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Boxes, Search, Plus, AppWindow, AlertCircle, CheckCircle2, Link2, RefreshCw, ShieldAlert } from "lucide-react";
import ModulePageHeader from "@/components/branding/ModulePageHeader";
import { BRANDS } from "@/lib/moduleBrands";
import CBDApplicationFormDialog from "@/components/cmdb/CBDApplicationFormDialog";
import { toast } from "sonner";

export default function CBDApplications() {
  const [companyId] = useCompanyFilter();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [critFilter, setCritFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["cbdAppRefs", companyId],
    queryFn: () => companyId ? base44.entities.CBDApplicationReference.filter({ company_id: companyId }) : [],
    enabled: !!companyId,
  });

  const { data: appRels = [] } = useQuery({
    queryKey: ["allAppCIRels", companyId],
    queryFn: () => companyId ? base44.entities.ApplicationCIRelationship.filter({ company_id: companyId }) : [],
    enabled: !!companyId,
  });

  const { data: prefs } = useQuery({
    queryKey: ["companyPrefs", companyId],
    queryFn: () => companyId ? base44.entities.CompanyPreference.filter({ company_id: companyId }) : [],
    enabled: !!companyId,
  });
  const abdEnabled = prefs?.[0]?.enable_assets_by_design === true;

  const relCountByApp = useMemo(() => {
    const m = {};
    appRels.forEach(r => { m[r.cbd_application_reference_id] = (m[r.cbd_application_reference_id] || 0) + 1; });
    return m;
  }, [appRels]);

  const filtered = useMemo(() => {
    return apps.filter(a => {
      if (search) {
        const s = search.toLowerCase();
        if (!`${a.application_name} ${a.cbd_application_id} ${a.application_owner || ""}`.toLowerCase().includes(s)) return false;
      }
      if (critFilter !== "all" && (a.business_criticality || "").toLowerCase() !== critFilter) return false;
      if (activeFilter === "active" && !a.is_active) return false;
      if (activeFilter === "inactive" && a.is_active) return false;
      return true;
    });
  }, [apps, search, critFilter, activeFilter]);

  const stats = useMemo(() => ({
    total: apps.length,
    active: apps.filter(a => a.is_active).length,
    withLinks: Object.keys(relCountByApp).length,
    withoutLinks: apps.length - Object.keys(relCountByApp).length,
  }), [apps, relCountByApp]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("syncCBDApplications", { company_id: companyId });
      const d = res.data;
      let msg = `Synced ${d.total_ict_systems} ICT system(s): ${d.created} new, ${d.updated} updated`;
      if (d.deactivated) msg += `, ${d.deactivated} deactivated`;
      if (d.write_back_skipped) msg += ". Write-back skipped — ABD not enabled.";
      else if (d.discovered_writebacks > 0) msg += `, ${d.discovered_writebacks} marked Discovered`;
      toast.success(msg);
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <ModulePageHeader brand={BRANDS.abd} Icon={Boxes} title="CBD Applications" subtitle="Read-only references to CBD ICT applications and their CI dependencies" />

      <div className="p-4 lg:p-6 space-y-4">
        {!companyId ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500">Select a company to view CBD applications.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-4"><div className="flex items-center gap-2"><AppWindow className="w-5 h-5 text-indigo-500" /><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-slate-500">Total Apps</p></div></div></Card>
              <Card className="p-4"><div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /><div><p className="text-2xl font-bold">{stats.active}</p><p className="text-xs text-slate-500">Active</p></div></div></Card>
              <Card className="p-4"><div className="flex items-center gap-2"><Link2 className="w-5 h-5 text-blue-500" /><div><p className="text-2xl font-bold">{stats.withLinks}</p><p className="text-xs text-slate-500">With CI Links</p></div></div></Card>
              <Card className="p-4"><div className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-amber-500" /><div><p className="text-2xl font-bold">{stats.withoutLinks}</p><p className="text-xs text-slate-500">Unlinked</p></div></div></Card>
            </div>

            {!abdEnabled && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-700">Assets by Design is not enabled for this company. Sync will read CBD ICT systems but <strong>cannot write back</strong> "Discovered" status. Enable ABD in company preferences to allow write-back.</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, CBD ID, owner..." className="pl-8" />
              </div>
              <Select value={critFilter} onValueChange={setCritFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Criticalities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleSync} disabled={syncing} className="gap-1.5"><RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} /> Sync from CBD</Button>
              <Button onClick={() => setShowAdd(true)} className="gap-1.5"><Plus className="w-4 h-4" /> Add Application</Button>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-slate-600">Application</th>
                      <th className="text-left px-4 py-2.5 font-medium text-slate-600">CBD ID</th>
                      <th className="text-left px-4 py-2.5 font-medium text-slate-600">Type</th>
                      <th className="text-left px-4 py-2.5 font-medium text-slate-600">Owner</th>
                      <th className="text-left px-4 py-2.5 font-medium text-slate-600">Criticality</th>
                      <th className="text-center px-4 py-2.5 font-medium text-slate-600">CIs</th>
                      <th className="text-left px-4 py-2.5 font-medium text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={7} className="text-center py-8 text-slate-400">Loading...</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-slate-400">No applications found.</td></tr>
                    ) : filtered.map(a => (
                      <tr key={a.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/CMDBApplicationDetail?id=${a.id}`)}>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{a.application_name}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{a.cbd_application_id}</td>
                        <td className="px-4 py-2.5 text-slate-600">{a.application_type || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-600">{a.application_owner || "—"}</td>
                        <td className="px-4 py-2.5">
                          {a.business_criticality && (
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                              a.business_criticality === "critical" ? "bg-red-50 text-red-700 border-red-200" :
                              a.business_criticality === "high" ? "bg-orange-50 text-orange-700 border-orange-200" :
                              a.business_criticality === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-slate-50 text-slate-600 border-slate-200"
                            }`}>{a.business_criticality}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center font-semibold text-slate-700">{relCountByApp[a.id] || 0}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${a.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                            {a.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>

      {showAdd && <CBDApplicationFormDialog open={showAdd} onOpenChange={setShowAdd} companyId={companyId} />}
    </div>
  );
}
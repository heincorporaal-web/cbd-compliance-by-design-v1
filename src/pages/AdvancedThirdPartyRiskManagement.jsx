import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  ShieldAlert, Globe, Search, Plus, ShieldCheck, Cpu, AlertCircle,
  TriangleAlert, FileCheck, Network, Lock, Power,
} from "lucide-react";
import { toast } from "sonner";
import ThirdPartyRiskDetailDialog from "@/components/tprm/ThirdPartyRiskDetailDialog";

const RATING_COLOR = {
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
};
const CRIT_COLOR = {
  critical: "bg-red-100 text-red-700 border-red-200",
  important: "bg-amber-100 text-amber-700 border-amber-200",
  supporting: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function AdvancedThirdPartyRiskManagement() {
  const [companyId] = useCompanyFilter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null);

  const effectiveCompanyId = companyId === "all" ? null : companyId;

  // Product owner = platform admin or a role flagged is_product_owner
  const { data: roles = [] } = useQuery({
    queryKey: ["userRoles"],
    queryFn: () => base44.entities.UserRole.list("-created_date", 2000),
    enabled: !!user?.custom_role_id,
  });
  const myRole = roles.find(r => r.id === user?.custom_role_id);
  const isProductOwner = user?.role === "admin" || !!myRole?.is_product_owner;

  // Company preferences (TPRM on/off flag)
  const { data: prefs = [] } = useQuery({
    queryKey: ["companyPrefs", effectiveCompanyId],
    queryFn: () => base44.entities.CompanyPreference.filter({ company_id: effectiveCompanyId }),
    enabled: !!effectiveCompanyId,
  });
  const pref = prefs[0];
  const tprmEnabled = !!pref?.enable_third_party_risk_management;

  const enableModuleMutation = useMutation({
    mutationFn: async (enable) => {
      if (pref) {
        return base44.entities.CompanyPreference.update(pref.id, { enable_third_party_risk_management: enable });
      }
      return base44.entities.CompanyPreference.create({
        company_id: effectiveCompanyId,
        enable_third_party_risk_management: enable,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["companyPrefs", effectiveCompanyId]);
      toast.success(`Advanced Third Party Risk Management ${tprmEnabled ? "disabled" : "enabled"}`);
    },
  });

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["tprmProviders", effectiveCompanyId],
    queryFn: () => effectiveCompanyId
      ? base44.entities.ThirdPartyProvider.filter({ company_id: effectiveCompanyId })
      : base44.entities.ThirdPartyProvider.list("-created_date", 500),
    enabled: !!effectiveCompanyId,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.service_type || "").toLowerCase().includes(q)
    );
  }, [providers, search]);

  const tprmCount = providers.filter(p => p.tprm_enabled).length;

  const toggleMutation = useMutation({
    mutationFn: async ({ providerId, enabled }) =>
      base44.entities.ThirdPartyProvider.update(providerId, { tprm_enabled: enabled }),
    onSuccess: () => queryClient.invalidateQueries(["tprmProviders"]),
  });

  // No company selected (admin "all")
  if (!effectiveCompanyId) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader />
        <Card className="p-10 text-center text-slate-500">
          <Globe className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">Select a specific company to manage Advanced Third Party Risk Management.</p>
          <p className="text-sm text-slate-400 mt-1">The module is switched on per company.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader />

      {/* Module toggle banner — product owner only */}
      {isProductOwner && (
        <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tprmEnabled ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Advanced Third Party Risk Management add-on</h3>
              <p className="text-sm text-slate-500">
                {tprmEnabled
                  ? "Switched on — add and track third parties for risk, controls, frameworks, processes, assets, BCP and more."
                  : "Switched off — enable the add-on to start adding and tracking third parties."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${tprmEnabled ? "text-indigo-600" : "text-slate-400"}`}>
              {tprmEnabled ? "Enabled" : "Disabled"}
            </span>
            <Switch checked={tprmEnabled} onCheckedChange={(v) => enableModuleMutation.mutate(v)} />
          </div>
        </Card>
      )}

      {!tprmEnabled ? (
        <Card className="p-10 text-center text-slate-500">
          {isProductOwner ? (
            <>
              <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Advanced Third Party Risk Management is switched off.</p>
              <p className="text-sm text-slate-400 mt-1">Enable the add-on above to start adding and tracking third parties.</p>
              <p className="text-sm text-slate-400 mt-3">You can still add and manage basic third-party records in the Third Parties register.</p>
              <Link to="/ThirdParties" className="inline-flex items-center gap-1.5 mt-3 text-sm text-indigo-600 font-medium hover:underline">
                <Plus className="w-4 h-4" /> Go to Third Parties
              </Link>
            </>
          ) : (
            <>
              <Lock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Advanced Third Party Risk Management is not enabled for your company.</p>
              <p className="text-sm text-slate-400 mt-1">
                Request activation using the Contact form in the{" "}
                <Link to="/about" className="text-indigo-600 font-medium hover:underline">About section</Link>.
              </p>
              <p className="text-sm text-slate-400 mt-3">You can still add and manage basic third-party records in the Third Parties register.</p>
              <Link to="/ThirdParties" className="inline-flex items-center gap-1.5 mt-3 text-sm text-indigo-600 font-medium hover:underline">
                <Plus className="w-4 h-4" /> Go to Third Parties
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
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search third parties…" className="pl-9" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Badge variant="secondary">{tprmCount} in TPRM</Badge>
                <Badge variant="outline">{providers.length - tprmCount} basic</Badge>
              </div>
              <Link to="/ThirdParties" className="text-sm text-indigo-600 font-medium hover:underline whitespace-nowrap">
                Add in Third Parties →
              </Link>
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="text-center text-slate-400 py-20">Loading…</div>
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center text-slate-500">
              <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No third parties found for this company.</p>
              <p className="text-sm text-slate-400 mt-1 mb-4">Add basic third-party records in the Third Parties register, then search and manage their advanced risk profile here.</p>
              <Link to="/ThirdParties">
                <Button variant="outline" className="gap-1.5">
                  <Plus className="w-4 h-4" /> Go to Third Parties
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(p => (
                <Card key={p.id} className="p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">{p.name}</h3>
                      <p className="text-xs text-slate-400 capitalize">{(p.service_type || "").replace(/_/g, " ")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={CRIT_COLOR[p.criticality] || ""}>{p.criticality}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {p.inherent_risk_rating && (
                      <Badge className={RATING_COLOR[p.inherent_risk_rating]}>Inherent: {p.inherent_risk_rating}</Badge>
                    )}
                    {p.residual_risk_rating && (
                      <Badge className={RATING_COLOR[p.residual_risk_rating]}>Residual: {p.residual_risk_rating}</Badge>
                    )}
                    {p.business_continuity_critical && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1"><ShieldCheck className="w-3 h-3" /> BCP-critical</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <Stat icon={ShieldAlert} n={p.linked_risk_ids?.length} label="risks" />
                    <Stat icon={FileCheck} n={p.linked_control_ids?.length} label="controls" />
                    <Stat icon={Network} n={p.linked_process_ids?.length} label="processes" />
                    <Stat icon={Cpu} n={p.linked_ict_system_ids?.length} label="assets" />
                    <Stat icon={AlertCircle} n={p.linked_issue_ids?.length} label="issues" />
                    <Stat icon={TriangleAlert} n={p.linked_incident_ids?.length} label="incidents" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <Switch checked={!!p.tprm_enabled} onCheckedChange={(v) => toggleMutation.mutate({ providerId: p.id, enabled: v })} />
                      TPRM tracking
                    </label>
                    <Button size="sm" onClick={() => setActive(p)} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Manage Risk Profile
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {active && (
        <ThirdPartyRiskDetailDialog provider={active} companyId={effectiveCompanyId} onClose={() => setActive(null)} />
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-rose-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
        <ShieldAlert className="w-7 h-7 text-white" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Advanced Third Party Risk Management</h1>
        <p className="text-slate-500 text-sm">Search third-party records and manage their advanced risk profiles — risks, controls, frameworks, processes, assets & BCP</p>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, n, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      {n || 0} {label}
    </span>
  );
}
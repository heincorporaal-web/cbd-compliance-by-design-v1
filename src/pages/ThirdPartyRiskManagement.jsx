import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  ShieldAlert, Globe, Power, Lock, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function ThirdPartyRiskManagement() {
  const [companyId] = useCompanyFilter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const effectiveCompanyId = companyId === "all" ? null : companyId;

  // Product owner = platform admin or a role flagged is_product_owner
  // (same convention used by the Framework Library maintainer gate).
  const { data: roles = [] } = useQuery({
    queryKey: ["userRoles"],
    queryFn: () => base44.entities.UserRole.list("-created_date", 2000),
    enabled: !!user?.custom_role_id,
  });
  const myRole = roles.find(r => r.id === user?.custom_role_id);
  const isProductOwner = user?.role === "admin" || !!myRole?.is_product_owner;

  // Company preferences (for the TPRM on/off flag)
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
                  ? "Switched on — third parties can be tracked for risk, controls, frameworks, processes, assets, BCP and more."
                  : "Switched off — only basic Supplier Management (Third Parties under Compliance) is active."}
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
              <p className="text-sm text-slate-400 mt-1">Enable the add-on above to start tracking third-party risks, controls and dependencies.</p>
            </>
          ) : (
            <>
              <Lock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Advanced Third Party Risk Management is not enabled for your company.</p>
              <p className="text-sm text-slate-400 mt-1">
                Request activation using the Contact form in the{" "}
                <Link to="/about" className="text-indigo-600 font-medium hover:underline">About section</Link>.
              </p>
            </>
          )}
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-indigo-500" />
          <p className="font-medium text-slate-700">Advanced Third Party Risk Management is enabled for this company.</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Open the module to manage third-party risk profiles, linked controls, frameworks, processes, assets and BCP.</p>
          <Link to="/AdvancedThirdPartyRiskManagement">
            <Button className="gap-2">
              Open Advanced Third Party Risk Management <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>
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
        <p className="text-slate-500 text-sm">Add-on module — activation &amp; overview</p>
      </div>
    </div>
  );
}
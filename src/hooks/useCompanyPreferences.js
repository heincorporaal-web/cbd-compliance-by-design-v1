import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Fetches CompanyPreference for a given company and exposes module toggle flags.
 * Used to conditionally show/hide add-on module features (ABD, TPRM, etc.).
 */
export function useCompanyPreferences(companyId) {
  const { data: prefs, isLoading } = useQuery({
    queryKey: ["company-preferences", companyId],
    queryFn: () =>
      base44.entities.CompanyPreference.filter({ company_id: companyId }).then((r) => r[0]),
    enabled: !!companyId,
  });

  return {
    preferences: prefs,
    isLoading,
    enableAssetsByDesign: prefs?.enable_assets_by_design ?? false,
    enableThirdPartyRiskManagement: prefs?.enable_third_party_risk_management ?? false,
    enableAdvancedProcessModelling: prefs?.enable_advanced_process_modelling ?? false,
    enableGovernanceByDesign: prefs?.enable_governance_by_design ?? false,
  };
}
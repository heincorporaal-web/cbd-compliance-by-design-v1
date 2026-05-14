/**
 * useCompanyBranding(companyId)
 *
 * Returns branding settings for a given company.
 * Use this hook in report pages to get logo, colours, and report options.
 *
 * Example:
 *   const { logo_url, brand_colors, include_logo_in_reports, report_header_text } = useCompanyBranding(companyId);
 */
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const DEFAULT_COLORS = {
  primary: "#1e40af",
  secondary: "#3b82f6",
  accent: "#0ea5e9",
  background: "#f8fafc",
  text: "#0f172a",
};

export function useCompanyBranding(companyId) {
  const { data: company } = useQuery({
    queryKey: ["company-branding", companyId],
    queryFn: () => base44.entities.Company.filter({ id: companyId }).then(r => r[0]),
    enabled: !!companyId,
  });

  return {
    logo_url: company?.logo_url || null,
    brand_colors: { ...DEFAULT_COLORS, ...(company?.brand_colors || {}) },
    include_logo_in_reports: company?.include_logo_in_reports !== false,
    report_header_text: company?.report_header_text || company?.name || "",
    report_footer_text: company?.report_footer_text || "",
    company,
  };
}
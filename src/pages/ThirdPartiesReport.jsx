import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building } from "lucide-react";
import DataListReportPage from "@/components/reports/DataListReportPage";

const ALL_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "service_type", label: "Service Type" },
  { key: "criticality", label: "Criticality" },
  { key: "risk_rating", label: "Risk Rating" },
  { key: "status", label: "Status" },
  { key: "contact_name", label: "Contact Name" },
  { key: "contact_email", label: "Contact Email" },
  { key: "contract_start_date", label: "Contract Start" },
  { key: "contract_end_date", label: "Contract End" },
  { key: "last_audit_date", label: "Last Audit" },
  { key: "next_audit_date", label: "Next Audit" },
  { key: "company_name", label: "Company" },
];
const DEFAULT_FIELDS = ["name", "service_type", "criticality", "risk_rating", "status", "contract_end_date", "company_name"];

export default function ThirdPartiesReport() {
  const [filterCompanyId, setFilterCompanyId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterServiceTypes, setFilterServiceTypes] = useState([]);
  const [filterCriticalities, setFilterCriticalities] = useState([]);
  const [filterRiskRatings, setFilterRiskRatings] = useState([]);

  const { data: providers = [] } = useQuery({ queryKey: ["thirdParties"], queryFn: () => base44.entities.ThirdPartyProvider.list() });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));

  const enriched = providers.map(p => ({ ...p, company_name: companyMap[p.company_id] || "" }));

  const allServiceTypes = useMemo(() => [...new Set(enriched.map(p => p.service_type).filter(Boolean))].sort(), [enriched]);
  const allCriticalities = useMemo(() => [...new Set(enriched.map(p => p.criticality).filter(Boolean))].sort(), [enriched]);
  const allRiskRatings = useMemo(() => [...new Set(enriched.map(p => p.risk_rating).filter(Boolean))].sort(), [enriched]);

  const filtered = enriched.filter(p => {
    if (filterCompanyId !== "all" && p.company_id !== filterCompanyId) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterServiceTypes.length && !filterServiceTypes.includes(p.service_type)) return false;
    if (filterCriticalities.length && !filterCriticalities.includes(p.criticality)) return false;
    if (filterRiskRatings.length && !filterRiskRatings.includes(p.risk_rating)) return false;
    return true;
  });

  return (
    <DataListReportPage
      title="Third Parties Report"
      icon={Building}
      allFields={ALL_FIELDS}
      defaultFields={DEFAULT_FIELDS}
      rows={filtered}
      filename="third-parties-report"
      reportTitle="Third Parties Report"
      fixedFilters={
        <>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Company</label>
            <Select value={filterCompanyId} onValueChange={setFilterCompanyId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {["active","under_review","terminated","onboarding"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </>
      }
      multiFilters={[
        { label: "Service Type", options: allServiceTypes, selected: filterServiceTypes, onChange: setFilterServiceTypes },
        { label: "Criticality", options: allCriticalities, selected: filterCriticalities, onChange: setFilterCriticalities },
        { label: "Risk Rating", options: allRiskRatings, selected: filterRiskRatings, onChange: setFilterRiskRatings },
      ]}
    />
  );
}
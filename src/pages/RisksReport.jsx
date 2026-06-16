import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert } from "lucide-react";
import DataListReportPage, { MultiValueFilter } from "@/components/reports/DataListReportPage";

const ALL_FIELDS = [
  { key: "risk_reference_nr", label: "Reference" },
  { key: "title", label: "Title", required: true },
  { key: "category", label: "Category" },
  { key: "risk_type", label: "Risk Type" },
  { key: "status", label: "Status" },
  { key: "likelihood", label: "Likelihood" },
  { key: "impact", label: "Impact" },
  { key: "inherent_risk_score", label: "Inherent Score" },
  { key: "owner", label: "Owner" },
  { key: "company_name", label: "Company" },
  { key: "review_date", label: "Review Date" },
  { key: "identified_date", label: "Identified Date" },
];
const DEFAULT_FIELDS = ["risk_reference_nr", "title", "category", "status", "likelihood", "impact", "owner", "company_name"];

export default function RisksReport() {
  const [filterCompanyId, setFilterCompanyId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterRiskTypes, setFilterRiskTypes] = useState([]);
  const [filterOwners, setFilterOwners] = useState([]);

  const { data: risks = [] } = useQuery({ queryKey: ["risks"], queryFn: () => base44.entities.Risk.list() });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));

  const enriched = risks.map(r => ({ ...r, company_name: companyMap[r.company_id] || "" }));

  const allCategories = useMemo(() => [...new Set(enriched.map(r => r.category).filter(Boolean))].sort(), [enriched]);
  const allRiskTypes = useMemo(() => [...new Set(enriched.map(r => r.risk_type).filter(Boolean))].sort(), [enriched]);
  const allOwners = useMemo(() => [...new Set(enriched.map(r => r.owner).filter(Boolean))].sort(), [enriched]);

  const filtered = enriched.filter(r => {
    if (filterCompanyId !== "all" && r.company_id !== filterCompanyId) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterCategories.length && !filterCategories.includes(r.category)) return false;
    if (filterRiskTypes.length && !filterRiskTypes.includes(r.risk_type)) return false;
    if (filterOwners.length && !filterOwners.includes(r.owner)) return false;
    return true;
  });

  return (
    <DataListReportPage
      title="Risks Report"
      icon={ShieldAlert}
      allFields={ALL_FIELDS}
      defaultFields={DEFAULT_FIELDS}
      rows={filtered}
      filename="risks-report"
      reportTitle="Risks Report"
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
                {["draft","identified","pending_review","approved","assessed","mitigated","accepted","closed"].map(s => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      }
      multiFilters={[
        { label: "Category", options: allCategories, selected: filterCategories, onChange: setFilterCategories },
        { label: "Risk Type", options: allRiskTypes, selected: filterRiskTypes, onChange: setFilterRiskTypes },
        { label: "Owner", options: allOwners, selected: filterOwners, onChange: setFilterOwners },
      ]}
    />
  );
}
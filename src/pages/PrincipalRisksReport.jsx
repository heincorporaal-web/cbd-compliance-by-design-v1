import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import DataListReportPage from "@/components/reports/DataListReportPage";

const ALL_FIELDS = [
  { key: "risk_reference", label: "Reference" },
  { key: "risk_title", label: "Title", required: true },
  { key: "risk_category", label: "Category" },
  { key: "risk_sub_category", label: "Sub-Category" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "criticality", label: "Criticality" },
  { key: "risk_owner_name", label: "Risk Owner" },
  { key: "risk_manager_name", label: "Risk Manager" },
  { key: "company_name", label: "Company" },
  { key: "review_frequency", label: "Review Frequency" },
  { key: "next_review_date", label: "Next Review" },
];
const DEFAULT_FIELDS = ["risk_reference", "risk_title", "risk_category", "status", "priority", "criticality", "risk_owner_name", "company_name"];

export default function PrincipalRisksReport() {
  const [filterCompanyId, setFilterCompanyId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterPriorities, setFilterPriorities] = useState([]);
  const [filterCriticalities, setFilterCriticalities] = useState([]);

  const { data: risks = [] } = useQuery({ queryKey: ["principalRisks"], queryFn: () => base44.entities.PrincipalRisk.list() });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));

  const enriched = risks.map(r => ({ ...r, company_name: companyMap[r.company_id] || "" }));

  const allCategories = useMemo(() => [...new Set(enriched.map(r => r.risk_category).filter(Boolean))].sort(), [enriched]);
  const allPriorities = useMemo(() => [...new Set(enriched.map(r => r.priority).filter(Boolean))].sort(), [enriched]);
  const allCriticalities = useMemo(() => [...new Set(enriched.map(r => r.criticality).filter(Boolean))].sort(), [enriched]);

  const filtered = enriched.filter(r => {
    if (filterCompanyId !== "all" && r.company_id !== filterCompanyId) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterCategories.length && !filterCategories.includes(r.risk_category)) return false;
    if (filterPriorities.length && !filterPriorities.includes(r.priority)) return false;
    if (filterCriticalities.length && !filterCriticalities.includes(r.criticality)) return false;
    return true;
  });

  return (
    <DataListReportPage
      title="Principal Risks Report"
      icon={AlertTriangle}
      allFields={ALL_FIELDS}
      defaultFields={DEFAULT_FIELDS}
      rows={filtered}
      filename="principal-risks-report"
      reportTitle="Principal Risks Report"
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
                {["Draft","Active","Under Review","Retired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </>
      }
      multiFilters={[
        { label: "Category", options: allCategories, selected: filterCategories, onChange: setFilterCategories },
        { label: "Priority", options: allPriorities, selected: filterPriorities, onChange: setFilterPriorities },
        { label: "Criticality", options: allCriticalities, selected: filterCriticalities, onChange: setFilterCriticalities },
      ]}
    />
  );
}
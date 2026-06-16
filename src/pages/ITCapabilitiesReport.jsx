import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cpu } from "lucide-react";
import DataListReportPage from "@/components/reports/DataListReportPage";

const ALL_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "category", label: "Category" },
  { key: "maturity_level", label: "Maturity Level" },
  { key: "status", label: "Status" },
  { key: "owner", label: "Owner" },
  { key: "company_name", label: "Company" },
  { key: "end_date", label: "End Date" },
  { key: "description", label: "Description" },
];
const DEFAULT_FIELDS = ["name", "category", "maturity_level", "status", "owner", "company_name"];

export default function ITCapabilitiesReport() {
  const [filterCompanyId, setFilterCompanyId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterMaturity, setFilterMaturity] = useState([]);
  const [filterOwners, setFilterOwners] = useState([]);

  const { data: capabilities = [] } = useQuery({ queryKey: ["itCapabilities"], queryFn: () => base44.entities.ITCapability.list() });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));

  const enriched = capabilities.map(c => ({ ...c, company_name: companyMap[c.company_id] || "" }));

  const allCategories = useMemo(() => [...new Set(enriched.map(c => c.category).filter(Boolean))].sort(), [enriched]);
  const allMaturity = useMemo(() => [...new Set(enriched.map(c => c.maturity_level).filter(Boolean))].sort(), [enriched]);
  const allOwners = useMemo(() => [...new Set(enriched.map(c => c.owner).filter(Boolean))].sort(), [enriched]);

  const filtered = enriched.filter(c => {
    if (filterCompanyId !== "all" && c.company_id !== filterCompanyId) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterCategories.length && !filterCategories.includes(c.category)) return false;
    if (filterMaturity.length && !filterMaturity.includes(c.maturity_level)) return false;
    if (filterOwners.length && !filterOwners.includes(c.owner)) return false;
    return true;
  });

  return (
    <DataListReportPage
      title="IT Capabilities Report"
      icon={Cpu}
      allFields={ALL_FIELDS}
      defaultFields={DEFAULT_FIELDS}
      rows={filtered}
      filename="it-capabilities-report"
      reportTitle="IT Capabilities Report"
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
                {["active","planned","retired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </>
      }
      multiFilters={[
        { label: "Category", options: allCategories, selected: filterCategories, onChange: setFilterCategories },
        { label: "Maturity Level", options: allMaturity, selected: filterMaturity, onChange: setFilterMaturity },
        { label: "Owner", options: allOwners, selected: filterOwners, onChange: setFilterOwners },
      ]}
    />
  );
}
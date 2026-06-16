import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Siren } from "lucide-react";
import DataListReportPage from "@/components/reports/DataListReportPage";

const ALL_FIELDS = [
  { key: "title", label: "Title", required: true },
  { key: "incident_type", label: "Type" },
  { key: "severity", label: "Severity" },
  { key: "status", label: "Status" },
  { key: "detected_date", label: "Detected" },
  { key: "resolved_date", label: "Resolved" },
  { key: "company_name", label: "Company" },
  { key: "reported_to_regulator", label: "Reported to Regulator" },
  { key: "regulator_reference", label: "Regulator Reference" },
];
const DEFAULT_FIELDS = ["title", "incident_type", "severity", "status", "detected_date", "company_name"];

export default function IncidentsReport() {
  const [filterCompanyId, setFilterCompanyId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTypes, setFilterTypes] = useState([]);
  const [filterSeverities, setFilterSeverities] = useState([]);

  const { data: incidents = [] } = useQuery({ queryKey: ["incidents"], queryFn: () => base44.entities.Incident.list() });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));

  const enriched = incidents.map(i => ({
    ...i,
    company_name: companyMap[i.company_id] || "",
    reported_to_regulator: i.reported_to_regulator ? "Yes" : "No",
    detected_date: i.detected_date ? String(i.detected_date).slice(0, 10) : "",
    resolved_date: i.resolved_date ? String(i.resolved_date).slice(0, 10) : "",
  }));

  const allTypes = useMemo(() => [...new Set(enriched.map(i => i.incident_type).filter(Boolean))].sort(), [enriched]);
  const allSeverities = useMemo(() => [...new Set(enriched.map(i => i.severity).filter(Boolean))].sort(), [enriched]);

  const filtered = enriched.filter(i => {
    if (filterCompanyId !== "all" && i.company_id !== filterCompanyId) return false;
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    if (filterTypes.length && !filterTypes.includes(i.incident_type)) return false;
    if (filterSeverities.length && !filterSeverities.includes(i.severity)) return false;
    return true;
  });

  return (
    <DataListReportPage
      title="Incidents Report"
      icon={Siren}
      allFields={ALL_FIELDS}
      defaultFields={DEFAULT_FIELDS}
      rows={filtered}
      filename="incidents-report"
      reportTitle="Incidents Report"
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
                {["open","investigating","resolved","closed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </>
      }
      multiFilters={[
        { label: "Type", options: allTypes, selected: filterTypes, onChange: setFilterTypes },
        { label: "Severity", options: allSeverities, selected: filterSeverities, onChange: setFilterSeverities },
      ]}
    />
  );
}
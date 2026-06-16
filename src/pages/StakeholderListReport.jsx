import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import DataListReportPage from "@/components/reports/DataListReportPage";

const ALL_FIELDS = [
  { key: "employee_number", label: "Employee Number" },
  { key: "full_name", label: "Full Name", required: true },
  { key: "email", label: "Email" },
  { key: "job_title", label: "Job Title" },
  { key: "department", label: "Department" },
  { key: "phone", label: "Phone" },
  { key: "company_name", label: "Company" },
  { key: "manager_name", label: "Reporting Manager" },
  { key: "group_names", label: "Groups" },
  { key: "status", label: "Status" },
  { key: "end_date", label: "End Date" },
];
const DEFAULT_FIELDS = ["full_name", "email", "job_title", "department", "company_name", "status"];

export default function StakeholderListReport() {
  const [filterCompanyId, setFilterCompanyId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterDepartments, setFilterDepartments] = useState([]);
  const [filterJobTitles, setFilterJobTitles] = useState([]);
  const [filterGroups, setFilterGroups] = useState([]);

  const { data: stakeholders = [] } = useQuery({ queryKey: ["stakeholders"], queryFn: () => base44.entities.Stakeholder.list() });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const { data: groups = [] } = useQuery({ queryKey: ["stakeholderGroups"], queryFn: () => base44.entities.StakeholderGroup.list() });

  const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));
  const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]));
  const stakeholderMap = Object.fromEntries(stakeholders.map(s => [s.id, s.full_name]));

  const enriched = stakeholders.map(s => ({
    ...s,
    company_name: companyMap[s.company_id] || "",
    manager_name: stakeholderMap[s.manager_id] || "",
    group_names: (s.group_ids || []).map(id => groupMap[id] || id).join(", "),
  }));

  const allDepartments = useMemo(() => [...new Set(enriched.map(s => s.department || "").filter(Boolean))].sort(), [enriched]);
  const allJobTitles = useMemo(() => [...new Set(enriched.map(s => s.job_title || "").filter(Boolean))].sort(), [enriched]);
  const allGroupNames = useMemo(() => [...new Set(enriched.flatMap(s => (s.group_ids || []).map(id => groupMap[id]).filter(Boolean)))].sort(), [enriched, groupMap]);

  const filtered = enriched.filter(s => {
    if (filterCompanyId !== "all" && s.company_id !== filterCompanyId) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (filterDepartments.length && !filterDepartments.includes(s.department || "")) return false;
    if (filterJobTitles.length && !filterJobTitles.includes(s.job_title || "")) return false;
    if (filterGroups.length && !(s.group_ids || []).some(id => filterGroups.includes(groupMap[id]))) return false;
    return true;
  });

  return (
    <DataListReportPage
      title="Stakeholder List Report"
      icon={Users}
      allFields={ALL_FIELDS}
      defaultFields={DEFAULT_FIELDS}
      rows={filtered}
      filename="stakeholder-list"
      reportTitle="Stakeholder List Report"
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      }
      multiFilters={[
        { label: "Department", options: allDepartments, selected: filterDepartments, onChange: setFilterDepartments },
        { label: "Job Title", options: allJobTitles, selected: filterJobTitles, onChange: setFilterJobTitles },
        { label: "Group", options: allGroupNames, selected: filterGroups, onChange: setFilterGroups },
      ]}
    />
  );
}
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquareWarning } from "lucide-react";
import DataListReportPage from "@/components/reports/DataListReportPage";

const ALL_FIELDS = [
  { key: "reference_number", label: "Reference" },
  { key: "title", label: "Title", required: true },
  { key: "issue_type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "assigned_to", label: "Assigned To" },
  { key: "linked_entity_type", label: "Linked Entity Type" },
  { key: "linked_entity_name", label: "Linked Entity" },
  { key: "due_date", label: "Due Date" },
  { key: "company_name", label: "Company" },
];
const DEFAULT_FIELDS = ["reference_number", "title", "issue_type", "status", "priority", "assigned_to", "due_date", "company_name"];

export default function IssuesReport() {
  const [filterCompanyId, setFilterCompanyId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTypes, setFilterTypes] = useState([]);
  const [filterPriorities, setFilterPriorities] = useState([]);
  const [filterAssignees, setFilterAssignees] = useState([]);

  const { data: issues = [] } = useQuery({ queryKey: ["issues"], queryFn: () => base44.entities.Issue.list() });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));

  const enriched = issues.map(i => ({ ...i, company_name: companyMap[i.company_id] || "" }));

  const allTypes = useMemo(() => [...new Set(enriched.map(i => i.issue_type).filter(Boolean))].sort(), [enriched]);
  const allPriorities = useMemo(() => [...new Set(enriched.map(i => i.priority).filter(Boolean))].sort(), [enriched]);
  const allAssignees = useMemo(() => [...new Set(enriched.map(i => i.assigned_to).filter(Boolean))].sort(), [enriched]);

  const filtered = enriched.filter(i => {
    if (filterCompanyId !== "all" && i.company_id !== filterCompanyId) return false;
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    if (filterTypes.length && !filterTypes.includes(i.issue_type)) return false;
    if (filterPriorities.length && !filterPriorities.includes(i.priority)) return false;
    if (filterAssignees.length && !filterAssignees.includes(i.assigned_to)) return false;
    return true;
  });

  return (
    <DataListReportPage
      title="Issues Report"
      icon={MessageSquareWarning}
      allFields={ALL_FIELDS}
      defaultFields={DEFAULT_FIELDS}
      rows={filtered}
      filename="issues-report"
      reportTitle="Issues Report"
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
                {["open","in_progress","resolved","closed"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </>
      }
      multiFilters={[
        { label: "Type", options: allTypes, selected: filterTypes, onChange: setFilterTypes },
        { label: "Priority", options: allPriorities, selected: filterPriorities, onChange: setFilterPriorities },
        { label: "Assigned To", options: allAssignees, selected: filterAssignees, onChange: setFilterAssignees },
      ]}
    />
  );
}
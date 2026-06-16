import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList } from "lucide-react";
import DataListReportPage from "@/components/reports/DataListReportPage";

const ALL_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "status", label: "Status" },
  { key: "assessment_model_name", label: "Model" },
  { key: "framework_name", label: "Framework" },
  { key: "assessor", label: "Assessor" },
  { key: "reviewer", label: "Reviewer" },
  { key: "assessment_date", label: "Assessment Date" },
  { key: "due_date", label: "Due Date" },
  { key: "completion_date", label: "Completion Date" },
  { key: "company_name", label: "Company" },
];
const DEFAULT_FIELDS = ["name", "status", "assessment_model_name", "framework_name", "assessor", "assessment_date", "company_name"];

export default function AssessmentsReport() {
  const [filterCompanyId, setFilterCompanyId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterModels, setFilterModels] = useState([]);
  const [filterFrameworks, setFilterFrameworks] = useState([]);
  const [filterAssessors, setFilterAssessors] = useState([]);

  const { data: assessments = [] } = useQuery({ queryKey: ["assessments"], queryFn: () => base44.entities.Assessment.list() });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const { data: frameworks = [] } = useQuery({ queryKey: ["frameworks"], queryFn: () => base44.entities.Framework.list() });
  const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));
  const frameworkMap = Object.fromEntries(frameworks.map(f => [f.id, f.name]));

  const enriched = assessments.map(a => ({
    ...a,
    company_name: companyMap[a.company_id] || "",
    framework_name: frameworkMap[a.framework_id] || "",
  }));

  const allModels = useMemo(() => [...new Set(enriched.map(a => a.assessment_model_name).filter(Boolean))].sort(), [enriched]);
  const allFrameworks = useMemo(() => [...new Set(enriched.map(a => a.framework_name).filter(Boolean))].sort(), [enriched]);
  const allAssessors = useMemo(() => [...new Set(enriched.map(a => a.assessor).filter(Boolean))].sort(), [enriched]);

  const filtered = enriched.filter(a => {
    if (filterCompanyId !== "all" && a.company_id !== filterCompanyId) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterModels.length && !filterModels.includes(a.assessment_model_name)) return false;
    if (filterFrameworks.length && !filterFrameworks.includes(a.framework_name)) return false;
    if (filterAssessors.length && !filterAssessors.includes(a.assessor)) return false;
    return true;
  });

  return (
    <DataListReportPage
      title="Assessments Report"
      icon={ClipboardList}
      allFields={ALL_FIELDS}
      defaultFields={DEFAULT_FIELDS}
      rows={filtered}
      filename="assessments-report"
      reportTitle="Assessments Report"
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
                {["draft","in_progress","pending_review","returned","approved","completed","overdue","archived"].map(s => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      }
      multiFilters={[
        { label: "Model", options: allModels, selected: filterModels, onChange: setFilterModels },
        { label: "Framework", options: allFrameworks, selected: filterFrameworks, onChange: setFilterFrameworks },
        { label: "Assessor", options: allAssessors, selected: filterAssessors, onChange: setFilterAssessors },
      ]}
    />
  );
}
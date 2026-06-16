import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare } from "lucide-react";
import DataListReportPage from "@/components/reports/DataListReportPage";

const ALL_FIELDS = [
  { key: "control_id", label: "Control ID" },
  { key: "title", label: "Title", required: true },
  { key: "category", label: "Category" },
  { key: "control_type", label: "Type" },
  { key: "control_execution_type", label: "Execution Type" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "control_frequency", label: "Frequency" },
  { key: "control_owner", label: "Owner" },
  { key: "framework_name", label: "Framework" },
  { key: "key_control", label: "Key Control" },
];
const DEFAULT_FIELDS = ["control_id", "title", "category", "control_type", "status", "priority", "control_owner", "framework_name"];

export default function ControlsReport() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterTypes, setFilterTypes] = useState([]);
  const [filterOwners, setFilterOwners] = useState([]);
  const [filterFrameworks, setFilterFrameworks] = useState([]);

  const { data: controls = [] } = useQuery({ queryKey: ["controls"], queryFn: () => base44.entities.Control.list() });
  const { data: frameworks = [] } = useQuery({ queryKey: ["frameworks"], queryFn: () => base44.entities.Framework.list() });
  const frameworkMap = Object.fromEntries(frameworks.map(f => [f.id, f.name]));

  const enriched = controls.map(c => ({
    ...c,
    framework_name: frameworkMap[c.framework_id] || "",
    key_control: c.key_control ? "Yes" : "No",
  }));

  const allCategories = useMemo(() => [...new Set(enriched.map(c => c.category).filter(Boolean))].sort(), [enriched]);
  const allTypes = useMemo(() => [...new Set(enriched.map(c => c.control_type).filter(Boolean))].sort(), [enriched]);
  const allOwners = useMemo(() => [...new Set(enriched.map(c => c.control_owner).filter(Boolean))].sort(), [enriched]);
  const allFrameworks = useMemo(() => [...new Set(enriched.map(c => c.framework_name).filter(Boolean))].sort(), [enriched]);

  const filtered = enriched.filter(c => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterCategories.length && !filterCategories.includes(c.category)) return false;
    if (filterTypes.length && !filterTypes.includes(c.control_type)) return false;
    if (filterOwners.length && !filterOwners.includes(c.control_owner)) return false;
    if (filterFrameworks.length && !filterFrameworks.includes(c.framework_name)) return false;
    return true;
  });

  return (
    <DataListReportPage
      title="Controls Report"
      icon={CheckSquare}
      allFields={ALL_FIELDS}
      defaultFields={DEFAULT_FIELDS}
      rows={filtered}
      filename="controls-report"
      reportTitle="Controls Report"
      fixedFilters={
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {["draft","pending_review","returned","approved","active","archived"].map(s => (
                <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      multiFilters={[
        { label: "Category", options: allCategories, selected: filterCategories, onChange: setFilterCategories },
        { label: "Type", options: allTypes, selected: filterTypes, onChange: setFilterTypes },
        { label: "Owner", options: allOwners, selected: filterOwners, onChange: setFilterOwners },
        { label: "Framework", options: allFrameworks, selected: filterFrameworks, onChange: setFilterFrameworks },
      ]}
    />
  );
}
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Download, FileText, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReportFieldSelector from "@/components/reports/ReportFieldSelector";
import { exportCSV, exportPDF } from "@/components/reports/ExportUtils";

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

function MultiValueFilter({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === 0;

  const toggle = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-700 block mb-1">{label}</label>
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-md bg-white text-sm text-slate-700 hover:bg-slate-50"
        onClick={() => setOpen(o => !o)}
      >
        <span className="truncate">{allSelected ? "All" : `${selected.length} selected`}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="mt-1 border border-slate-200 rounded-md bg-white shadow-sm max-h-48 overflow-y-auto">
          <div
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
            onClick={() => onChange([])}
          >
            <Checkbox checked={allSelected} onCheckedChange={() => onChange([])} />
            <span className="text-sm text-slate-600">All</span>
          </div>
          {options.map(opt => (
            <div
              key={opt}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
              onClick={() => toggle(opt)}
            >
              <Checkbox checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} />
              <span className="text-sm text-slate-700">{opt || "(blank)"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StakeholderListReport() {
  const [selectedFields, setSelectedFields] = useState(DEFAULT_FIELDS);
  const [filterCompanyId, setFilterCompanyId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterDepartments, setFilterDepartments] = useState([]);
  const [filterJobTitles, setFilterJobTitles] = useState([]);
  const [filterGroups, setFilterGroups] = useState([]);

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders"],
    queryFn: () => base44.entities.Stakeholder.list(),
  });
  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });
  const { data: groups = [] } = useQuery({
    queryKey: ["stakeholderGroups"],
    queryFn: () => base44.entities.StakeholderGroup.list(),
  });

  const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));
  const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]));
  const stakeholderMap = Object.fromEntries(stakeholders.map(s => [s.id, s.full_name]));

  const enriched = stakeholders.map(s => ({
    ...s,
    company_name: companyMap[s.company_id] || "",
    manager_name: stakeholderMap[s.manager_id] || "",
    group_names: (s.group_ids || []).map(id => groupMap[id] || id).join(", "),
  }));

  // Derive unique filter options from ALL enriched data
  const allDepartments = useMemo(() => [...new Set(enriched.map(s => s.department || "").filter(Boolean))].sort(), [enriched]);
  const allJobTitles = useMemo(() => [...new Set(enriched.map(s => s.job_title || "").filter(Boolean))].sort(), [enriched]);
  const allGroupNames = useMemo(() => [...new Set(enriched.flatMap(s => (s.group_ids || []).map(id => groupMap[id]).filter(Boolean)))].sort(), [enriched, groupMap]);

  const filtered = enriched.filter(s => {
    const matchesCompany = filterCompanyId === "all" || s.company_id === filterCompanyId;
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    const matchesDept = filterDepartments.length === 0 || filterDepartments.includes(s.department || "");
    const matchesTitle = filterJobTitles.length === 0 || filterJobTitles.includes(s.job_title || "");
    const matchesGroup = filterGroups.length === 0 || (s.group_ids || []).some(id => filterGroups.includes(groupMap[id]));
    return matchesCompany && matchesStatus && matchesDept && matchesTitle && matchesGroup;
  });

  const activeFields = ALL_FIELDS.filter(f => selectedFields.includes(f.key));

  const handleCSV = () => exportCSV(filtered, activeFields, "stakeholder-list.csv");
  const handlePDF = () => exportPDF(filtered, activeFields, "Stakeholder List Report");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Reports")}>
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Stakeholder List Report
              </h1>
              <p className="text-sm text-slate-500">{filtered.length} stakeholders</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCSV}>
              <FileText className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button onClick={handlePDF} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" /> Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Parameters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Column Selection</CardTitle></CardHeader>
            <CardContent>
              <ReportFieldSelector
                fields={ALL_FIELDS}
                selected={selectedFields}
                onChange={setSelectedFields}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
            <CardContent className="space-y-4">
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
              <MultiValueFilter
                label="Department"
                options={allDepartments}
                selected={filterDepartments}
                onChange={setFilterDepartments}
              />
              <MultiValueFilter
                label="Job Title"
                options={allJobTitles}
                selected={filterJobTitles}
                onChange={setFilterJobTitles}
              />
              <MultiValueFilter
                label="Group"
                options={allGroupNames}
                selected={filterGroups}
                onChange={setFilterGroups}
              />
            </CardContent>
          </Card>
        </div>

        {/* Preview Table */}
        <Card>
          <CardHeader><CardTitle className="text-base">Preview — {filtered.length} records</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    {activeFields.map(f => (
                      <th key={f.key} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 50).map((row, i) => (
                    <tr key={row.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      {activeFields.map(f => (
                        <td key={f.key} className="px-4 py-2.5 text-slate-700 border-b border-slate-100 whitespace-nowrap max-w-[200px] truncate">
                          {Array.isArray(row[f.key]) ? row[f.key].join(", ") : (row[f.key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={activeFields.length} className="text-center py-12 text-slate-400">No records match the selected filters</td></tr>
                  )}
                  {filtered.length > 50 && (
                    <tr><td colSpan={activeFields.length} className="text-center py-3 text-xs text-slate-400 bg-slate-50 border-t">Showing first 50 of {filtered.length} rows — export to see all</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
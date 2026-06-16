import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Download, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReportFieldSelector from "@/components/reports/ReportFieldSelector";
import { exportCSV, exportPDF } from "@/components/reports/ExportUtils";

/**
 * MultiValueFilter — a dropdown with checkboxes for picking specific values.
 */
export function MultiValueFilter({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === 0;

  const toggle = (val) => {
    if (selected.includes(val)) onChange(selected.filter(v => v !== val));
    else onChange([...selected, val]);
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
        <div className="mt-1 border border-slate-200 rounded-md bg-white shadow-sm max-h-48 overflow-y-auto z-10 relative">
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

/**
 * DataListReportPage — generic reusable report page shell.
 *
 * Props:
 *  title         – string, report title
 *  icon          – Lucide icon component
 *  backPage      – string, page name to link back to (default "Reports")
 *  allFields     – array of { key, label, required? }
 *  defaultFields – array of field keys selected by default
 *  rows          – the enriched/filtered source data (all records)
 *  fixedFilters  – JSX rendered above the multi-value filters (e.g. company / status selects)
 *  multiFilters  – array of { label, options, selected, onChange } for MultiValueFilter
 *  filename      – base filename for exports (no extension)
 *  reportTitle   – title used in PDF header
 */
export default function DataListReportPage({
  title,
  icon: Icon,
  backPage = "Reports",
  allFields,
  defaultFields,
  rows,
  fixedFilters,
  multiFilters = [],
  filename,
  reportTitle,
}) {
  const [selectedFields, setSelectedFields] = useState(defaultFields);
  const activeFields = allFields.filter(f => selectedFields.includes(f.key));

  const handleCSV = () => exportCSV(rows, activeFields, `${filename}.csv`);
  const handlePDF = () => exportPDF(rows, activeFields, reportTitle || title);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl(backPage)}>
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {Icon && <Icon className="w-5 h-5 text-blue-600" />} {title}
              </h1>
              <p className="text-sm text-slate-500">{rows.length} records</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column selector */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Column Selection</CardTitle></CardHeader>
            <CardContent>
              <ReportFieldSelector fields={allFields} selected={selectedFields} onChange={setSelectedFields} />
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {fixedFilters}
              {multiFilters.map(f => (
                <MultiValueFilter key={f.label} label={f.label} options={f.options} selected={f.selected} onChange={f.onChange} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Preview table */}
        <Card>
          <CardHeader><CardTitle className="text-base">Preview — {rows.length} records</CardTitle></CardHeader>
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
                  {rows.slice(0, 50).map((row, i) => (
                    <tr key={row.id ?? i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      {activeFields.map(f => (
                        <td key={f.key} className="px-4 py-2.5 text-slate-700 border-b border-slate-100 whitespace-nowrap max-w-[220px] truncate">
                          {Array.isArray(row[f.key]) ? row[f.key].join(", ") : (row[f.key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={activeFields.length} className="text-center py-12 text-slate-400">No records match the selected filters</td></tr>
                  )}
                  {rows.length > 50 && (
                    <tr><td colSpan={activeFields.length} className="text-center py-3 text-xs text-slate-400 bg-slate-50 border-t">Showing first 50 of {rows.length} rows — export to see all</td></tr>
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
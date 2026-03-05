import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertTriangle, CheckCircle2, XCircle, Info, Download } from "lucide-react";

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/['"]/g, ""));
  return lines.slice(1).map(line => {
    // handle quoted fields with commas
    const values = [];
    let cur = "", inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === "," && !inQuote) { values.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    values.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] || "").replace(/^"|"$/g, "")]));
  }).filter(row => Object.values(row).some(v => v));
}

// ─── Normalize row to Stakeholder fields ──────────────────────────────────────
function normalizeRow(row) {
  return {
    full_name: row.full_name || row.name || row.employee_name || "",
    email: row.email || row.email_address || row.work_email || "",
    employee_number: row.employee_number || row.emp_number || row.emp_no || row.employee_id || "",
    job_title: row.job_title || row.title || row.position || row.role || "",
    department: row.department || row.dept || row.business_unit || "",
    phone: row.phone || row.phone_number || row.mobile || "",
    status: detectStatus(row),
    _action: detectAction(row),
  };
}

function detectStatus(row) {
  const raw = (row.status || row.employment_status || row.hr_status || "").toLowerCase();
  if (["terminated", "inactive", "resigned", "left", "departed", "offboarded"].some(k => raw.includes(k))) return "inactive";
  return "active";
}

function detectAction(row) {
  const raw = (row.action || row.change_type || row.event_type || row.hr_action || "").toLowerCase();
  if (["terminate", "termination", "resigned", "offboard", "left"].some(k => raw.includes(k))) return "termination";
  if (["transfer", "promotion", "job change", "role change", "update"].some(k => raw.includes(k))) return "job_change";
  if (["new", "hire", "onboard", "join"].some(k => raw.includes(k))) return "new_hire";
  // fallback: detect from status
  return null;
}

function classifyAction(row, existing) {
  if (row._action) return row._action;
  if (row.status === "inactive") return "termination";
  if (existing) return "job_change";
  return "new_hire";
}

const ACTION_STYLE = {
  new_hire: { label: "New Hire", class: "bg-green-100 text-green-700" },
  job_change: { label: "Job Change", class: "bg-blue-100 text-blue-700" },
  termination: { label: "Termination", class: "bg-red-100 text-red-700" },
};

const SAMPLE_CSV = `full_name,email,employee_number,job_title,department,phone,action
Jane Smith,jane.smith@example.com,EMP001,Risk Manager,Risk & Compliance,+44 7700 900001,new_hire
John Doe,john.doe@example.com,EMP002,Process Owner,Operations,+44 7700 900002,job_change
Alice Brown,alice.brown@example.com,EMP003,Control Owner,Finance,+44 7700 900003,termination`;

// ─── Main component ───────────────────────────────────────────────────────────
export default function HRImportDialog({ open, onOpenChange }) {
  const qc = useQueryClient();
  const fileRef = useRef();
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders"],
    queryFn: () => base44.entities.Stakeholder.list(),
  });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResults(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      const normalized = parsed.map(r => normalizeRow(r));
      const enriched = normalized.map(r => {
        const existing = stakeholders.find(s => s.email?.toLowerCase() === r.email?.toLowerCase());
        return { ...r, _existing: existing, _classified: classifyAction(r, existing) };
      });
      setRows(enriched);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    const stats = { created: 0, updated: 0, terminated: 0, errors: 0 };

    for (const row of rows) {
      const { _existing, _classified, _action, ...data } = row;
      if (!data.email) { stats.errors++; continue; }
      try {
        if (_classified === "new_hire" && !_existing) {
          await base44.entities.Stakeholder.create(data);
          stats.created++;
        } else if (_existing) {
          await base44.entities.Stakeholder.update(_existing.id, {
            ...data,
            group_ids: _existing.group_ids, // preserve group assignments
          });
          if (_classified === "termination") stats.terminated++;
          else stats.updated++;
        } else {
          // email not found for non-new rows — create anyway
          await base44.entities.Stakeholder.create(data);
          stats.created++;
        }
      } catch {
        stats.errors++;
      }
    }

    qc.invalidateQueries(["stakeholders"]);
    setImporting(false);
    setResults(stats);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "hr_import_sample.csv"; a.click();
  };

  const reset = () => { setRows([]); setFileName(""); setResults(null); if (fileRef.current) fileRef.current.value = ""; };

  const counts = rows.reduce((acc, r) => {
    acc[r._classified] = (acc[r._classified] || 0) + 1;
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" /> HR Data Import
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              Upload a CSV with columns: <strong>full_name, email, employee_number, job_title, department, phone, action</strong>.
              The <strong>action</strong> column should be: <code>new_hire</code>, <code>job_change</code>, or <code>termination</code>.
              If omitted, action is inferred from the <strong>status</strong> column or email match.
            </div>
          </div>

          {/* File picker */}
          <div
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
            onClick={() => fileRef.current?.click()}
          >
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            {fileName ? (
              <p className="font-semibold text-slate-700">{fileName}</p>
            ) : (
              <>
                <p className="font-semibold text-slate-700">Click to browse CSV file</p>
                <p className="text-sm text-slate-500 mt-1">Supports .csv files</p>
              </>
            )}
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>

          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={downloadSample}>
              <Download className="w-4 h-4 mr-2" /> Download Sample CSV
            </Button>
            {rows.length > 0 && (
              <Button variant="ghost" size="sm" onClick={reset}>Clear</Button>
            )}
          </div>

          {/* Preview */}
          {rows.length > 0 && !results && (
            <div className="space-y-3">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-slate-700">{rows.length} records detected:</span>
                {counts.new_hire && <Badge className="bg-green-100 text-green-700">{counts.new_hire} New Hire{counts.new_hire > 1 ? "s" : ""}</Badge>}
                {counts.job_change && <Badge className="bg-blue-100 text-blue-700">{counts.job_change} Job Change{counts.job_change > 1 ? "s" : ""}</Badge>}
                {counts.termination && <Badge className="bg-red-100 text-red-700">{counts.termination} Termination{counts.termination > 1 ? "s" : ""}</Badge>}
              </div>

              {/* Table preview */}
              <div className="rounded-lg border border-slate-200 overflow-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Action</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Email</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Job Title</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Department</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const style = ACTION_STYLE[row._classified] || ACTION_STYLE.new_hire;
                      return (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                          <td className="px-3 py-2">
                            <Badge className={`text-xs ${style.class}`}>{style.label}</Badge>
                          </td>
                          <td className="px-3 py-2 font-medium">{row.full_name || "—"}</td>
                          <td className="px-3 py-2 text-slate-600">{row.email || <span className="text-red-500">missing</span>}</td>
                          <td className="px-3 py-2 text-slate-600">{row.job_title || "—"}</td>
                          <td className="px-3 py-2 text-slate-600">{row.department || "—"}</td>
                          <td className="px-3 py-2">
                            {row._existing ? (
                              <span className="text-green-600 font-medium">Existing</span>
                            ) : (
                              <span className="text-slate-400">New</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Warnings */}
              {rows.some(r => !r.email) && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Some rows are missing an email — they will be skipped.
                </div>
              )}
              {rows.filter(r => r._classified === "termination").length > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Terminated stakeholders will be set to <strong>Inactive</strong> and ownership alerts will be raised.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleImport} disabled={importing} className="bg-blue-600 hover:bg-blue-700">
                  {importing ? "Importing…" : `Import ${rows.length} Records`}
                </Button>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="rounded-xl border border-slate-200 p-5 space-y-4">
              <p className="font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" /> Import Complete
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{results.created}</p>
                  <p className="text-xs text-green-600 mt-1">Created</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{results.updated}</p>
                  <p className="text-xs text-blue-600 mt-1">Updated</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{results.terminated}</p>
                  <p className="text-xs text-red-600 mt-1">Terminated</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{results.errors}</p>
                  <p className="text-xs text-amber-600 mt-1">Skipped</p>
                </div>
              </div>
              {results.terminated > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>{results.terminated} stakeholder(s)</strong> have been marked inactive due to termination.
                    Review ownership assignments in Process Management, Risk Register, and ICT Systems to resolve gaps.
                  </span>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => { onOpenChange(false); reset(); }}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
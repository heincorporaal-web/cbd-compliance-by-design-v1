import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, CheckCircle2, AlertCircle, Loader2, FileText } from "lucide-react";

const CSV_COLUMNS = [
  "process_code", "name", "level", "parent_code", "description",
  "process_owner", "deputy_owner", "workstream", "status",
  "criticality", "automation_level", "frequency"
];

const TEMPLATE_ROWS = [
  ["P1", "Finance", "1", "", "Finance process group", "Jane Smith", "", "Finance", "active", "high", "manual", "monthly"],
  ["P1.1", "Accounts Payable", "2", "P1", "AP processes", "John Doe", "Alice Brown", "Finance", "active", "medium", "semi_automated", "weekly"],
  ["P1.1.1", "Invoice Processing", "3", "P1.1", "Process supplier invoices", "John Doe", "", "Finance", "active", "medium", "semi_automated", "daily"],
];

function downloadTemplate() {
  const header = CSV_COLUMNS.join(",");
  const rows = TEMPLATE_ROWS.map(r => r.map(v => `"${v}"`).join(","));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "process_definitions_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, "_"));
  const rows = lines.slice(1).map(line => {
    const values = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
  return { headers, rows };
}

export default function ProcessCSVImportDialog({ open, onOpenChange, companies }) {
  const qc = useQueryClient();
  const [companyId, setCompanyId] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows } = parseCSV(ev.target.result);
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file || !companyId) return;
    setImporting(true);
    setResult(null);

    const text = await file.text();
    const { rows } = parseCSV(text);

    // Build a map of process_code -> id for parent resolution (two passes)
    const codeToId = {};
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Sort by level so parents are created before children
    const sorted = [...rows].sort((a, b) => parseInt(a.level || 0) - parseInt(b.level || 0));

    for (const row of sorted) {
      if (!row.process_code || !row.name) {
        errors.push(`Skipped row: missing process_code or name`);
        errorCount++;
        continue;
      }

      const level = parseInt(row.level) || 0;
      const parentId = row.parent_code ? codeToId[row.parent_code] : undefined;

      const payload = {
        company_id: companyId,
        process_code: row.process_code,
        name: row.name,
        level,
        description: row.description || undefined,
        process_owner: row.process_owner || undefined,
        deputy_owner: row.deputy_owner || undefined,
        workstream: row.workstream || undefined,
        status: row.status || "active",
        criticality: row.criticality || "medium",
        automation_level: row.automation_level || "manual",
        frequency: row.frequency || undefined,
        parent_id: parentId || undefined,
      };

      try {
        const created = await base44.entities.OrgProcess.create(payload);
        codeToId[row.process_code] = created.id;
        successCount++;
      } catch (err) {
        errors.push(`Row "${row.process_code}": ${err.message || "Failed"}`);
        errorCount++;
      }
    }

    qc.invalidateQueries(["orgProcesses"]);
    setImporting(false);
    setResult({ successCount, errorCount, errors });
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setCompanyId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600" />
            Import Process Definitions
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk-import process definitions. Parents are resolved by <code className="bg-slate-100 px-1 rounded text-xs">parent_code</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Template download */}
          <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-teal-800">
              <FileText className="w-4 h-4 shrink-0" />
              <span>Download the CSV template with all supported columns</span>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="border-teal-300 text-teal-700 hover:bg-teal-100 shrink-0">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Template
            </Button>
          </div>

          {/* Column reference */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 uppercase tracking-wider">CSV Columns</Label>
            <div className="flex flex-wrap gap-1.5">
              {CSV_COLUMNS.map(col => (
                <Badge key={col} variant="outline" className="text-xs font-mono bg-slate-50">{col}</Badge>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              <strong>level</strong>: 0=Value Chain, 1=Process Group, 2=Process, 3=Sub-Process, 4=Procedure, 5=Task, 6=Activity &nbsp;|&nbsp;
              <strong>parent_code</strong>: process_code of the parent row
            </p>
          </div>

          {/* Company selector */}
          <div className="space-y-1.5">
            <Label>Target Company *</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* File picker */}
          <div className="space-y-1.5">
            <Label>CSV File *</Label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
              <Upload className="w-7 h-7 text-slate-400 mb-2" />
              <span className="text-sm text-slate-600">{file ? file.name : "Click to select a CSV file"}</span>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
            </label>
          </div>

          {/* Preview */}
          {preview && preview.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 uppercase tracking-wider">Preview (first {preview.length} rows)</Label>
              <div className="overflow-x-auto border rounded-lg">
                <table className="text-xs w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {["process_code", "name", "level", "parent_code", "process_owner"].map(col => (
                        <th key={col} className="text-left px-3 py-2 text-slate-500 font-medium">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 font-mono">{row.process_code}</td>
                        <td className="px-3 py-1.5">{row.name}</td>
                        <td className="px-3 py-1.5">{row.level}</td>
                        <td className="px-3 py-1.5 font-mono text-slate-400">{row.parent_code}</td>
                        <td className="px-3 py-1.5">{row.process_owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-4 space-y-2 ${result.errorCount === 0 ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
              <div className="flex items-center gap-2">
                {result.errorCount === 0
                  ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                  : <AlertCircle className="w-5 h-5 text-amber-600" />}
                <span className="font-semibold text-sm">
                  {result.successCount} imported successfully{result.errorCount > 0 ? `, ${result.errorCount} failed` : ""}
                </span>
              </div>
              {result.errors.length > 0 && (
                <ul className="text-xs text-amber-800 space-y-0.5 ml-7 list-disc">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={handleClose}>Close</Button>
            <Button
              onClick={handleImport}
              disabled={!file || !companyId || importing}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</> : <><Upload className="w-4 h-4 mr-2" /> Import</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, CheckCircle2, AlertCircle, Loader2, FileText, Link2 } from "lucide-react";

const MANAGEMENT_CHAINS = [
  "Customer Relationship Management",
  "Enterprise Asset Management",
  "Enterprise Governance and Shareholder",
  "Enterprise IT Management",
  "Enterprise Perfomance Management",
  "Financial Management",
  "Governance, Risk & Compliance",
  "Human Capital Management",
  "Inventory Management",
  "Product Management",
  "Strategic Planning & Direction",
];

const CSV_COLUMNS = [
  "name", "value_chain_code", "management_chain", "description",
  "sort_order", "status", "end_date",
];

const TEMPLATE_ROWS = [
  ["Acquire-to-Decommission", "EAM-ATD", "Enterprise Asset Management", "Full asset lifecycle from acquisition to decommissioning.", "10", "active", ""],
  ["Record-to-Report", "FIN-R2R", "Financial Management", "Accounting close, consolidation and external reporting.", "20", "active", ""],
  ["Hire-to-Retire", "HCM-H2R", "Human Capital Management", "End-to-end employee lifecycle.", "30", "active", ""],
  ["Plan-to-Strategy", "SPD-PLN", "Strategic Planning & Direction", "Strategic planning and enterprise direction.", "40", "active", ""],
];

function downloadTemplate() {
  const header = CSV_COLUMNS.join(",");
  const rows = TEMPLATE_ROWS.map(r => r.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(","));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "value_chains_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
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

export default function ValueChainImportDialog({ open, onOpenChange, companies, defaultCompanyId }) {
  const qc = useQueryClient();
  const [companyId, setCompanyId] = useState(defaultCompanyId || "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  React.useEffect(() => {
    if (open && !companyId) setCompanyId(defaultCompanyId || "");
  }, [open, defaultCompanyId]);

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

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const row of rows) {
      if (!row.name) {
        errors.push(`Skipped row: missing name`);
        errorCount++;
        continue;
      }
      const management_chain = MANAGEMENT_CHAINS.includes(row.management_chain) ? row.management_chain : undefined;
      const payload = {
        company_id: companyId,
        name: row.name,
        value_chain_code: row.value_chain_code || undefined,
        management_chain,
        description: row.description || undefined,
        sort_order: row.sort_order ? parseInt(row.sort_order, 10) || 0 : 0,
        status: row.status || "active",
        end_date: row.end_date || undefined,
      };

      try {
        await base44.entities.ValueChain.create(payload);
        successCount++;
      } catch (err) {
        errors.push(`Row "${row.name}": ${err.message || "Failed"}`);
        errorCount++;
      }
    }

    qc.invalidateQueries(["value-chains"]);
    setImporting(false);
    setResult({ successCount, errorCount, errors });
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setCompanyId(defaultCompanyId || "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import Value Chains
          </DialogTitle>
          <DialogDescription>
            Bulk-import value chains from a CSV file into a target company.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Template download */}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <FileText className="w-4 h-4 shrink-0" />
              <span>Download the CSV template with example value chains</span>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="border-blue-300 text-blue-700 hover:bg-blue-100 shrink-0">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Template
            </Button>
          </div>

          {/* Guidance */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <Link2 className="w-4 h-4" /> How to populate the CSV
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600 ml-6 list-disc">
              <li><strong>name</strong> — value chain name (required).</li>
              <li><strong>value_chain_code</strong> — short reference code e.g. <code>EAM-ATD</code>.</li>
              <li><strong>management_chain</strong> — initially use one of the seeded values: {MANAGEMENT_CHAINS.map(c => <span key={c} className="font-medium">{c}; </span>)} leave blank if unknown. To use a different management chain, first add it as a new Management chain option on the Value Chains screen, then update the value here to the new option.</li>
              <li><strong>sort_order</strong> — numeric sort order (defaults to 0).</li>
              <li><strong>status</strong> — <code>active</code>, <code>inactive</code>, or <code>archived</code> (defaults to active).</li>
              <li><strong>end_date</strong> — optional, format <code>YYYY-MM-DD</code>.</li>
            </ul>
          </div>

          {/* Column reference */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 uppercase tracking-wider">CSV Columns</Label>
            <div className="flex flex-wrap gap-1.5">
              {CSV_COLUMNS.map(col => (
                <Badge key={col} variant="outline" className="text-xs font-mono bg-slate-50">{col}</Badge>
              ))}
            </div>
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
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
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
                      {["name", "value_chain_code", "management_chain", "status"].map(col => (
                        <th key={col} className="text-left px-3 py-2 text-slate-500 font-medium">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5">{row.name}</td>
                        <td className="px-3 py-1.5">{row.value_chain_code || "—"}</td>
                        <td className="px-3 py-1.5">{row.management_chain || "—"}</td>
                        <td className="px-3 py-1.5">{row.status}</td>
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
                <ul className="text-xs text-amber-800 space-y-0.5 ml-7 list-disc max-h-40 overflow-y-auto">
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
              className="bg-primary hover:bg-primary/90"
            >
              {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</> : <><Upload className="w-4 h-4 mr-2" /> Import</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
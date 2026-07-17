import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, CheckCircle2, AlertCircle, Loader2, FileText, Link2 } from "lucide-react";

const BU_TYPES = [
  "Profit & Loss Unit", "Department", "Capability", "Center of Excellence",
  "Division", "Business Line", "Function", "Region", "Country",
  "Legal Entity", "Shared Services", "Project Office", "Team", "Other",
];

const CSV_COLUMNS = [
  "name", "type", "parent_name", "description",
  "owner_name", "cost_center_code", "value_chain_name",
  "workstream_name", "status", "end_date",
];

// Example rows that demonstrate each relationship type and parent linking.
// parent_name references the `name` of another row (or an existing unit) in the same company.
const TEMPLATE_ROWS = [
  ["Group Operations", "Profit & Loss Unit", "", "Top-level P&L unit that owns the consolidated result.", "", "", "", "", "active", ""],
  ["Finance Division", "Division", "Group Operations", "Finance division reporting to Group Operations.", "", "", "", "", "active", ""],
  ["Finance Department", "Department", "Finance Division", "Core finance accounting team.", "Jane Smith", "CC-1001", "", "", "active", ""],
  ["Accounts Payable", "Function", "Finance Department", "AP processing function.", "John Doe", "CC-1002", "", "", "active", ""],
  ["Financial Reporting CoE", "Center of Excellence", "Finance Division", "Reporting & consolidation Centre of Excellence.", "Alice Brown", "", "", "", "active", ""],
  ["Data Analytics Capability", "Capability", "Group Operations", "Group-wide data & analytics capability.", "", "", "Primary Value Chain", "Analytics", "active", ""],
  ["Shared Services Centre", "Shared Services", "Group Operations", "Shared back-office services across the group.", "", "", "", "", "active", ""],
];

function downloadTemplate() {
  const header = CSV_COLUMNS.join(",");
  const rows = TEMPLATE_ROWS.map(r => r.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(","));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "business_units_template.csv";
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

export default function BusinessUnitImportDialog({ open, onOpenChange, companies, defaultCompanyId }) {
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

    // Pre-load existing units (name -> id), value chains, workstreams, stakeholders
    const [existingUnits, valueChains, workstreams, stakeholders] = await Promise.all([
      base44.entities.BusinessUnit.filter({ company_id: companyId }),
      base44.entities.ValueChain.list("sort_order"),
      base44.entities.Workstream.list("sort_order"),
      base44.entities.Stakeholder.filter({ company_id: companyId }),
    ]);

    const nameToId = {};
    existingUnits.forEach(u => { nameToId[u.name.toLowerCase()] = u.id; });
    const vcByName = {};
    valueChains.forEach(vc => { vcByName[(vc.name || "").toLowerCase()] = vc.id; });
    const wsByKey = {};
    workstreams.forEach(ws => {
      wsByKey[`${(ws.name || "").toLowerCase()}|${ws.value_chain_id || ""}`] = ws.id;
      // also index by name alone for convenience when only one match
    });
    const shByName = {};
    stakeholders.forEach(s => { shByName[(s.full_name || "").toLowerCase()] = s; });

    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const pending = [...rows];

    // Multi-pass: create top-level rows first, then children once their parent exists.
    let progress = true;
    while (pending.length && progress) {
      progress = false;
      for (let i = pending.length - 1; i >= 0; i--) {
        const row = pending[i];
        if (!row.name) {
          errors.push(`Skipped row: missing name`);
          errorCount++;
          pending.splice(i, 1);
          continue;
        }
        const parentName = (row.parent_name || "").trim();
        if (parentName && !nameToId[parentName.toLowerCase()]) {
          continue; // parent not created yet — try in a later pass
        }

        const type = BU_TYPES.includes(row.type) ? row.type : "Department";
        const parentId = parentName ? nameToId[parentName.toLowerCase()] : undefined;
        const vcId = row.value_chain_name ? vcByName[(row.value_chain_name || "").toLowerCase()] : undefined;
        let wsId;
        if (row.workstream_name && vcId) {
          wsId = wsByKey[`${(row.workstream_name || "").toLowerCase()}|${vcId}`];
        }
        let ownerId, ownerName;
        if (row.owner_name) {
          const sh = shByName[(row.owner_name || "").toLowerCase()];
          if (sh) { ownerId = sh.id; ownerName = sh.full_name; }
          else { ownerName = row.owner_name; } // keep denormalized name even if no stakeholder record
        }

        const payload = {
          company_id: companyId,
          name: row.name,
          type,
          description: row.description || undefined,
          parent_id: parentId || undefined,
          value_chain_id: vcId || undefined,
          workstream_id: wsId || undefined,
          owner_stakeholder_id: ownerId || undefined,
          owner_name: ownerName || undefined,
          cost_center_code: row.cost_center_code || undefined,
          status: row.status || "active",
          end_date: row.end_date || undefined,
        };

        try {
          const created = await base44.entities.BusinessUnit.create(payload);
          nameToId[row.name.toLowerCase()] = created.id;
          successCount++;
          pending.splice(i, 1);
          progress = true;
        } catch (err) {
          errors.push(`Row "${row.name}": ${err.message || "Failed"}`);
          errorCount++;
          pending.splice(i, 1);
          progress = true;
        }
      }
    }

    // Any remaining rows have unresolved parents
    pending.forEach(row => {
      errors.push(`Row "${row.name}": parent "${row.parent_name}" not found`);
      errorCount++;
    });

    qc.invalidateQueries(["business-units"]);
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
            Import Business Units
          </DialogTitle>
          <DialogDescription>
            Bulk-import organisational units from a CSV file. Parents are linked by <code className="bg-slate-100 px-1 rounded text-xs">parent_name</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Template download */}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <FileText className="w-4 h-4 shrink-0" />
              <span>Download the CSV template with example relationships & parent links</span>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="border-blue-300 text-blue-700 hover:bg-blue-100 shrink-0">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Template
            </Button>
          </div>

          {/* Guidance */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <Link2 className="w-4 h-4" /> How to populate relationships & parents
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600 ml-6 list-disc">
              <li><strong>type</strong> — classifies the unit. Use <em>Department</em>, <em>Capability</em>, <em>Center of Excellence</em>, <em>Division</em>, <em>Function</em>, or <em>Shared Services</em> (also: Profit &amp; Loss Unit, Business Line, Region, Country, Legal Entity, Project Office, Team, Other).</li>
              <li><strong>parent_name</strong> — the <code className="bg-white px-1 rounded">name</code> of the parent unit. Leave blank for a top-level unit. The parent must already exist in the company or appear earlier in the file. Children are created after their parent automatically.</li>
              <li><strong>value_chain_name</strong> / <strong>workstream_name</strong> — optional; must match existing records. The workstream must belong to the named value chain.</li>
              <li><strong>owner_name</strong> — optional; matches an existing stakeholder's full name in the company (the stakeholder record is linked automatically).</li>
              <li><strong>status</strong> — <code>active</code>, <code>inactive</code>, or <code>archived</code> (defaults to active).</li>
              <li><strong>end_date</strong> — optional, format <code>YYYY-MM-DD</code>.</li>
            </ul>
            <p className="text-xs text-slate-500 pt-1 border-t border-slate-200">
              Tip: import top-level units (Division, P&L Unit) first, then Departments, then Functions/CoEs/Capabilities underneath — or just list them in any order; the importer resolves parents across multiple passes.
            </p>
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
                      {["name", "type", "parent_name", "owner_name", "status"].map(col => (
                        <th key={col} className="text-left px-3 py-2 text-slate-500 font-medium">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5">{row.name}</td>
                        <td className="px-3 py-1.5">{row.type}</td>
                        <td className="px-3 py-1.5 text-slate-400">{row.parent_name || "—"}</td>
                        <td className="px-3 py-1.5">{row.owner_name || "—"}</td>
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
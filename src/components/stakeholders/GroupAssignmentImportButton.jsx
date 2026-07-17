import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Upload, CheckCircle, AlertCircle, Loader2, Download } from "lucide-react";

const TEMPLATE_ROWS = [
  "EmployeeNumber;FullName;Email;JobTitle;Department;Company;ExistingGroups;RecommendedStakeholderGroup;AssignmentBasis",
  "12345;Jane Smith;jane.smith@example.com;Risk Manager;Finance;Acme Ltd;Control Owner;Risk Owner;Role alignment",
  "67890;John Doe;john.doe@example.com;IT Lead;Technology;Acme Ltd;;IT / Capability Owner;IT skill match",
];

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_ROWS.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "group_assignment_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}
import { toast } from "sonner";
import { useIsImplementerRole } from "@/hooks/useIsImplementerRole";

export default function GroupAssignmentImportButton({ onDone }) {
  const { canImport } = useIsImplementerRole();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  if (!canImport) return null;

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    const csvText = await file.text();
    const res = await base44.functions.invoke("applyStakeholderGroupAssignments", { csvText });
    setResult(res.data);
    setLoading(false);
    if (res.data?.success) {
      toast.success(`Updated ${res.data.updated} stakeholder(s)`);
      onDone?.();
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Upload className="w-4 h-4" /> Import Group Assignments
      </Button>

      <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); setFile(null); setResult(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Stakeholder Group Assignments</DialogTitle>
            <DialogDescription>
              Upload a semicolon-delimited CSV to assign stakeholders to groups. Download the template to get started.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Semicolon-delimited CSV. Groups are merged, not replaced.</p>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1 text-xs">
                <Download className="w-3 h-3" /> Template
              </Button>
            </div>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFile}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />

            {result && (
              <div className={`rounded-lg p-4 text-sm space-y-1 ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <div className="flex items-center gap-2 font-semibold">
                  {result.success
                    ? <><CheckCircle className="w-4 h-4 text-green-600" /> Import complete</>
                    : <><AlertCircle className="w-4 h-4 text-red-600" /> Import failed</>
                  }
                </div>
                <p className="text-slate-600">Stakeholders updated: <strong>{result.updated}</strong> of <strong>{result.total}</strong></p>
                {result.skippedNoStakeholder > 0 && (
                  <p className="text-amber-600">{result.skippedNoStakeholder} employee number(s) not found in the database</p>
                )}
                {result.unmatchedGroups?.length > 0 && (
                  <div className="text-amber-600">
                    <p>Unmatched group names ({result.unmatchedGroups.length}):</p>
                    <ul className="list-disc ml-4 text-xs">{result.unmatchedGroups.map(g => <li key={g}>{g}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setOpen(false); setFile(null); setResult(null); }}>
              {result ? "Close" : "Cancel"}
            </Button>
            {!result && (
              <Button onClick={handleImport} disabled={!file || loading} className="gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : "Run Import"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
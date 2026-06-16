import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function GroupAssignmentImportButton({ onDone }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

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
              Upload a semicolon-delimited CSV with columns: EmployeeNumber, FullName, Email, JobTitle, Department, Company, ExistingGroups, RecommendedStakeholderGroup, AssignmentBasis.
              Groups will be merged (not replaced) with existing assignments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
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
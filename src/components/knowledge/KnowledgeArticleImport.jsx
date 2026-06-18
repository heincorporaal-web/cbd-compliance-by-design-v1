/**
 * KnowledgeArticleImport
 * Admin-only: download a CSV template and bulk-import knowledge articles from CSV.
 */
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { Upload, Download, CheckCircle, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const TEMPLATE_HEADERS = [
  "title",
  "chapter",
  "description",
  "content",
  "category",
  "status",
  "tags",
  "framework_id",
];

const TEMPLATE_EXAMPLE = [
  "ISO 27001 Access Control Guide",
  "Access Control",
  "Implementation guide for ISO 27001 A.9 Access Control",
  "Full content of the article goes here",
  "implementation_guide",
  "draft",
  "iso27001;access control;iam",
  "",
];

const CATEGORY_OPTIONS = [
  "implementation_guide",
  "best_practice",
  "policy_template",
  "procedure",
  "checklist",
];

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "knowledge_articles_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const parseRow = (line) => {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  };
  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(l => {
    const vals = parseRow(l);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  });
  return { headers, rows };
}

function rowToArticle(row) {
  return {
    title: row.title || "",
    chapter: row.chapter || "",
    description: row.description || "",
    content: row.content || "",
    category: CATEGORY_OPTIONS.includes(row.category) ? row.category : "implementation_guide",
    status: ["draft", "published", "archived"].includes(row.status) ? row.status : "draft",
    tags: row.tags ? row.tags.split(";").map(t => t.trim()).filter(Boolean) : [],
    framework_id: row.framework_id || "",
    key_steps: [],
    attachments: [],
    pdf_url: "",
  };
}

export default function KnowledgeArticleImport() {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const fileRef = useRef();
  const queryClient = useQueryClient();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setResults(null);

    const text = await file.text();
    const { rows } = parseCSV(text);

    if (rows.length === 0) {
      setResults({ success: 0, failed: 0, errors: ["No data rows found in file."] });
      setImporting(false);
      return;
    }

    let success = 0;
    const errors = [];

    for (const row of rows) {
      const article = rowToArticle(row);
      if (!article.title) {
        errors.push(`Skipped row: missing title`);
        continue;
      }
      try {
        await base44.entities.KnowledgeArticle.create(article);
        success++;
      } catch (err) {
        errors.push(`"${article.title}": ${err.message || "Unknown error"}`);
      }
    }

    setResults({ success, failed: errors.length, errors });
    setImporting(false);
    queryClient.invalidateQueries(["knowledgeArticles"]);
    if (success > 0) toast.success(`${success} article${success > 1 ? "s" : ""} imported`);
    // Reset file input
    e.target.value = "";
  };

  const handleClose = () => {
    setOpen(false);
    setResults(null);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Upload className="w-4 h-4" /> Import CSV
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Import Knowledge Articles
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Step 1: Download template */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-1">Step 1 — Download the template</p>
              <p className="text-xs text-slate-500 mb-3">
                Fill in the CSV with your articles. Tags should be separated by semicolons (;).
                Category must be one of: <span className="font-mono">{CATEGORY_OPTIONS.join(", ")}</span>.
              </p>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                <Download className="w-4 h-4" /> Download Template
              </Button>
            </div>

            {/* Step 2: Upload */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-1">Step 2 — Upload your completed CSV</p>
              <p className="text-xs text-slate-500 mb-3">Only rows with a valid title will be imported.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="gap-2"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? "Importing…" : "Choose CSV File"}
              </Button>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-sm text-green-700 font-medium">
                    <CheckCircle className="w-4 h-4" /> {results.success} imported
                  </span>
                  {results.failed > 0 && (
                    <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
                      <AlertCircle className="w-4 h-4" /> {results.failed} failed
                    </span>
                  )}
                </div>
                {results.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-36 overflow-y-auto">
                    {results.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-700">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
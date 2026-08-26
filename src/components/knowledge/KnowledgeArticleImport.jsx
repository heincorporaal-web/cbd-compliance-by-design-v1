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
  "shortcode",
  "reference_number",
  "title",
  "chapter",
  "description",
  "content",
  "category",
  "status",
  "tags",
  "framework_id",
  "source_url",
];

const TEMPLATE_EXAMPLE = [
  "ISO",
  "ISO-IG-001",
  "ISO 27001 Access Control Guide",
  "Access Control",
  "Implementation guide for ISO 27001 A.9 Access Control",
  "Full content of the article goes here",
  "implementation_guide",
  "draft",
  "iso27001;access control;iam",
  "",
  "",
];

// Checklist template: same base columns + step columns (up to 10 steps)
const CHECKLIST_STEP_COUNT = 10;
const CHECKLIST_HEADERS = [
  ...TEMPLATE_HEADERS,
  ...Array.from({ length: CHECKLIST_STEP_COUNT }, (_, i) => [`step_${i + 1}_title`, `step_${i + 1}_description`]).flat(),
];
const CHECKLIST_EXAMPLE = [
  "GDPR",
  "GDPR-CHL-001",
  "GDPR Compliance Checklist",
  "Data Privacy",
  "Step-by-step GDPR compliance checklist",
  "Use this checklist to verify GDPR compliance",
  "checklist",
  "draft",
  "gdpr;privacy;compliance",
  "",
  "",
  "Appoint a DPO", "Designate a Data Protection Officer if required",
  "Map data flows", "Document all personal data processing activities",
  "Update privacy notice", "Ensure your privacy notice is clear and up to date",
  ...Array(CHECKLIST_STEP_COUNT * 2 - 6).fill(""),
];

// Implementation guide template: shortcode + reference_number + base columns + step columns with reference numbers and expected artefacts (up to 10 steps)
const GUIDE_STEP_COUNT = 10;
const GUIDE_HEADERS = [
  ...TEMPLATE_HEADERS,
  ...Array.from({ length: GUIDE_STEP_COUNT }, (_, i) => [
    `step_${i + 1}_title`,
    `step_${i + 1}_description`,
    `step_${i + 1}_reference_number`,
    `step_${i + 1}_expected_artefacts`,
  ]).flat(),
];
const GUIDE_EXAMPLE = [
  "AC",
  "AC-IG-001",
  "ISO 27001 Access Control Implementation Guide",
  "Access Control",
  "Implementation guide for ISO 27001 A.9 Access Control",
  "Full content of the implementation guide goes here",
  "implementation_guide",
  "draft",
  "iso27001;access control;iam",
  "",
  "",
  "Define access control policy", "Document the organisation's access control policy and review annually", "AC-001", "Access Control Policy document;Board approval",
  "Establish user registration", "Implement a formal user registration and de-registration process", "AC-002", "User provisioning procedure;HR onboarding checklist",
  "Manage privileged access", "Restrict and monitor privileged access to systems and data", "AC-003", "Privileged access matrix;PAM tool configuration",
  ...Array(GUIDE_STEP_COUNT * 4 - 12).fill(""),
];

const CATEGORY_OPTIONS = [
  "implementation_guide",
  "best_practice",
  "policy_template",
  "procedure",
  "checklist",
  "wiki_article",
];

function triggerDownload(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  triggerDownload(csv, "knowledge_articles_template.csv");
}

function downloadChecklistTemplate() {
  const rows = [CHECKLIST_HEADERS, CHECKLIST_EXAMPLE];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  triggerDownload(csv, "knowledge_checklist_template.csv");
}

function downloadImplementationGuideTemplate() {
  const rows = [GUIDE_HEADERS, GUIDE_EXAMPLE];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  triggerDownload(csv, "knowledge_implementation_guide_template.csv");
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
  const category = CATEGORY_OPTIONS.includes(row.category) ? row.category : "implementation_guide";

  // Parse step columns for checklist and implementation guide articles
  const key_steps = [];
  if (category === "checklist") {
    for (let i = 1; i <= CHECKLIST_STEP_COUNT; i++) {
      const stepTitle = (row[`step_${i}_title`] || "").trim();
      if (stepTitle) {
        key_steps.push({
          step: stepTitle,
          description: (row[`step_${i}_description`] || "").trim(),
          order: i,
        });
      }
    }
  } else if (category === "implementation_guide") {
    for (let i = 1; i <= GUIDE_STEP_COUNT; i++) {
      const stepTitle = (row[`step_${i}_title`] || "").trim();
      if (stepTitle) {
        key_steps.push({
          step: stepTitle,
          description: (row[`step_${i}_description`] || "").trim(),
          order: i,
          reference_number: (row[`step_${i}_reference_number`] || "").trim(),
          expected_artefacts: (row[`step_${i}_expected_artefacts`] || "")
            .split(";").map(a => a.trim()).filter(Boolean),
        });
      }
    }
  }

  return {
    shortcode: (row.shortcode || "").trim(),
    reference_number: (row.reference_number || "").trim(),
    title: row.title || "",
    chapter: row.chapter || "",
    description: row.description || "",
    content: row.content || "",
    category,
    status: ["draft", "published", "archived"].includes(row.status) ? row.status : "draft",
    tags: row.tags ? row.tags.split(";").map(t => t.trim()).filter(Boolean) : [],
    framework_id: row.framework_id || "",
    source_url: row.source_url || "",
    key_steps,
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
      if (!article.shortcode) {
        errors.push(`Skipped row "${article.title}": missing shortcode (required, max 4 chars)`);
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
                Fill in the CSV with your articles. <strong>shortcode</strong> is required (max 4 characters, e.g. ISO).
                Tags should be separated by semicolons (;).
                Category must be one of: <span className="font-mono">{CATEGORY_OPTIONS.join(", ")}</span>.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                  <Download className="w-4 h-4" /> General Template
                </Button>
                <Button variant="outline" size="sm" onClick={downloadImplementationGuideTemplate} className="gap-2">
                  <Download className="w-4 h-4" /> Implementation Guide Template (with steps & artefacts)
                </Button>
                <Button variant="outline" size="sm" onClick={downloadChecklistTemplate} className="gap-2">
                  <Download className="w-4 h-4" /> Checklist Template (with steps)
                </Button>
              </div>
            </div>

            {/* Step 2: Upload */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-1">Step 2 — Upload your completed CSV</p>
              <p className="text-xs text-slate-500 mb-3">Only rows with a valid title and shortcode will be imported.</p>
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
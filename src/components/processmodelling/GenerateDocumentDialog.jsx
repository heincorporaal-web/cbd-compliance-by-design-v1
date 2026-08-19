import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

const SKIP_KEYS = ["id", "created_date", "updated_date", "created_by_id"];

function formatVal(v) {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(formatVal).filter(Boolean).join(", ");
  if (typeof v === "object") {
    const vals = Object.values(v).map(formatVal).filter(Boolean);
    return vals.join(", ");
  }
  return String(v);
}

function buildContext(process, diagram, template) {
  const ctx = {};
  // Document meta fields (always available)
  ctx.process_name = diagram?.canvas_meta?.process_name || process?.name || "";
  ctx.process_code = process?.process_code || "";
  ctx.created_date = process?.created_date
    ? new Date(process.created_date).toLocaleDateString("en-GB")
    : "";
  ctx.status = template?.status || "";
  ctx.created_by = template?.created_by || "";
  ctx.template_version = template?.version_label || "";

  // Process fields
  if (process) {
    Object.keys(process).forEach((k) => {
      if (SKIP_KEYS.includes(k)) return;
      if (ctx[k] === undefined) ctx[k] = formatVal(process[k]);
    });
  }
  // Canvas-level BPMN metadata
  if (diagram?.canvas_meta) {
    Object.keys(diagram.canvas_meta).forEach((k) => {
      if (ctx[k] === undefined) ctx[k] = formatVal(diagram.canvas_meta[k]);
    });
  }
  // Flattened element metadata (first non-empty value wins)
  if (diagram?.element_meta) {
    Object.values(diagram.element_meta).forEach((em) => {
      if (em && typeof em === "object") {
        Object.keys(em).forEach((k) => {
          if (ctx[k] === undefined) ctx[k] = formatVal(em[k]);
        });
      }
    });
  }
  return ctx;
}

function mergeHtml(html, ctx) {
  return (html || "").replace(/{{\s*([a-z0-9_]+)\s*}}/gi, (m, k) =>
    ctx[k] != null ? ctx[k] : ""
  );
}

function downloadDoc(html, filename) {
  const full =
    '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
    `<head><meta charset="utf-8"><title>${filename}</title>` +
    `<style>body{font-family:'Calibri',sans-serif;font-size:11pt;line-height:1.4;color:#1e293b;} h1,h2,h3{color:#0f172a;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #cbd5e1;padding:6px 8px;font-size:10pt;} th{background:#f1f5f9;text-align:left;}</style>` +
    `</head><body>${html}</body></html>`;
  const blob = new Blob([full], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function GenerateDocumentDialog({
  open,
  onClose,
  process,
  diagram,
  companyId,
}) {
  const [templateId, setTemplateId] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["processDocTemplates", companyId],
    queryFn: () =>
      base44.entities.ProcessDocumentTemplate.filter({ company_id: companyId }),
    enabled: !!companyId && open,
  });

  const template = templates.find((t) => t.id === templateId);

  const ctx = useMemo(
    () => buildContext(process, diagram, template),
    [process, diagram, template]
  );
  const merged = useMemo(
    () => mergeHtml(template?.body_html, ctx),
    [template, ctx]
  );

  const handleDownload = () => {
    if (!template) {
      toast.error("Select a template first");
      return;
    }
    const name =
      `${process?.process_code || "process"} ${diagram?.canvas_meta?.process_name || process?.name || ""}`.trim() ||
      "process-document";
    downloadDoc(merged, name);
    toast.success("Document downloaded");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Generate Process Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Document template</Label>
            {isLoading ? (
              <p className="text-sm text-slate-400">Loading templates…</p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-slate-400">
                No templates yet — create one in the Document Templates tab.
              </p>
            ) : (
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template…" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      {t.version_label ? ` (${t.version_label})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {template && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div
                className="border rounded-lg p-4 bg-white prose prose-sm max-w-none [&_p]:my-1 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm"
                dangerouslySetInnerHTML={{ __html: merged }}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleDownload} disabled={!template} className="gap-1.5">
            <Download className="w-4 h-4" /> Download Word
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, FileText, Presentation, Printer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Exports the current page content as Word (.doc) by writing the page HTML
 * into a Word-compatible blob. Works via "Save As" from the print dialog for PPT.
 */
function exportAsWord(title) {
  const content = document.querySelector(".print-content");
  if (!content) { window.print(); return; }

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; margin: 2cm; }
    h1 { font-size: 22pt; color: #1e3a5f; }
    h2 { font-size: 15pt; color: #1e3a5f; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    h3 { font-size: 12pt; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; }
    th { background: #1e3a5f; color: white; padding: 6px 10px; font-size: 10pt; }
    td { padding: 5px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10pt; }
    .no-print { display: none; }
  </style>
</head>
<body>${content.innerHTML}</body></html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "-")}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAsPowerPoint(title) {
  // PPT export: open a simplified slides-style print view the user can print/save as PDF
  // then instruct to import into PPT. Full client-side PPTX requires a heavy library.
  const content = document.querySelector(".print-content");
  if (!content) { window.print(); return; }

  const sections = Array.from(content.querySelectorAll("h2")).map(h2 => {
    let html = `<h2>${h2.innerText}</h2>`;
    let node = h2.nextElementSibling;
    while (node && node.tagName !== "H2") {
      html += node.outerHTML;
      node = node.nextElementSibling;
    }
    return html;
  });

  const slides = sections.map((s, i) => `
    <div class="slide">
      <div class="slide-num">${i + 1} / ${sections.length}</div>
      <div class="slide-title">${title}</div>
      <div class="slide-body">${s}</div>
    </div>`).join("");

  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><title>${title} - Slides</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; margin: 0; background: #f1f5f9; }
    .slide { width: 25.4cm; min-height: 14.3cm; background: white; margin: 1cm auto;
             padding: 1.5cm; box-shadow: 0 2px 8px rgba(0,0,0,0.15); page-break-after: always;
             position: relative; }
    .slide-num { position: absolute; bottom: 0.8cm; right: 1.2cm; font-size: 9pt; color: #94a3b8; }
    .slide-title { font-size: 11pt; color: #64748b; margin-bottom: 0.5cm; font-weight: 600; }
    h2 { font-size: 18pt; color: #1e3a5f; margin: 0 0 0.5cm; }
    h3 { font-size: 13pt; color: #334155; }
    p, li { font-size: 11pt; color: #334155; }
    table { border-collapse: collapse; width: 100%; margin-top: 0.4cm; }
    th { background: #1e3a5f; color: white; padding: 5px 8px; font-size: 9pt; }
    td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; font-size: 9pt; }
    @media print { body { background: white; } .slide { margin: 0; box-shadow: none; } }
  </style></head><body>${slides}
  <div style="text-align:center;padding:1cm;color:#94a3b8;font-size:10pt">
    Print this page or Save as PDF to use as presentation slides.
  </div>
  </body></html>`);
  win.document.close();
}

export default function PerformanceExportMenu({ title = "Report" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Export
          <ChevronDown className="w-3.5 h-3.5 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Print / PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => exportAsWord(title)}>
          <FileText className="w-4 h-4 mr-2 text-blue-600" /> Export to Word
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAsPowerPoint(title)}>
          <Presentation className="w-4 h-4 mr-2 text-orange-500" /> Export to PowerPoint
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
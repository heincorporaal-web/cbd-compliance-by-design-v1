import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Printer, FileText, ChevronDown, ChevronRight, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

const levelLabels = {
  0: "Value Chain", 1: "Process Group", 2: "Process",
  3: "Sub-Process", 4: "Procedure", 5: "Task", 6: "Activity/Keystroke"
};

const criticalityColors = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const statusColors = {
  active: "bg-green-100 text-green-700",
  draft: "bg-slate-100 text-slate-600",
  archived: "bg-slate-100 text-slate-500",
  under_review: "bg-amber-100 text-amber-700",
};

function ProcessRow({ process, showColumns, depth = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const indent = depth * 20;

  return (
    <div>
      <div className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${depth > 0 ? "bg-slate-50/50" : ""}`}>
        <div className="flex items-start gap-2 p-3 print:p-2">
          {/* Level indicator */}
          <div style={{ minWidth: `${indent + 20}px` }} className="flex items-center justify-end shrink-0">
            {process._children?.length > 0 ? (
              <button onClick={() => setExpanded(v => !v)} className="p-0.5 hover:bg-slate-200 rounded print:hidden">
                {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            ) : (
              <span className="w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0 grid gap-x-4" style={{
            gridTemplateColumns: [
              "1fr", // name always shown
              showColumns.level ? "80px" : null,
              showColumns.status ? "90px" : null,
              showColumns.criticality ? "90px" : null,
              showColumns.ownership ? "140px" : null,
              showColumns.description ? "1fr" : null,
              showColumns.requirements && process.level === 3 ? "1fr" : null,
            ].filter(Boolean).join(" ")
          }}>
            {/* Name / code */}
            <div className="min-w-0">
              <span className="font-mono text-xs text-primary mr-2">{process.process_code}</span>
              <span className="font-medium text-slate-900 text-sm">{process.name}</span>
            </div>

            {showColumns.level && (
              <div className="text-xs text-slate-500 self-center">
                L{process.level}: {levelLabels[process.level]}
              </div>
            )}

            {showColumns.status && (
              <div className="self-center">
                <Badge className={`text-xs ${statusColors[process.status] || "bg-slate-100 text-slate-600"}`}>
                  {process.status?.replace(/_/g, " ")}
                </Badge>
              </div>
            )}

            {showColumns.criticality && (
              <div className="self-center">
                <Badge variant="outline" className={`text-xs ${criticalityColors[process.criticality] || ""}`}>
                  {process.criticality}
                </Badge>
              </div>
            )}

            {showColumns.ownership && (
              <div className="text-xs text-slate-600 self-center">
                {process.process_owner || process.deputy_owner ? (
                  <div>
                    {process.process_owner && <div><span className="font-medium">Owner:</span> {process.process_owner}</div>}
                    {process.deputy_owner && <div><span className="font-medium">Deputy:</span> {process.deputy_owner}</div>}
                  </div>
                ) : <span className="text-slate-400">—</span>}
              </div>
            )}

            {showColumns.description && (
              <div className="text-xs text-slate-600 self-center line-clamp-2">
                {process.description || <span className="text-slate-400">—</span>}
              </div>
            )}

            {showColumns.requirements && process.level === 3 && (
              <div className="self-center">
                {(process.minimum_requirements?.length || 0) > 0 ? (
                  <div className="space-y-1">
                    {process.minimum_requirements.map((req, i) => (
                      <div key={req.id || i} className="text-xs">
                        <span className="font-medium text-slate-700">{i + 1}. {req.requirement}</span>
                        {req.description && <span className="text-slate-500"> — {req.description}</span>}
                      </div>
                    ))}
                  </div>
                ) : <span className="text-xs text-slate-400">—</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && process._children?.map(child => (
        <ProcessRow key={child.id} process={child} showColumns={showColumns} depth={depth + 1} />
      ))}
    </div>
  );
}

function buildTree(processes) {
  const map = {};
  processes.forEach(p => { map[p.id] = { ...p, _children: [] }; });
  const roots = [];
  processes.forEach(p => {
    if (p.parent_id && map[p.parent_id]) {
      map[p.parent_id]._children.push(map[p.id]);
    } else {
      roots.push(map[p.id]);
    }
  });
  // sort children by process_code
  const sortNode = (node) => {
    node._children.sort((a, b) => (a.process_code || "").localeCompare(b.process_code || ""));
    node._children.forEach(sortNode);
    return node;
  };
  roots.sort((a, b) => (a.process_code || "").localeCompare(b.process_code || ""));
  roots.forEach(sortNode);
  return roots;
}

function exportToWord(flat, selectedCompany, filters, showColumns) {
  const esc = s => String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const wRun = (text, bold = false, color = null) => {
    const rPr = [
      bold ? "<w:b/>" : "",
      color ? `<w:color w:val="${color}"/>` : "",
      `<w:sz w:val="18"/>`,
    ].join("");
    return `<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
  };

  const wPara = (runs, styleId = null, indentTwips = 0) => {
    const pPr = [
      styleId ? `<w:pStyle w:val="${styleId}"/>` : "",
      indentTwips > 0 ? `<w:ind w:left="${indentTwips}"/>` : "",
    ].join("");
    return `<w:p><w:pPr>${pPr}</w:pPr>${runs}</w:p>`;
  };

  const wCell = (content, shaded = false) => {
    const shade = shaded ? `<w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>` : "";
    return `<w:tc><w:tcPr>${shade}<w:tcBorders><w:top w:val="single" w:sz="4" w:color="CBD5E1"/><w:left w:val="single" w:sz="4" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="4" w:color="CBD5E1"/><w:right w:val="single" w:sz="4" w:color="CBD5E1"/></w:tcBorders></w:tcPr>${content}</w:tc>`;
  };

  const wCellPara = (text, bold = false, color = null, shaded = false) =>
    wCell(wPara(wRun(text, bold, color)), shaded);

  // Determine active columns
  const activeCols = Object.entries(showColumns).filter(([, v]) => v).map(([k]) => k);
  const colLabels = { level: "Level", status: "Status", criticality: "Criticality", ownership: "Ownership", description: "Description", requirements: "Min. Requirements" };

  // Header row
  const headerCells = [
    wCellPara("Process", true, null, true),
    ...activeCols.map(k => wCellPara(colLabels[k], true, null, true)),
  ].join("");
  const headerRow = `<w:tr>${headerCells}</w:tr>`;

  // Data rows
  const dataRows = flat.map(p => {
    const indent = "  ".repeat(p._depth || 0);
    const nameText = `${indent}${p.process_code}  ${p.name}`;

    const cells = [wCell(wPara(wRun(p.process_code, true, "1D4ED8") + wRun(`  ${indent.trimEnd() ? indent : ""}${p.name}`, false, null)))];

    activeCols.forEach(k => {
      switch (k) {
        case "level":
          cells.push(wCellPara(`L${p.level}: ${levelLabels[p.level] || ""}`));
          break;
        case "status":
          cells.push(wCellPara((p.status || "").replace(/_/g, " ")));
          break;
        case "criticality":
          cells.push(wCellPara(p.criticality || "—"));
          break;
        case "ownership": {
          const lines = [
            p.process_owner ? `Owner: ${p.process_owner}` : null,
            p.deputy_owner ? `Deputy: ${p.deputy_owner}` : null,
          ].filter(Boolean).join("  ");
          cells.push(wCellPara(lines || "—"));
          break;
        }
        case "description":
          cells.push(wCellPara(p.description || "—"));
          break;
        case "requirements":
          if (p.level === 3 && p.minimum_requirements?.length) {
            const reqs = p.minimum_requirements.map((r, i) => `${i + 1}. ${r.requirement}${r.description ? " — " + r.description : ""}`).join("  ");
            cells.push(wCellPara(reqs));
          } else {
            cells.push(wCellPara("—"));
          }
          break;
        default:
          cells.push(wCellPara(""));
      }
    });

    return `<w:tr>${cells.join("")}</w:tr>`;
  }).join("");

  const colCount = 1 + activeCols.length;
  const colWidth = Math.floor(9000 / colCount);
  const gridCols = Array(colCount).fill(`<w:gridCol w:w="${colWidth}"/>`).join("");
  const table = `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:insideH w:val="single" w:sz="4" w:color="CBD5E1"/><w:insideV w:val="single" w:sz="4" w:color="CBD5E1"/></w:tblBorders></w:tblPr><w:tblGrid>${gridCols}</w:tblGrid>${headerRow}${dataRows}</w:tbl>`;

  const titlePara = wPara(wRun(`Process Report — ${selectedCompany?.name || ""}`, true, "0F172A"), null, 0).replace("<w:sz w:val=\"18\"/>", "<w:sz w:val=\"28\"/>");
  const metaParts = [
    `Generated: ${format(new Date(), "PPP")}`,
    filters.date_from ? `From: ${filters.date_from}` : null,
    filters.date_to ? `To: ${filters.date_to}` : null,
    filters.status !== "all" ? `Status: ${filters.status}` : null,
  ].filter(Boolean).join("  ·  ");
  const metaPara = wPara(wRun(metaParts, false, "64748B"));

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>
${titlePara}
${metaPara}
<w:p/>
${table}
<w:sectPr><w:pgSz w:w="15840" w:h="12240" w:orient="landscape"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr>
</w:body>
</w:document>`;

  const blob = new Blob([xml], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Process_Report_${(selectedCompany?.name || "export").replace(/\s+/g, "_")}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToPowerPoint(flat, selectedCompany, filters, showColumns) {
  const SLIDE_W = 9144000, SLIDE_H = 5143500;

  const escXml = s => String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  // Title slide
  const titleSlide = `<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="3200" b="1"/><a:t>Process Report — ${escXml(selectedCompany?.name)}</a:t></a:r></a:p></p:txBody></p:sp>
<p:sp><p:nvSpPr><p:cNvPr id="3" name="Subtitle"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="subTitle" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="1800"/><a:t>Generated: ${escXml(format(new Date(), "PPP"))}</a:t></a:r></a:p></p:txBody></p:sp>`;

  // Process slides — 8 per slide
  const chunkSize = 8;
  const chunks = [];
  for (let i = 0; i < flat.length; i += chunkSize) chunks.push(flat.slice(i, i + chunkSize));

  const dataSlides = chunks.map((chunk) => {
    const rows = chunk.map(p => {
      const indent = "  ".repeat(p._depth || 0);
      const parts = [`${indent}${p.process_code} ${p.name}`];
      if (showColumns.ownership && p.process_owner) parts.push(`  Owner: ${p.process_owner}`);
      if (showColumns.description && p.description) parts.push(`  ${p.description.slice(0, 120)}`);
      return parts.join("&#xA;");
    });

    const textRuns = rows.map(row =>
      `<a:p><a:r><a:rPr lang="en-US" sz="1000"/><a:t>${escXml(row)}</a:t></a:r></a:p>`
    ).join("");

    return `<p:sp><p:nvSpPr><p:cNvPr id="2" name="Content"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="457200" y="685800"/><a:ext cx="8229600" cy="4114800"/></a:xfrm></p:spPr>
<p:txBody><a:bodyPr/><a:lstStyle/>${textRuns}</p:txBody></p:sp>`;
  });

  const makeSlideXml = (content) =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${SLIDE_W}" cy="${SLIDE_H}"/><a:chOff x="0" y="0"/><a:chExt cx="${SLIDE_W}" cy="${SLIDE_H}"/></a:xfrm><a:grpFill><a:noFill/></a:grpFill></p:grpSpPr>${content}</p:spTree></p:cSld></p:sld>`;

  const allSlides = [makeSlideXml(titleSlide), ...dataSlides.map(makeSlideXml)];
  const slideCount = allSlides.length;

  const slideRels = allSlides.map((_, i) =>
    `<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i+1}.xml"/>`
  ).join("");

  const slideRefIds = allSlides.map((_, i) => `<p:sldId id="${256+i}" r:id="rId${i+1}"/>`).join("");

  const presXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1"><p:sldMasterIdLst/><p:sldSz cx="${SLIDE_W}" cy="${SLIDE_H}"/><p:notesSz cx="${SLIDE_H}" cy="${SLIDE_W}"/><p:sldIdLst>${slideRefIds}</p:sldIdLst></p:presentation>`;

  const slideRelXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;

  const contentTypes = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`,
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`,
    `<Default Extension="xml" ContentType="application/xml"/>`,
    `<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>`,
    ...allSlides.map((_, i) => `<Override PartName="/ppt/slides/slide${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`),
    `</Types>`
  ].join("");

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>`;

  const presRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${slideRels}</Relationships>`;

  // Build a minimal ZIP manually using a simple concatenation approach (store method)
  // We'll use a Blob with HTML fallback since real ZIP requires a library.
  // Instead we output a simple HTML that PowerPoint can open.
  const pptHtml = `<html><head><meta charset="UTF-8"><title>Process Report</title>
<style>body{font-family:Calibri,sans-serif;} .slide{page-break-after:always;padding:40px;border:1px solid #ccc;margin-bottom:20px;min-height:400px;} h1{color:#1d4ed8;} .row{padding:4px 0;font-size:12px;border-bottom:1px solid #f1f5f9;} .code{color:#1d4ed8;font-family:monospace;font-size:11px;} .indent-1{padding-left:20px;} .indent-2{padding-left:40px;} .indent-3{padding-left:60px;} .meta{font-size:10px;color:#64748b;margin-left:20px;}</style></head>
<body>
<div class="slide"><h1>Process Report — ${escXml(selectedCompany?.name)}</h1><p style="color:#64748b;">Generated: ${escXml(format(new Date(), "PPP"))}${filters.date_from ? " · From: " + filters.date_from : ""}${filters.date_to ? " · To: " + filters.date_to : ""}</p></div>
${flat.map(p => `<div class="row indent-${Math.min(p._depth||0,3)}"><span class="code">${escXml(p.process_code)}</span> <b>${escXml(p.name)}</b>${showColumns.status ? ` <span style="color:#64748b;font-size:10px;">[${p.status||""}]</span>` : ""}${showColumns.ownership && p.process_owner ? `<div class="meta">Owner: ${escXml(p.process_owner)}</div>` : ""}${showColumns.description && p.description ? `<div class="meta">${escXml(p.description.slice(0,200))}</div>` : ""}${showColumns.requirements && p.level===3 && p.minimum_requirements?.length ? `<div class="meta">${p.minimum_requirements.map((r,i)=>`${i+1}. ${escXml(r.requirement)}`).join(" | ")}</div>` : ""}</div>`).join("")}
</body></html>`;

  const blob = new Blob([pptHtml], { type: "application/vnd.ms-powerpoint" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Process_Report_${selectedCompany?.name || "export"}.ppt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Attach depth info to flattened nodes
function flattenWithDepth(nodes, depth = 0, result = []) {
  nodes.forEach(node => {
    result.push({ ...node, _depth: depth });
    if (node._children?.length) flattenWithDepth(node._children, depth + 1, result);
  });
  return result;
}

export default function ProcessCompanyReport() {
  const [filters, setFilters] = useState({
    company_id: "",
    date_from: "",
    date_to: "",
    levels: [0, 1, 2, 3, 4, 5, 6],
    status: "all",
  });
  const [showColumns, setShowColumns] = useState({
    level: true,
    status: true,
    criticality: true,
    ownership: true,
    description: true,
    requirements: true,
  });

  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const { data: allProcesses = [] } = useQuery({ queryKey: ["orgProcesses"], queryFn: () => base44.entities.OrgProcess.list() });

  const filteredProcesses = useMemo(() => {
    let result = allProcesses;

    if (filters.company_id) result = result.filter(p => p.company_id === filters.company_id);
    if (filters.status !== "all") result = result.filter(p => p.status === filters.status);
    if (filters.levels.length > 0) result = result.filter(p => filters.levels.includes(Number(p.level)));

    if (filters.date_from || filters.date_to) {
      result = result.filter(p => {
        const created = p.created_date ? new Date(p.created_date) : null;
        const updated = p.updated_date ? new Date(p.updated_date) : null;
        const date = updated || created;
        if (!date) return true;
        if (filters.date_from && date < new Date(filters.date_from)) return false;
        if (filters.date_to && date > new Date(filters.date_to + "T23:59:59")) return false;
        return true;
      });
    }

    return result;
  }, [allProcesses, filters]);

  const tree = useMemo(() => buildTree(filteredProcesses), [filteredProcesses]);

  const selectedCompany = companies.find(c => c.id === filters.company_id);

  const toggleLevel = (level) => {
    setFilters(prev => ({
      ...prev,
      levels: prev.levels.includes(level) ? prev.levels.filter(l => l !== level) : [...prev.levels, level]
    }));
  };

  const toggleColumn = (col) => {
    setShowColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Reports")}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Process Company Report</h1>
            <p className="text-slate-600">List all processes assigned to a company with ownership and requirements</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700" disabled={!filters.company_id}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2 text-slate-500" />
              Print / Save as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportToWord(flattenWithDepth(tree), selectedCompany, filters, showColumns)}>
              <FileText className="w-4 h-4 mr-2 text-blue-600" />
              Export to Word (.docx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportToPowerPoint(flattenWithDepth(tree), selectedCompany, filters, showColumns)}>
              <FileText className="w-4 h-4 mr-2 text-orange-500" />
              Export to PowerPoint (.ppt)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-lg print:hidden">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base">Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Company *</Label>
              <Select value={filters.company_id} onValueChange={v => setFilters(f => ({ ...f, company_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Active From (updated/created date)</Label>
              <Input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Active To</Label>
              <Input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Hierarchy Levels to Display</Label>
            <div className="flex flex-wrap gap-3">
              {Object.entries(levelLabels).map(([l, label]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`level-${l}`}
                    checked={filters.levels.includes(Number(l))}
                    onCheckedChange={() => toggleLevel(Number(l))}
                  />
                  <Label htmlFor={`level-${l}`} className="cursor-pointer text-sm font-normal">
                    L{l}: {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Columns to Show</Label>
            <div className="flex flex-wrap gap-3">
              {Object.entries({
                level: "Level", status: "Status", criticality: "Criticality",
                ownership: "Ownership", description: "Description", requirements: "Min. Requirements (L3)"
              }).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`col-${key}`}
                    checked={showColumns[key]}
                    onCheckedChange={() => toggleColumn(key)}
                  />
                  <Label htmlFor={`col-${key}`} className="cursor-pointer text-sm font-normal">{label}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report */}
      {!filters.company_id ? (
        <div className="text-center py-20 text-slate-500 print:hidden">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p>Select a company to generate the report</p>
        </div>
      ) : (
        <div className="print:m-0">
          {/* Print header */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Process Report — {selectedCompany?.name}</h1>
            <p className="text-slate-600 text-sm mt-1">
              Generated: {format(new Date(), "PPP")}
              {filters.date_from && ` · From: ${filters.date_from}`}
              {filters.date_to && ` · To: ${filters.date_to}`}
              {filters.status !== "all" && ` · Status: ${filters.status}`}
            </p>
          </div>

          <Card className="border-none shadow-lg print:shadow-none print:border print:border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  {selectedCompany?.name} — Processes
                </CardTitle>
                <Badge variant="outline" className="text-sm">{filteredProcesses.length} processes</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Column Headers */}
              <div className="bg-slate-50 border-b border-slate-200 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div style={{ minWidth: "20px" }} className="shrink-0" />
                  <div className="flex-1 grid gap-x-4 text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{
                    gridTemplateColumns: [
                      "1fr",
                      showColumns.level ? "80px" : null,
                      showColumns.status ? "90px" : null,
                      showColumns.criticality ? "90px" : null,
                      showColumns.ownership ? "140px" : null,
                      showColumns.description ? "1fr" : null,
                      showColumns.requirements ? "1fr" : null,
                    ].filter(Boolean).join(" ")
                  }}>
                    <span>Process</span>
                    {showColumns.level && <span>Level</span>}
                    {showColumns.status && <span>Status</span>}
                    {showColumns.criticality && <span>Criticality</span>}
                    {showColumns.ownership && <span>Ownership</span>}
                    {showColumns.description && <span>Description</span>}
                    {showColumns.requirements && <span>Min. Requirements</span>}
                  </div>
                </div>
              </div>

              {tree.length > 0 ? (
                tree.map(proc => (
                  <ProcessRow key={proc.id} process={proc} showColumns={showColumns} depth={0} />
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p>No processes found for the selected filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
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
import { ArrowLeft, Printer, FileText, User, ListChecks, ChevronDown, ChevronRight } from "lucide-react";
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
        <Button onClick={() => window.print()} className="bg-teal-600 hover:bg-teal-700">
          <Printer className="w-4 h-4 mr-2" />
          Print / Export PDF
        </Button>
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
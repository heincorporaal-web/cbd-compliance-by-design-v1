import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle, Search, Filter, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// RACI role definitions — which stakeholder group → which RACI role
const GROUP_RACI_MAP = {
  "Risk Owner":          "R",  // Responsible
  "Control Owner":       "A",  // Accountable
  "Leadership":          "A",  // Accountable
  "Process Owner":       "C",  // Consulted
  "ICT System Owners":   "C",  // Consulted
  "IT Capability Owner": "I",  // Informed
  "Policy Owner":        "I",  // Informed
  "Digital asset owner": "I",  // Informed
};

const RACI_CONFIG = {
  R: { label: "R", title: "Responsible",  bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-200" },
  A: { label: "A", title: "Accountable",  bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
  C: { label: "C", title: "Consulted",    bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-200" },
  I: { label: "I", title: "Informed",     bg: "bg-slate-100",  text: "text-slate-600",  border: "border-slate-200" },
  "?": { label: "?", title: "Unassigned", bg: "bg-red-50",     text: "text-red-500",    border: "border-red-200" },
};

const STATUS_COLORS = {
  identified:     "bg-blue-100 text-blue-700",
  pending_review: "bg-amber-100 text-amber-700",
  approved:       "bg-green-100 text-green-700",
  mitigated:      "bg-teal-100 text-teal-700",
  accepted:       "bg-purple-100 text-purple-700",
  closed:         "bg-slate-200 text-slate-600",
  draft:          "bg-slate-100 text-slate-500",
  active:         "bg-green-100 text-green-700",
  archived:       "bg-slate-200 text-slate-500",
};

export default function RACIMatrix() {
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [entityFilter, setEntityFilter] = useState("both"); // "risks" | "controls" | "both"
  const [search, setSearch] = useState("");
  const [highlightGaps, setHighlightGaps] = useState(true);

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: risks = [] } = useQuery({
    queryKey: ["risks"],
    queryFn: () => base44.entities.Risk.list(),
  });

  const { data: controls = [] } = useQuery({
    queryKey: ["controls"],
    queryFn: () => base44.entities.Control.list(),
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders"],
    queryFn: () => base44.entities.Stakeholder.list(),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["stakeholder-groups"],
    queryFn: () => base44.entities.StakeholderGroup.list(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ["frameworks"],
    queryFn: () => base44.entities.Framework.list(),
  });

  // All active group names for this company (columns)
  const companyGroups = useMemo(() => {
    const filtered = selectedCompany === "all"
      ? groups
      : groups.filter(g => g.company_id === selectedCompany || !g.company_id);
    return filtered.filter(g => g.status === "active");
  }, [groups, selectedCompany]);

  // Build rows: combine risks + controls filtered by company
  const rows = useMemo(() => {
    const result = [];

    if (entityFilter !== "controls") {
      const filteredRisks = risks.filter(r => {
        if (selectedCompany !== "all" && r.company_id !== selectedCompany) return false;
        if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      });
      filteredRisks.forEach(r => {
        // Find which stakeholder groups are assigned via owner_stakeholder_id
        const ownerStakeholder = r.owner_stakeholder_id
          ? stakeholders.find(s => s.id === r.owner_stakeholder_id)
          : null;
        const assignedGroupIds = ownerStakeholder?.group_ids || [];

        result.push({
          id: r.id,
          type: "risk",
          title: r.title,
          status: r.status,
          category: r.category,
          company_id: r.company_id,
          assignedGroupIds,
          ownerName: r.owner || null,
          detailUrl: createPageUrl(`RiskDetail?id=${r.id}`),
        });
      });
    }

    if (entityFilter !== "risks") {
      const filteredControls = controls.filter(c => {
        const fw = frameworks.find(f => f.id === c.framework_id);
        if (selectedCompany !== "all" && fw?.company_id !== selectedCompany) return false;
        if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      });
      filteredControls.forEach(c => {
        const ownerStakeholder = c.owner_stakeholder_id
          ? stakeholders.find(s => s.id === c.owner_stakeholder_id)
          : null;
        const reviewerStakeholder = c.reviewer_stakeholder_id
          ? stakeholders.find(s => s.id === c.reviewer_stakeholder_id)
          : null;
        const assignedGroupIds = [
          ...(ownerStakeholder?.group_ids || []),
          ...(reviewerStakeholder?.group_ids || []),
        ];

        result.push({
          id: c.id,
          type: "control",
          title: `${c.control_id} — ${c.title}`,
          status: c.status,
          category: c.category,
          company_id: frameworks.find(f => f.id === c.framework_id)?.company_id,
          assignedGroupIds,
          ownerName: c.approver || null,
          detailUrl: createPageUrl(`ControlDetail?id=${c.id}`),
        });
      });
    }

    return result;
  }, [risks, controls, stakeholders, frameworks, selectedCompany, entityFilter, search]);

  // For each row+group, compute the RACI cell value
  function getRaciForCell(row, group) {
    if (!row.assignedGroupIds.includes(group.id)) return null;
    return GROUP_RACI_MAP[group.name] || "C";
  }

  // Gap = row has no assigned groups at all
  const gapCount = rows.filter(r => r.assignedGroupIds.length === 0).length;

  // Summary stats
  const rCount = rows.filter(r => r.assignedGroupIds.length > 0).length;

  return (
    <TooltipProvider>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">RACI Matrix</h1>
            <p className="text-slate-500 mt-1">Responsibility assignment across Risks and Controls</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Legend */}
            {Object.entries(RACI_CONFIG).filter(([k]) => k !== "?").map(([key, cfg]) => (
              <span key={key} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                <span className="font-bold">{cfg.label}</span>
                <span className="font-normal">{cfg.title}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Total Items</p>
              <p className="text-2xl font-bold text-slate-800">{rows.length}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Assigned</p>
              <p className="text-2xl font-bold text-green-600">{rCount}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-500" /> Responsibility Gaps
              </p>
              <p className="text-2xl font-bold text-red-500">{gapCount}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Stakeholder Groups</p>
              <p className="text-2xl font-bold text-slate-800">{companyGroups.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search risks or controls…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Risks & Controls</SelectItem>
              <SelectItem value="risks">Risks Only</SelectItem>
              <SelectItem value="controls">Controls Only</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={highlightGaps ? "default" : "outline"}
            size="sm"
            onClick={() => setHighlightGaps(!highlightGaps)}
            className={highlightGaps ? "bg-red-500 hover:bg-red-600" : ""}
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            {highlightGaps ? "Gaps Highlighted" : "Highlight Gaps"}
          </Button>
        </div>

        {/* Matrix Table */}
        <Card className="border-none shadow-lg overflow-hidden">
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No items match your filters.</p>
              </div>
            ) : (
              <div className="overflow-auto max-h-[60vh]">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-800 text-white">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium min-w-[200px] sticky left-0 bg-slate-800 z-20">
                        Item
                      </th>
                      <th className="px-3 py-3 font-medium min-w-[80px] text-center bg-slate-700">Type</th>
                      <th className="px-3 py-3 font-medium min-w-[100px] text-center bg-slate-700">Status</th>
                      <th className="px-3 py-3 font-medium min-w-[130px] text-center bg-slate-700">Owner</th>
                      {companyGroups.map(g => (
                        <th
                          key={g.id}
                          className="px-2 py-3 font-medium text-center min-w-[90px] border-l border-slate-600"
                          style={{ backgroundColor: g.color ? `${g.color}33` : undefined }}
                        >
                          <div className="text-xs leading-tight">{g.name}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const isGap = row.assignedGroupIds.length === 0;
                      const rowBg = isGap && highlightGaps
                        ? "bg-red-50 hover:bg-red-100"
                        : idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-100";

                      return (
                        <tr key={`${row.type}-${row.id}`} className={`${rowBg} transition-colors border-b border-slate-100`}>
                          {/* Title */}
                          <td className={`px-4 py-3 sticky left-0 z-10 ${isGap && highlightGaps ? "bg-red-50" : idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                            <div className="flex items-center gap-2">
                              {isGap && highlightGaps && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent>No stakeholder group assigned — responsibility gap!</TooltipContent>
                                </Tooltip>
                              )}
                              <Link
                                to={row.detailUrl}
                                className="font-medium text-slate-800 hover:text-blue-600 hover:underline line-clamp-2 max-w-xs"
                              >
                                {row.title}
                              </Link>
                            </div>
                          </td>

                          {/* Type badge */}
                          <td className="px-3 py-3 text-center">
                            <Badge className={row.type === "risk"
                              ? "bg-rose-100 text-rose-700 text-xs"
                              : "bg-indigo-100 text-indigo-700 text-xs"}>
                              {row.type === "risk" ? "Risk" : "Control"}
                            </Badge>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3 text-center">
                            <Badge className={`${STATUS_COLORS[row.status] || "bg-slate-100 text-slate-600"} text-xs capitalize`}>
                              {row.status?.replace(/_/g, " ") || "—"}
                            </Badge>
                          </td>

                          {/* Owner */}
                          <td className="px-3 py-3 text-center">
                            <span className="text-xs text-slate-600 truncate max-w-[120px] block">
                              {row.ownerName || <span className="text-slate-300 italic">None</span>}
                            </span>
                          </td>

                          {/* RACI cells per group */}
                          {companyGroups.map(g => {
                            const raci = getRaciForCell(row, g);
                            const cfg = raci ? RACI_CONFIG[raci] : null;
                            return (
                              <td key={g.id} className="px-2 py-3 text-center border-l border-slate-100">
                                {cfg ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs border cursor-default ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                        {cfg.label}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-semibold">{g.name}</p>
                                      <p className="text-xs">{cfg.title}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="text-slate-200">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gap analysis summary */}
        {gapCount > 0 && highlightGaps && (
          <Card className="border border-red-200 bg-red-50 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-700">{gapCount} responsibility gap{gapCount > 1 ? "s" : ""} detected</p>
                  <p className="text-sm text-red-600 mt-1">
                    The following items have no stakeholder group assigned. Assign a Risk Owner or Control Owner to resolve these gaps:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {rows.filter(r => r.assignedGroupIds.length === 0).slice(0, 8).map(r => (
                      <li key={r.id} className="text-sm">
                        <Link to={r.detailUrl} className="text-red-700 hover:underline font-medium">
                          {r.title}
                        </Link>
                        <Badge className={`ml-2 text-xs ${r.type === "risk" ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"}`}>
                          {r.type}
                        </Badge>
                      </li>
                    ))}
                    {rows.filter(r => r.assignedGroupIds.length === 0).length > 8 && (
                      <li className="text-xs text-red-400">…and {rows.filter(r => r.assignedGroupIds.length === 0).length - 8} more</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search, Eye, Pencil, GitBranch, Cpu, Filter, X,
} from "lucide-react";

const LEVELS = [0, 1, 2, 3, 4, 5, 6];

export default function ProcessDiagramList({ processes, isLoading, onView, onEdit }) {
  const [nameQuery, setNameQuery] = useState("");
  const [codeQuery, setCodeQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  const hasFilters = nameQuery.trim() || codeQuery.trim() || levelFilter !== "all";

  const filtered = useMemo(() => {
    const name = nameQuery.trim().toLowerCase();
    const code = codeQuery.trim().toLowerCase();
    return processes.filter((p) => {
      if (levelFilter !== "all" && Number(p.level) !== Number(levelFilter)) return false;
      if (name && !(p.name || "").toLowerCase().includes(name)) return false;
      if (code && !(p.process_code || "").toLowerCase().includes(code)) return false;
      return true;
    });
  }, [processes, nameQuery, codeQuery, levelFilter]);

  const clearFilters = () => {
    setNameQuery("");
    setCodeQuery("");
    setLevelFilter("all");
  };

  return (
    <div className="space-y-4">
      {/* Extended search bar */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Filter className="w-4 h-4" /> Search &amp; filter
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Process name…"
              className="pl-9"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={codeQuery}
              onChange={(e) => setCodeQuery(e.target.value)}
              placeholder="Activity number (e.g. P1.2)…"
              className="pl-9"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {filtered.length} of {processes.length} processes
            {hasFilters && (
              <button onClick={clearFilters} className="ml-2 inline-flex items-center gap-1 text-indigo-600 hover:underline">
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </span>
        </div>
      </Card>

      {/* Compact list */}
      {isLoading ? (
        <div className="text-center text-slate-400 py-20">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">
          <Cpu className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No processes match your search.</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            {hasFilters
              ? "Try adjusting or clearing the filters above."
              : "Add processes in Process Management first, then design their BPMN 2.0 diagrams here."}
          </p>
          <Link to="/ProcessManagement">
            <button className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline">
              <GitBranch className="w-4 h-4" /> Go to Process Management
            </button>
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[2fr_1fr_1fr_auto_auto] gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 bg-slate-50 border-b border-slate-200">
            <div>Process</div>
            <div className="hidden md:block">Level</div>
            <div className="hidden md:block">Code</div>
            <div className="text-center">View</div>
            <div className="text-center">Edit</div>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[2fr_1fr_1fr_auto_auto] gap-2 px-3 py-2.5 items-center hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{p.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {p.criticality && (
                      <Badge variant="outline" className="capitalize text-[10px] py-0 px-1.5">{p.criticality}</Badge>
                    )}
                    {(p.linked_risk_ids?.length || 0) > 0 && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] py-0 px-1.5">{p.linked_risk_ids.length} risks</Badge>
                    )}
                    {(p.linked_control_ids?.length || 0) > 0 && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0 px-1.5">{p.linked_control_ids.length} controls</Badge>
                    )}
                    {(p.linked_system_ids?.length || 0) > 0 && (
                      <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] py-0 px-1.5">{p.linked_system_ids.length} systems</Badge>
                    )}
                  </div>
                </div>
                <div className="hidden md:block">
                  <Badge variant="outline">L{p.level}</Badge>
                </div>
                <div className="hidden md:block text-xs font-mono text-slate-500 truncate">{p.process_code}</div>
                <div className="flex justify-center">
                  <button
                    onClick={() => onView(p)}
                    title="View diagram"
                    className="p-2 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => onEdit(p)}
                    title="Edit / design diagram"
                    className="p-2 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
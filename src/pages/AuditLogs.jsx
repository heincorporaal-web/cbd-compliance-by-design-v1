import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText, Search, User, Clock, Activity, ArrowRight,
  ShieldAlert, Shield, CheckCircle, AlertTriangle, RotateCcw,
  Eye, Download, Filter
} from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft:          { color: "bg-slate-100 text-slate-600",   label: "Draft" },
  identified:     { color: "bg-blue-100 text-blue-700",     label: "Identified" },
  pending_review: { color: "bg-amber-100 text-amber-700",   label: "Pending Review" },
  returned:       { color: "bg-orange-100 text-orange-700", label: "Returned" },
  approved:       { color: "bg-green-100 text-green-700",   label: "Approved" },
  assessed:       { color: "bg-teal-100 text-teal-700",     label: "Assessed" },
  mitigated:      { color: "bg-teal-100 text-teal-700",     label: "Mitigated" },
  accepted:       { color: "bg-purple-100 text-purple-700", label: "Accepted" },
  closed:         { color: "bg-slate-200 text-slate-600",   label: "Closed" },
  active:         { color: "bg-green-100 text-green-700",   label: "Active" },
  archived:       { color: "bg-slate-200 text-slate-500",   label: "Archived" },
};

const ACTION_CONFIG = {
  create:  { color: "bg-green-100 text-green-700",  label: "Created",  icon: "+" },
  update:  { color: "bg-blue-100 text-blue-700",    label: "Updated",  icon: "✎" },
  delete:  { color: "bg-red-100 text-red-700",      label: "Deleted",  icon: "×" },
  login:   { color: "bg-purple-100 text-purple-700", label: "Login",   icon: "→" },
  logout:  { color: "bg-slate-100 text-slate-600",  label: "Logout",   icon: "←" },
  export:  { color: "bg-amber-100 text-amber-700",  label: "Export",   icon: "↓" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: "bg-slate-100 text-slate-500", label: status };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cfg.color}`}>
      {cfg.label || status?.replace(/_/g, " ")}
    </span>
  );
}

// ─── Build unified timeline entries from Risk/Control history ─────────────────
function buildStatusEntries(risks, controls) {
  const entries = [];

  risks.forEach(risk => {
    (risk.workflow_status_history || []).forEach((h, idx) => {
      entries.push({
        id: `risk-${risk.id}-${idx}`,
        type: "status_transition",
        entity_type: "Risk",
        entity_id: risk.id,
        entity_name: risk.title,
        status: h.status,
        prev_status: idx > 0 ? risk.workflow_status_history[idx - 1].status : null,
        actor: h.actor || "system",
        timestamp: h.timestamp,
        comments: h.comments,
        detail_url: createPageUrl(`RiskDetail?id=${risk.id}`),
        category: risk.category,
      });
    });
    // If no history but has a status, create a synthetic "created" entry
    if ((!risk.workflow_status_history || risk.workflow_status_history.length === 0) && risk.status) {
      entries.push({
        id: `risk-${risk.id}-created`,
        type: "status_transition",
        entity_type: "Risk",
        entity_id: risk.id,
        entity_name: risk.title,
        status: risk.status,
        prev_status: null,
        actor: risk.created_by || "system",
        timestamp: risk.created_date,
        comments: "Risk created",
        detail_url: createPageUrl(`RiskDetail?id=${risk.id}`),
        category: risk.category,
      });
    }
  });

  controls.forEach(ctrl => {
    (ctrl.workflow_status_history || []).forEach((h, idx) => {
      entries.push({
        id: `ctrl-${ctrl.id}-${idx}`,
        type: "status_transition",
        entity_type: "Control",
        entity_id: ctrl.id,
        entity_name: `${ctrl.control_id} — ${ctrl.title}`,
        status: h.status,
        prev_status: idx > 0 ? ctrl.workflow_status_history[idx - 1].status : null,
        actor: h.actor || "system",
        timestamp: h.timestamp,
        comments: h.comments,
        detail_url: createPageUrl(`ControlDetail?id=${ctrl.id}`),
        category: ctrl.category,
      });
    });
    if ((!ctrl.workflow_status_history || ctrl.workflow_status_history.length === 0) && ctrl.status) {
      entries.push({
        id: `ctrl-${ctrl.id}-created`,
        type: "status_transition",
        entity_type: "Control",
        entity_id: ctrl.id,
        entity_name: `${ctrl.control_id} — ${ctrl.title}`,
        status: ctrl.status,
        prev_status: null,
        actor: ctrl.created_by || "system",
        timestamp: ctrl.created_date,
        comments: "Control created",
        detail_url: createPageUrl(`ControlDetail?id=${ctrl.id}`),
        category: ctrl.category,
      });
    }
  });

  return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ─── Timeline entry row ───────────────────────────────────────────────────────
function TimelineRow({ entry }) {
  const entityColor = entry.entity_type === "Risk"
    ? "bg-rose-100 text-rose-700"
    : "bg-indigo-100 text-indigo-700";

  return (
    <div className="flex gap-4 py-4 px-5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      {/* Timeline dot */}
      <div className="flex flex-col items-center pt-1">
        <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
          entry.entity_type === "Risk" ? "bg-rose-400" : "bg-indigo-400"
        }`} />
        <div className="w-px flex-1 bg-slate-200 mt-1" />
      </div>

      <div className="flex-1 min-w-0 pb-1">
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge className={`text-xs ${entityColor}`}>{entry.entity_type}</Badge>
          <Link
            to={entry.detail_url}
            className="font-medium text-slate-800 hover:text-blue-600 hover:underline truncate max-w-sm text-sm"
          >
            {entry.entity_name}
          </Link>
        </div>

        {/* Status transition */}
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {entry.prev_status ? (
            <>
              <StatusBadge status={entry.prev_status} />
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <StatusBadge status={entry.status} />
            </>
          ) : (
            <StatusBadge status={entry.status} />
          )}
        </div>

        {/* Actor + time + comment */}
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {entry.actor}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {entry.timestamp ? format(new Date(entry.timestamp), "MMM dd, yyyy HH:mm") : "—"}
          </span>
          {entry.category && (
            <span className="capitalize text-slate-400">{entry.category.replace(/_/g, " ")}</span>
          )}
        </div>

        {entry.comments && (
          <p className="mt-1.5 text-xs text-slate-500 italic">{entry.comments}</p>
        )}
      </div>
    </div>
  );
}

// ─── AuditLog row ──────────────────────────────────────────────────────────────
function AuditRow({ log }) {
  const cfg = ACTION_CONFIG[log.action] || { color: "bg-slate-100 text-slate-600", label: log.action, icon: "•" };
  return (
    <div className="flex gap-4 py-4 px-5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <div className="flex flex-col items-center pt-1">
        <div className="w-2.5 h-2.5 rounded-full mt-1 bg-slate-400 shrink-0" />
        <div className="w-px flex-1 bg-slate-200 mt-1" />
      </div>

      <div className="flex-1 min-w-0 pb-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge className={`text-xs ${cfg.color}`}>{cfg.icon} {cfg.label}</Badge>
          <Badge variant="outline" className="text-xs">{log.entity_type}</Badge>
          {log.entity_name && (
            <span className="text-sm font-medium text-slate-700 truncate max-w-sm">{log.entity_name}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {log.user_name || log.user_email}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {log.created_date ? format(new Date(log.created_date), "MMM dd, yyyy HH:mm:ss") : "—"}
          </span>
          {log.ip_address && <span>IP: {log.ip_address}</span>}
        </div>

        {log.changes && (
          <details className="mt-2">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">View changes</summary>
            <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              {log.changes.before && (
                <div>
                  <p className="font-medium text-slate-600 mb-1">Before</p>
                  <pre className="text-slate-500 overflow-auto whitespace-pre-wrap">{JSON.stringify(log.changes.before, null, 2)}</pre>
                </div>
              )}
              {log.changes.after && (
                <div>
                  <p className="font-medium text-slate-600 mb-1">After</p>
                  <pre className="text-slate-500 overflow-auto whitespace-pre-wrap">{JSON.stringify(log.changes.after, null, 2)}</pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterActor, setFilterActor] = useState("");

  const { data: risks = [] } = useQuery({
    queryKey: ["audit-risks"],
    queryFn: () => base44.entities.Risk.list("-updated_date", 500),
  });

  const { data: controls = [] } = useQuery({
    queryKey: ["audit-controls"],
    queryFn: () => base44.entities.Control.list("-updated_date", 500),
  });

  const { data: auditLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => base44.entities.AuditLog.list("-created_date", 500),
  });

  const statusEntries = useMemo(() => buildStatusEntries(risks, controls), [risks, controls]);

  // Filter status entries
  const filteredStatusEntries = useMemo(() => {
    const cutoff = filterPeriod !== "all"
      ? subDays(new Date(), Number(filterPeriod))
      : null;

    return statusEntries.filter(e => {
      if (filterEntity !== "all" && e.entity_type !== filterEntity) return false;
      if (filterStatus !== "all" && e.status !== filterStatus) return false;
      if (filterActor && !e.actor?.toLowerCase().includes(filterActor.toLowerCase())) return false;
      if (cutoff && !isAfter(new Date(e.timestamp), cutoff)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.entity_name?.toLowerCase().includes(q) &&
            !e.actor?.toLowerCase().includes(q) &&
            !e.comments?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [statusEntries, filterEntity, filterStatus, filterActor, filterPeriod, search]);

  // Filter audit logs
  const filteredAuditLogs = useMemo(() => {
    const cutoff = filterPeriod !== "all"
      ? subDays(new Date(), Number(filterPeriod))
      : null;

    return auditLogs.filter(log => {
      if (filterEntity !== "all") {
        if (filterEntity === "Risk" && log.entity_type !== "Risk") return false;
        if (filterEntity === "Control" && log.entity_type !== "Control") return false;
      }
      if (cutoff && !isAfter(new Date(log.created_date), cutoff)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!log.entity_name?.toLowerCase().includes(q) &&
            !log.user_name?.toLowerCase().includes(q) &&
            !log.user_email?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [auditLogs, filterEntity, filterPeriod, search]);

  // Stats
  const riskTransitions = statusEntries.filter(e => e.entity_type === "Risk").length;
  const controlTransitions = statusEntries.filter(e => e.entity_type === "Control").length;
  const pendingReviewCount = statusEntries.filter(e => e.status === "pending_review").length;
  const approvedCount = statusEntries.filter(e => e.status === "approved").length;

  const uniqueStatuses = [...new Set(statusEntries.map(e => e.status))].filter(Boolean);
  const uniqueActors = [...new Set(statusEntries.map(e => e.actor))].filter(Boolean).sort();

  // CSV export
  const handleExport = () => {
    const rows = [
      ["Entity Type", "Entity Name", "Status", "Previous Status", "Actor", "Timestamp", "Comments"],
      ...filteredStatusEntries.map(e => [
        e.entity_type, e.entity_name, e.status, e.prev_status || "",
        e.actor, e.timestamp ? format(new Date(e.timestamp), "yyyy-MM-dd HH:mm") : "", e.comments || ""
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "audit_trail.csv"; a.click();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Audit Trail</h1>
            <p className="text-slate-500">Full status history for Risks and Controls — compliance-ready</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Risk Transitions",    value: riskTransitions,    icon: ShieldAlert, color: "text-rose-500" },
          { label: "Control Transitions", value: controlTransitions, icon: Shield,      color: "text-indigo-500" },
          { label: "Pending Review",      value: pendingReviewCount, icon: Eye,         color: "text-amber-500" },
          { label: "Approved",            value: approvedCount,      icon: CheckCircle, color: "text-green-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
              <Icon className={`w-7 h-7 ${color} opacity-30`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search entity, actor, comments…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="Risk">Risks</SelectItem>
            <SelectItem value="Control">Controls</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {uniqueStatuses.map(s => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transitions">
        <TabsList className="mb-4">
          <TabsTrigger value="transitions" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Status Transitions
            <Badge className="bg-slate-200 text-slate-700 text-xs ml-1">{filteredStatusEntries.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Activity className="w-4 h-4" />
            System Logs
            <Badge className="bg-slate-200 text-slate-700 text-xs ml-1">{filteredAuditLogs.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Status Transitions Tab */}
        <TabsContent value="transitions">
          <Card className="border-none shadow-lg overflow-hidden">
            {filteredStatusEntries.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Filter className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No status transitions match your filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[65vh] overflow-auto">
                {filteredStatusEntries.map(entry => (
                  <TimelineRow key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* System Logs Tab */}
        <TabsContent value="system">
          <Card className="border-none shadow-lg overflow-hidden">
            {loadingLogs ? (
              <div className="py-12 text-center text-slate-400">Loading system logs…</div>
            ) : filteredAuditLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No system logs found.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[65vh] overflow-auto">
                {filteredAuditLogs.map(log => (
                  <AuditRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
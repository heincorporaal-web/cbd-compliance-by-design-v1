import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText, Search, User, Clock, Activity, ArrowRight,
  ShieldAlert, Shield, CheckCircle, AlertTriangle, RotateCcw,
  Eye, Download, Filter, Server, Building2, PlusCircle, Trash2,
  RefreshCw, UserCog, CalendarX, Pencil
} from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "@/components/layout/PageHeader";

// ─── Config maps ─────────────────────────────────────────────────────────────
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

const EVENT_TYPE_CONFIG = {
  created:          { color: "bg-green-100 text-green-700",   label: "Created",          Icon: PlusCircle },
  deleted:          { color: "bg-red-100 text-red-700",       label: "Deleted",          Icon: Trash2 },
  changed:          { color: "bg-blue-100 text-blue-700",     label: "Changed",          Icon: Pencil },
  ownership_change: { color: "bg-violet-100 text-violet-700", label: "Ownership Change", Icon: UserCog },
  end_dated:        { color: "bg-orange-100 text-orange-700", label: "End Dated",        Icon: CalendarX },
  status_change:    { color: "bg-teal-100 text-teal-700",     label: "Status Change",    Icon: RefreshCw },
};

const ENTITY_COLOR = {
  Risk:                  "bg-rose-100 text-rose-700",
  Control:               "bg-indigo-100 text-indigo-700",
  ICTSystem:             "bg-cyan-100 text-cyan-700",
  Company:               "bg-amber-100 text-amber-700",
  CompanyPrincipleRisk:  "bg-orange-100 text-orange-700",
};

// Human-friendly field labels
const FIELD_LABELS = {
  owner_stakeholder_id:          "Owner (stakeholder)",
  owner:                         "Owner",
  owner_name:                    "Owner Name",
  control_owner:                 "Control Owner",
  reviewer_stakeholder_id:       "Reviewer (stakeholder)",
  reviewer:                      "Reviewer",
  approver:                      "Approver",
  end_date:                      "End Date",
  status:                        "Status",
  title:                         "Title",
  name:                          "Name",
  description:                   "Description",
  likelihood:                    "Likelihood",
  impact:                        "Impact",
  criticality:                   "Criticality",
  control_frequency:             "Control Frequency",
  control_type:                  "Control Type",
  control_execution_type:        "Execution Type",
  priority:                      "Priority",
  principle_risks:               "Principle Risks",
  objectives:                    "Objectives",
};

const fmtFieldLabel = (key) => FIELD_LABELS[key] || key.replace(/_/g, " ");

const fmtVal = (v) => {
  if (v === null || v === undefined || v === "") return <em className="text-slate-400">empty</em>;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return <em className="text-slate-400">[{v.length} items]</em>;
  if (typeof v === "object") return <em className="text-slate-400">[object]</em>;
  return String(v);
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: "bg-slate-100 text-slate-500" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cfg.color}`}>
      {cfg.label || status?.replace(/_/g, " ")}
    </span>
  );
}

function EventTypeBadge({ eventType }) {
  const cfg = EVENT_TYPE_CONFIG[eventType] || { color: "bg-slate-100 text-slate-600", label: eventType, Icon: Activity };
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Change diff display ──────────────────────────────────────────────────────
function ChangeDiff({ changes }) {
  if (!changes?.changed_fields?.length) return null;
  const { before, after, changed_fields } = changes;
  return (
    <details className="mt-2">
      <summary className="text-xs text-blue-500 cursor-pointer hover:text-blue-700 select-none">
        View changes ({changed_fields.length} field{changed_fields.length > 1 ? "s" : ""})
      </summary>
      <div className="mt-2 rounded-lg border border-slate-200 overflow-hidden text-xs">
        <div className="grid grid-cols-3 bg-slate-100 px-3 py-1.5 font-semibold text-slate-500 uppercase tracking-wider">
          <span>Field</span>
          <span>Before</span>
          <span>After</span>
        </div>
        {changed_fields.map(field => (
          <div key={field} className="grid grid-cols-3 px-3 py-2 border-t border-slate-100 hover:bg-slate-50">
            <span className="font-medium text-slate-700">{fmtFieldLabel(field)}</span>
            <span className="text-red-500 line-through truncate pr-2">{fmtVal(before?.[field])}</span>
            <span className="text-green-600 font-medium truncate">{fmtVal(after?.[field])}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

// ─── Entity history row (from AuditLog entity) ────────────────────────────────
function EntityHistoryRow({ log }) {
  const entityColor = ENTITY_COLOR[log.entity_type] || "bg-slate-100 text-slate-600";
  const dotColor = {
    created: "bg-green-400", deleted: "bg-red-400", changed: "bg-blue-400",
    ownership_change: "bg-violet-400", end_dated: "bg-orange-400", status_change: "bg-teal-400"
  }[log.event_type] || "bg-slate-400";

  return (
    <div className="flex gap-4 py-4 px-5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <div className="flex flex-col items-center pt-1">
        <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${dotColor}`} />
        <div className="w-px flex-1 bg-slate-200 mt-1" />
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <Badge className={`text-xs ${entityColor}`}>{log.entity_type}</Badge>
          <EventTypeBadge eventType={log.event_type} />
          <span className="font-medium text-slate-800 text-sm truncate max-w-sm">{log.entity_name}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {log.user_name || log.user_email}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {log.created_date ? format(new Date(log.created_date), "dd MMM yyyy HH:mm") : "—"}
          </span>
        </div>
        {log.changes && <ChangeDiff changes={log.changes} />}
      </div>
    </div>
  );
}

// ─── Status transition rows (from embedded workflow_status_history) ───────────
function buildStatusEntries(risks, controls, ictSystems) {
  const entries = [];

  const addEntries = (items, entityType, getName, getUrl) => {
    items.forEach(item => {
      const hist = item.workflow_status_history || [];
      hist.forEach((h, idx) => {
        entries.push({
          id: `${entityType}-${item.id}-${idx}`,
          entity_type: entityType,
          entity_id: item.id,
          entity_name: getName(item),
          status: h.status,
          prev_status: idx > 0 ? hist[idx - 1].status : null,
          actor: h.actor || "system",
          timestamp: h.timestamp,
          comments: h.comments,
          detail_url: getUrl(item),
          company_id: item.company_id,
        });
      });
      if (hist.length === 0 && item.status) {
        entries.push({
          id: `${entityType}-${item.id}-created`,
          entity_type: entityType,
          entity_id: item.id,
          entity_name: getName(item),
          status: item.status,
          prev_status: null,
          actor: "system",
          timestamp: item.created_date,
          comments: `${entityType} created`,
          detail_url: getUrl(item),
          company_id: item.company_id,
        });
      }
    });
  };

  addEntries(risks, "Risk",
    r => r.title,
    r => createPageUrl(`RiskDetail?id=${r.id}`)
  );
  addEntries(controls, "Control",
    c => c.control_id ? `${c.control_id} — ${c.title}` : c.title,
    c => createPageUrl(`ControlDetail?id=${c.id}`)
  );
  addEntries(ictSystems, "ICTSystem",
    s => s.name,
    s => createPageUrl(`ICTSystemDetail?id=${s.id}`)
  );

  return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function TimelineRow({ entry }) {
  const entityColor = ENTITY_COLOR[entry.entity_type] || "bg-slate-100 text-slate-600";
  const dotColor = entry.entity_type === "Risk" ? "bg-rose-400"
    : entry.entity_type === "ICTSystem" ? "bg-cyan-400" : "bg-indigo-400";

  return (
    <div className="flex gap-4 py-4 px-5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <div className="flex flex-col items-center pt-1">
        <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${dotColor}`} />
        <div className="w-px flex-1 bg-slate-200 mt-1" />
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge className={`text-xs ${entityColor}`}>{entry.entity_type}</Badge>
          {entry.detail_url ? (
            <Link to={entry.detail_url} className="font-medium text-slate-800 hover:text-blue-600 hover:underline truncate max-w-sm text-sm">
              {entry.entity_name}
            </Link>
          ) : (
            <span className="font-medium text-slate-800 truncate max-w-sm text-sm">{entry.entity_name}</span>
          )}
        </div>
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
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{entry.actor}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {entry.timestamp ? format(new Date(entry.timestamp), "dd MMM yyyy HH:mm") : "—"}
          </span>
        </div>
        {entry.comments && <p className="mt-1.5 text-xs text-slate-500 italic">{entry.comments}</p>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AuditLogs() {
  const [search, setSearch]             = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterEventType, setFilterEventType] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");

  const { data: companies = [] } = useQuery({
    queryKey: ["audit-companies"],
    queryFn: () => base44.entities.Company.list("name"),
  });

  const { data: risks = [] } = useQuery({
    queryKey: ["audit-risks"],
    queryFn: () => base44.entities.Risk.list("-updated_date", 500),
  });

  const { data: controls = [] } = useQuery({
    queryKey: ["audit-controls"],
    queryFn: () => base44.entities.Control.list("-updated_date", 500),
  });

  const { data: ictSystems = [] } = useQuery({
    queryKey: ["audit-ict"],
    queryFn: () => base44.entities.ICTSystem.list("-updated_date", 500),
  });

  const { data: auditLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => base44.entities.AuditLog.list("-created_date", 1000),
  });

  // Build status transition timeline
  const statusEntries = useMemo(
    () => buildStatusEntries(risks, controls, ictSystems),
    [risks, controls, ictSystems]
  );

  const cutoff = useMemo(
    () => filterPeriod !== "all" ? subDays(new Date(), Number(filterPeriod)) : null,
    [filterPeriod]
  );

  const matchesSearch = (fields) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return fields.some(f => f?.toLowerCase().includes(q));
  };

  // Filter status transitions
  const filteredStatusEntries = useMemo(() => {
    return statusEntries.filter(e => {
      if (filterCompany !== "all" && e.company_id !== filterCompany) return false;
      if (filterEntity !== "all" && e.entity_type !== filterEntity) return false;
      if (cutoff && !isAfter(new Date(e.timestamp), cutoff)) return false;
      if (!matchesSearch([e.entity_name, e.actor, e.comments])) return false;
      return true;
    });
  }, [statusEntries, filterCompany, filterEntity, cutoff, search]);

  // Filter entity history logs
  const filteredEntityHistory = useMemo(() => {
    const entityLogs = auditLogs.filter(l =>
      ["Risk", "Control", "ICTSystem", "Company", "CompanyPrincipleRisk"].includes(l.entity_type)
    );
    return entityLogs.filter(l => {
      if (filterCompany !== "all" && l.company_id !== filterCompany) return false;
      if (filterEntity !== "all" && l.entity_type !== filterEntity) return false;
      if (filterEventType !== "all" && l.event_type !== filterEventType) return false;
      if (cutoff && !isAfter(new Date(l.created_date), cutoff)) return false;
      if (!matchesSearch([l.entity_name, l.user_name, l.user_email])) return false;
      return true;
    });
  }, [auditLogs, filterCompany, filterEntity, filterEventType, cutoff, search]);

  // Stats
  const totalHistoryLogs = filteredEntityHistory.length;
  const createdCount     = filteredEntityHistory.filter(l => l.event_type === "created").length;
  const ownershipCount   = filteredEntityHistory.filter(l => l.event_type === "ownership_change").length;
  const endDatedCount    = filteredEntityHistory.filter(l => l.event_type === "end_dated").length;

  // CSV export
  const handleExport = () => {
    const rows = [
      ["Entity Type", "Entity Name", "Event Type", "Actor", "Date", "Changed Fields"],
      ...filteredEntityHistory.map(l => [
        l.entity_type, l.entity_name, l.event_type,
        l.user_name || l.user_email,
        l.created_date ? format(new Date(l.created_date), "yyyy-MM-dd HH:mm") : "",
        (l.changes?.changed_fields || []).join("; ")
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "entity_history.csv"; a.click();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <PageHeader
          navItemId="audit_logs"
          icon={Activity}
          title="Audit Trail"
          tagline="Full change history for Risks, Controls, ICT Systems & Principle Risks"
          gradient="from-slate-700 to-slate-800"
        />
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total History Events", value: totalHistoryLogs, Icon: Activity,  color: "text-slate-700" },
          { label: "Created Events",        value: createdCount,     Icon: PlusCircle, color: "text-green-600" },
          { label: "Ownership Changes",     value: ownershipCount,   Icon: UserCog,    color: "text-violet-600" },
          { label: "End Dated Events",      value: endDatedCount,    Icon: CalendarX,  color: "text-orange-500" },
        ].map(({ label, value, Icon, color }) => (
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
            placeholder="Search by name, user…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
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
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="Risk">Risks</SelectItem>
            <SelectItem value="Control">Controls</SelectItem>
            <SelectItem value="ICTSystem">ICT Systems</SelectItem>
            <SelectItem value="Company">Principle Risks (Co.)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterEventType} onValueChange={setFilterEventType}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="changed">Changed</SelectItem>
            <SelectItem value="status_change">Status Change</SelectItem>
            <SelectItem value="ownership_change">Ownership Change</SelectItem>
            <SelectItem value="end_dated">End Dated</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
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
      <Tabs defaultValue="entity_history">
        <TabsList className="mb-4">
          <TabsTrigger value="entity_history" className="gap-2">
            <Pencil className="w-4 h-4" />
            Entity History
            <Badge className="bg-slate-200 text-slate-700 text-xs ml-1">{filteredEntityHistory.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="transitions" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Status Transitions
            <Badge className="bg-slate-200 text-slate-700 text-xs ml-1">{filteredStatusEntries.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Entity History Tab */}
        <TabsContent value="entity_history">
          <Card className="border-none shadow-lg overflow-hidden">
            {loadingLogs ? (
              <div className="py-12 text-center text-slate-400">Loading history…</div>
            ) : filteredEntityHistory.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No history events found</p>
                <p className="text-sm mt-1">Events will appear here as Risks, Controls, and ICT Systems are created or changed.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[65vh] overflow-auto">
                {filteredEntityHistory.map(log => (
                  <EntityHistoryRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

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
      </Tabs>
    </div>
  );
}
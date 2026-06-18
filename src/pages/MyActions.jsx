import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  CalendarClock, AlertTriangle, CheckCircle2, Clock, ChevronRight,
  ShieldAlert, Target, Shield, Scale, TriangleAlert, ListFilter, X
} from "lucide-react";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import CompanyFilterBar from "@/components/CompanyFilterBar";
import { differenceInDays, parseISO, isValid, addDays, addWeeks, addMonths, addYears } from "date-fns";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const WINDOW_DAYS = 180; // show items due within 6 months

function parseDate(val) {
  if (!val) return null;
  const d = typeof val === "string" ? parseISO(val.split("T")[0]) : new Date(val);
  return isValid(d) ? d : null;
}

function getDaysUntil(dateVal) {
  const d = parseDate(dateVal);
  if (!d) return null;
  return differenceInDays(d, TODAY);
}

// Estimate next review date from last approval + frequency
function estimateNextReview(approvalDate, frequency) {
  const base = parseDate(approvalDate);
  if (!base) return null;
  switch (frequency) {
    case "Daily": return addDays(base, 1);
    case "Weekly": return addWeeks(base, 1);
    case "Monthly": return addMonths(base, 1);
    case "Quarterly": return addMonths(base, 3);
    case "Annually": return addYears(base, 1);
    default: return null;
  }
}

function StatusBadge({ days }) {
  if (days === null) return null;
  if (days < 0) return <Badge className="bg-red-100 text-red-700 border-red-200">Overdue {Math.abs(days)}d</Badge>;
  if (days === 0) return <Badge className="bg-red-100 text-red-700 border-red-200">Due Today</Badge>;
  if (days <= 7)  return <Badge className="bg-red-50 text-red-600 border-red-100">In {days}d</Badge>;
  if (days <= 14) return <Badge className="bg-orange-100 text-orange-700 border-orange-200">In {days}d</Badge>;
  if (days <= 30) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">In {days}d</Badge>;
  if (days <= 90) return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-100">In {days}d</Badge>;
  return <Badge className="bg-slate-100 text-slate-500 border-slate-200">In {days}d</Badge>;
}

const TYPE_META = {
  principal_risk: { label: "Principal Risk",  icon: ShieldAlert,   iconBg: "bg-red-500",    color: "text-red-600",    url: "/PrincipalRisks",                     linkLabel: "Risks"      },
  risk:           { label: "Risk",             icon: TriangleAlert, iconBg: "bg-orange-500", color: "text-orange-600", url: "/RiskRegister",                         linkLabel: "Register"   },
  objective:      { label: "Objective",        icon: Target,        iconBg: "bg-purple-500", color: "text-purple-600", url: "/ObjectivesSummary",                    linkLabel: "Objectives" },
  control:        { label: "Control",          icon: Shield,        iconBg: "bg-indigo-500", color: "text-indigo-600", url: "/Controls",                             linkLabel: "Controls"   },
  framework:      { label: "Framework",        icon: Shield,        iconBg: "bg-blue-500",   color: "text-blue-600",   url: "/Frameworks",                           linkLabel: "Frameworks" },
  doa:            { label: "DOA",              icon: Scale,         iconBg: "bg-teal-500",   color: "text-teal-600",   url: "/DelegationOfAuthority",                linkLabel: "DOA"        },
};

const TYPE_FILTERS = [
  { id: "all",           label: "All Types" },
  { id: "principal_risk",label: "Principal Risks" },
  { id: "risk",          label: "Risks" },
  { id: "objective",     label: "Objectives" },
  { id: "control",       label: "Controls" },
  { id: "framework",     label: "Frameworks" },
  { id: "doa",           label: "DOA" },
];

const URGENCY_FILTERS = [
  { id: "all",     label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "soon",    label: "Due ≤ 14d" },
  { id: "upcoming",label: "Due ≤ 90d" },
];

function ActionRow({ item }) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-3 p-3.5 border-b last:border-0 hover:bg-slate-50 transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.iconBg}`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm truncate">{item.title}</p>
        <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className={`text-xs hidden sm:inline-flex ${meta.color}`}>{meta.label}</Badge>
        <StatusBadge days={item.days} />
        <Link to={meta.url}>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function MyActions() {
  const [globalCompany] = useCompanyFilter();
  const gc = globalCompany;
  const [typeFilter, setTypeFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const { data: principalRisks = [] } = useQuery({ queryKey: ["principalRisks"],  queryFn: () => base44.entities.PrincipalRisk.list() });
  const { data: risks = [] }           = useQuery({ queryKey: ["risks"],            queryFn: () => base44.entities.Risk.list() });
  const { data: objectives = [] }      = useQuery({ queryKey: ["orgObjectives"],    queryFn: () => base44.entities.OrgObjective.list() });
  const { data: controls = [] }        = useQuery({ queryKey: ["controls"],         queryFn: () => base44.entities.Control.list() });
  const { data: frameworks = [] }      = useQuery({ queryKey: ["frameworks"],       queryFn: () => base44.entities.Framework.list() });
  const { data: doaList = [] }         = useQuery({ queryKey: ["doa"],              queryFn: () => base44.entities.DelegationOfAuthority.list() });
  const { data: companies = [] }       = useQuery({ queryKey: ["companies"],        queryFn: () => base44.entities.Company.list() });

  const cname = (id) => companies.find(c => c.id === id)?.name || "";
  const byCompany = (arr) => gc && gc !== "all" ? arr.filter(r => r.company_id === gc) : arr;

  const allItems = useMemo(() => {
    const items = [];

    // Principal Risks — next_review_date
    byCompany(principalRisks)
      .filter(r => r.next_review_date && r.status !== "Retired")
      .forEach(r => {
        const days = getDaysUntil(r.next_review_date);
        if (days !== null && days <= WINDOW_DAYS) {
          items.push({
            type: "principal_risk",
            days,
            title: `${r.risk_reference ? `[${r.risk_reference}] ` : ""}${r.risk_title}`,
            subtitle: `Next Review · ${cname(r.company_id)} · ${r.risk_category}`,
            dateLabel: r.next_review_date,
          });
        }
      });

    // Risks — review_date
    byCompany(risks)
      .filter(r => r.review_date && r.status !== "closed" && r.status !== "mitigated")
      .forEach(r => {
        const days = getDaysUntil(r.review_date);
        if (days !== null && days <= WINDOW_DAYS) {
          items.push({
            type: "risk",
            days,
            title: `${r.risk_reference_nr ? `[${r.risk_reference_nr}] ` : ""}${r.title}`,
            subtitle: `Review Date · ${cname(r.company_id)} · ${r.category?.replace(/_/g, " ")}`,
            dateLabel: r.review_date,
          });
        }
      });

    // Objectives — next_review_date
    byCompany(objectives)
      .filter(o => o.next_review_date && o.status !== "Retired")
      .forEach(o => {
        const days = getDaysUntil(o.next_review_date);
        if (days !== null && days <= WINDOW_DAYS) {
          items.push({
            type: "objective",
            days,
            title: `${o.reference_number ? `[${o.reference_number}] ` : ""}${o.title}`,
            subtitle: `Next Review · ${cname(o.company_id)} · ${o.category}`,
            dateLabel: o.next_review_date,
          });
        }
      });

    // Controls — estimate from approval_date + control_frequency
    controls
      .filter(c => c.status === "active" || c.status === "approved")
      .forEach(c => {
        const nextDate = estimateNextReview(c.approval_date, c.control_frequency);
        if (!nextDate) return;
        const days = differenceInDays(nextDate, TODAY);
        if (days !== null && days <= WINDOW_DAYS) {
          items.push({
            type: "control",
            days,
            title: `${c.control_id ? `[${c.control_id}] ` : ""}${c.title}`,
            subtitle: `${c.control_frequency} Review · ${c.control_type || "Control"} · ${c.category || ""}`,
            dateLabel: nextDate.toISOString().split("T")[0],
          });
        }
      });

    // Frameworks — end_date
    frameworks
      .filter(f => f.end_date && f.status !== "archived")
      .forEach(f => {
        const days = getDaysUntil(f.end_date);
        if (days !== null && days <= WINDOW_DAYS) {
          items.push({
            type: "framework",
            days,
            title: f.name,
            subtitle: `End Date · ${f.framework_code || f.category}`,
            dateLabel: f.end_date,
          });
        }
      });

    // DOA — reminder_date
    byCompany(doaList)
      .filter(d => d.reminder_date && d.status !== "archived")
      .forEach(d => {
        const days = getDaysUntil(d.reminder_date);
        if (days !== null && days <= WINDOW_DAYS) {
          items.push({
            type: "doa",
            days,
            title: d.title,
            subtitle: `Review Reminder · ${cname(d.company_id)}`,
            dateLabel: d.reminder_date,
          });
        }
      });

    return items.sort((a, b) => a.days - b.days);
  }, [principalRisks, risks, objectives, controls, frameworks, doaList, gc, companies]);

  const filtered = useMemo(() => {
    let result = allItems;
    if (typeFilter !== "all") result = result.filter(i => i.type === typeFilter);
    if (urgencyFilter === "overdue")  result = result.filter(i => i.days < 0);
    if (urgencyFilter === "soon")     result = result.filter(i => i.days >= 0 && i.days <= 14);
    if (urgencyFilter === "upcoming") result = result.filter(i => i.days >= 0 && i.days <= 90);
    return result;
  }, [allItems, typeFilter, urgencyFilter]);

  const totalOverdue  = allItems.filter(i => i.days < 0).length;
  const totalSoon     = allItems.filter(i => i.days >= 0 && i.days <= 14).length;
  const totalUpcoming = allItems.filter(i => i.days >= 0 && i.days <= 90).length;

  const typeCounts = useMemo(() => {
    const counts = {};
    allItems.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
    return counts;
  }, [allItems]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <CalendarClock className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Actions</h1>
            <p className="text-slate-600">Upcoming review dates across risks, controls, objectives and more</p>
          </div>
        </div>
        <CompanyFilterBar />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={() => setUrgencyFilter(urgencyFilter === "overdue" ? "all" : "overdue")} className="text-left">
          <Card className={`border-2 shadow-lg transition-all ${urgencyFilter === "overdue" ? "border-red-500 ring-2 ring-red-200" : "border-transparent bg-gradient-to-br from-red-500 to-red-600"} text-white bg-gradient-to-br from-red-500 to-red-600`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm opacity-90">Overdue</p>
                <AlertTriangle className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-3xl font-bold">{totalOverdue}</p>
              <p className="text-xs opacity-75 mt-1">Require immediate attention</p>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => setUrgencyFilter(urgencyFilter === "soon" ? "all" : "soon")} className="text-left">
          <Card className={`border-2 shadow-lg transition-all ${urgencyFilter === "soon" ? "border-orange-500 ring-2 ring-orange-200" : "border-transparent"} text-white bg-gradient-to-br from-amber-500 to-orange-500`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm opacity-90">Due in 14 days</p>
                <Clock className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-3xl font-bold">{totalSoon}</p>
              <p className="text-xs opacity-75 mt-1">Action needed soon</p>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => setUrgencyFilter(urgencyFilter === "upcoming" ? "all" : "upcoming")} className="text-left">
          <Card className={`border-2 shadow-lg transition-all ${urgencyFilter === "upcoming" ? "border-slate-400 ring-2 ring-slate-200" : "border-transparent"} text-white bg-gradient-to-br from-slate-500 to-slate-600`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm opacity-90">Due in 90 days</p>
                <CheckCircle2 className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-3xl font-bold">{totalUpcoming}</p>
              <p className="text-xs opacity-75 mt-1">Plan ahead</p>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <ListFilter className="w-4 h-4 text-slate-400 shrink-0" />
        {TYPE_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setTypeFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              typeFilter === f.id
                ? "bg-primary text-white border-primary"
                : "bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary"
            }`}
          >
            {f.label}{f.id !== "all" && typeCounts[f.id] ? ` (${typeCounts[f.id]})` : ""}
          </button>
        ))}
        {(typeFilter !== "all" || urgencyFilter !== "all") && (
          <button
            onClick={() => { setTypeFilter("all"); setUrgencyFilter("all"); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Action list */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-600" />
            Action Items
            <Badge variant="outline" className="ml-auto font-normal">{filtered.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">All clear!</p>
              <p className="text-sm text-slate-400 mt-1">No items match the selected filters.</p>
            </div>
          ) : (
            filtered.map((item, i) => <ActionRow key={i} item={item} />)
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
        {Object.entries(TYPE_META).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded flex items-center justify-center ${meta.iconBg}`}>
                <Icon className="w-2.5 h-2.5 text-white" />
              </div>
              {meta.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
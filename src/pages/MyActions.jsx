import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CalendarClock, AlertTriangle, CheckCircle2, Clock, ChevronRight, ShieldAlert, Target, Shield, FileText, Scale } from "lucide-react";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import CompanyFilterBar from "@/components/CompanyFilterBar";
import { differenceInDays, parseISO, isValid } from "date-fns";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

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

function StatusBadge({ days }) {
  if (days === null) return null;
  if (days < 0) return <Badge className="bg-red-100 text-red-700">Overdue by {Math.abs(days)}d</Badge>;
  if (days === 0) return <Badge className="bg-red-100 text-red-700">Due Today</Badge>;
  if (days <= 14) return <Badge className="bg-orange-100 text-orange-700">Due in {days}d</Badge>;
  if (days <= 30) return <Badge className="bg-amber-100 text-amber-700">Due in {days}d</Badge>;
  return <Badge className="bg-slate-100 text-slate-600">Due in {days}d</Badge>;
}

function ActionRow({ icon: IconComp, iconBg, title, subtitle, days, url, linkLabel }) {
  const Icon = IconComp;
  return (
    <div className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-slate-50 transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm truncate">{title}</p>
        <p className="text-xs text-slate-500 truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge days={days} />
        {url && (
          <Link to={url}>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              {linkLabel || "View"} <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon: IconComp, color, items, emptyMsg }) {
  const Icon = IconComp;
  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          {title}
          <Badge variant="outline" className="ml-auto font-normal">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 italic p-4">{emptyMsg}</p>
        ) : (
          items.map((item, i) => <ActionRow key={i} {...item} />)
        )}
      </CardContent>
    </Card>
  );
}

export default function MyActions() {
  const { selectedCompany } = useCompanyFilter();
  const gc = selectedCompany;

  const { data: principalRisks = [] } = useQuery({ queryKey: ["principalRisks"], queryFn: () => base44.entities.PrincipalRisk.list() });
  const { data: objectives = [] } = useQuery({ queryKey: ["orgObjectives"], queryFn: () => base44.entities.OrgObjective.list() });
  const { data: frameworks = [] } = useQuery({ queryKey: ["frameworks"], queryFn: () => base44.entities.Framework.list() });
  const { data: doaList = [] } = useQuery({ queryKey: ["doa"], queryFn: () => base44.entities.DelegationOfAuthority.list() });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });

  const filter = (arr) => gc && gc !== "all" ? arr.filter(r => r.company_id === gc) : arr;

  const companyName = (id) => companies.find(c => c.id === id)?.name || "";

  // Principal Risks with next_review_date
  const prItems = useMemo(() => {
    return filter(principalRisks)
      .filter(r => r.next_review_date && r.status !== "Retired")
      .map(r => ({ days: getDaysUntil(r.next_review_date), r }))
      .filter(({ days }) => days !== null && days <= 90)
      .sort((a, b) => a.days - b.days)
      .map(({ days, r }) => ({
        icon: ShieldAlert,
        iconBg: "bg-red-500",
        title: `${r.risk_reference ? `[${r.risk_reference}] ` : ""}${r.risk_title}`,
        subtitle: `Next Review · ${companyName(r.company_id)} · ${r.risk_category}`,
        days,
        url: "/PrincipalRisks",
        linkLabel: "Go to Risks",
      }));
  }, [principalRisks, gc, companies]);

  // Objectives with next_review_date
  const objItems = useMemo(() => {
    return filter(objectives)
      .filter(o => o.next_review_date && o.status !== "Retired")
      .map(o => ({ days: getDaysUntil(o.next_review_date), o }))
      .filter(({ days }) => days !== null && days <= 90)
      .sort((a, b) => a.days - b.days)
      .map(({ days, o }) => ({
        icon: Target,
        iconBg: "bg-purple-500",
        title: `${o.reference_number ? `[${o.reference_number}] ` : ""}${o.title}`,
        subtitle: `Next Review · ${companyName(o.company_id)} · ${o.category}`,
        days,
        url: createPageUrl("ObjectivesSummary"),
        linkLabel: "Go to Objectives",
      }));
  }, [objectives, gc, companies]);

  // Frameworks with end_date approaching (treat as review date)
  const fwItems = useMemo(() => {
    return frameworks
      .filter(f => f.end_date && f.status !== "archived")
      .map(f => ({ days: getDaysUntil(f.end_date), f }))
      .filter(({ days }) => days !== null && days <= 90)
      .sort((a, b) => a.days - b.days)
      .map(({ days, f }) => ({
        icon: Shield,
        iconBg: "bg-indigo-500",
        title: f.name,
        subtitle: `Framework End Date · ${f.framework_code || f.category}`,
        days,
        url: createPageUrl("Frameworks"),
        linkLabel: "Go to Frameworks",
      }));
  }, [frameworks]);

  // DOA reminder dates
  const doaItems = useMemo(() => {
    return filter(doaList)
      .filter(d => d.reminder_date && d.status !== "archived")
      .map(d => ({ days: getDaysUntil(d.reminder_date), d }))
      .filter(({ days }) => days !== null && days <= 90)
      .sort((a, b) => a.days - b.days)
      .map(({ days, d }) => ({
        icon: Scale,
        iconBg: "bg-teal-500",
        title: d.title,
        subtitle: `DOA Review Reminder · ${companyName(d.company_id)}`,
        days,
        url: createPageUrl("DelegationOfAuthority"),
        linkLabel: "Go to DOA",
      }));
  }, [doaList, gc, companies]);

  const totalOverdue = [...prItems, ...objItems, ...fwItems, ...doaItems].filter(i => i.days < 0).length;
  const totalDueSoon = [...prItems, ...objItems, ...fwItems, ...doaItems].filter(i => i.days >= 0 && i.days <= 14).length;
  const total = prItems.length + objItems.length + fwItems.length + doaItems.length;

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
            <p className="text-slate-600">Upcoming review dates and actions across all modules</p>
          </div>
        </div>
        <CompanyFilterBar />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm opacity-90">Overdue</p>
              <AlertTriangle className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">{totalOverdue}</p>
            <p className="text-xs opacity-75 mt-1">Require immediate attention</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm opacity-90">Due in 14 days</p>
              <Clock className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">{totalDueSoon}</p>
            <p className="text-xs opacity-75 mt-1">Action needed soon</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-slate-500 to-slate-600 text-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm opacity-90">Due in 90 days</p>
              <CheckCircle2 className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">{total}</p>
            <p className="text-xs opacity-75 mt-1">Total upcoming actions</p>
          </CardContent>
        </Card>
      </div>

      {/* Sections */}
      <Section
        title="Principal Risk Reviews"
        icon={ShieldAlert}
        color="text-red-600"
        items={prItems}
        emptyMsg="No principal risk reviews due within 90 days."
      />
      <Section
        title="Objective Reviews"
        icon={Target}
        color="text-purple-600"
        items={objItems}
        emptyMsg="No objective reviews due within 90 days."
      />
      <Section
        title="Framework End Dates"
        icon={Shield}
        color="text-indigo-600"
        items={fwItems}
        emptyMsg="No framework end dates within 90 days."
      />
      <Section
        title="Delegation of Authority Reviews"
        icon={Scale}
        color="text-teal-600"
        items={doaItems}
        emptyMsg="No DOA review reminders within 90 days."
      />
    </div>
  );
}
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Activity, ShieldAlert, Clock, CheckCircle2, Zap, TrendingDown, FileSearch } from "lucide-react";

export default function IncidentKpiCards({ incidents }) {
  const total = incidents.length;
  const open = incidents.filter(i => !["closed", "resolved"].includes(i.status)).length;
  const critical = incidents.filter(i => i.severity === "critical").length;
  const major = incidents.filter(i => i.major_incident).length;
  const slaBreached = incidents.filter(i => i.sla_breached).length;
  const pirPending = incidents.filter(i => i.pir_required && !i.pir_completed).length;

  // Mean Time to Resolve (hours) for resolved/closed incidents
  const resolved = incidents.filter(i => i.resolved_date && i.detected_date);
  const mttrHours = resolved.length > 0
    ? Math.round(resolved.reduce((sum, i) => {
        const diff = new Date(i.resolved_date) - new Date(i.detected_date);
        return sum + (diff / (1000 * 60 * 60));
      }, 0) / resolved.length)
    : 0;

  // Priority metrics — things that need attention now
  const priorityCards = [
    { label: "Critical Severity", value: critical, icon: Zap, color: "text-red-600 bg-red-50", sub: "Requires immediate action" },
    { label: "SLA Breached", value: slaBreached, icon: Clock, color: "text-rose-600 bg-rose-50", sub: `${total > 0 ? Math.round((slaBreached / total) * 100) : 0}% of all incidents` },
    { label: "Major Incidents", value: major, icon: ShieldAlert, color: "text-orange-600 bg-orange-50", sub: "Declared major incidents" },
    { label: "PIR Pending", value: pirPending, icon: FileSearch, color: "text-purple-600 bg-purple-50", sub: "Post-incident reviews due" },
  ];

  // Volume summary — rolled-up counts
  const volumeCards = [
    { label: "Total", value: total, icon: AlertTriangle, color: "text-slate-600", sub: `${open} open` },
    { label: "Open / Active", value: open, icon: Activity, color: "text-blue-600", sub: "In progress" },
    { label: "Resolved / Closed", value: total - open, icon: CheckCircle2, color: "text-emerald-600", sub: `${total > 0 ? Math.round(((total - open) / total) * 100) : 0}% rate` },
    { label: "Avg Resolution", value: `${mttrHours}h`, icon: TrendingDown, color: "text-green-600", sub: "Mean time to resolve" },
  ];

  return (
    <div className="space-y-3">
      {/* Priority metrics — shown first */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {priorityCards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{c.value}</p>
                <p className="text-xs font-medium text-slate-600 mt-0.5">{c.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{c.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Volume summary — compact strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {volumeCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="flex items-center gap-3 bg-white rounded-lg border border-slate-100 px-3 py-2.5">
              <Icon className={`w-4 h-4 ${c.color} shrink-0`} />
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-slate-700">{c.value}</span>
                  <span className="text-[11px] text-slate-400">{c.sub}</span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 leading-tight">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
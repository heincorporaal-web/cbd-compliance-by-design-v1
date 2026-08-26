import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { CheckCircle2, ArrowRight } from "lucide-react";

const SEVERITY_COLORS = {
  critical: "#ef4444",
  major: "#f97316",
  moderate: "#eab308",
  minor: "#3b82f6",
};

const STATUS_COLORS = {
  detected: "#94a3b8",
  logged: "#64748b",
  classified: "#3b82f6",
  assessed: "#06b6d4",
  assigned: "#0ea5e9",
  investigating: "#f59e0b",
  mitigating: "#f97316",
  service_restored: "#10b981",
  resolved: "#22c55e",
  pir_rca: "#8b5cf6",
  closed: "#cbd5e1",
};

const TOOLTIP_STYLE = {
  contentStyle: { fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
  labelStyle: { fontWeight: 600, color: "#334155" },
  cursor: { fill: "#f8fafc" },
};

export default function RecentIncidentsChart({ incidents }) {
  const navigate = useNavigate();

  const severityData = useMemo(() => {
    const counts = { critical: 0, major: 0, moderate: 0, minor: 0 };
    incidents.forEach(i => { if (counts[i.severity] !== undefined) counts[i.severity]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  const statusData = useMemo(() => {
    const counts = {};
    incidents.forEach(i => {
      const s = i.status || "unknown";
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [incidents]);

  const total = incidents.length;
  const critical = severityData.find(d => d.name === "critical")?.value || 0;
  const open = incidents.filter(i =>
    !["resolved", "closed", "service_restored"].includes(i.status)
  ).length;

  const drillTo = (param) => navigate(`/Incidents?${param}`);

  if (total === 0) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle>Incident Summary</CardTitle>
            <Link to="/IncidentDashboard">
              <Button variant="ghost" size="sm" className="gap-1">
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-slate-500">No incidents recorded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle>Incident Summary</CardTitle>
            <div className="flex gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                {critical} critical
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                {open} open
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                {total} total
              </span>
            </div>
          </div>
          <Link to="/IncidentDashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              View Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity breakdown — click to drill down */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              By Severity <span className="font-normal normal-case text-slate-400">(click to view records)</span>
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={severityData} margin={{ left: -20, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, textTransform: "capitalize" }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(payload) => payload && payload.name && drillTo(`severity=${payload.name}`)}
                >
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={SEVERITY_COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status breakdown — donut, click to drill down */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              By Status <span className="font-normal normal-case text-slate-400">(click to view records)</span>
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius="45%"
                  outerRadius="75%"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  cursor="pointer"
                  onClick={(d) => drillTo(`status=${d.name}`)}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || "#64748b"} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value) => value.replace(/_/g, " ")}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
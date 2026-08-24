import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area,
} from "recharts";
import { format, subMonths, isAfter } from "date-fns";
import { PieChart as PieIcon, BarChart3, TrendingUp, Layers } from "lucide-react";

const SEVERITY_COLORS = { critical: "#ef4444", major: "#f97316", moderate: "#eab308", minor: "#3b82f6" };
const STATUS_COLORS = ["#64748b", "#3b82f6", "#06b6d4", "#f59e0b", "#f97316", "#10b981", "#22c55e", "#8b5cf6", "#a78bfa", "#94a3b8", "#cbd5e1"];
const TYPE_COLORS = ["#0ea5e9", "#8b5cf6", "#ef4444", "#f59e0b", "#10b981", "#06b6d4", "#ec4899", "#64748b", "#f97316"];
const PRIORITY_COLORS = { P1: "#dc2626", P2: "#ea580c", P3: "#ca8a04", P4: "#2563eb" };

const CHART_TOOLTIP = {
  contentStyle: { fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
  labelStyle: { fontWeight: 600, color: "#334155" },
};

function ChartCard({ title, icon: Icon, children }) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-500" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function IncidentCharts({ incidents }) {
  const severityData = useMemo(() => {
    const counts = { critical: 0, major: 0, moderate: 0, minor: 0 };
    incidents.forEach(i => { if (counts[i.severity] !== undefined) counts[i.severity]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  const statusData = useMemo(() => {
    const counts = {};
    incidents.forEach(i => { const s = i.status?.replace(/_/g, " ") || "unknown"; counts[s] = (counts[s] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [incidents]);

  const typeData = useMemo(() => {
    const counts = {};
    incidents.forEach(i => { const t = i.incident_type?.replace(/_/g, " ") || "other"; counts[t] = (counts[t] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [incidents]);

  const priorityData = useMemo(() => {
    const counts = { P1: 0, P2: 0, P3: 0, P4: 0 };
    incidents.forEach(i => { if (counts[i.priority] !== undefined) counts[i.priority]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  const trendData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = subMonths(now, i);
      const label = format(monthStart, "MMM");
      months.push({ label, critical: 0, major: 0, moderate: 0, minor: 0, total: 0 });
    }
    incidents.forEach(i => {
      if (!i.detected_date) return;
      const d = new Date(i.detected_date);
      for (let j = 0; j < months.length; j++) {
        const monthStart = subMonths(now, 5 - j);
        const monthEnd = subMonths(now, 4 - j);
        if (isAfter(d, monthStart) && !isAfter(d, monthEnd)) {
          if (months[j][i.severity] !== undefined) months[j][i.severity]++;
          months[j].total++;
          break;
        }
      }
    });
    return months;
  }, [incidents]);

  const categoryData = useMemo(() => {
    const counts = {};
    incidents.forEach(i => { if (i.category) counts[i.category] = (counts[i.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [incidents]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Severity Donut */}
      <ChartCard title="Incidents by Severity" icon={PieIcon}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={severityData} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={3} dataKey="value" stroke="none">
              {severityData.map((entry, i) => <Cell key={i} fill={SEVERITY_COLORS[entry.name]} />)}
            </Pie>
            <Tooltip {...CHART_TOOLTIP} />
            <Legend wrapperStyle={{ fontSize: 12, textTransform: "capitalize" }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Status Bar */}
      <ChartCard title="Incidents by Status" icon={BarChart3}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={statusData} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={90} />
            <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 6-Month Trend */}
      <ChartCard title="6-Month Incident Trend" icon={TrendingUp}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData} margin={{ left: -10, right: 10, top: 5 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
            <Tooltip {...CHART_TOOLTIP} />
            <Area type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2} fill="url(#trendGrad)" />
            <Area type="monotone" dataKey="critical" name="Critical" stroke="#ef4444" strokeWidth={1.5} fill="none" />
            <Area type="monotone" dataKey="major" name="Major" stroke="#f97316" strokeWidth={1.5} fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Priority Bar */}
      <ChartCard title="Incidents by Priority" icon={BarChart3}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={priorityData} margin={{ left: -10, right: 10, top: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
            <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {priorityData.map((entry, i) => <Cell key={i} fill={PRIORITY_COLORS[entry.name]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Type Bar */}
      <ChartCard title="Incidents by Type" icon={Layers}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={typeData} margin={{ left: 10, right: 10, top: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
            <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {typeData.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Top Categories */}
      <ChartCard title="Top Affected Categories" icon={BarChart3}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={100} />
            <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
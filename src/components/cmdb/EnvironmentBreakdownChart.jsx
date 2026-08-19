import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#ec4899", "#14b8a6", "#64748b", "#f97316", "#a855f7"];

export default function EnvironmentBreakdownChart({ cis = [], environments = [] }) {
  const data = useMemo(() => {
    const order = environments.map(e => e.name);
    const counts = {};
    cis.forEach(c => {
      const key = c.environment || "Unassigned";
      counts[key] = (counts[key] || 0) + 1;
    });
    const keys = [...new Set([...order, ...Object.keys(counts)])];
    return keys.filter(k => counts[k] > 0).map(k => ({ name: k, value: counts[k] }));
  }, [cis, environments]);

  if (data.length === 0) return <p className="text-center text-slate-400 py-8">No environment data.</p>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2}>
          {data.map((d, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
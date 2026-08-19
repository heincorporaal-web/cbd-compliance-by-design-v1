import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = {
  Discovered: "#3b82f6",
  Identified: "#06b6d4",
  "In Service": "#10b981",
  Maintenance: "#f59e0b",
  Quarantined: "#ef4444",
  Retiring: "#f97316",
  Retired: "#64748b",
  Stale: "#a855f7",
  Unknown: "#94a3b8",
};

export default function LifecycleBreakdownChart({ cis = [], lifecycles = [] }) {
  const data = useMemo(() => {
    const order = lifecycles.map(l => l.name);
    const counts = {};
    cis.forEach(c => {
      const key = c.lifecycle_status || "Unknown";
      counts[key] = (counts[key] || 0) + 1;
    });
    const keys = [...new Set([...order, ...Object.keys(counts)])];
    return keys
      .filter(k => counts[k] > 0)
      .map(k => ({ name: k, count: counts[k], fill: COLORS[k] || "#94a3b8" }));
  }, [cis, lifecycles]);

  if (data.length === 0) return <p className="text-center text-slate-400 py-8">No lifecycle data.</p>;

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
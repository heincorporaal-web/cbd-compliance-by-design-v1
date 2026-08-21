import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const STAGES = [
  { key: "draft", label: "Draft", color: "#94a3b8" },
  { key: "internal_review", label: "Internal Review", color: "#f59e0b" },
  { key: "awaiting_approval", label: "Awaiting Approval", color: "#fb923c" },
  { key: "approved", label: "Approved", color: "#10b981" },
  { key: "published", label: "Published", color: "#16a34a" },
  { key: "under_review", label: "Under Review", color: "#3b82f6" },
  { key: "superseded", label: "Superseded", color: "#a855f7" },
  { key: "retired", label: "Retired", color: "#ef4444" },
  { key: "expired", label: "Expired", color: "#dc2626" },
];

export default function ApprovalStageChart({ docs }) {
  const data = useMemo(() => {
    const total = docs.length;
    return STAGES.map((s) => {
      const count = docs.filter((d) => d.status === s.key).length;
      return {
        ...s,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    }).filter((d) => d.count > 0);
  }, [docs]);

  const total = docs.length;

  if (total === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">
        No documents to chart yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="relative w-48 h-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} (${Math.round((value / total) * 100)}%)`, name]}
              contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-slate-800">{total}</span>
          <span className="text-xs text-slate-400">policies</span>
        </div>
      </div>

      <div className="flex-1 w-full grid grid-cols-2 gap-x-4 gap-y-2">
        {data.map((d) => (
          <div key={d.key} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-sm text-slate-600 flex-1 truncate">{d.label}</span>
            <span className="text-sm font-semibold text-slate-800">{d.pct}%</span>
            <span className="text-xs text-slate-400 w-8 text-right">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
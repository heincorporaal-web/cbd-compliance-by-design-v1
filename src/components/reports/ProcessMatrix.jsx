import React, { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import ProcessMatrixCard from "./ProcessMatrixCard";

const GROUP_COLORS = [
  "#003366", "#660066", "#008080", "#CC6600", "#669933",
  "#0099CC", "#7B2D8B", "#B8860B", "#4A6FA5", "#8B4513",
];

const TOGGLES = [
  ["showMaturity", "Maturity score"],
  ["showRisk", "Risk score"],
  ["showResilience", "Resilience (critical)"],
  ["showReviewStatus", "Review status"],
  ["showCodes", "Process codes"],
];

function LegendCard({ title, buckets }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <h4 className="text-sm font-semibold text-slate-800 mb-2">{title}</h4>
      <div className="space-y-2">
        {buckets.map(b => (
          <div key={b.label} className="border-l-4 pl-2" style={{ borderColor: b.color }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: b.color }}>{b.label}</span>
              <span className="text-[10px] text-slate-400">({b.items.length})</span>
            </div>
            {b.items.length > 0 && (
              <p className="text-[10px] text-slate-600 leading-tight mt-0.5 line-clamp-3">
                {b.items.map(i => i.name).join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProcessMatrix({ processes, assessments }) {
  const [show, setShow] = useState({
    showMaturity: true,
    showRisk: true,
    showResilience: true,
    showReviewStatus: true,
    showCodes: true,
  });
  const toggle = (k) => setShow(s => ({ ...s, [k]: !s[k] }));

  const latestByProcess = useMemo(() => {
    const map = {};
    for (const a of assessments) {
      if (!a.process_id) continue;
      const prev = map[a.process_id];
      if (!prev || new Date(a.assessment_date || 0) > new Date(prev.assessment_date || 0)) {
        map[a.process_id] = a;
      }
    }
    return map;
  }, [assessments]);

  const childrenMap = useMemo(() => {
    const m = {};
    for (const p of processes) {
      if (p.parent_id) (m[p.parent_id] = m[p.parent_id] || []).push(p);
    }
    return m;
  }, [processes]);

  // leaf processes (no children) are the matrix cards
  const leaves = useMemo(
    () => processes.filter(p => !(childrenMap[p.id] || []).length),
    [processes, childrenMap]
  );

  const columns = useMemo(() => {
    const groups = {};
    for (const leaf of leaves) {
      const parent = processes.find(p => p.id === leaf.parent_id);
      const key = leaf.parent_id || "ungrouped";
      if (!groups[key]) groups[key] = { parent, items: [] };
      groups[key].items.push(leaf);
    }
    return Object.values(groups).sort((a, b) =>
      (a.parent?.process_code || "").localeCompare(b.parent?.process_code || "")
    );
  }, [leaves, processes]);

  const isOverdue = (leaf) => {
    const a = latestByProcess[leaf.id];
    if (!a || !a.assessment_date) return false;
    const months = leaf.review_cycle_months ?? 12;
    const due = new Date(a.assessment_date);
    due.setMonth(due.getMonth() + months);
    return due < new Date();
  };

  const buckets = useMemo(() => {
    const risk = { pay: [], needs: [], incomplete: [], none: [] };
    const mat = { cont: [], needs: [], incomplete: [], none: [] };
    for (const leaf of leaves) {
      const a = latestByProcess[leaf.id];
      if (!a) { risk.none.push(leaf); mat.none.push(leaf); continue; }
      const r = a.risk_score, m = a.maturity_score;
      if (r == null) risk.none.push(leaf);
      else if (r >= 7) risk.pay.push(leaf);
      else if (r >= 4) risk.needs.push(leaf);
      else risk.incomplete.push(leaf);
      if (m == null) mat.none.push(leaf);
      else if (m >= 4) mat.cont.push(leaf);
      else if (m >= 2) mat.needs.push(leaf);
      else mat.incomplete.push(leaf);
    }
    return { risk, mat };
  }, [leaves, latestByProcess]);

  return (
    <div className="space-y-4">
      {/* Display toggles */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 p-3 bg-white rounded-lg border border-slate-200">
        <span className="text-sm font-medium text-slate-600">Display:</span>
        {TOGGLES.map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
            <Checkbox checked={show[k]} onCheckedChange={() => toggle(k)} />
            {label}
          </label>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Periodic-table grid */}
        <div className="flex-1 overflow-x-auto pb-4">
          {columns.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              No leaf processes (L3+) found for the selected company.
            </div>
          ) : (
            <div className="flex gap-2 min-w-max">
              {columns.map((col, ci) => {
                const color = GROUP_COLORS[ci % GROUP_COLORS.length];
                const sortedItems = [...col.items].sort((a, b) =>
                  (a.process_code || "").localeCompare(b.process_code || "")
                );
                return (
                  <div key={col.parent?.id || "ungrouped"} className="flex flex-col gap-1.5 w-[152px]">
                    <div
                      className="rounded-tl-lg rounded-br-lg p-2 text-center shadow-sm text-white"
                      style={{ backgroundColor: color }}
                    >
                      <p className="text-xs font-bold leading-tight line-clamp-2">
                        {col.parent?.name || "Ungrouped"}
                      </p>
                      {col.parent?.process_code && (
                        <p className="text-[10px] font-mono opacity-80 mt-0.5">{col.parent.process_code}</p>
                      )}
                    </div>
                    {sortedItems.map(leaf => (
                      <ProcessMatrixCard
                        key={leaf.id}
                        process={leaf}
                        assessment={latestByProcess[leaf.id]}
                        overdue={isOverdue(leaf)}
                        groupColor={color}
                        show={show}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="lg:w-72 space-y-4 shrink-0">
          <LegendCard title="Risk Score" buckets={[
            { label: "Pay Attention", color: "#dc2626", items: buckets.risk.pay },
            { label: "Needs Attention", color: "#ea580c", items: buckets.risk.needs },
            { label: "Incomplete", color: "#2563eb", items: buckets.risk.incomplete },
            { label: "No Review", color: "#94a3b8", items: buckets.risk.none },
          ]} />
          <LegendCard title="Maturity Rating" buckets={[
            { label: "Continue", color: "#16a34a", items: buckets.mat.cont },
            { label: "Needs Attention", color: "#ca8a04", items: buckets.mat.needs },
            { label: "Incomplete", color: "#2563eb", items: buckets.mat.incomplete },
            { label: "No Review", color: "#94a3b8", items: buckets.mat.none },
          ]} />
        </div>
      </div>
    </div>
  );
}
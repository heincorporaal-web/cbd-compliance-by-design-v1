import React, { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

const LIKELIHOOD_RANK = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };

const RISK_STATUSES = [
  "draft", "identified", "auto_assigned", "pending_review",
  "returned", "approved", "assessed", "mitigated", "accepted", "closed",
];

const RISK_CATEGORIES = [
  "operational", "financial", "strategic", "compliance",
  "cyber_security", "third_party", "reputational", "technology",
];

// Default rating bands used when an assessment model has no impact_levels.
const DEFAULT_BANDS = [
  { label: "Very Low", low_value: 1, high_value: 4, color_hex: "#22c55e" },
  { label: "Low", low_value: 5, high_value: 9, color_hex: "#84cc16" },
  { label: "Medium", low_value: 10, high_value: 14, color_hex: "#eab308" },
  { label: "High", low_value: 15, high_value: 19, color_hex: "#f97316" },
  { label: "Critical", low_value: 20, high_value: 25, color_hex: "#dc2626" },
];

function hexToRgb(hex) {
  if (!hex) return { r: 220, g: 38, b: 38 };
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function scoreOf(risk, model) {
  if (typeof risk.inherent_risk_score === "number" && risk.inherent_risk_score > 0) {
    return risk.inherent_risk_score;
  }
  const lRank = LIKELIHOOD_RANK[risk.likelihood] || 3;
  const iRank = LIKELIHOOD_RANK[risk.impact] || 3;
  const bands = (model?.impact_levels || [])
    .filter((b) => b.high_value != null)
    .sort((a, b) => a.low_value - b.low_value);
  if (bands.length) {
    const lo = bands[0].low_value || 1;
    const hi = bands[bands.length - 1].high_value || bands[bands.length - 1].low_value || 5;
    const span = hi - lo || 1;
    return lo + ((lRank * iRank - 1) / 24) * span;
  }
  return lRank * iRank;
}

function bandOf(score, bands) {
  for (const b of bands) {
    const lo = b.low_value ?? -Infinity;
    const hi = b.high_value ?? Infinity;
    if (score >= lo && score <= hi) return b;
  }
  if (score > (bands[bands.length - 1]?.high_value ?? 0)) return bands[bands.length - 1];
  return bands[0];
}

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
        active
          ? "bg-primary text-white border-primary"
          : "bg-white text-slate-600 border-slate-200 hover:border-primary/50"
      }`}
    >
      {label}
    </button>
  );
}

export default function RiskHeatmap({ risks, companyId }) {
  const { data: businessUnits = [] } = useQuery({
    queryKey: ["businessUnits", companyId],
    queryFn: () => base44.entities.BusinessUnit.list(),
  });
  const { data: valueChains = [] } = useQuery({
    queryKey: ["valueChains", companyId],
    queryFn: () => base44.entities.ValueChain.list(),
  });
  const { data: assessmentModels = [] } = useQuery({
    queryKey: ["assessmentModels", companyId],
    queryFn: () => base44.entities.AssessmentModel.list(),
  });

  const filteredBUs = useMemo(
    () => (companyId === "all" ? businessUnits : businessUnits.filter((b) => b.company_id === companyId)),
    [businessUnits, companyId]
  );
  const filteredModels = useMemo(
    () => assessmentModels.filter((m) => companyId === "all" || m.company_id === companyId || m.is_global),
    [assessmentModels, companyId]
  );

  const [modelId, setModelId] = useState("");
  useEffect(() => {
    if (!modelId && filteredModels.length) {
      const active = filteredModels.find((m) => m.status === "active") || filteredModels[0];
      setModelId(active.id);
    }
  }, [filteredModels, modelId]);

  const [statuses, setStatuses] = useState(() => new Set(RISK_STATUSES));
  const [categories, setCategories] = useState(() => new Set(RISK_CATEGORIES));

  const model = useMemo(
    () => filteredModels.find((m) => m.id === modelId) || null,
    [filteredModels, modelId]
  );

  const bands = useMemo(() => {
    if (model?.impact_levels?.length) {
      return [...model.impact_levels]
        .sort((a, b) => (a.low_value ?? 0) - (b.low_value ?? 0))
        .map((b) => ({ ...b, color_hex: b.color_hex || "#dc2626" }));
    }
    return DEFAULT_BANDS;
  }, [model]);

  // Bridge risks → business units via value chain.
  const { buByVcId, vcMatchers } = useMemo(() => {
    const map = {};
    filteredBUs.forEach((bu) => {
      if (bu.value_chain_id) (map[bu.value_chain_id] ||= []).push(bu);
    });
    const matchers = valueChains
      .filter((vc) => companyId === "all" || vc.company_id === companyId)
      .map((vc) => ({
        id: vc.id,
        name: (vc.name || "").toLowerCase(),
        code: (vc.value_chain_code || "").toLowerCase(),
      }));
    return { buByVcId: map, vcMatchers: matchers };
  }, [filteredBUs, valueChains, companyId]);

  const riskToBUIds = useMemo(() => {
    const cache = new Map();
    risks.forEach((r) => {
      const key = r.id;
      if (cache.has(key)) return;
      const ids = new Set();
      const vc = (r.value_chain || "").toLowerCase();
      if (vc) {
        for (const m of vcMatchers) {
          if ((m.name && vc.includes(m.name)) || (m.code && vc.includes(m.code))) {
            (buByVcId[m.id] || []).forEach((b) => ids.add(b.id));
          }
        }
      }
      cache.set(key, ids);
    });
    return cache;
  }, [risks, vcMatchers, buByVcId]);

  const sliced = useMemo(
    () => risks.filter((r) => statuses.has(r.status) && categories.has(r.category)),
    [risks, statuses, categories]
  );

  const { rows, columnTotals, maxCount } = useMemo(() => {
    const buMap = new Map();
    filteredBUs.forEach((bu) =>
      buMap.set(bu.id, { name: bu.name, type: bu.type, counts: bands.map(() => 0) })
    );
    const unassigned = bands.map(() => 0);

    sliced.forEach((r) => {
      const score = scoreOf(r, model);
      const band = bandOf(score, bands);
      const bi = bands.indexOf(band);
      if (bi < 0) return;
      const buIds = riskToBUIds.get(r.id) || new Set();
      if (buIds.size === 0) {
        unassigned[bi] += 1;
      } else {
        buIds.forEach((id) => {
          const row = buMap.get(id);
          if (row) row.counts[bi] += 1;
        });
      }
    });

    const allRows = Array.from(buMap.values())
      .map((r) => ({ ...r, total: r.counts.reduce((s, c) => s + c, 0) }))
      .filter((r) => r.total > 0);
    allRows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

    const unTotal = unassigned.reduce((s, c) => s + c, 0);
    if (unTotal > 0) allRows.push({ name: "Unassigned", type: "", counts: unassigned, total: unTotal });

    const columnTotals = bands.map((_, i) => allRows.reduce((s, r) => s + r.counts[i], 0));
    const maxCount = Math.max(1, ...allRows.flatMap((r) => r.counts));

    return { rows: allRows, columnTotals, maxCount };
  }, [sliced, filteredBUs, bands, model, riskToBUIds]);

  const totalShown = sliced.length;

  if (risks.length === 0) return null;

  const toggle = (set, setter, val) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setter(next);
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            Risk Heatmap — by Business Unit &amp; Assessment Model Rating
          </CardTitle>
          <Link to="/RiskRegister" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Slicers */}
        <div className="flex flex-col gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Assessment Model
            </span>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="text-xs rounded-md border border-slate-200 bg-white px-2 py-1.5 max-w-[260px]"
            >
              {filteredModels.length === 0 && <option value="">No models</option>}
              {filteredModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.analysis_type ? `(${m.analysis_type})` : ""}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400">
              {bands.length} rating bands · {totalShown} risks shown
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-600">Status</span>
            <Chip
              label="All"
              active={statuses.size === RISK_STATUSES.length}
              onClick={() =>
                setStatuses(statuses.size === RISK_STATUSES.length ? new Set() : new Set(RISK_STATUSES))
              }
            />
            {RISK_STATUSES.map((s) => (
              <Chip
                key={s}
                label={s.replace(/_/g, " ")}
                active={statuses.has(s)}
                onClick={() => toggle(statuses, setStatuses, s)}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-600">Category</span>
            <Chip
              label="All"
              active={categories.size === RISK_CATEGORIES.length}
              onClick={() =>
                setCategories(categories.size === RISK_CATEGORIES.length ? new Set() : new Set(RISK_CATEGORIES))
              }
            />
            {RISK_CATEGORIES.map((c) => (
              <Chip
                key={c}
                label={c.replace(/_/g, " ")}
                active={categories.has(c)}
                onClick={() => toggle(categories, setCategories, c)}
              />
            ))}
          </div>
        </div>

        {/* Heatmap table */}
        {rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No risks map to a business unit for the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: `${bands.length * 64 + 260}px` }}>
              <thead>
                <tr>
                  <th className="text-left font-semibold text-slate-600 px-3 py-2 sticky left-0 bg-white">
                    Business Unit
                  </th>
                  {bands.map((b, i) => (
                    <th key={i} className="text-center font-semibold px-2 py-2" style={{ color: hexToRgb(b.color_hex) && undefined }}>
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ backgroundColor: b.color_hex }}
                        />
                        {b.label}
                      </span>
                    </th>
                  ))}
                  <th className="text-center font-semibold text-slate-600 px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.name}-${i}`} className={i % 2 ? "bg-slate-50/50" : ""}>
                    <td className="px-3 py-2 sticky left-0 bg-inherit">
                      <div className="font-medium text-slate-800 truncate max-w-[200px]">{row.name}</div>
                      {row.type && <div className="text-[11px] text-slate-400">{row.type}</div>}
                    </td>
                    {row.counts.map((count, bi) => {
                      const { r, g, b } = hexToRgb(bands[bi].color_hex);
                      const intensity = count === 0 ? 0 : 0.2 + 0.8 * (count / maxCount);
                      const dark = count / maxCount > 0.5;
                      return (
                        <td key={bi} className="px-2 py-2 text-center">
                          <div
                            className="flex items-center justify-center rounded-md font-semibold"
                            style={{
                              backgroundColor: `rgba(${r}, ${g}, ${b}, ${intensity.toFixed(2)})`,
                              color: count === 0 ? "#cbd5e1" : dark ? "#ffffff" : "#1e293b",
                              minHeight: "36px",
                              minWidth: "56px",
                            }}
                            title={`${count} risk${count === 1 ? "" : "s"} rated "${bands[bi].label}" in ${row.name}`}
                          >
                            {count}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center">
                      <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-1 rounded-md bg-slate-800 text-white font-bold text-xs">
                        {row.total}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td className="px-3 py-2 font-semibold text-slate-700 sticky left-0 bg-white">Total</td>
                  {columnTotals.map((c, i) => (
                    <td key={i} className="px-3 py-2 text-center font-bold text-slate-800">
                      {c}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-bold text-slate-900">{totalShown}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Low</span>
            <div className="flex items-center gap-1">
              {[0.2, 0.45, 0.7, 1].map((op) => (
                <div key={op} className="w-5 h-3 rounded-sm" style={{ backgroundColor: `rgba(220, 38, 38, ${op})` }} />
              ))}
            </div>
            <span>High count</span>
          </div>
          <span>Risks mapped to business units via their value chain · rating bands from the selected assessment model</span>
        </div>
      </CardContent>
    </Card>
  );
}
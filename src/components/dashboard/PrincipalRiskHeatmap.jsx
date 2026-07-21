import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

const SEVERITY_LEVELS = ["Critical", "High", "Medium", "Low"];

// Base RGB per severity — intensity (alpha) scales with the count.
const SEVERITY_RGB = {
  Critical: { r: 220, g: 38, b: 38 },
  High: { r: 234, g: 88, b: 12 },
  Medium: { r: 202, g: 138, b: 4 },
  Low: { r: 37, g: 99, b: 235 },
};

export default function PrincipalRiskHeatmap({ principalRisks, companyId }) {
  const { data: businessUnits = [] } = useQuery({
    queryKey: ["businessUnits", companyId],
    queryFn: () => base44.entities.BusinessUnit.list(),
  });

  const filteredBUs = useMemo(
    () => (companyId === "all" ? businessUnits : businessUnits.filter((b) => b.company_id === companyId)),
    [businessUnits, companyId]
  );

  const { rows, columnTotals, maxCount } = useMemo(() => {
    // Count risks per business unit × severity.
    const buMap = new Map();
    const unassigned = { Critical: 0, High: 0, Medium: 0, Low: 0 };

    // Seed rows for every business unit (so the heatmap shows zeros too).
    filteredBUs.forEach((bu) => {
      buMap.set(bu.id, { name: bu.name, type: bu.type, counts: { Critical: 0, High: 0, Medium: 0, Low: 0 } });
    });

    principalRisks.forEach((r) => {
      const sev = r.criticality && SEVERITY_LEVELS.includes(r.criticality) ? r.criticality : null;
      if (!sev) return;
      const row = r.business_area_id && buMap.get(r.business_area_id);
      if (row) {
        row.counts[sev] += 1;
      } else if (r.business_area_id) {
        // Business unit not in the fetched list — track by denormalized name.
        let byName = buMap.get(`name:${r.business_area_name}`);
        if (!byName) {
          byName = { name: r.business_area_name || "Unknown", type: "", counts: { Critical: 0, High: 0, Medium: 0, Low: 0 } };
          buMap.set(`name:${r.business_area_name}`, byName);
        }
        byName.counts[sev] += 1;
      } else {
        unassigned[sev] += 1;
      }
    });

    const allRows = Array.from(buMap.values()).map((r) => ({
      ...r,
      total: SEVERITY_LEVELS.reduce((s, l) => s + r.counts[l], 0),
    }));
    // Sort: units with risks first, by total desc, then by name.
    allRows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

    // Add unassigned row only if it has risks.
    const unassignedTotal = SEVERITY_LEVELS.reduce((s, l) => s + unassigned[l], 0);
    if (unassignedTotal > 0) {
      allRows.push({ name: "Unassigned", type: "", counts: unassigned, total: unassignedTotal });
    }

    const columnTotals = SEVERITY_LEVELS.reduce((acc, l) => {
      acc[l] = allRows.reduce((s, r) => s + r.counts[l], 0);
      return acc;
    }, {});

    const maxCount = Math.max(1, ...allRows.flatMap((r) => SEVERITY_LEVELS.map((l) => r.counts[l])));

    return { rows: allRows, columnTotals, maxCount };
  }, [filteredBUs, principalRisks]);

  const totalRisks = principalRisks.length;

  if (totalRisks === 0) return null;

  // Build a per-severity cell with the matching base colour.
  const cell = (count, severity) => {
    const { r, g, b } = SEVERITY_RGB[severity];
    const intensity = 0.2 + 0.8 * (count / maxCount);
    const dark = count / maxCount > 0.55;
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, ${intensity.toFixed(2)})`,
      color: dark ? "#ffffff" : "#1e293b",
    };
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            Principal Risk Heatmap — by Business Unit &amp; Severity
          </CardTitle>
          <Link
            to="/PrincipalRisks"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No business units mapped to principal risks.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[560px]">
              <thead>
                <tr>
                  <th className="text-left font-semibold text-slate-600 px-3 py-2 sticky left-0 bg-white">
                    Business Unit
                  </th>
                  {SEVERITY_LEVELS.map((l) => (
                    <th key={l} className="text-center font-semibold text-slate-600 px-3 py-2">
                      {l}
                    </th>
                  ))}
                  <th className="text-center font-semibold text-slate-600 px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.name}-${i}`} className={i % 2 ? "bg-slate-50/50" : ""}>
                    <td className="px-3 py-2 sticky left-0 bg-inherit">
                      <div className="font-medium text-slate-800 truncate max-w-[220px]">{row.name}</div>
                      {row.type && (
                        <div className="text-[11px] text-slate-400">{row.type}</div>
                      )}
                    </td>
                    {SEVERITY_LEVELS.map((l) => (
                      <td key={l} className="px-2 py-2 text-center">
                        <div
                          className="flex items-center justify-center rounded-md font-semibold"
                          style={{ ...cell(row.counts[l], l), minHeight: "36px", minWidth: "56px" }}
                          title={`${row.counts[l]} ${l} risk${row.counts[l] === 1 ? "" : "s"} in ${row.name}`}
                        >
                          {row.counts[l]}
                        </div>
                      </td>
                    ))}
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
                  <td className="px-3 py-2 font-semibold text-slate-700 sticky left-0 bg-white">
                    Total
                  </td>
                  {SEVERITY_LEVELS.map((l) => (
                    <td key={l} className="px-3 py-2 text-center font-bold text-slate-800">
                      {columnTotals[l]}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-bold text-slate-900">
                    {totalRisks}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Low intensity</span>
            <div className="flex items-center gap-1">
              {[0.2, 0.45, 0.7, 1].map((op) => (
                <div
                  key={op}
                  className="w-5 h-3 rounded-sm"
                  style={{ backgroundColor: `rgba(220, 38, 38, ${op})` }}
                />
              ))}
            </div>
            <span>High intensity</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            {SEVERITY_LEVELS.map((l) => (
              <span key={l} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: `rgba(${SEVERITY_RGB[l].r}, ${SEVERITY_RGB[l].g}, ${SEVERITY_RGB[l].b}, 1)` }}
                />
                {l}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
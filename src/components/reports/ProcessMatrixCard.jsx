import React from "react";
import { Clock, ShieldAlert, AlertTriangle } from "lucide-react";

export function riskColor(score) {
  if (score == null) return "#94a3b8";
  if (score >= 7) return "#dc2626"; // red — pay attention
  if (score >= 4) return "#ea580c"; // orange — needs attention
  return "#2563eb"; // blue — incomplete / low
}

export function maturityColor(score) {
  if (score == null) return "#94a3b8";
  if (score >= 4) return "#16a34a"; // green — continue
  if (score >= 2) return "#ca8a04"; // yellow — needs attention
  return "#2563eb"; // blue — incomplete
}

function ScoreBar({ label, value, max, color }) {
  const pct = value == null ? 0 : Math.min(100, (value / max) * 100);
  const display = value == null ? "—" : Number.isInteger(value) ? value : Number(value).toFixed(1);
  return (
    <div className="flex items-center gap-1">
      <span className="text-[8px] opacity-80 w-3">{label}</span>
      <div className="flex-1 h-2 rounded bg-white/25 overflow-hidden">
        <div className="h-full rounded transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[8px] w-7 text-right opacity-95 font-medium">{display}</span>
    </div>
  );
}

export default function ProcessMatrixCard({ process, assessment, overdue, groupColor, show }) {
  const { showMaturity, showRisk, showResilience, showReviewStatus, showCodes } = show;
  const hasReview = !!assessment;
  const maturity = assessment?.maturity_score;
  const risk = assessment?.risk_score;
  const isCritical = process.criticality === "critical";

  return (
    <div
      className="rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-white flex flex-col gap-1"
      style={{ backgroundColor: groupColor }}
      title={process.name}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1 shrink-0">
          {showReviewStatus && !hasReview && <Clock className="w-3.5 h-3.5 opacity-90" title="No review performed" />}
          {showReviewStatus && hasReview && overdue && <AlertTriangle className="w-3.5 h-3.5 opacity-90" title="Review overdue" />}
          {showResilience && isCritical && <ShieldAlert className="w-3.5 h-3.5 opacity-90" title="Critical (resilience)" />}
        </div>
        <span className="text-[10px] leading-tight font-medium text-right flex-1 line-clamp-2">
          {process.name}
        </span>
      </div>
      {showCodes && (
        <span className="text-[9px] font-mono opacity-70">{process.process_code}</span>
      )}
      {(showMaturity || showRisk) && (
        <div className="mt-1 space-y-1">
          {showMaturity && (
            <ScoreBar label="M" value={maturity} max={5} color={maturityColor(maturity)} />
          )}
          {showRisk && (
            <ScoreBar label="R" value={risk} max={10} color={riskColor(risk)} />
          )}
        </div>
      )}
    </div>
  );
}
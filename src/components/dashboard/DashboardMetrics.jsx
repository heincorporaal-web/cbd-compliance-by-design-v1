import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

/**
 * Compact metric tile for the Executive Dashboard.
 * - `gradient`: dark saturated gradient (white text), e.g. "from-blue-500 to-blue-600"
 * - `tint`: light gradient background (slate text), e.g. "from-amber-50 to-orange-50"
 * - `iconColor`: tailwind text color for the icon on plain/tinted tiles
 * - `to`: optional route path — makes the tile clickable (navigates to the listed records)
 */
export function MetricTile({ icon: Icon, label, value, sub, gradient, tint, iconColor, to }) {
  const solid = !!gradient;
  const inner = (
    <Card
      className={`border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
        to ? "cursor-pointer hover:border-slate-300" : ""
      } ${
        gradient
          ? `bg-gradient-to-br ${gradient} text-white border-transparent`
          : tint
          ? `bg-gradient-to-br ${tint}`
          : "bg-white"
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <span className={`text-xl font-bold leading-none ${solid ? "text-white" : "text-slate-900"}`}>
            {value}
          </span>
          {Icon && (
            <Icon className={`w-4 h-4 shrink-0 ${solid ? "text-white/80" : iconColor || "text-slate-400"}`} />
          )}
        </div>
        <p className={`text-xs font-medium mt-2 ${solid ? "text-white/90" : "text-slate-600"}`}>{label}</p>
        {sub && (
          <p className={`text-[11px] mt-0.5 ${solid ? "text-white/70" : "text-slate-400"}`}>{sub}</p>
        )}
      </CardContent>
    </Card>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

/**
 * Renders a dashboard metric section in either compact tiles or a consolidated list.
 * Each item may carry a `to` route path to make it clickable.
 */
export default function MetricSection({ title, items, view, action }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{title}</h2>
        {action}
      </div>
      {view === "list" ? (
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((it, i) => {
                const Icon = it.icon;
                const row = (
                  <div className={`flex items-center justify-between gap-3 px-4 py-2.5 ${it.to ? "cursor-pointer hover:bg-slate-50" : ""}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      {Icon && (
                        <Icon className={`w-4 h-4 shrink-0 ${it.iconColor || "text-slate-400"}`} />
                      )}
                      <span className="text-sm text-slate-600 truncate">{it.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2 shrink-0">
                      <span className="text-sm font-bold text-slate-900">{it.value}</span>
                      {it.sub && <span className="text-xs text-slate-400">{it.sub}</span>}
                    </div>
                  </div>
                );
                return it.to ? (
                  <Link key={i} to={it.to} className="block">{row}</Link>
                ) : (
                  <div key={i}>{row}</div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((it, i) => (
            <MetricTile key={i} {...it} />
          ))}
        </div>
      )}
    </div>
  );
}
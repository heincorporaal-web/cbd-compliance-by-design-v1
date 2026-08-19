import React from "react";
import { Boxes, ShieldCheck, ShieldAlert, Clock, AlertTriangle } from "lucide-react";

export default function CIStatCards({ cis = [] }) {
  const total = cis.length;
  const managed = cis.filter(c => c.managed_unmanaged === "managed").length;
  const unmanaged = cis.filter(c => c.managed_unmanaged === "unmanaged").length;
  const stale = cis.filter(c => c.stale_status === "stale" || c.stale_status === "retirement_candidate").length;
  const unknown = cis.filter(c => !c.ci_class_name).length;

  const cards = [
    { label: "Total CIs", value: total, icon: Boxes, color: "text-blue-600 bg-blue-50" },
    { label: "Managed", value: managed, icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50" },
    { label: "Unmanaged", value: unmanaged, icon: ShieldAlert, color: "text-amber-600 bg-amber-50" },
    { label: "Stale", value: stale, icon: Clock, color: "text-orange-600 bg-orange-50" },
    { label: "Unclassified", value: unknown, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map(c => (
        <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${c.color}`}>
            <c.icon className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{c.value}</p>
          <p className="text-xs text-slate-500">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
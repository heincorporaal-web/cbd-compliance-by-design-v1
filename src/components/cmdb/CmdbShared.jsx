import React from "react";

export function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  );
}

export function Field({ label, children, full, required }) {
  return (
    <div className={`space-y-1 ${full ? "md:col-span-2" : ""}`}>
      <label className="text-xs font-medium text-slate-600">{label}{required && <span className="text-red-500"> *</span>}</label>
      {children}
    </div>
  );
}

export function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      {Icon && <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-800 break-words">{value || <span className="text-slate-300 italic">—</span>}</p>
      </div>
    </div>
  );
}

export function Badge2({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
import React from "react";
import ReportCard from "./ReportCard";

export default function ReportCategoryPage({ title, description, reports = [], children }) {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-slate-600 mt-1">{description}</p>}
      </div>
      {reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map(r => <ReportCard key={r.id} report={r} />)}
        </div>
      )}
      {children}
    </div>
  );
}
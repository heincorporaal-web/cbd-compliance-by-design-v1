import React from "react";
import ReportCard from "./ReportCard";
import PageHeader from "@/components/layout/PageHeader";

export default function ReportCategoryPage({ title, description, reports = [], children, icon, gradient = "from-slate-600 to-slate-800" }) {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={icon}
        title={title}
        tagline={description}
        gradient={gradient}
      />
      {reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map(r => <ReportCard key={r.id} report={r} />)}
        </div>
      )}
      {children}
    </div>
  );
}
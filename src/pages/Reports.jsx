import React from "react";
import { Presentation, FileSpreadsheet } from "lucide-react";
import ReportCard from "@/components/reports/ReportCard";
import { PERFORMANCE_REPORTS, DATA_LIBRARY_REPORTS, ISSUE_REPORTS } from "@/lib/reportsCatalog";
import PageHeader from "@/components/layout/PageHeader";

export default function Reports() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <PageHeader
        navItemId="reports"
        icon={Presentation}
        title="Reports"
        tagline="Generate compliance, GRC, and data reports"
        gradient="from-indigo-600 to-violet-700"
      />

      {/* Performance Reports */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Presentation className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Performance Reports</h2>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Exportable to Word / PowerPoint / Print</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PERFORMANCE_REPORTS.map(r => <ReportCard key={r.id} report={r} />)}
        </div>
      </div>

      {/* Data / List Reports */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Data &amp; List Reports</h2>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Configure fields · Filter records · Export to CSV or PDF</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...DATA_LIBRARY_REPORTS, ...ISSUE_REPORTS].map(r => <ReportCard key={r.id} report={r} />)}
        </div>
      </div>
    </div>
  );
}
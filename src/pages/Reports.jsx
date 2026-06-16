import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Building2, BarChart3, Network, Users, FileSpreadsheet, Presentation } from "lucide-react";

const PERFORMANCE_REPORTS = [
  {
    id: "company-overview",
    title: "Company Overview Report",
    description: "Comprehensive report showing all statistics for each company including frameworks, processes, maturity scores, goals, risks, and controls.",
    icon: Building2,
    color: "from-blue-500 to-indigo-600",
    url: createPageUrl("CompanyOverviewReport"),
    exports: ["Print / PDF", "Word", "PowerPoint"],
  },
  {
    id: "ihpom-tree",
    title: "iHPOM Tree View Report",
    description: "Hierarchical tree view of business processes from Level 0 (Value Chain) to Level 5 (Tasks) with drill-down capabilities.",
    icon: BarChart3,
    color: "from-purple-500 to-pink-600",
    url: createPageUrl("iHPOMTreeReport"),
    exports: ["Print / PDF", "Word", "PowerPoint"],
  },
  {
    id: "process-company",
    title: "Process Company Report",
    description: "List all processes assigned to a company with date range filtering, hierarchy level selection, ownership, key requirements and descriptions.",
    icon: Network,
    color: "from-teal-500 to-green-600",
    url: createPageUrl("ProcessCompanyReport"),
    exports: ["Print / PDF", "Word", "PowerPoint"],
  },
];

const DATA_REPORTS = [
  {
    id: "stakeholder-list",
    title: "Stakeholder List",
    description: "Export a configurable list of stakeholders. Select which fields to include and filter by company or status. Export to PDF or CSV.",
    icon: Users,
    color: "from-orange-500 to-amber-500",
    url: createPageUrl("StakeholderListReport"),
    exports: ["CSV", "PDF"],
  },
];

function ReportCard({ report, type }) {
  const exportBadgeColor = (label) => {
    if (label === "CSV") return "bg-green-100 text-green-700 border-green-200";
    if (label === "PDF") return "bg-red-100 text-red-700 border-red-200";
    if (label === "Word") return "bg-blue-100 text-blue-700 border-blue-200";
    if (label === "PowerPoint") return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <CardHeader className="pb-3">
        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${report.color} flex items-center justify-center mb-3`}>
          <report.icon className="w-5 h-5 text-white" />
        </div>
        <CardTitle className="text-base">{report.title}</CardTitle>
        <CardDescription className="text-sm mt-1">{report.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {report.exports.map(e => (
            <span key={e} className={`text-xs px-2 py-0.5 rounded border font-medium ${exportBadgeColor(e)}`}>{e}</span>
          ))}
        </div>
        <Link to={report.url}>
          <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <FileText className="w-4 h-4 mr-2" />
            Open Report
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-600 mt-1">Generate compliance, GRC, and data reports</p>
      </div>

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
          {PERFORMANCE_REPORTS.map(r => <ReportCard key={r.id} report={r} type="performance" />)}
        </div>
      </div>

      {/* Data / List Reports */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Data &amp; List Reports</h2>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Configure fields · Export to CSV or PDF</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DATA_REPORTS.map(r => <ReportCard key={r.id} report={r} type="data" />)}
        </div>
      </div>
    </div>
  );
}
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Building2, TrendingUp, BarChart3 } from "lucide-react";

export default function Reports() {
  const reports = [
    {
      id: "company-overview",
      title: "Company Overview Report",
      description: "Comprehensive report showing all statistics for each company including frameworks, processes, maturity scores, goals, risks, and controls",
      icon: Building2,
      color: "from-blue-500 to-indigo-600",
      url: createPageUrl("CompanyOverviewReport")
    }
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-600 mt-1">Generate comprehensive compliance and GRC reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map(report => (
          <Card key={report.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${report.color} flex items-center justify-center mb-4`}>
                <report.icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle>{report.title}</CardTitle>
              <CardDescription className="mt-2">{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={report.url}>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
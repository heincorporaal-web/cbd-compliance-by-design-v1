import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, FileCheck, Shield, TrendingUp, AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import StatsOverview from "../components/dashboard/StatsOverview";
import RecentAssessments from "../components/dashboard/RecentAssessments";
import RiskDistribution from "../components/dashboard/RiskDistribution";
import CompanyRiskMatrix from "../components/dashboard/CompanyRiskMatrix";

export default function Dashboard() {
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list('-created_date'),
  });

  const completedAssessments = assessments.filter(a => a.status === 'completed');
  const criticalRisks = assessments.filter(a => a.risk_level === 'critical').length;
  const avgScore = completedAssessments.length > 0
    ? (completedAssessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / completedAssessments.length).toFixed(1)
    : 0;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Risk Management Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor and assess risks across your organization</p>
        </div>
        <Link to={createPageUrl("Assessments")}>
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            New Assessment
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsOverview
          title="Total Companies"
          value={companies.length}
          icon={Building2}
          bgColor="from-blue-500 to-blue-600"
          trend={`${companies.length} active`}
        />
        <StatsOverview
          title="Frameworks"
          value={frameworks.filter(f => f.is_active).length}
          icon={FileCheck}
          bgColor="from-indigo-500 to-indigo-600"
          trend={`${frameworks.length} total`}
        />
        <StatsOverview
          title="Assessments"
          value={completedAssessments.length}
          icon={Shield}
          bgColor="from-green-500 to-green-600"
          trend={`${assessments.length} total`}
        />
        <StatsOverview
          title="Critical Risks"
          value={criticalRisks}
          icon={AlertTriangle}
          bgColor="from-red-500 to-red-600"
          trend={criticalRisks > 0 ? "Requires attention" : "All clear"}
          alert={criticalRisks > 0}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentAssessments assessments={assessments.slice(0, 5)} />
          <CompanyRiskMatrix companies={companies} assessments={assessments} />
        </div>
        <div className="space-y-6">
          <RiskDistribution assessments={completedAssessments} />
          
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <Link to={createPageUrl("Companies")}>
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="w-4 h-4 mr-2" />
                  Manage Companies
                </Button>
              </Link>
              <Link to={createPageUrl("Frameworks")}>
                <Button variant="outline" className="w-full justify-start">
                  <FileCheck className="w-4 h-4 mr-2" />
                  View Frameworks
                </Button>
              </Link>
              <Link to={createPageUrl("Assessments")}>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  All Assessments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
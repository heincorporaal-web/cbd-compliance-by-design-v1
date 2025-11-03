import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Shield, ClipboardCheck, TrendingUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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

  const { data: controlAssessments = [] } = useQuery({
    queryKey: ['controlAssessments'],
    queryFn: () => base44.entities.ControlAssessment.list(),
  });

  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const activeFrameworks = frameworks.filter(f => f.status === 'active').length;
  const inProgressAssessments = assessments.filter(a => a.status === 'in_progress').length;
  
  const compliantControls = controlAssessments.filter(ca => ca.status === 'compliant').length;
  const totalAssessedControls = controlAssessments.filter(ca => ca.status !== 'not_assessed').length;
  const complianceRate = totalAssessedControls > 0 
    ? Math.round((compliantControls / totalAssessedControls) * 100) 
    : 0;

  const recentAssessments = assessments.slice(0, 5);

  const getStatusColor = (status) => {
    const colors = {
      not_started: 'bg-slate-100 text-slate-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      archived: 'bg-slate-100 text-slate-500'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getStatusIcon = (status) => {
    const icons = {
      not_started: Clock,
      in_progress: TrendingUp,
      completed: CheckCircle2,
      archived: AlertTriangle
    };
    return icons[status] || Clock;
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Risk Management Dashboard</h1>
        <p className="text-slate-600">Monitor compliance and assess risks across your organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90">Active Companies</CardTitle>
              <Building2 className="w-5 h-5 opacity-75" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCompanies}</div>
            <p className="text-xs opacity-75 mt-1">Total: {companies.length}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90">Frameworks</CardTitle>
              <Shield className="w-5 h-5 opacity-75" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeFrameworks}</div>
            <p className="text-xs opacity-75 mt-1">Ready for assessment</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90">In Progress</CardTitle>
              <ClipboardCheck className="w-5 h-5 opacity-75" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inProgressAssessments}</div>
            <p className="text-xs opacity-75 mt-1">Active assessments</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90">Compliance Rate</CardTitle>
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{complianceRate}%</div>
            <p className="text-xs opacity-75 mt-1">{compliantControls} of {totalAssessedControls} controls</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Assessments</CardTitle>
              <Link to={createPageUrl("Assessments")}>
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentAssessments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentAssessments.map((assessment) => {
                  const company = companies.find(c => c.id === assessment.company_id);
                  const framework = frameworks.find(f => f.id === assessment.framework_id);
                  const StatusIcon = getStatusIcon(assessment.status);
                  
                  return (
                    <Link 
                      key={assessment.id}
                      to={createPageUrl(`AssessmentDetail?id=${assessment.id}`)}
                      className="block p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{assessment.name}</div>
                          <div className="text-sm text-slate-500 mt-1">
                            {company?.name || 'Unknown'} • {framework?.name || 'Unknown Framework'}
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {assessment.status.replace('_', ' ')}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No assessments yet</p>
                <Link to={createPageUrl("Assessments")}>
                  <Button className="mt-4" size="sm">Create Assessment</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Link to={createPageUrl("Companies")}>
              <Button className="w-full justify-start" variant="outline">
                <Building2 className="w-4 h-4 mr-2" />
                Manage Companies
              </Button>
            </Link>
            <Link to={createPageUrl("Frameworks")}>
              <Button className="w-full justify-start" variant="outline">
                <Shield className="w-4 h-4 mr-2" />
                View Frameworks
              </Button>
            </Link>
            <Link to={createPageUrl("Assessments")}>
              <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                <ClipboardCheck className="w-4 h-4 mr-2" />
                New Assessment
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {companies.length === 0 && frameworks.length === 0 && (
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Get Started</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Begin by adding companies and loading risk frameworks to start your compliance assessments
            </p>
            <div className="flex gap-3 justify-center">
              <Link to={createPageUrl("Companies")}>
                <Button>Add Company</Button>
              </Link>
              <Link to={createPageUrl("Frameworks")}>
                <Button variant="outline">Load Frameworks</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
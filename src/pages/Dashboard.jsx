import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Shield, ClipboardCheck, TrendingUp, AlertTriangle, CheckCircle2, Server, Users, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  const { data: ictSystems = [] } = useQuery({
    queryKey: ['ictSystems'],
    queryFn: () => base44.entities.ICTSystem.list(),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-detected_date', 10),
  });

  const { data: thirdParties = [] } = useQuery({
    queryKey: ['thirdParties'],
    queryFn: () => base44.entities.ThirdPartyProvider.list(),
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues'],
    queryFn: () => base44.entities.Issue.list('-created_date'),
  });

  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const activeFrameworks = frameworks.filter(f => f.status === 'active').length;
  const inProgressAssessments = assessments.filter(a => a.status === 'in_progress').length;
  
  const compliantControls = controlAssessments.filter(ca => ca.status === 'compliant').length;
  const totalAssessedControls = controlAssessments.filter(ca => ca.status !== 'not_assessed').length;
  const complianceRate = totalAssessedControls > 0 
    ? Math.round((compliantControls / totalAssessedControls) * 100) 
    : 0;

  const criticalSystems = ictSystems.filter(s => s.criticality === 'critical').length;
  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && (i.status === 'open' || i.status === 'investigating')).length;
  const highRiskProviders = thirdParties.filter(tp => tp.risk_rating === 'high' || tp.risk_rating === 'critical').length;

  const openIssues = issues.filter(i => i.status === 'open' || i.status === 'in_progress').length;
  const closedIssues = issues.filter(i => i.status === 'resolved' || i.status === 'closed').length;

  const recentIncidents = incidents.slice(0, 5);

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      major: 'bg-orange-100 text-orange-700 border-orange-200',
      moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      minor: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return colors[severity] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-red-100 text-red-700',
      investigating: 'bg-amber-100 text-amber-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-slate-100 text-slate-500'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Compliance Dashboard</h1>
        <p className="text-slate-600">Monitor compliance, resilience, and operational risk across your organization</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Compliance Overview</h2>
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
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">DORA Resilience & Issue Tracking</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">ICT Systems</CardTitle>
                <Server className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{ictSystems.length}</div>
              <p className="text-xs text-slate-500 mt-1">{criticalSystems} critical systems</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Open Incidents</CardTitle>
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{openIncidents}</div>
              <p className="text-xs text-red-600 mt-1">{criticalIncidents} critical</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Third Parties</CardTitle>
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{thirdParties.length}</div>
              <p className="text-xs text-slate-500 mt-1">{highRiskProviders} high risk</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Open Issues</CardTitle>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{openIssues}</div>
              <p className="text-xs text-slate-500 mt-1">Action items & findings</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Closed Issues</CardTitle>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{closedIssues}</div>
              <p className="text-xs text-slate-500 mt-1">Resolved items</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Incidents</CardTitle>
              <Link to={createPageUrl("Incidents")}>
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentIncidents.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentIncidents.map((incident) => (
                  <div key={incident.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{incident.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{incident.incident_type.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={`${getSeverityColor(incident.severity)} border`}>
                          {incident.severity}
                        </Badge>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </div>
                    </div>
                    {incident.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">{incident.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-slate-500">No recent incidents</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Link to={createPageUrl("Issues")}>
              <Button className="w-full justify-start" variant="outline">
                <AlertCircle className="w-4 h-4 mr-2" />
                Manage Issues
              </Button>
            </Link>
            <Link to={createPageUrl("ICTSystems")}>
              <Button className="w-full justify-start" variant="outline">
                <Server className="w-4 h-4 mr-2" />
                Manage ICT Systems
              </Button>
            </Link>
            <Link to={createPageUrl("Incidents")}>
              <Button className="w-full justify-start" variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report Incident
              </Button>
            </Link>
            <Link to={createPageUrl("ThirdParties")}>
              <Button className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Third Party Risk
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
    </div>
  );
}
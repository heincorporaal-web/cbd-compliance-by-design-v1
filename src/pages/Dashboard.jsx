import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Shield, ClipboardCheck, TrendingUp, AlertTriangle, CheckCircle2, Server, Users, AlertCircle, Network, Target, Settings, LayoutDashboard, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import CompanyFilterBar from "@/components/CompanyFilterBar";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import UnassignedRecordsChart from "@/components/dashboard/UnassignedRecordsChart";

const WIDGET_LABELS = {
  compliance: "Compliance Overview",
  riskPosture: "Risk & Control Posture",
  resilience: "DORA Resilience & Issues",
  processHealth: "Process Health",
  goals: "Goal Achievement",
  recentIncidents: "Recent Incidents",
};

const CATEGORY_VIEWS = [
  { id: "all", label: "All", widgets: ["compliance", "riskPosture", "resilience", "processHealth", "goals", "recentIncidents"] },
  { id: "compliance", label: "Compliance", widgets: ["compliance", "recentIncidents"] },
  { id: "risk", label: "Risk", widgets: ["riskPosture", "recentIncidents"] },
  { id: "resilience", label: "Resilience", widgets: ["resilience", "recentIncidents"] },
  { id: "process", label: "Process", widgets: ["processHealth", "goals"] },
];

const DEFAULT_WIDGETS = { compliance: true, resilience: true, processHealth: true, goals: true, riskPosture: true, recentIncidents: true };

export default function Dashboard() {
  const [globalCompany, setSelectedCompany] = useCompanyFilter();
  const [activeView, setActiveView] = useState("all");
  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem("dashboard_widgets");
      return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
    } catch { return DEFAULT_WIDGETS; }
  });

  useEffect(() => {
    try { localStorage.setItem("dashboard_widgets", JSON.stringify(visibleWidgets)); } catch {}
  }, [visibleWidgets]);

  const applyView = (viewId) => {
    setActiveView(viewId);
    const view = CATEGORY_VIEWS.find(v => v.id === viewId);
    if (!view) return;
    const updated = Object.fromEntries(Object.keys(DEFAULT_WIDGETS).map(k => [k, view.widgets.includes(k)]));
    setVisibleWidgets(updated);
  };

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', globalCompany],
    queryFn: () => base44.entities.Assessment.list('-created_date'),
  });

  const { data: controlAssessments = [] } = useQuery({
    queryKey: ['controlAssessments'],
    queryFn: () => base44.entities.ControlAssessment.list(),
  });

  const { data: ictSystems = [] } = useQuery({
    queryKey: ['ictSystems', globalCompany],
    queryFn: () => base44.entities.ICTSystem.list(),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents', globalCompany],
    queryFn: () => base44.entities.Incident.list('-detected_date', 10),
  });

  const { data: thirdParties = [] } = useQuery({
    queryKey: ['thirdParties', globalCompany],
    queryFn: () => base44.entities.ThirdPartyProvider.list(),
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues', globalCompany],
    queryFn: () => base44.entities.Issue.list('-created_date'),
  });

  const { data: processes = [] } = useQuery({
    queryKey: ['businessProcesses', globalCompany],
    queryFn: () => base44.entities.BusinessProcess.list(),
  });

  const { data: processAssessments = [] } = useQuery({
    queryKey: ['processAssessments', globalCompany],
    queryFn: () => base44.entities.ProcessAssessment.list('-assessment_date'),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['grcGoals', globalCompany],
    queryFn: () => base44.entities.GRCGoal.list(),
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['risks', globalCompany],
    queryFn: () => base44.entities.Risk.list(),
  });

  const { data: principalRisks = [] } = useQuery({
    queryKey: ['principalRisks'],
    queryFn: () => base44.entities.PrincipalRisk.list(),
  });

  // Apply company filter
  const gc = globalCompany;
  const filteredAssessments = gc === "all" ? assessments : assessments.filter(a => a.company_id === gc);
  const filteredIctSystems = gc === "all" ? ictSystems : ictSystems.filter(s => s.company_id === gc);
  const filteredIncidents = gc === "all" ? incidents : incidents.filter(i => i.company_id === gc);
  const filteredThirdParties = gc === "all" ? thirdParties : thirdParties.filter(tp => tp.company_id === gc);
  const filteredProcesses = gc === "all" ? processes : processes.filter(p => p.company_id === gc);
  const filteredGoals = gc === "all" ? goals : goals.filter(g => g.company_id === gc);
  const filteredRisks = gc === "all" ? risks : risks.filter(r => r.company_id === gc);
  const filteredPrincipalRisks = gc === "all" ? principalRisks : principalRisks.filter(r => r.company_id === gc);
  const filteredProcessAssessments = gc === "all" ? processAssessments : processAssessments.filter(pa => {
    const proc = processes.find(p => p.id === pa.process_id);
    return proc?.company_id === gc;
  });
  const filteredIssues = gc === "all" ? issues : issues.filter(i => {
    if (i.linked_entity_type === "Company") return i.linked_entity_id === gc;
    if (i.linked_entity_type === "Assessment") return filteredAssessments.some(a => a.id === i.linked_entity_id);
    return true;
  });

  const activeCompanies = gc === "all" ? companies.filter(c => c.status === 'active').length : (companies.find(c => c.id === gc)?.status === 'active' ? 1 : 0);
  const activeFrameworks = frameworks.filter(f => f.status === 'active').length;
  const inProgressAssessments = filteredAssessments.filter(a => a.status === 'in_progress').length;

  const filteredAssessmentIds = new Set(filteredAssessments.map(a => a.id));
  const filteredControlAssessments = controlAssessments.filter(ca => filteredAssessmentIds.has(ca.assessment_id));
  const compliantControls = filteredControlAssessments.filter(ca => ca.status === 'compliant').length;
  const totalAssessedControls = filteredControlAssessments.filter(ca => ca.status !== 'not_assessed').length;
  const complianceRate = totalAssessedControls > 0 
    ? Math.round((compliantControls / totalAssessedControls) * 100) 
    : 0;

  const criticalSystems = filteredIctSystems.filter(s => s.criticality === 'critical').length;
  const openIncidents = filteredIncidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
  const criticalIncidents = filteredIncidents.filter(i => i.severity === 'critical' && (i.status === 'open' || i.status === 'investigating')).length;
  const highRiskProviders = filteredThirdParties.filter(tp => tp.risk_rating === 'high' || tp.risk_rating === 'critical').length;

  const openIssues = filteredIssues.filter(i => i.status === 'open' || i.status === 'in_progress').length;
  const closedIssues = filteredIssues.filter(i => i.status === 'resolved' || i.status === 'closed').length;

  // Process Health Metrics
  const activeProcesses = filteredProcesses.filter(p => p.status === 'active').length;
  const criticalProcesses = filteredProcesses.filter(p => p.criticality === 'critical').length;
  const needsImprovementCount = filteredProcessAssessments.filter(pa => 
    pa.overall_rating === 'needs_improvement' || pa.overall_rating === 'unsatisfactory'
  ).length;
  const excellentProcesses = filteredProcessAssessments.filter(pa => pa.overall_rating === 'excellent').length;

  // Goal Achievement Metrics
  const achievedGoals = filteredGoals.filter(g => g.status === 'achieved').length;
  const onTrackGoals = filteredGoals.filter(g => g.status === 'on_track').length;
  const atRiskGoals = filteredGoals.filter(g => g.status === 'at_risk').length;
  const goalAchievementRate = filteredGoals.length > 0 ? Math.round(((achievedGoals + onTrackGoals) / filteredGoals.length) * 100) : 0;

  // Risk Posture
  const highRisks = filteredRisks.filter(r => 
    (r.likelihood === 'high' || r.likelihood === 'very_high') && 
    (r.impact === 'high' || r.impact === 'very_high')
  ).length;
  const openRisks = filteredRisks.filter(r => r.status === 'identified' || r.status === 'assessed').length;
  const mitigatedRisks = filteredRisks.filter(r => r.status === 'mitigated').length;

  // Principal Risks
  const activePrincipalRisks = filteredPrincipalRisks.filter(r => r.status === 'Active').length;
  const highPrincipalRisks = filteredPrincipalRisks.filter(r => r.priority === 'High').length;
  const criticalPrincipalRisks = filteredPrincipalRisks.filter(r => r.criticality === 'Critical').length;

  const recentIncidents = filteredIncidents.slice(0, 5);

  const toggleWidget = (widget) => {
    setActiveView("custom");
    setVisibleWidgets(prev => ({ ...prev, [widget]: !prev[widget] }));
  };

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-primary" /> Executive Dashboard
          </h1>
          <p className="text-slate-600">Real-time overview of risk, compliance, and operational performance</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <CompanyFilterBar />
          <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Customize Widgets
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Customise Widgets</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {Object.entries(visibleWidgets).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={() => toggleWidget(key)}
                  />
                  <Label htmlFor={key} className="cursor-pointer font-medium text-slate-700 flex-1">
                    {WIDGET_LABELS[key] || key}
                  </Label>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Category View Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORY_VIEWS.map(view => (
          <button
            key={view.id}
            onClick={() => applyView(view.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              activeView === view.id
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary"
            }`}
          >
            {view.label}
          </button>
        ))}
        {activeView === "custom" && (
          <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">Custom</span>
        )}
      </div>

      {visibleWidgets.compliance && (
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
      )}

      {visibleWidgets.processHealth && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Process Health (iHPOM)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">Active Processes</CardTitle>
                  <Network className="w-5 h-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{activeProcesses}</div>
                <p className="text-xs text-slate-500 mt-1">{criticalProcesses} critical processes</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">Process Assessments</CardTitle>
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{filteredProcessAssessments.length}</div>
                <p className="text-xs text-green-600 mt-1">{excellentProcesses} rated excellent</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">Needs Attention</CardTitle>
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{needsImprovementCount}</div>
                <p className="text-xs text-slate-500 mt-1">Requires improvement</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">Open Actions</CardTitle>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {processAssessments.reduce((sum, pa) => 
                    sum + (pa.actions?.filter(a => a.status === 'open' || a.status === 'in_progress').length || 0), 0
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">From process assessments</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {visibleWidgets.goals && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Goal Achievement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium opacity-90">Achievement Rate</CardTitle>
                  <Target className="w-5 h-5 opacity-75" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{goalAchievementRate}%</div>
                <p className="text-xs opacity-75 mt-1">{achievedGoals + onTrackGoals} of {filteredGoals.length} goals</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">Achieved</CardTitle>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{achievedGoals}</div>
                <p className="text-xs text-slate-500 mt-1">Goals completed</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">On Track</CardTitle>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{onTrackGoals}</div>
                <p className="text-xs text-slate-500 mt-1">Progressing well</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">At Risk</CardTitle>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{atRiskGoals}</div>
                <p className="text-xs text-slate-500 mt-1">Needs intervention</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {visibleWidgets.riskPosture && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Risk & Control Posture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Risks</CardTitle>
                  <AlertTriangle className="w-5 h-5 text-slate-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{filteredRisks.length}</div>
                <p className="text-xs text-red-600 mt-1">{highRisks} high/critical risks</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">Open Risks</CardTitle>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{openRisks}</div>
                <p className="text-xs text-slate-500 mt-1">Require mitigation</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">Mitigated Risks</CardTitle>
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{mitigatedRisks}</div>
                <p className="text-xs text-slate-500 mt-1">Controls in place</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium opacity-90">Control Compliance</CardTitle>
                  <Shield className="w-5 h-5 opacity-75" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{complianceRate}%</div>
                <p className="text-xs opacity-75 mt-1">{compliantControls}/{totalAssessedControls} compliant</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {filteredPrincipalRisks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" /> Principal Risks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card className="border-none shadow-lg">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-slate-500">Total</p>
                  <ShieldAlert className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{filteredPrincipalRisks.length}</p>
                <p className="text-xs text-green-600 mt-1">{activePrincipalRisks} active</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-slate-500">High Priority</p>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-red-600">{highPrincipalRisks}</p>
                <p className="text-xs text-slate-500 mt-1">{criticalPrincipalRisks} critical</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-slate-500">Under Review</p>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{filteredPrincipalRisks.filter(r => r.status === 'Under Review').length}</p>
                <p className="text-xs text-slate-500 mt-1">Awaiting action</p>
              </CardContent>
            </Card>
          </div>
          <Card className="border-none shadow-lg">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {filteredPrincipalRisks.slice(0, 5).map(r => (
                  <div key={r.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {r.risk_reference && <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{r.risk_reference}</span>}
                        <span className="font-medium text-slate-900 text-sm">{r.risk_title}</span>
                      </div>
                      {r.risk_statement && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">"{r.risk_statement}"</p>}
                    </div>
                    <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                      <Badge className="bg-blue-100 text-blue-700 text-xs">{r.risk_category}</Badge>
                      <Badge className={`text-xs ${{ High: "bg-red-100 text-red-700", Medium: "bg-yellow-100 text-yellow-700", Low: "bg-slate-100 text-slate-600" }[r.priority] || ""}`}>{r.priority}</Badge>
                      <Badge className={`text-xs ${{ Draft: "bg-slate-100 text-slate-600", Active: "bg-green-100 text-green-700", "Under Review": "bg-yellow-100 text-yellow-700", Retired: "bg-red-100 text-red-700" }[r.status] || ""}`}>{r.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              {filteredPrincipalRisks.length > 5 && (
                <div className="p-3 text-center border-t">
                  <Link to="/PrincipalRisks"><Button variant="ghost" size="sm">View all {filteredPrincipalRisks.length} principal risks</Button></Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {visibleWidgets.resilience && (
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
              <div className="text-3xl font-bold text-slate-900">{filteredIctSystems.length}</div>
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
              <div className="text-3xl font-bold text-slate-900">{filteredThirdParties.length}</div>
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
      )}

      <UnassignedRecordsChart />

      <div className="grid grid-cols-1 gap-6">
        {visibleWidgets.recentIncidents && (
          <Card className="border-none shadow-lg">
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
        )}


      </div>
    </div>
  );
}
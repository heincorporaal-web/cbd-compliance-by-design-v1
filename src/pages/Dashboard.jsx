import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Shield, ClipboardCheck, TrendingUp, AlertTriangle, CheckCircle2, Server, Users, AlertCircle, Network, Target, Settings, LayoutDashboard, ShieldAlert, LayoutGrid, List, Boxes, FileText, Handshake, Workflow } from "lucide-react";
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
import RiskHeatmap from "@/components/dashboard/RiskHeatmap";
import RecentIncidentsChart from "@/components/dashboard/RecentIncidentsChart";
import NavIcon from "@/hooks/useNavIcon.jsx";
import PageHeader from "@/components/layout/PageHeader";
import MetricSection from "@/components/dashboard/DashboardMetrics";

const WIDGET_LABELS = {
  compliance: "Compliance Overview",
  riskPosture: "Risk & Control Posture",
  resilience: "DORA Resilience & Issues",
  processHealth: "Process Health",
  goals: "Goal Achievement",
  recentIncidents: "Recent Incidents",
  tprm: "Third Party Risk Management",
  assetsByDesign: "Assets by Design (CMDB)",
  governanceByDesign: "Governance & Policies",
  advancedProcessModelling: "Process Modelling",
};

const CATEGORY_VIEWS = [
  { id: "all", label: "All", widgets: ["compliance", "riskPosture", "resilience", "processHealth", "goals", "recentIncidents", "tprm", "assetsByDesign", "governanceByDesign", "advancedProcessModelling"] },
  { id: "compliance", label: "Compliance", widgets: ["compliance", "governanceByDesign", "recentIncidents"] },
  { id: "risk", label: "Risk", widgets: ["riskPosture", "tprm", "recentIncidents"] },
  { id: "resilience", label: "Resilience", widgets: ["resilience", "assetsByDesign", "recentIncidents"] },
  { id: "process", label: "Process", widgets: ["processHealth", "advancedProcessModelling", "goals"] },
];

const DEFAULT_WIDGETS = { compliance: true, resilience: true, processHealth: true, goals: true, riskPosture: true, recentIncidents: true, tprm: true, assetsByDesign: true, governanceByDesign: true, advancedProcessModelling: true };

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

  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem("dashboard_view") || "tile"; } catch { return "tile"; }
  });
  useEffect(() => {
    try { localStorage.setItem("dashboard_view", viewMode); } catch {}
  }, [viewMode]);

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
    queryKey: ['orgProcesses', globalCompany],
    queryFn: () => base44.entities.OrgProcess.list(),
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

  const { data: allPrefs = [] } = useQuery({
    queryKey: ['companyPreferences'],
    queryFn: () => base44.entities.CompanyPreference.list(),
  });

  const { data: configurationItems = [] } = useQuery({
    queryKey: ['configurationItems', globalCompany],
    queryFn: () => base44.entities.ConfigurationItem.list(),
  });

  const { data: governanceDocs = [] } = useQuery({
    queryKey: ['governanceDocs', globalCompany],
    queryFn: () => base44.entities.GovernanceDocument.list(),
  });

  const { data: processDiagrams = [] } = useQuery({
    queryKey: ['processDiagrams', globalCompany],
    queryFn: () => base44.entities.ProcessDiagram.list(),
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

  // Add-on module data
  const filteredCIs = gc === "all" ? configurationItems : configurationItems.filter(ci => ci.company_id === gc);
  const filteredGovDocs = gc === "all" ? governanceDocs : governanceDocs.filter(d => d.company_id === gc);
  const filteredDiagrams = gc === "all" ? processDiagrams : processDiagrams.filter(d => d.company_id === gc);

  const companyPrefs = gc === "all" ? allPrefs : allPrefs.filter(p => p.company_id === gc);
  const enableTPRM = companyPrefs.some(p => p.enable_third_party_risk_management);
  const enableABD = companyPrefs.some(p => p.enable_assets_by_design);
  const enableGBD = companyPrefs.some(p => p.enable_governance_by_design);
  const enableAPM = companyPrefs.some(p => p.enable_advanced_process_modelling);

  const criticalCIs = filteredCIs.filter(ci => ci.intrinsic_criticality === 'critical').length;
  const unmanagedCIs = filteredCIs.filter(ci => ci.managed_unmanaged === 'unmanaged' || ci.managed_unmanaged === 'unknown').length;
  const staleCIs = filteredCIs.filter(ci => ci.stale_status === 'stale' || ci.stale_status === 'retirement_candidate').length;

  const publishedGovDocs = filteredGovDocs.filter(d => d.status === 'published' || d.status === 'approved').length;
  const underReviewGovDocs = filteredGovDocs.filter(d => d.status === 'internal_review' || d.status === 'awaiting_approval' || d.status === 'under_review').length;

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
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader
          navItemId="dashboard"
          icon={LayoutDashboard}
          title="Executive Dashboard"
          tagline="Real-time overview of risk, compliance, and operational performance"
          gradient="from-blue-600 to-indigo-700"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <CompanyFilterBar />
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("tile")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === "tile" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Tiles
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>
          <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Customise Widgets
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
        <MetricSection
          title="Compliance Overview"
          view={viewMode}
          items={[
            { icon: Building2, label: "Active Companies", value: activeCompanies, sub: `Total ${companies.length}`, gradient: "from-blue-500 to-blue-600", to: "/Companies" },
            { icon: ClipboardCheck, label: "In Progress", value: inProgressAssessments, sub: "Active assessments", gradient: "from-amber-500 to-amber-600", to: "/Assessments" },
            { icon: TrendingUp, label: "Compliance Rate", value: `${complianceRate}%`, sub: `${compliantControls}/${totalAssessedControls} controls`, gradient: "from-green-500 to-green-600", to: "/Controls" },
          ]}
        />
      )}

      {visibleWidgets.processHealth && (
        <MetricSection
          title="Process Health (iHPOM)"
          view={viewMode}
          items={[
            { icon: Network, label: "Active Processes", value: activeProcesses, sub: `${criticalProcesses} critical`, iconColor: "text-purple-600", to: "/ProcessManagement" },
            { icon: ClipboardCheck, label: "Assessments", value: filteredProcessAssessments.length, sub: `${excellentProcesses} excellent`, iconColor: "text-blue-600", to: "/ProcessAssessments" },
            { icon: AlertTriangle, label: "Needs Attention", value: needsImprovementCount, sub: "Requires improvement", iconColor: "text-orange-600", tint: "from-amber-50 to-orange-50", to: "/ProcessAssessments" },
          ]}
        />
      )}

      {visibleWidgets.goals && (
        <MetricSection
          title="Goal Achievement"
          view={viewMode}
          items={[
            { icon: Target, label: "Achievement Rate", value: `${goalAchievementRate}%`, sub: `${achievedGoals + onTrackGoals}/${filteredGoals.length} goals`, gradient: "from-purple-500 to-purple-600", to: "/GRCGoals" },
            { icon: CheckCircle2, label: "Achieved", value: achievedGoals, sub: "Completed", iconColor: "text-green-600", tint: "from-green-50 to-emerald-50", to: "/GRCGoals" },
            { icon: AlertTriangle, label: "At Risk", value: atRiskGoals, sub: "Needs intervention", iconColor: "text-red-600", tint: "from-red-50 to-orange-50", to: "/GRCGoals" },
          ]}
        />
      )}

      {visibleWidgets.riskPosture && (
        <MetricSection
          title="Risk & Control Posture"
          view={viewMode}
          items={[
            { icon: AlertTriangle, label: "Total Risks", value: filteredRisks.length, sub: `${highRisks} high/critical`, iconColor: "text-slate-500", to: "/RiskRegister" },
            { icon: AlertCircle, label: "Open Risks", value: openRisks, sub: "Require mitigation", iconColor: "text-red-600", tint: "from-red-50 to-orange-50", to: "/RiskRegister" },
            { icon: Shield, label: "Control Compliance", value: `${complianceRate}%`, sub: `${compliantControls}/${totalAssessedControls} compliant`, gradient: "from-green-500 to-green-600", to: "/Controls" },
          ]}
        />
      )}

      {filteredPrincipalRisks.length > 0 && (
        <MetricSection
          title={<span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-600" /> Principal Risks</span>}
          view={viewMode}
          items={[
            { icon: ShieldAlert, label: "Total", value: filteredPrincipalRisks.length, sub: `${activePrincipalRisks} active`, iconColor: "text-slate-400", to: "/PrincipalRisks" },
            { icon: AlertTriangle, label: "High Priority", value: highPrincipalRisks, sub: `${criticalPrincipalRisks} critical`, iconColor: "text-red-500", tint: "from-red-50 to-orange-50", to: "/PrincipalRisks" },
            { icon: AlertCircle, label: "Under Review", value: filteredPrincipalRisks.filter(r => r.status === 'Under Review').length, sub: "Awaiting action", iconColor: "text-amber-500", to: "/PrincipalRisks" },
          ]}
        />
      )}

      {visibleWidgets.resilience && (
        <MetricSection
          title="DORA Resilience & Issue Tracking"
          view={viewMode}
          items={[
            { icon: Server, label: "ICT Systems", value: filteredIctSystems.length, sub: `${criticalSystems} critical`, iconColor: "text-blue-600", to: "/ICTSystems" },
            { icon: AlertTriangle, label: "Open Incidents", value: openIncidents, sub: `${criticalIncidents} critical`, iconColor: "text-orange-600", to: "/Incidents" },
            { icon: AlertCircle, label: "Open Issues", value: openIssues, sub: "Action items", iconColor: "text-red-600", tint: "from-red-50 to-orange-50", to: "/Issues" },
            { icon: CheckCircle2, label: "Closed Issues", value: closedIssues, sub: "Resolved", iconColor: "text-green-600", tint: "from-green-50 to-emerald-50", to: "/Issues" },
          ]}
        />
      )}

      {visibleWidgets.tprm && enableTPRM && (
        <MetricSection
          title={<span className="flex items-center gap-2"><Handshake className="w-4 h-4 text-indigo-600" /> Third Party Risk Management</span>}
          view={viewMode}
          items={[
            { icon: Handshake, label: "Total Third Parties", value: filteredThirdParties.length, sub: "Active providers", iconColor: "text-indigo-600", to: "/ThirdParties" },
            { icon: AlertTriangle, label: "High Risk", value: highRiskProviders, sub: "Critical suppliers", iconColor: "text-red-600", tint: "from-red-50 to-orange-50", to: "/ThirdParties" },
            { icon: Shield, label: "Assessed", value: filteredThirdParties.filter(tp => tp.risk_rating).length, sub: "With rating", iconColor: "text-green-600", to: "/AdvancedThirdPartyRiskManagement" },
          ]}
        />
      )}

      {visibleWidgets.assetsByDesign && enableABD && (
        <MetricSection
          title={<span className="flex items-center gap-2"><Boxes className="w-4 h-4 text-cyan-600" /> Assets by Design (CMDB)</span>}
          view={viewMode}
          items={[
            { icon: Boxes, label: "Config Items", value: filteredCIs.length, sub: `${criticalCIs} critical`, iconColor: "text-cyan-600", to: "/CMDBInventory" },
            { icon: AlertCircle, label: "Unmanaged", value: unmanagedCIs, sub: "Need review", iconColor: "text-orange-600", tint: "from-amber-50 to-orange-50", to: "/CMDBInventory" },
            { icon: AlertTriangle, label: "Stale", value: staleCIs, sub: "Retirement candidates", iconColor: "text-red-500", tint: "from-red-50 to-orange-50", to: "/CMDBInventory" },
          ]}
        />
      )}

      {visibleWidgets.governanceByDesign && enableGBD && (
        <MetricSection
          title={<span className="flex items-center gap-2"><FileText className="w-4 h-4 text-violet-600" /> Governance & Policies</span>}
          view={viewMode}
          items={[
            { icon: FileText, label: "Total Documents", value: filteredGovDocs.length, sub: "Policies & standards", iconColor: "text-violet-600", to: "/GovernanceByDesignModule" },
            { icon: CheckCircle2, label: "Published", value: publishedGovDocs, sub: "In effect", iconColor: "text-green-600", tint: "from-green-50 to-emerald-50", to: "/GovernanceByDesignModule" },
            { icon: AlertCircle, label: "Under Review", value: underReviewGovDocs, sub: "Awaiting approval", iconColor: "text-amber-600", tint: "from-amber-50 to-orange-50", to: "/GovernanceByDesignModule" },
          ]}
        />
      )}

      {visibleWidgets.advancedProcessModelling && enableAPM && (
        <MetricSection
          title={<span className="flex items-center gap-2"><Workflow className="w-4 h-4 text-blue-600" /> Process Modelling</span>}
          view={viewMode}
          items={[
            { icon: Workflow, label: "Process Diagrams", value: filteredDiagrams.length, sub: "BPMN models", iconColor: "text-blue-600", to: "/AdvancedProcessModelling" },
            { icon: Network, label: "Active Processes", value: activeProcesses, sub: `${criticalProcesses} critical`, iconColor: "text-purple-600", to: "/ProcessManagement" },
            { icon: ClipboardCheck, label: "Assessed", value: filteredProcessAssessments.length, sub: "Risk-rated", iconColor: "text-green-600", to: "/ProcessAssessments" },
          ]}
        />
      )}

      {filteredRisks.length > 0 && (
        <RiskHeatmap risks={filteredRisks} companyId={gc} />
      )}

      <UnassignedRecordsChart />

      {visibleWidgets.recentIncidents && (
        <RecentIncidentsChart incidents={filteredIncidents} />
      )}

    </div>
  );
}
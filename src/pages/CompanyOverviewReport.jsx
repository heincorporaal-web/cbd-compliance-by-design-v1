import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, Shield, Network, Target, AlertTriangle, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PerformanceExportMenu from "@/components/reports/PerformanceExportMenu";

export default function CompanyOverviewReport() {
  const [selectedCompanyId, setSelectedCompanyId] = useState("all");

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const { data: processes = [] } = useQuery({
    queryKey: ['processes'],
    queryFn: () => base44.entities.BusinessProcess.list(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.GRCGoal.list(),
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.Risk.list(),
  });

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list(),
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list(),
  });

  const filteredCompanies = selectedCompanyId === "all" 
    ? companies 
    : companies.filter(c => c.id === selectedCompanyId);

  const getCompanyStats = (companyId) => {
    const companyProcesses = processes.filter(p => p.company_id === companyId);
    const companyGoals = goals.filter(g => g.company_id === companyId);
    const companyRisks = risks.filter(r => r.company_id === companyId);
    const companyAssessments = assessments.filter(a => a.company_id === companyId);

    const avgMaturity = companyGoals.length > 0
      ? (companyGoals.reduce((sum, g) => sum + (g.current_maturity || 0), 0) / companyGoals.length).toFixed(1)
      : "N/A";

    const highRisks = companyRisks.filter(r => {
      const values = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
      const score = (values[r.likelihood] || 3) * (values[r.impact] || 3);
      return score >= 16;
    });

    return {
      processCount: companyProcesses.length,
      goalCount: companyGoals.length,
      riskCount: companyRisks.length,
      controlCount: controls.length,
      assessmentCount: companyAssessments.length,
      avgMaturity,
      highRiskCount: highRisks.length,
      goalsAchieved: companyGoals.filter(g => g.status === 'achieved').length,
      openRisks: companyRisks.filter(r => r.status !== 'closed').length
    };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="no-print p-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Reports")}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Company Overview Report</h1>
              <p className="text-slate-600">Comprehensive statistics and metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PerformanceExportMenu title="Company Overview Report" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 print-content">
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-content { 
              background: white !important; 
              padding: 0 !important;
              max-width: 100% !important;
            }
            .page-break { page-break-after: always; }
            body { background: white !important; }
          }
        `}</style>

        {filteredCompanies.map((company, idx) => {
          const stats = getCompanyStats(company.id);
          const companyFrameworks = frameworks.filter(f => 
            assessments.some(a => a.company_id === company.id && a.framework_id === f.id)
          );
          const companyProcesses = processes.filter(p => p.company_id === company.id);
          const companyGoals = goals.filter(g => g.company_id === company.id);
          const companyRisks = risks.filter(r => r.company_id === company.id);

          return (
            <div key={company.id} className={idx > 0 ? "page-break" : ""}>
              <Card className="border-none shadow-none bg-white mb-8">
                <CardContent className="p-8 space-y-8">
                  {/* Header */}
                  <div className="border-b-2 border-slate-900 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="w-8 h-8 text-blue-600" />
                      <h1 className="text-4xl font-bold text-slate-900">{company.name}</h1>
                    </div>
                    <p className="text-slate-600 text-lg">{company.industry || "Organization Overview Report"}</p>
                    <p className="text-sm text-slate-500 mt-2">Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>

                  {/* Executive Summary */}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                      Executive Summary
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-slate-600 mb-1">Total Processes</p>
                        <p className="text-3xl font-bold text-blue-700">{stats.processCount}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-sm text-slate-600 mb-1">GRC Goals</p>
                        <p className="text-3xl font-bold text-green-700">{stats.goalCount}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <p className="text-sm text-slate-600 mb-1">Avg Maturity</p>
                        <p className="text-3xl font-bold text-purple-700">{stats.avgMaturity}</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <p className="text-sm text-slate-600 mb-1">Total Risks</p>
                        <p className="text-3xl font-bold text-orange-700">{stats.riskCount}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <p className="text-sm text-slate-600 mb-1">High/Critical Risks</p>
                        <p className="text-3xl font-bold text-red-700">{stats.highRiskCount}</p>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <p className="text-sm text-slate-600 mb-1">Total Controls</p>
                        <p className="text-3xl font-bold text-indigo-700">{stats.controlCount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Frameworks */}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Shield className="w-6 h-6 text-blue-600" />
                      Frameworks & Standards
                    </h2>
                    {companyFrameworks.length > 0 ? (
                      <div className="space-y-3">
                        {companyFrameworks.map(fw => {
                          const fwAssessments = assessments.filter(a => 
                            a.company_id === company.id && a.framework_id === fw.id
                          );
                          return (
                            <div key={fw.id} className="border border-slate-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-900">{fw.name}</h3>
                                <span className="text-sm text-slate-500">{fwAssessments.length} assessments</span>
                              </div>
                              {fw.description && (
                                <p className="text-sm text-slate-600">{fw.description}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No frameworks assigned</p>
                    )}
                  </div>

                  {/* Business Processes */}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Network className="w-6 h-6 text-blue-600" />
                      Business Processes (iHPOM)
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-50 p-3 rounded border">
                        <p className="text-xs text-slate-600">Total Processes</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.processCount}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded border">
                        <p className="text-xs text-slate-600">Critical Processes</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {companyProcesses.filter(p => p.criticality === 'critical').length}
                        </p>
                      </div>
                    </div>
                    {companyProcesses.length > 0 && (
                      <div className="space-y-2">
                        {companyProcesses.slice(0, 5).map(proc => (
                          <div key={proc.id} className="border-l-2 border-blue-500 pl-3 py-1">
                            <p className="font-medium text-sm text-slate-900">{proc.process_code} - {proc.name}</p>
                            <p className="text-xs text-slate-600">Level {proc.level} | {proc.criticality}</p>
                          </div>
                        ))}
                        {companyProcesses.length > 5 && (
                          <p className="text-sm text-slate-500 italic">+ {companyProcesses.length - 5} more processes</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* GRC Goals & Maturity */}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Target className="w-6 h-6 text-blue-600" />
                      GRC Goals & Maturity
                    </h2>
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 mb-2">Overall Maturity Level: <span className="font-bold text-lg text-purple-700">{stats.avgMaturity}</span></p>
                      <p className="text-sm text-slate-600">Goals Achieved: <span className="font-bold">{stats.goalsAchieved} of {stats.goalCount}</span></p>
                    </div>
                    {companyGoals.length > 0 && (
                      <div className="space-y-2">
                        {companyGoals.map(goal => (
                          <div key={goal.id} className="border border-slate-200 rounded p-3">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="font-semibold text-sm text-slate-900">{goal.title}</h3>
                              <span className={`text-xs px-2 py-1 rounded ${
                                goal.status === 'achieved' ? 'bg-green-100 text-green-700' :
                                goal.status === 'on_track' ? 'bg-blue-100 text-blue-700' :
                                goal.status === 'at_risk' ? 'bg-orange-100 text-orange-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {goal.status?.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-600">
                              <span>Current: Level {goal.current_maturity || 'N/A'}</span>
                              <span>Target: Level {goal.target_maturity || 'N/A'}</span>
                              {goal.maturity_gap > 0 && <span className="text-red-600">Gap: {goal.maturity_gap}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Risks */}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-blue-600" />
                      Risk Overview
                    </h2>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-slate-50 p-3 rounded border">
                        <p className="text-xs text-slate-600">Total Risks</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.riskCount}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded border border-red-200">
                        <p className="text-xs text-slate-600">High/Critical</p>
                        <p className="text-2xl font-bold text-red-700">{stats.highRiskCount}</p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded border border-orange-200">
                        <p className="text-xs text-slate-600">Open Risks</p>
                        <p className="text-2xl font-bold text-orange-700">{stats.openRisks}</p>
                      </div>
                    </div>
                    {companyRisks.length > 0 && (
                      <div className="space-y-2">
                        {companyRisks.slice(0, 5).map(risk => {
                          const values = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
                          const score = (values[risk.likelihood] || 3) * (values[risk.impact] || 3);
                          return (
                            <div key={risk.id} className="border-l-2 border-orange-500 pl-3 py-1">
                              <div className="flex items-start justify-between">
                                <p className="font-medium text-sm text-slate-900">{risk.title}</p>
                                <span className="text-xs font-bold text-orange-700">Score: {score}</span>
                              </div>
                              <p className="text-xs text-slate-600">{risk.category?.replace('_', ' ')} | {risk.status}</p>
                            </div>
                          );
                        })}
                        {companyRisks.length > 5 && (
                          <p className="text-sm text-slate-500 italic">+ {companyRisks.length - 5} more risks</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Shield className="w-6 h-6 text-blue-600" />
                      Controls & Compliance
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                        <p className="text-xs text-slate-600">Total Controls</p>
                        <p className="text-2xl font-bold text-indigo-700">{stats.controlCount}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-xs text-slate-600">Assessments</p>
                        <p className="text-2xl font-bold text-blue-700">{stats.assessmentCount}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">
                      {controls.filter(c => c.status === 'active').length} active controls across {companyFrameworks.length} framework(s)
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="border-t-2 border-slate-200 pt-4 mt-8">
                    <p className="text-xs text-slate-500">
                      This report was generated by the CBD Compliance Platform on {new Date().toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Contact: {company.contact_email || 'N/A'} | Status: {company.status}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
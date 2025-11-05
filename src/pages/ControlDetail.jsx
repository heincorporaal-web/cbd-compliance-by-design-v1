import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, CheckCircle2, XCircle, AlertCircle, Clock, FileText, ExternalLink, Building2, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function ControlDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const controlId = urlParams.get('id');

  const { data: control, isLoading: controlLoading } = useQuery({
    queryKey: ['control', controlId],
    queryFn: () => base44.entities.Control.filter({ id: controlId }).then(res => res[0]),
    enabled: !!controlId,
  });

  const { data: framework } = useQuery({
    queryKey: ['framework', control?.framework_id],
    queryFn: () => base44.entities.Framework.filter({ id: control.framework_id }).then(res => res[0]),
    enabled: !!control?.framework_id,
  });

  const { data: controlAssessments = [] } = useQuery({
    queryKey: ['controlAssessments', controlId],
    queryFn: () => base44.entities.ControlAssessment.filter({ control_id: controlId }),
    enabled: !!controlId,
  });

  const { data: allAssessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list(),
  });

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-green-500 text-white'
    };
    return colors[priority] || 'bg-slate-500 text-white';
  };

  const getStatusIcon = (status) => {
    const icons = {
      compliant: CheckCircle2,
      partial: AlertCircle,
      non_compliant: XCircle,
      not_applicable: FileText,
      not_assessed: Clock
    };
    return icons[status] || Clock;
  };

  const getStatusColor = (status) => {
    const colors = {
      compliant: 'bg-green-100 text-green-700 border-green-200',
      partial: 'bg-amber-100 text-amber-700 border-amber-200',
      non_compliant: 'bg-red-100 text-red-700 border-red-200',
      not_applicable: 'bg-slate-100 text-slate-700 border-slate-200',
      not_assessed: 'bg-slate-50 text-slate-500 border-slate-200'
    };
    return colors[status] || colors.not_assessed;
  };

  const getRiskLevelColor = (riskLevel) => {
    const colors = {
      critical: 'bg-red-500 text-white border-red-600',
      high: 'bg-orange-500 text-white border-orange-600',
      medium: 'bg-yellow-500 text-white border-yellow-600',
      low: 'bg-green-500 text-white border-green-600',
      none: 'bg-slate-100 text-slate-600 border-slate-200'
    };
    return colors[riskLevel] || colors.none;
  };

  // Calculate statistics
  const assessedCount = controlAssessments.filter(ca => ca.status !== 'not_assessed').length;
  const compliantCount = controlAssessments.filter(ca => ca.status === 'compliant').length;
  const nonCompliantCount = controlAssessments.filter(ca => ca.status === 'non_compliant').length;
  const partialCount = controlAssessments.filter(ca => ca.status === 'partial').length;
  const complianceRate = assessedCount > 0 ? Math.round((compliantCount / assessedCount) * 100) : 0;

  if (controlLoading) {
    return <div className="p-8 text-center">Loading control details...</div>;
  }

  if (!control) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">Control not found</p>
        <Link to={createPageUrl("Frameworks")}>
          <Button>Back to Frameworks</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Frameworks")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="text-base px-3 py-1">{control.control_id}</Badge>
            {control.priority && (
              <Badge className={getPriorityColor(control.priority)}>
                {control.priority} priority
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{control.title}</h1>
          {framework && (
            <div className="flex items-center gap-2 mt-2 text-slate-600">
              <Shield className="w-4 h-4" />
              <span>{framework.name}</span>
              {control.category && (
                <>
                  <span>•</span>
                  <span>{control.category}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Control Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {control.description && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                <p className="text-slate-600">{control.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500 mb-1">Framework</p>
                <p className="font-semibold text-slate-900">{framework?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Category</p>
                <p className="font-semibold text-slate-900">{control.category || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Priority</p>
                <Badge className={getPriorityColor(control.priority)}>
                  {control.priority || 'N/A'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Control ID</p>
                <p className="font-semibold text-slate-900">{control.control_id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90">Total Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{controlAssessments.length}</div>
            <p className="text-xs opacity-75 mt-1">{assessedCount} assessed</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90">Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{compliantCount}</div>
            <p className="text-xs opacity-75 mt-1">{complianceRate}% compliance rate</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90">Partial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{partialCount}</div>
            <p className="text-xs opacity-75 mt-1">Partially compliant</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90">Non-Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{nonCompliantCount}</div>
            <p className="text-xs opacity-75 mt-1">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Assessment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {controlAssessments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No assessments for this control yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {controlAssessments.map((ca) => {
                const assessment = allAssessments.find(a => a.id === ca.assessment_id);
                const company = allCompanies.find(c => c.id === assessment?.company_id);
                const StatusIcon = getStatusIcon(ca.status);

                return (
                  <div key={ca.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link 
                            to={createPageUrl(`AssessmentDetail?id=${assessment?.id}`)}
                            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {assessment?.name || 'Unknown Assessment'}
                          </Link>
                          <Badge variant="outline" className={`${getStatusColor(ca.status)} border`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {ca.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          {company && (
                            <div className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {company.name}
                            </div>
                          )}
                          {assessment?.assessment_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {ca.risk_level && ca.risk_level !== 'none' && (
                        <Badge className={`${getRiskLevelColor(ca.risk_level)} border`}>
                          {ca.risk_level} risk
                        </Badge>
                      )}
                    </div>

                    {ca.notes && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-slate-700 mb-1">Notes</h4>
                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                          {ca.notes}
                        </p>
                      </div>
                    )}

                    {ca.evidence_url && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-slate-700 mb-1">Evidence</h4>
                        <a
                          href={ca.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Evidence Document
                        </a>
                      </div>
                    )}

                    {ca.remediation_plan && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-slate-700 mb-1">Remediation Plan</h4>
                        <p className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                          {ca.remediation_plan}
                        </p>
                        {ca.remediation_date && (
                          <p className="text-xs text-slate-500 mt-2">
                            Target Date: {format(new Date(ca.remediation_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end pt-3 border-t border-slate-200">
                      <Link to={createPageUrl(`AssessmentDetail?id=${assessment?.id}`)}>
                        <Button variant="outline" size="sm">
                          View Full Assessment
                          <ArrowLeft className="w-3 h-3 ml-2 rotate-180" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
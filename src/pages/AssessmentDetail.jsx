import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Clock, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AssessmentDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const assessmentId = urlParams.get('id');
  const queryClient = useQueryClient();

  const { data: assessment } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => base44.entities.Assessment.filter({ id: assessmentId }).then(res => res[0]),
    enabled: !!assessmentId,
  });

  const { data: company } = useQuery({
    queryKey: ['company', assessment?.company_id],
    queryFn: () => base44.entities.Company.filter({ id: assessment.company_id }).then(res => res[0]),
    enabled: !!assessment?.company_id,
  });

  const { data: framework } = useQuery({
    queryKey: ['framework', assessment?.framework_id],
    queryFn: () => base44.entities.Framework.filter({ id: assessment.framework_id }).then(res => res[0]),
    enabled: !!assessment?.framework_id,
  });

  const { data: controls = [] } = useQuery({
    queryKey: ['controls', assessment?.framework_id],
    queryFn: () => base44.entities.Control.filter({ framework_id: assessment.framework_id }),
    enabled: !!assessment?.framework_id,
  });

  const { data: controlAssessments = [] } = useQuery({
    queryKey: ['controlAssessments', assessmentId],
    queryFn: () => base44.entities.ControlAssessment.filter({ assessment_id: assessmentId }),
    enabled: !!assessmentId,
  });

  const createControlAssessmentMutation = useMutation({
    mutationFn: (data) => base44.entities.ControlAssessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['controlAssessments', assessmentId]);
    },
  });

  const updateControlAssessmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ControlAssessment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['controlAssessments', assessmentId]);
    },
  });

  const updateAssessmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Assessment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assessment', assessmentId]);
    },
  });

  useEffect(() => {
    if (controls.length > 0 && controlAssessments.length === 0 && assessmentId) {
      controls.forEach(control => {
        createControlAssessmentMutation.mutate({
          assessment_id: assessmentId,
          control_id: control.id,
          status: 'not_assessed'
        });
      });
    }
  }, [controls.length, controlAssessments.length, assessmentId]);

  const handleStatusChange = (controlAssessmentId, newStatus) => {
    if (controlAssessmentId) {
      updateControlAssessmentMutation.mutate({
        id: controlAssessmentId,
        data: { status: newStatus }
      });
    }
  };

  const handleNotesChange = (controlAssessmentId, notes) => {
    if (controlAssessmentId) {
      updateControlAssessmentMutation.mutate({
        id: controlAssessmentId,
        data: { notes }
      });
    }
  };

  const compliantCount = controlAssessments.filter(ca => ca.status === 'compliant').length;
  const assessedCount = controlAssessments.filter(ca => ca.status !== 'not_assessed').length;
  const totalCount = controls.length;
  const completionPercentage = totalCount > 0 ? Math.round((assessedCount / totalCount) * 100) : 0;
  const compliancePercentage = assessedCount > 0 ? Math.round((compliantCount / assessedCount) * 100) : 0;

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
      compliant: 'text-green-600 bg-green-50 border-green-200',
      partial: 'text-amber-600 bg-amber-50 border-amber-200',
      non_compliant: 'text-red-600 bg-red-50 border-red-200',
      not_applicable: 'text-slate-600 bg-slate-50 border-slate-200',
      not_assessed: 'text-slate-400 bg-slate-50 border-slate-200'
    };
    return colors[status] || colors.not_assessed;
  };

  if (!assessment) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Assessments")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">{assessment.name}</h1>
          <p className="text-slate-600 mt-1">
            {company?.name} • {framework?.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 mb-2">{completionPercentage}%</div>
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-slate-500 mt-2">{assessedCount} of {totalCount} controls assessed</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">{compliancePercentage}%</div>
            <Progress value={compliancePercentage} className="h-2" />
            <p className="text-xs text-slate-500 mt-2">{compliantCount} compliant controls</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={assessment.status}
              onValueChange={(value) => updateAssessmentMutation.mutate({ id: assessmentId, data: { status: value } })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Control Assessments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {controls.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No controls found for this framework
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {controls.map(control => {
                const controlAssessment = controlAssessments.find(ca => ca.control_id === control.id);
                const StatusIcon = getStatusIcon(controlAssessment?.status);
                
                return (
                  <div key={control.id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <Badge variant="outline" className="mt-0.5">{control.control_id}</Badge>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{control.title}</h3>
                            {control.description && (
                              <p className="text-sm text-slate-600 mt-1">{control.description}</p>
                            )}
                            {control.category && (
                              <p className="text-xs text-slate-500 mt-1">{control.category}</p>
                            )}
                          </div>
                        </div>
                        
                        {controlAssessment && (
                          <>
                            <div className="flex gap-3 mt-3">
                              <Select
                                value={controlAssessment.status || 'not_assessed'}
                                onValueChange={(value) => handleStatusChange(controlAssessment.id, value)}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_assessed">Not Assessed</SelectItem>
                                  <SelectItem value="compliant">Compliant</SelectItem>
                                  <SelectItem value="partial">Partially Compliant</SelectItem>
                                  <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                                  <SelectItem value="not_applicable">Not Applicable</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(controlAssessment.status)}`}>
                                <StatusIcon className="w-4 h-4" />
                              </div>
                            </div>

                            <Textarea
                              placeholder="Add notes or evidence..."
                              value={controlAssessment.notes || ''}
                              onChange={(e) => handleNotesChange(controlAssessment.id, e.target.value)}
                              className="mt-3"
                              rows={2}
                            />
                          </>
                        )}
                      </div>
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
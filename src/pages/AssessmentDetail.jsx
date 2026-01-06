import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Clock, FileText, AlertTriangle, Plus, Save, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "../components/FileUpload";
import { toast } from "sonner";

export default function AssessmentDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const assessmentId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [newRiskData, setNewRiskData] = useState({
    title: "",
    description: "",
    category: "compliance",
    likelihood: "medium",
    impact: "medium"
  });

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

  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.Risk.list(),
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => base44.entities.Workflow.filter({ entity_type: 'Assessment' }),
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

  const createRiskMutation = useMutation({
    mutationFn: async (riskData) => {
      const risk = await base44.entities.Risk.create(riskData);
      const linkedRisks = [...(assessment.linked_risk_ids || []), risk.id];
      await base44.entities.Assessment.update(assessmentId, { linked_risk_ids: linkedRisks });
      return risk;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assessment', assessmentId]);
      queryClient.invalidateQueries(['risks']);
      setIsRiskDialogOpen(false);
      setNewRiskData({
        title: "",
        description: "",
        category: "compliance",
        likelihood: "medium",
        impact: "medium"
      });
      toast.success('Risk created and linked to assessment');
    },
  });

  const startWorkflowMutation = useMutation({
    mutationFn: async (workflowId) => {
      const workflow = workflows.find(w => w.id === workflowId);
      const instance = await base44.entities.WorkflowInstance.create({
        workflow_id: workflowId,
        entity_type: 'Assessment',
        entity_id: assessmentId,
        entity_name: assessment.name,
        status: 'in_progress',
        current_step: 0,
        pending_approvers: workflow.steps?.[0]?.approvers || []
      });
      await base44.entities.Assessment.update(assessmentId, { workflow_instance_id: instance.id });
      return instance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assessment', assessmentId]);
      setIsWorkflowDialogOpen(false);
      toast.success('Workflow initiated');
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

  const handleFileUploaded = (controlAssessmentId, fileUrl, fileName) => {
    const controlAssessment = controlAssessments.find(ca => ca.id === controlAssessmentId);
    if (controlAssessment) {
      const newAttachments = [...(controlAssessment.attachments || []), { url: fileUrl, name: fileName }];
      updateControlAssessmentMutation.mutate({
        id: controlAssessmentId,
        data: { attachments: newAttachments }
      });
    }
  };

  const handleFileRemoved = (controlAssessmentId, fileIndex) => {
    const controlAssessment = controlAssessments.find(ca => ca.id === controlAssessmentId);
    if (controlAssessment) {
      const newAttachments = controlAssessment.attachments.filter((_, idx) => idx !== fileIndex);
      updateControlAssessmentMutation.mutate({
        id: controlAssessmentId,
        data: { attachments: newAttachments }
      });
    }
  };

  const compliantCount = controlAssessments.filter(ca => ca.status === 'compliant').length;
  const assessedCount = controlAssessments.filter(ca => ca.status !== 'not_assessed').length;
  const totalCount = controls.length;
  const completionPercentage = totalCount > 0 ? Math.round((assessedCount / totalCount) * 100) : 0;
  const compliancePercentage = assessedCount > 0 ? Math.round((compliantCount / assessedCount) * 100) : 0;

  const linkedRisks = risks.filter(r => assessment?.linked_risk_ids?.includes(r.id));

  const checkOverdue = () => {
    if (assessment?.due_date && assessment?.status !== 'completed') {
      const today = new Date().toISOString().split('T')[0];
      if (assessment.due_date < today && assessment.status !== 'overdue') {
        updateAssessmentMutation.mutate({ id: assessmentId, data: { status: 'overdue' } });
      }
    }
  };

  useEffect(() => {
    checkOverdue();
  }, [assessment?.due_date, assessment?.status]);

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

  const handleCreateRisk = () => {
    createRiskMutation.mutate({
      ...newRiskData,
      company_id: assessment.company_id,
      framework_ids: [assessment.framework_id]
    });
  };

  const unlinkRisk = async (riskId) => {
    const updated = assessment.linked_risk_ids.filter(id => id !== riskId);
    await updateAssessmentMutation.mutate({ id: assessmentId, data: { linked_risk_ids: updated } });
    toast.success('Risk unlinked');
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      archived: 'bg-slate-100 text-slate-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Assessments")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{assessment.name}</h1>
              <Badge className={getStatusBadgeColor(assessment.status)}>
                {assessment.status?.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-slate-600 mt-1">
              {company?.name} • {framework?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {workflows.length > 0 && !assessment.workflow_instance_id && (
            <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Workflow
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start Assessment Workflow</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {workflows.map(workflow => (
                    <div
                      key={workflow.id}
                      className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                      onClick={() => startWorkflowMutation.mutate(workflow.id)}
                    >
                      <p className="font-medium">{workflow.name}</p>
                      {workflow.description && <p className="text-sm text-slate-600">{workflow.description}</p>}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button onClick={() => updateAssessmentMutation.mutate({ 
            id: assessmentId, 
            data: { 
              status: 'completed',
              completion_date: new Date().toISOString().split('T')[0]
            } 
          })}>
            <Save className="w-4 h-4 mr-2" />
            Mark Complete
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-slate-600">Assessor</Label>
              <Input
                value={assessment.assessor || ''}
                onChange={(e) => updateAssessmentMutation.mutate({ id: assessmentId, data: { assessor: e.target.value } })}
                placeholder="Assign assessor"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-600">Assessor Email</Label>
              <Input
                type="email"
                value={assessment.assessor_email || ''}
                onChange={(e) => updateAssessmentMutation.mutate({ id: assessmentId, data: { assessor_email: e.target.value } })}
                placeholder="email@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-600">Start Date</Label>
              <Input
                type="date"
                value={assessment.assessment_date || ''}
                onChange={(e) => updateAssessmentMutation.mutate({ id: assessmentId, data: { assessment_date: e.target.value } })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-600">Due Date</Label>
              <Input
                type="date"
                value={assessment.due_date || ''}
                onChange={(e) => updateAssessmentMutation.mutate({ id: assessmentId, data: { due_date: e.target.value } })}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="controls" className="space-y-6">
        <TabsList>
          <TabsTrigger value="controls">Control Assessments</TabsTrigger>
          <TabsTrigger value="risks">
            Linked Risks
            {linkedRisks.length > 0 && (
              <Badge variant="secondary" className="ml-2">{linkedRisks.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="controls">
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

                            <div className="mt-3">
                              <Label className="text-sm text-slate-600 mb-2 block">Evidence Documents</Label>
                              <FileUpload
                                onFileUploaded={(url, name) => handleFileUploaded(controlAssessment.id, url, name)}
                                existingFiles={controlAssessment.attachments || []}
                                onFileRemoved={(idx) => handleFileRemoved(controlAssessment.id, idx)}
                              />
                            </div>
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
        </TabsContent>

        <TabsContent value="risks">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle>Linked Risks</CardTitle>
                <Dialog open={isRiskDialogOpen} onOpenChange={setIsRiskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Risk
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Risk from Assessment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Risk Title</Label>
                        <Input
                          value={newRiskData.title}
                          onChange={(e) => setNewRiskData({ ...newRiskData, title: e.target.value })}
                          placeholder="Enter risk title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newRiskData.description}
                          onChange={(e) => setNewRiskData({ ...newRiskData, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={newRiskData.category} onValueChange={(value) => setNewRiskData({ ...newRiskData, category: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="compliance">Compliance</SelectItem>
                              <SelectItem value="operational">Operational</SelectItem>
                              <SelectItem value="financial">Financial</SelectItem>
                              <SelectItem value="strategic">Strategic</SelectItem>
                              <SelectItem value="cyber_security">Cyber Security</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Likelihood</Label>
                          <Select value={newRiskData.likelihood} onValueChange={(value) => setNewRiskData({ ...newRiskData, likelihood: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="very_low">Very Low</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="very_high">Very High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Impact</Label>
                        <Select value={newRiskData.impact} onValueChange={(value) => setNewRiskData({ ...newRiskData, impact: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="very_low">Very Low</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="very_high">Very High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsRiskDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateRisk} disabled={!newRiskData.title}>
                          Create Risk
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {linkedRisks.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-4">No risks linked to this assessment</p>
                  <Button onClick={() => setIsRiskDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Risk
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {linkedRisks.map(risk => (
                    <div key={risk.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link to={createPageUrl(`RiskDetail?id=${risk.id}`)}>
                            <h4 className="font-medium text-slate-900 hover:text-blue-600">{risk.title}</h4>
                          </Link>
                          <p className="text-sm text-slate-600 mt-1">{risk.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{risk.category?.replace('_', ' ')}</Badge>
                            <Badge variant="outline">Likelihood: {risk.likelihood?.replace('_', ' ')}</Badge>
                            <Badge variant="outline">Impact: {risk.impact?.replace('_', ' ')}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unlinkRisk(risk.id)}
                        >
                          Unlink
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
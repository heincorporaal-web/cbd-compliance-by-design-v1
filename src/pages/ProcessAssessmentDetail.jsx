import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Plus, Trash2, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProcessAssessmentDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const assessmentId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';

  const [formData, setFormData] = useState({
    process_id: "",
    assessment_date: new Date().toISOString().split('T')[0],
    assessor: "",
    assessment_type: "annual",
    scope: "",
    findings: "",
    outcomes: "",
    overall_rating: "satisfactory",
    actions: [],
    status: "draft",
    next_assessment_date: "",
    notes: ""
  });

  const { data: existingAssessment } = useQuery({
    queryKey: ['processAssessment', assessmentId],
    queryFn: () => base44.entities.ProcessAssessment.filter({ id: assessmentId }),
    enabled: !!assessmentId && !isNew,
  });

  const { data: processes = [] } = useQuery({
    queryKey: ['businessProcesses'],
    queryFn: () => base44.entities.BusinessProcess.list('process_code'),
  });

  useEffect(() => {
    if (existingAssessment?.[0]) {
      setFormData(existingAssessment[0]);
    }
  }, [existingAssessment]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProcessAssessment.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['processAssessments']);
      navigate(createPageUrl(`ProcessAssessmentDetail?id=${data.id}`));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ProcessAssessment.update(assessmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['processAssessments']);
      queryClient.invalidateQueries(['processAssessment', assessmentId]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isNew || !assessmentId) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const addAction = () => {
    const newAction = {
      id: Date.now().toString(),
      description: "",
      priority: "medium",
      due_date: "",
      status: "open",
      responsible: "",
      accountable: "",
      consulted: "",
      informed: ""
    };
    setFormData({
      ...formData,
      actions: [...(formData.actions || []), newAction]
    });
  };

  const updateAction = (actionId, field, value) => {
    const updatedActions = formData.actions.map(action =>
      action.id === actionId ? { ...action, [field]: value } : action
    );
    setFormData({ ...formData, actions: updatedActions });
  };

  const removeAction = (actionId) => {
    const updatedActions = formData.actions.filter(action => action.id !== actionId);
    setFormData({ ...formData, actions: updatedActions });
  };

  const selectedProcess = processes.find(p => p.id === formData.process_id);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("ProcessAssessments")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isNew ? 'New Process Assessment' : 'Assessment Details'}
          </h1>
          {selectedProcess && (
            <p className="text-slate-600">{selectedProcess.process_code} - {selectedProcess.name}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Assessment Details</TabsTrigger>
            <TabsTrigger value="actions">
              Actions & RACI
              {formData.actions?.length > 0 && (
                <Badge variant="secondary" className="ml-2">{formData.actions.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="process_id">Business Process *</Label>
                    <Select value={formData.process_id} onValueChange={(value) => setFormData({...formData, process_id: value})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select process" />
                      </SelectTrigger>
                      <SelectContent>
                        {processes.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.process_code} - {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessment_type">Assessment Type</Label>
                    <Select value={formData.assessment_type} onValueChange={(value) => setFormData({...formData, assessment_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initial">Initial</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="ad_hoc">Ad Hoc</SelectItem>
                        <SelectItem value="remediation">Remediation</SelectItem>
                        <SelectItem value="maturity">Maturity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessment_date">Assessment Date *</Label>
                    <Input
                      id="assessment_date"
                      type="date"
                      value={formData.assessment_date}
                      onChange={(e) => setFormData({...formData, assessment_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessor">Assessor</Label>
                    <Input
                      id="assessor"
                      value={formData.assessor}
                      onChange={(e) => setFormData({...formData, assessor: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overall_rating">Overall Rating</Label>
                    <Select value={formData.overall_rating} onValueChange={(value) => setFormData({...formData, overall_rating: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="satisfactory">Satisfactory</SelectItem>
                        <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                        <SelectItem value="unsatisfactory">Unsatisfactory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope">Scope & Objectives</Label>
                  <Textarea
                    id="scope"
                    value={formData.scope}
                    onChange={(e) => setFormData({...formData, scope: e.target.value})}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="findings">Key Findings</Label>
                  <Textarea
                    id="findings"
                    value={formData.findings}
                    onChange={(e) => setFormData({...formData, findings: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outcomes">Outcomes & Conclusions</Label>
                  <Textarea
                    id="outcomes"
                    value={formData.outcomes}
                    onChange={(e) => setFormData({...formData, outcomes: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="next_assessment_date">Next Assessment Date</Label>
                    <Input
                      id="next_assessment_date"
                      type="date"
                      value={formData.next_assessment_date}
                      onChange={(e) => setFormData({...formData, next_assessment_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Action Items with RACI Matrix
                  </CardTitle>
                  <Button type="button" onClick={addAction} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Action
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {formData.actions?.length > 0 ? (
                  <div className="space-y-4">
                    {formData.actions.map((action, idx) => (
                      <Card key={action.id} className="border">
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex items-start justify-between">
                            <Badge variant="outline">Action #{idx + 1}</Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeAction(action.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={action.description}
                              onChange={(e) => updateAction(action.id, 'description', e.target.value)}
                              rows={2}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label>Priority</Label>
                              <Select
                                value={action.priority}
                                onValueChange={(value) => updateAction(action.id, 'priority', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="critical">Critical</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Status</Label>
                              <Select
                                value={action.status}
                                onValueChange={(value) => updateAction(action.id, 'status', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Due Date</Label>
                              <Input
                                type="date"
                                value={action.due_date}
                                onChange={(e) => updateAction(action.id, 'due_date', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="font-medium text-sm text-slate-700 mb-3">RACI Matrix</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs">
                                  <span className="font-semibold">R</span>esponsible
                                </Label>
                                <Input
                                  value={action.responsible}
                                  onChange={(e) => updateAction(action.id, 'responsible', e.target.value)}
                                  placeholder="Who does the work"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">
                                  <span className="font-semibold">A</span>ccountable
                                </Label>
                                <Input
                                  value={action.accountable}
                                  onChange={(e) => updateAction(action.id, 'accountable', e.target.value)}
                                  placeholder="Who approves the work"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">
                                  <span className="font-semibold">C</span>onsulted
                                </Label>
                                <Input
                                  value={action.consulted}
                                  onChange={(e) => updateAction(action.id, 'consulted', e.target.value)}
                                  placeholder="Who provides input"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">
                                  <span className="font-semibold">I</span>nformed
                                </Label>
                                <Input
                                  value={action.informed}
                                  onChange={(e) => updateAction(action.id, 'informed', e.target.value)}
                                  placeholder="Who is kept updated"
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 mb-4">No actions defined yet</p>
                    <Button type="button" onClick={addAction} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Action
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6">
          <Link to={createPageUrl("ProcessAssessments")}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {isNew || !assessmentId ? 'Create Assessment' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
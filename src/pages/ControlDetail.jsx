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
import { ArrowLeft, Save, Shield, CheckCircle, AlertTriangle, Plus, Trash2, History, Target } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import LifecycleActions from "@/components/lifecycle/LifecycleActions";
import LifecycleHistory from "@/components/lifecycle/LifecycleHistory";
import LifecycleNotifications from "@/components/lifecycle/LifecycleNotifications";
import WorkflowPanel from "@/components/workflows/WorkflowPanel";

export default function ControlDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const controlId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';

  const [formData, setFormData] = useState({
    framework_id: "",
    control_id: "",
    title: "",
    description: "",
    category: "",
    priority: "medium",
    compensating_control_ids: [],
    linked_objective_ids: []
  });

  const [isAddingCompensating, setIsAddingCompensating] = useState(false);

  const { data: existingControl } = useQuery({
    queryKey: ['control', controlId],
    queryFn: () => base44.entities.Control.filter({ id: controlId }),
    enabled: !!controlId && !isNew,
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const { data: controlAssessments = [] } = useQuery({
    queryKey: ['controlAssessments', controlId],
    queryFn: () => base44.entities.ControlAssessment.filter({ control_id: controlId }),
    enabled: !!controlId && !isNew,
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list(),
  });

  const { data: allControls = [] } = useQuery({
    queryKey: ['allControls'],
    queryFn: () => base44.entities.Control.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  useEffect(() => {
    if (existingControl?.[0]) {
      setFormData(existingControl[0]);
    }
  }, [existingControl]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Control.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['controls']);
      navigate(createPageUrl(`ControlDetail?id=${data.id}`));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Control.update(controlId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['controls']);
      queryClient.invalidateQueries(['control', controlId]);
      toast.success('Control updated successfully');
    },
  });

  const addLifecycleEvent = (status, comments = "") => {
    const event = {
      status,
      actor: "Current User",
      timestamp: new Date().toISOString(),
      comments
    };
    const history = [...(existingControl?.[0]?.lifecycle_history || []), event];
    return history;
  };

  const submitForReview = async () => {
    await updateMutation.mutateAsync({
      status: "pending_review",
      lifecycle_history: addLifecycleEvent("pending_review", "Submitted for review")
    });
    toast.success("Control submitted for review");
  };

  const returnControl = async (comments) => {
    await updateMutation.mutateAsync({
      status: "returned",
      return_comments: comments,
      lifecycle_history: addLifecycleEvent("returned", comments)
    });
    toast.success("Control returned");
  };

  const approveControl = async () => {
    const user = await base44.auth.me();
    await updateMutation.mutateAsync({
      status: "approved",
      approver: user.full_name,
      approval_date: new Date().toISOString(),
      lifecycle_history: addLifecycleEvent("approved", "Control approved")
    });
    toast.success("Control approved");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isNew || !controlId) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return colors[priority] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      compliant: 'bg-green-100 text-green-700',
      partial: 'bg-yellow-100 text-yellow-700',
      non_compliant: 'bg-red-100 text-red-700',
      not_applicable: 'bg-slate-100 text-slate-700',
      not_assessed: 'bg-blue-100 text-blue-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const framework = frameworks.find(f => f.id === formData.framework_id);

  const complianceRate = controlAssessments.length > 0
    ? Math.round((controlAssessments.filter(ca => ca.status === 'compliant').length / controlAssessments.length) * 100)
    : 0;

  const addCompensatingControl = (compensatingControlId) => {
    if (!formData.compensating_control_ids?.includes(compensatingControlId)) {
      const updated = [...(formData.compensating_control_ids || []), compensatingControlId];
      const newData = { ...formData, compensating_control_ids: updated };
      setFormData(newData);
      if (controlId) updateMutation.mutate(newData);
    }
    setIsAddingCompensating(false);
  };

  const removeCompensatingControl = (compensatingControlId) => {
    const updated = formData.compensating_control_ids?.filter(id => id !== compensatingControlId) || [];
    const newData = { ...formData, compensating_control_ids: updated };
    setFormData(newData);
    if (controlId) updateMutation.mutate(newData);
  };

  const compensatingControls = allControls.filter(c => formData.compensating_control_ids?.includes(c.id));
  const availableControls = allControls.filter(c => 
    c.id !== controlId && 
    !formData.compensating_control_ids?.includes(c.id)
  );

  const allObjectives = companies.flatMap(company => 
    (company.objectives || []).map(obj => ({ ...obj, companyName: company.name, companyId: company.id }))
  );
  const linkedObjectives = allObjectives.filter(obj => formData.linked_objective_ids?.includes(obj.id));
  const availableObjectives = allObjectives.filter(obj => !formData.linked_objective_ids?.includes(obj.id));

  const addObjective = (objectiveId) => {
    const updated = [...(formData.linked_objective_ids || []), objectiveId];
    const newData = { ...formData, linked_objective_ids: updated };
    setFormData(newData);
    if (controlId) updateMutation.mutate(newData);
  };

  const removeObjective = (objectiveId) => {
    const updated = formData.linked_objective_ids?.filter(id => id !== objectiveId) || [];
    const newData = { ...formData, linked_objective_ids: updated };
    setFormData(newData);
    if (controlId) updateMutation.mutate(newData);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Controls")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isNew ? 'New Control' : formData.title || 'Control Details'}
            </h1>
            <p className="text-slate-600">
              {framework ? `${framework.name} • ` : ''}Control Management
            </p>
          </div>
          </div>
          <div className="flex gap-2">
          {!isNew && existingControl?.[0] && (
            <LifecycleActions
              entity={existingControl[0]}
              onSubmitForReview={submitForReview}
              onReturn={returnControl}
              onApprove={approveControl}
            />
          )}
          <Link to={createPageUrl("Controls")}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {isNew || !controlId ? 'Create Control' : 'Save Changes'}
          </Button>
          </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            {!isNew && controlId && (
              <TabsTrigger value="assessments">
                Assessments
                {controlAssessments.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {controlAssessments.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="objectives">
              Strategic Objectives
              {linkedObjectives.length > 0 && (
                <Badge variant="secondary" className="ml-2">{linkedObjectives.length}</Badge>
              )}
            </TabsTrigger>
            {!isNew && controlId && (
              <TabsTrigger value="history">
                <History className="w-4 h-4 mr-2" />
                Lifecycle
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {!isNew && existingControl?.[0] && <LifecycleNotifications entity={existingControl[0]} />}
            
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Control Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="framework_id">Framework *</Label>
                    <Select value={formData.framework_id} onValueChange={(value) => setFormData({...formData, framework_id: value})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select framework" />
                      </SelectTrigger>
                      <SelectContent>
                        {frameworks.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="control_id">Control ID *</Label>
                    <Input
                      id="control_id"
                      value={formData.control_id}
                      onChange={(e) => setFormData({...formData, control_id: e.target.value})}
                      placeholder="e.g., A.5.1"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Control Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="e.g., Access Control, Cryptography"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
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

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isNew && (
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle>Compensating Controls</CardTitle>
                    <Dialog open={isAddingCompensating} onOpenChange={setIsAddingCompensating}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Compensating Control
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add Compensating Control</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {availableControls.map(control => {
                            const fw = frameworks.find(f => f.id === control.framework_id);
                            return (
                              <div
                                key={control.id}
                                className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                onClick={() => addCompensatingControl(control.id)}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-slate-900">{control.control_id}</span>
                                  <Badge variant="outline">{fw?.name}</Badge>
                                </div>
                                <p className="text-sm text-slate-600">{control.title}</p>
                              </div>
                            );
                          })}
                          {availableControls.length === 0 && (
                            <p className="text-center text-slate-500 py-8">No available controls to add</p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {compensatingControls.length > 0 ? (
                    <div className="space-y-2">
                      {compensatingControls.map(control => {
                        const fw = frameworks.find(f => f.id === control.framework_id);
                        return (
                          <div key={control.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-900">{control.control_id}</span>
                                <Badge variant="outline">{fw?.name}</Badge>
                              </div>
                              <p className="text-sm text-slate-600">{control.title}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCompensatingControl(control.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No compensating controls defined</p>
                  )}
                </CardContent>
              </Card>
            )}

            {!isNew && controlAssessments.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle>Compliance Overview</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-slate-900">{complianceRate}%</div>
                      <p className="text-sm text-slate-600 mt-1">Compliance Rate</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                      <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-slate-900">{controlAssessments.length}</div>
                      <p className="text-sm text-slate-600 mt-1">Total Assessments</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
                      <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-slate-900">
                        {controlAssessments.filter(ca => ca.status === 'non_compliant').length}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Non-Compliant</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {!isNew && controlId && (
            <TabsContent value="assessments" className="space-y-6">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle>Assessment History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {controlAssessments.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {controlAssessments.map((ca) => {
                        const assessment = assessments.find(a => a.id === ca.assessment_id);
                        return (
                          <div key={ca.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-900">
                                  {assessment?.name || 'Assessment'}
                                </h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className={getStatusColor(ca.status)}>
                                    {ca.status?.replace('_', ' ')}
                                  </Badge>
                                  {ca.risk_level && ca.risk_level !== 'none' && (
                                    <Badge variant="outline" className={getPriorityColor(ca.risk_level)}>
                                      {ca.risk_level} risk
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {ca.notes && (
                              <p className="text-sm text-slate-600 mt-2">{ca.notes}</p>
                            )}
                            {ca.remediation_plan && (
                              <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-sm font-medium text-amber-900">Remediation Plan:</p>
                                <p className="text-sm text-amber-700 mt-1">{ca.remediation_plan}</p>
                                {ca.remediation_date && (
                                  <p className="text-xs text-amber-600 mt-1">
                                    Target: {new Date(ca.remediation_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-500">
                      <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p>No assessments for this control yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            )}

            <TabsContent value="objectives">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle>Linked Strategic Objectives</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {linkedObjectives.length > 0 && (
                    <div className="space-y-2">
                      {linkedObjectives.map(obj => (
                        <div key={obj.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <Target className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="font-medium text-slate-900">{obj.title}</p>
                              <p className="text-xs text-slate-500">{obj.companyName}</p>
                              {obj.description && (
                                <p className="text-sm text-slate-600 mt-1">{obj.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeObjective(obj.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {availableObjectives.length > 0 && (
                    <div className="space-y-2">
                      <Label>Add Strategic Objective</Label>
                      <Select onValueChange={addObjective}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select objective to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableObjectives.map(obj => (
                            <SelectItem key={obj.id} value={obj.id}>
                              {obj.companyName} - {obj.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {linkedObjectives.length === 0 && availableObjectives.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No objectives available. Add objectives in company settings.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {!isNew && controlId && existingControl?.[0] && (
            <TabsContent value="history">
              <LifecycleHistory history={existingControl[0]?.lifecycle_history} />
            </TabsContent>
            )}
            </Tabs>

            </form>

            {controlId && !isNew && (
              <WorkflowPanel
                entityType="Control"
                entityId={controlId}
                entityName={formData.title || "Control"}
                companyId={frameworks.find(f => f.id === formData.framework_id)?.company_id}
                record={existingControl?.[0]}
                onInstanceCreated={() => queryClient.invalidateQueries(['control', controlId])}
              />
            )}
            </div>
            );
            }
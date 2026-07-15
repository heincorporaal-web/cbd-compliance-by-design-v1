import React, { useState, useEffect } from "react";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import UnsavedChangesDialog from "@/components/UnsavedChangesDialog";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Plus, Trash2, Target, TrendingUp, AlertTriangle, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import MaturityScale from "../components/grc/MaturityScale";
import MaturityBadge from "../components/grc/MaturityBadge";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import CompanyField from "@/components/CompanyField";

export default function GRCGoalDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const goalId = urlParams.get('id');
  const [globalCompany, , { locked }] = useCompanyFilter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company_id: globalCompany && globalCompany !== "all" ? globalCompany : "",
    category: "governance",
    linked_risk_ids: [],
    linked_control_ids: [],
    linked_objective_ids: [],
    current_maturity: null,
    target_maturity: null,
    maturity_gap: 0,
    status: "not_started",
    owner: "",
    due_date: "",
    notes: "",
    maturity_assessments: []
  });

  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false);
  const [isControlDialogOpen, setIsControlDialogOpen] = useState(false);
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);
  const [newAssessment, setNewAssessment] = useState({ level: null, notes: "", assessor: "" });
  const { isDirty, checkDirty, initSnapshot, markClean, guardedNavigate, showDialog, confirmDiscard, confirmSave, cancelDialog } = useUnsavedChangesGuard(navigate);

  const { data: existingGoal } = useQuery({
    queryKey: ['grcGoal', goalId],
    queryFn: () => base44.entities.GRCGoal.filter({ id: goalId }),
    enabled: !!goalId,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.Risk.list(),
  });

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list(),
  });

  useEffect(() => {
    if (existingGoal?.[0]) {
      setFormData(existingGoal[0]);
      initSnapshot(existingGoal[0]);
    } else if (!goalId) {
      initSnapshot(formData);
    }
  }, [existingGoal]);

  useEffect(() => {
    if (formData.current_maturity && formData.target_maturity) {
      const gap = Math.max(0, formData.target_maturity - formData.current_maturity);
      setFormData(prev => ({ ...prev, maturity_gap: gap }));
    }
  }, [formData.current_maturity, formData.target_maturity]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GRCGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['grcGoals']);
      navigate(createPageUrl("GRCGoals"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.GRCGoal.update(goalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['grcGoals']);
      queryClient.invalidateQueries(['grcGoal', goalId]);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    markClean();
    if (goalId) {
      await updateMutation.mutateAsync(formData);
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const addRisk = (riskId) => {
    if (!formData.linked_risk_ids.includes(riskId)) {
      const updated = [...formData.linked_risk_ids, riskId];
      setFormData({ ...formData, linked_risk_ids: updated });
      if (goalId) updateMutation.mutate({ ...formData, linked_risk_ids: updated });
    }
    setIsRiskDialogOpen(false);
  };

  const removeRisk = (riskId) => {
    const updated = formData.linked_risk_ids.filter(id => id !== riskId);
    setFormData({ ...formData, linked_risk_ids: updated });
    if (goalId) updateMutation.mutate({ ...formData, linked_risk_ids: updated });
  };

  const addControl = (controlId) => {
    if (!formData.linked_control_ids.includes(controlId)) {
      const updated = [...formData.linked_control_ids, controlId];
      setFormData({ ...formData, linked_control_ids: updated });
      if (goalId) updateMutation.mutate({ ...formData, linked_control_ids: updated });
    }
    setIsControlDialogOpen(false);
  };

  const removeControl = (controlId) => {
    const updated = formData.linked_control_ids.filter(id => id !== controlId);
    setFormData({ ...formData, linked_control_ids: updated });
    if (goalId) updateMutation.mutate({ ...formData, linked_control_ids: updated });
  };

  const addMaturityAssessment = () => {
    if (newAssessment.level) {
      const assessment = {
        date: new Date().toISOString().split('T')[0],
        level: newAssessment.level,
        assessor: newAssessment.assessor,
        notes: newAssessment.notes
      };
      const updatedAssessments = [...(formData.maturity_assessments || []), assessment];
      const updatedFormData = {
        ...formData,
        maturity_assessments: updatedAssessments,
        current_maturity: newAssessment.level
      };
      setFormData(updatedFormData);
      if (goalId) updateMutation.mutate(updatedFormData);
      setNewAssessment({ level: null, notes: "", assessor: "" });
      setIsAssessmentDialogOpen(false);
    }
  };

  // Track dirty state
  useEffect(() => { checkDirty(formData); }, [formData]);

  const linkedRisks = risks.filter(r => formData.linked_risk_ids?.includes(r.id));
  const linkedControls = controls.filter(c => formData.linked_control_ids?.includes(c.id));
  const company = companies.find(c => c.id === formData.company_id);
  
  const companyObjectives = company?.objectives || [];
  const linkedObjectives = companyObjectives.filter(obj => formData.linked_objective_ids?.includes(obj.id));
  const availableObjectives = companyObjectives.filter(obj => !formData.linked_objective_ids?.includes(obj.id));

  const addObjective = (objectiveId) => {
    const updated = [...(formData.linked_objective_ids || []), objectiveId];
    setFormData({ ...formData, linked_objective_ids: updated });
    if (goalId) updateMutation.mutate({ ...formData, linked_objective_ids: updated });
  };

  const removeObjective = (objectiveId) => {
    const updated = formData.linked_objective_ids.filter(id => id !== objectiveId);
    setFormData({ ...formData, linked_objective_ids: updated });
    if (goalId) updateMutation.mutate({ ...formData, linked_objective_ids: updated });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => guardedNavigate(createPageUrl("GRCGoals"))}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {goalId ? 'Edit GRC Goal' : 'New GRC Goal'}
            </h1>
            <p className="text-slate-600">Define goals with maturity assessments</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => guardedNavigate(createPageUrl("GRCGoals"))}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {goalId ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Goal Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <CompanyField value={formData.company_id} onChange={(value) => setFormData({...formData, company_id: value})} companies={companies} />
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="governance">Governance</SelectItem>
                        <SelectItem value="risk_management">Risk Management</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="strategic">Strategic</SelectItem>
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
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="on_track">On Track</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
                        <SelectItem value="achieved">Achieved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner">Owner</Label>
                    <Input
                      id="owner"
                      value={formData.owner}
                      onChange={(e) => setFormData({...formData, owner: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Strategic Objectives
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {linkedObjectives.length > 0 ? (
                  <div className="space-y-2">
                    {linkedObjectives.map(obj => (
                      <div key={obj.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div>
                          <p className="font-medium text-slate-900">{obj.title}</p>
                          {obj.description && (
                            <p className="text-sm text-slate-600">{obj.description}</p>
                          )}
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeObjective(obj.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No objectives linked yet</p>
                )}
                
                {availableObjectives.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label>Add Strategic Objective</Label>
                    <Select onValueChange={addObjective}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select objective to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableObjectives.map(obj => (
                          <SelectItem key={obj.id} value={obj.id}>
                            {obj.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Linked Entity Risks
                  </CardTitle>
                  <Dialog open={isRiskDialogOpen} onOpenChange={setIsRiskDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-1" /> Add Risk
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Link Risk</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {risks.filter(r => !formData.linked_risk_ids?.includes(r.id)).map(risk => (
                          <div
                            key={risk.id}
                            className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                            onClick={() => addRisk(risk.id)}
                          >
                            <p className="font-medium">{risk.title}</p>
                            <p className="text-sm text-slate-600">{risk.category?.replace('_', ' ')}</p>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {linkedRisks.length > 0 ? (
                  <div className="space-y-2">
                    {linkedRisks.map(risk => (
                      <div key={risk.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div>
                          <p className="font-medium text-slate-900">{risk.title}</p>
                          <p className="text-sm text-slate-600">{risk.category?.replace('_', ' ')}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeRisk(risk.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No risks linked yet</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Control Objectives
                  </CardTitle>
                  <Dialog open={isControlDialogOpen} onOpenChange={setIsControlDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-1" /> Add Control
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Link Control Objective</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {controls.filter(c => !formData.linked_control_ids?.includes(c.id)).map(control => (
                          <div
                            key={control.id}
                            className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                            onClick={() => addControl(control.id)}
                          >
                            <p className="font-medium">{control.control_id} - {control.title}</p>
                            <p className="text-sm text-slate-600">{control.category}</p>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {linkedControls.length > 0 ? (
                  <div className="space-y-2">
                    {linkedControls.map(control => (
                      <div key={control.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                          <p className="font-medium text-slate-900">{control.control_id} - {control.title}</p>
                          <p className="text-sm text-slate-600">{control.category}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeControl(control.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No controls linked yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Maturity Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label>Current Maturity</Label>
                  <MaturityScale
                    value={formData.current_maturity}
                    onChange={(level) => setFormData({...formData, current_maturity: level})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Maturity</Label>
                  <MaturityScale
                    value={formData.target_maturity}
                    onChange={(level) => setFormData({...formData, target_maturity: level})}
                  />
                </div>
                {formData.maturity_gap > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-red-700">Maturity Gap</p>
                    <p className="text-3xl font-bold text-red-700">{formData.maturity_gap}</p>
                  </div>
                )}
                {formData.maturity_gap === 0 && formData.current_maturity && formData.target_maturity && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-700">Target Achieved!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle>Assessment History</CardTitle>
                  <Dialog open={isAssessmentDialogOpen} onOpenChange={setIsAssessmentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Maturity Assessment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Maturity Level</Label>
                          <MaturityScale
                            value={newAssessment.level}
                            onChange={(level) => setNewAssessment({...newAssessment, level})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Assessor</Label>
                          <Input
                            value={newAssessment.assessor}
                            onChange={(e) => setNewAssessment({...newAssessment, assessor: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={newAssessment.notes}
                            onChange={(e) => setNewAssessment({...newAssessment, notes: e.target.value})}
                            rows={2}
                          />
                        </div>
                        <Button type="button" onClick={addMaturityAssessment} className="w-full">
                          Record Assessment
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {formData.maturity_assessments?.length > 0 ? (
                  <div className="space-y-2">
                    {[...formData.maturity_assessments].reverse().map((assessment, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <MaturityBadge level={assessment.level} />
                          <span className="text-xs text-slate-500">
                            {format(new Date(assessment.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {assessment.assessor && (
                          <p className="text-xs text-slate-600">By: {assessment.assessor}</p>
                        )}
                        {assessment.notes && (
                          <p className="text-sm text-slate-700 mt-1">{assessment.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No assessments recorded</p>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </form>

      <UnsavedChangesDialog
        open={showDialog}
        onDiscard={confirmDiscard}
        onSave={() => confirmSave(handleSubmit.bind(null, { preventDefault: () => {} }))}
        onClose={cancelDialog}
      />
    </div>
  );
}
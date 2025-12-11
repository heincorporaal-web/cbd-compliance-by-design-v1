import React, { useState, useEffect } from "react";
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
import { ArrowLeft, Save, Plus, X, Network } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProcessDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const processId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';

  const [formData, setFormData] = useState({
    process_number: "",
    name: "",
    description: "",
    company_id: "",
    level: 0,
    parent_process_id: "",
    value_chain: "",
    process_owner: "",
    global_control_owner: "",
    status: "active",
    linked_risk_ids: [],
    linked_control_ids: [],
    linked_issue_ids: [],
    linked_goal_ids: [],
    linked_workstream_ids: [],
    linked_assessment_ids: [],
    documentation_url: "",
    last_review_date: "",
    next_review_date: ""
  });

  const [linkDialogs, setLinkDialogs] = useState({
    risks: false,
    controls: false,
    issues: false,
    goals: false,
    workstreams: false,
    assessments: false
  });

  const { data: existingProcess } = useQuery({
    queryKey: ['businessProcess', processId],
    queryFn: () => base44.entities.BusinessProcess.filter({ id: processId }),
    enabled: !!processId && !isNew,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: processes = [] } = useQuery({
    queryKey: ['businessProcesses'],
    queryFn: () => base44.entities.BusinessProcess.list(),
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.Risk.list(),
  });

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list(),
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues'],
    queryFn: () => base44.entities.Issue.list(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['grcGoals'],
    queryFn: () => base44.entities.GRCGoal.list(),
  });

  const { data: workstreams = [] } = useQuery({
    queryKey: ['workstreams'],
    queryFn: () => base44.entities.Workstream.list(),
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list(),
  });

  useEffect(() => {
    if (existingProcess?.[0]) {
      setFormData(existingProcess[0]);
    }
  }, [existingProcess]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BusinessProcess.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['businessProcesses']);
      navigate(createPageUrl("iHPOM"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.BusinessProcess.update(processId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['businessProcesses']);
      queryClient.invalidateQueries(['businessProcess', processId]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isNew || !processId) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const toggleLink = (type, id) => {
    const field = `linked_${type}_ids`;
    const current = formData[field] || [];
    const updated = current.includes(id) 
      ? current.filter(i => i !== id)
      : [...current, id];
    
    const newData = { ...formData, [field]: updated };
    setFormData(newData);
    if (processId) updateMutation.mutate(newData);
  };

  const openDialog = (type) => setLinkDialogs({ ...linkDialogs, [type]: true });
  const closeDialog = (type) => setLinkDialogs({ ...linkDialogs, [type]: false });

  const parentOptions = processes.filter(p => 
    p.level < formData.level && 
    p.id !== processId &&
    (!formData.company_id || p.company_id === formData.company_id)
  );

  const getLevelName = (level) => {
    const names = {
      0: "Value Chain",
      1: "Level 1 - Process",
      2: "Level 2 - Sub-Process",
      3: "Level 3 - Procedure",
      4: "Level 4 - Task",
      5: "Level 5 - Step",
      6: "Level 6 - Activity/Keystroke"
    };
    return names[level];
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("iHPOM")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isNew ? 'New Business Process' : formData.name || 'Process Details'}
          </h1>
          <p className="text-slate-600">Define process metadata and links</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Process Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="process_number">Process Number *</Label>
                <Input
                  id="process_number"
                  value={formData.process_number}
                  onChange={(e) => setFormData({...formData, process_number: e.target.value})}
                  placeholder="e.g., L0-001, L1-001-002"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_id">Company *</Label>
                <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Process Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Hierarchy Level *</Label>
                <Select value={formData.level?.toString()} onValueChange={(value) => setFormData({...formData, level: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6].map(level => (
                      <SelectItem key={level} value={level.toString()}>
                        {getLevelName(level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_process_id">Parent Process</Label>
                <Select value={formData.parent_process_id} onValueChange={(value) => setFormData({...formData, parent_process_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {parentOptions.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.process_number} - {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value_chain">Value Chain</Label>
                <Input
                  id="value_chain"
                  value={formData.value_chain}
                  onChange={(e) => setFormData({...formData, value_chain: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="process_owner">Process Owner</Label>
                <Input
                  id="process_owner"
                  value={formData.process_owner}
                  onChange={(e) => setFormData({...formData, process_owner: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="global_control_owner">Global Control Owner</Label>
                <Input
                  id="global_control_owner"
                  value={formData.global_control_owner}
                  onChange={(e) => setFormData({...formData, global_control_owner: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_review_date">Last Review Date</Label>
                <Input
                  id="last_review_date"
                  type="date"
                  value={formData.last_review_date}
                  onChange={(e) => setFormData({...formData, last_review_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_review_date">Next Review Date</Label>
                <Input
                  id="next_review_date"
                  type="date"
                  value={formData.next_review_date}
                  onChange={(e) => setFormData({...formData, next_review_date: e.target.value})}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="documentation_url">Documentation URL</Label>
                <Input
                  id="documentation_url"
                  type="url"
                  value={formData.documentation_url}
                  onChange={(e) => setFormData({...formData, documentation_url: e.target.value})}
                  placeholder="https://..."
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Risks */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Linked Risks</CardTitle>
                <Dialog open={linkDialogs.risks} onOpenChange={(open) => setLinkDialogs({...linkDialogs, risks: open})}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Link Risks</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {risks.map(risk => (
                        <div
                          key={risk.id}
                          className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                          onClick={() => { toggleLink('risk', risk.id); closeDialog('risks'); }}
                        >
                          <p className="font-medium">{risk.title}</p>
                          <p className="text-sm text-slate-600">{risk.category}</p>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {formData.linked_risk_ids?.length > 0 ? (
                <div className="space-y-2">
                  {risks.filter(r => formData.linked_risk_ids.includes(r.id)).map(risk => (
                    <div key={risk.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                      <span className="text-sm">{risk.title}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleLink('risk', risk.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No risks linked</p>
              )}
            </CardContent>
          </Card>

          {/* Controls */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Linked Controls</CardTitle>
                <Dialog open={linkDialogs.controls} onOpenChange={(open) => setLinkDialogs({...linkDialogs, controls: open})}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Link Controls</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {controls.map(control => (
                        <div
                          key={control.id}
                          className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                          onClick={() => { toggleLink('control', control.id); closeDialog('controls'); }}
                        >
                          <p className="font-medium">{control.control_id} - {control.title}</p>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {formData.linked_control_ids?.length > 0 ? (
                <div className="space-y-2">
                  {controls.filter(c => formData.linked_control_ids.includes(c.id)).map(control => (
                    <div key={control.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                      <span className="text-sm">{control.control_id}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleLink('control', control.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No controls linked</p>
              )}
            </CardContent>
          </Card>

          {/* Issues */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Linked Issues</CardTitle>
                <Dialog open={linkDialogs.issues} onOpenChange={(open) => setLinkDialogs({...linkDialogs, issues: open})}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Link Issues</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {issues.map(issue => (
                        <div
                          key={issue.id}
                          className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                          onClick={() => { toggleLink('issue', issue.id); closeDialog('issues'); }}
                        >
                          <p className="font-medium">{issue.title}</p>
                          <p className="text-sm text-slate-600">{issue.issue_type}</p>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {formData.linked_issue_ids?.length > 0 ? (
                <div className="space-y-2">
                  {issues.filter(i => formData.linked_issue_ids.includes(i.id)).map(issue => (
                    <div key={issue.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                      <span className="text-sm">{issue.title}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleLink('issue', issue.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No issues linked</p>
              )}
            </CardContent>
          </Card>

          {/* Goals */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Linked Goals</CardTitle>
                <Dialog open={linkDialogs.goals} onOpenChange={(open) => setLinkDialogs({...linkDialogs, goals: open})}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Link GRC Goals</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {goals.map(goal => (
                        <div
                          key={goal.id}
                          className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                          onClick={() => { toggleLink('goal', goal.id); closeDialog('goals'); }}
                        >
                          <p className="font-medium">{goal.title}</p>
                          <p className="text-sm text-slate-600">{goal.category}</p>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {formData.linked_goal_ids?.length > 0 ? (
                <div className="space-y-2">
                  {goals.filter(g => formData.linked_goal_ids.includes(g.id)).map(goal => (
                    <div key={goal.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                      <span className="text-sm">{goal.title}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleLink('goal', goal.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No goals linked</p>
              )}
            </CardContent>
          </Card>

          {/* Workstreams */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Linked Workstreams</CardTitle>
                <Dialog open={linkDialogs.workstreams} onOpenChange={(open) => setLinkDialogs({...linkDialogs, workstreams: open})}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Link Workstreams</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {workstreams.map(ws => (
                        <div
                          key={ws.id}
                          className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                          onClick={() => { toggleLink('workstream', ws.id); closeDialog('workstreams'); }}
                        >
                          <p className="font-medium">{ws.name}</p>
                          <p className="text-sm text-slate-600">{ws.status}</p>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {formData.linked_workstream_ids?.length > 0 ? (
                <div className="space-y-2">
                  {workstreams.filter(w => formData.linked_workstream_ids.includes(w.id)).map(ws => (
                    <div key={ws.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                      <span className="text-sm">{ws.name}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleLink('workstream', ws.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No workstreams linked</p>
              )}
            </CardContent>
          </Card>

          {/* Assessments */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Linked Assessments</CardTitle>
                <Dialog open={linkDialogs.assessments} onOpenChange={(open) => setLinkDialogs({...linkDialogs, assessments: open})}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Link Assessments</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {assessments.map(assessment => (
                        <div
                          key={assessment.id}
                          className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                          onClick={() => { toggleLink('assessment', assessment.id); closeDialog('assessments'); }}
                        >
                          <p className="font-medium">{assessment.name}</p>
                          <p className="text-sm text-slate-600">{assessment.status}</p>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {formData.linked_assessment_ids?.length > 0 ? (
                <div className="space-y-2">
                  {assessments.filter(a => formData.linked_assessment_ids.includes(a.id)).map(assessment => (
                    <div key={assessment.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                      <span className="text-sm">{assessment.name}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleLink('assessment', assessment.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No assessments linked</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Link to={createPageUrl("iHPOM")}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {isNew ? 'Create Process' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
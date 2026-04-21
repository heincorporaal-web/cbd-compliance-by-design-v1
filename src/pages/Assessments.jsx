import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardCheck, Plus, ArrowRight, Calendar, Building2, Shield, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import CompanyFilterBar from "@/components/CompanyFilterBar";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";

export default function Assessments() {
  const [globalCompany] = useCompanyFilter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    company_id: "",
    framework_id: "",
    name: "",
    assessment_date: new Date().toISOString().split('T')[0],
    due_date: "",
    assessor: "",
    notes: "",
    status: "not_started"
  });

  const [issueFormData, setIssueFormData] = useState({
    title: "",
    description: "",
    issue_type: "action_item",
    status: "open",
    priority: "medium",
    linked_entity_type: "Assessment",
    linked_entity_id: "",
    linked_entity_name: "",
    assigned_to: "",
    due_date: ""
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list('-created_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assessments']);
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: (data) => base44.entities.Issue.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['issues']);
      setIsIssueDialogOpen(false);
      resetIssueForm();
    },
  });

  const resetForm = () => {
    setFormData({
      company_id: "",
      framework_id: "",
      name: "",
      assessment_date: new Date().toISOString().split('T')[0],
      due_date: "",
      assessor: "",
      notes: "",
      status: "not_started"
    });
  };

  const resetIssueForm = () => {
    setIssueFormData({
      title: "",
      description: "",
      issue_type: "action_item",
      status: "open",
      priority: "medium",
      linked_entity_type: "Assessment",
      linked_entity_id: "",
      linked_entity_name: "",
      assigned_to: "",
      due_date: ""
    });
    setSelectedAssessment(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleIssueSubmit = (e) => {
    e.preventDefault();
    createIssueMutation.mutate(issueFormData);
  };

  const handleCreateIssue = (assessment) => {
    const company = companies.find(c => c.id === assessment.company_id);
    const framework = frameworks.find(f => f.id === assessment.framework_id);
    setSelectedAssessment(assessment);
    setIssueFormData({
      ...issueFormData,
      linked_entity_type: "Assessment",
      linked_entity_id: assessment.id,
      linked_entity_name: `${assessment.name} (${company?.name || ''} - ${framework?.name || ''})`
    });
    setIsIssueDialogOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      not_started: 'bg-slate-100 text-slate-700 border-slate-200',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      archived: 'bg-slate-100 text-slate-500 border-slate-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Assessments</h1>
          <p className="text-slate-600">Create and manage compliance assessments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assessment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="company_id">Company *</Label>
                    <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="framework_id">Framework *</Label>
                  <Select value={formData.framework_id} onValueChange={(value) => setFormData({...formData, framework_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      {frameworks.map(framework => (
                        <SelectItem key={framework.id} value={framework.id}>{framework.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Assessment Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Q4 2024 ISO 27001 Assessment"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assessment_date">Start Date</Label>
                  <Input
                    id="assessment_date"
                    type="date"
                    value={formData.assessment_date}
                    onChange={(e) => setFormData({...formData, assessment_date: e.target.value})}
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
                  <Label htmlFor="assessor">Assessor</Label>
                  <Input
                    id="assessor"
                    value={formData.assessor}
                    onChange={(e) => setFormData({...formData, assessor: e.target.value})}
                    placeholder="Person responsible for assessment"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Assessment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isIssueDialogOpen} onOpenChange={(open) => {
        setIsIssueDialogOpen(open);
        if (!open) resetIssueForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Issue</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleIssueSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="issue_title">Title *</Label>
                <Input
                  id="issue_title"
                  value={issueFormData.title}
                  onChange={(e) => setIssueFormData({...issueFormData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue_type">Type *</Label>
                <Select value={issueFormData.issue_type} onValueChange={(value) => setIssueFormData({...issueFormData, issue_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="action_item">Action Item</SelectItem>
                    <SelectItem value="fyi">FYI</SelectItem>
                    <SelectItem value="risk">Risk</SelectItem>
                    <SelectItem value="finding">Finding</SelectItem>
                    <SelectItem value="recommendation">Recommendation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue_priority">Priority</Label>
                <Select value={issueFormData.priority} onValueChange={(value) => setIssueFormData({...issueFormData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue_assigned">Assigned To</Label>
                <Input
                  id="issue_assigned"
                  value={issueFormData.assigned_to}
                  onChange={(e) => setIssueFormData({...issueFormData, assigned_to: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue_due_date">Due Date</Label>
                <Input
                  id="issue_due_date"
                  type="date"
                  value={issueFormData.due_date}
                  onChange={(e) => setIssueFormData({...issueFormData, due_date: e.target.value})}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="issue_description">Description</Label>
                <Textarea
                  id="issue_description"
                  value={issueFormData.description}
                  onChange={(e) => setIssueFormData({...issueFormData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Linked To</Label>
                <Input value={issueFormData.linked_entity_name} disabled className="bg-slate-50" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsIssueDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Create Issue
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {companies.length === 0 || frameworks.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
          <CardContent className="p-12 text-center">
            <ClipboardCheck className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Setup Required</h3>
            <p className="text-slate-600 mb-6">
              {companies.length === 0 && "Add companies "}
              {companies.length === 0 && frameworks.length === 0 && "and "}
              {frameworks.length === 0 && "load frameworks "}
              before creating assessments
            </p>
            <div className="flex gap-3 justify-center">
              {companies.length === 0 && (
                <Link to={createPageUrl("Companies")}>
                  <Button>Add Companies</Button>
                </Link>
              )}
              {frameworks.length === 0 && (
                <Link to={createPageUrl("Frameworks")}>
                  <Button variant="outline">Load Frameworks</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : assessments.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
          <CardContent className="p-12 text-center">
            <ClipboardCheck className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Assessments Yet</h3>
            <p className="text-slate-600 mb-6">
              Create your first assessment to start evaluating compliance
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Assessment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assessments.filter(a => globalCompany === "all" || a.company_id === globalCompany).map((assessment) => {
            const company = companies.find(c => c.id === assessment.company_id);
            const framework = frameworks.find(f => f.id === assessment.framework_id);
            
            return (
              <Card key={assessment.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-2">{assessment.name}</CardTitle>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Building2 className="w-4 h-4" />
                          {company?.name || 'Unknown Company'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Shield className="w-4 h-4" />
                          {framework?.name || 'Unknown Framework'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(assessment.status)} border`}>
                      {assessment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3 mb-4">
                    {assessment.assessor && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Assessor:</span> {assessment.assessor}
                      </p>
                    )}
                    {assessment.due_date && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        Due: {format(new Date(assessment.due_date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link to={createPageUrl(`AssessmentDetail?id=${assessment.id}`)} className="flex-1">
                      <Button className="w-full" variant="outline">
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleCreateIssue(assessment)}
                      title="Create Issue"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
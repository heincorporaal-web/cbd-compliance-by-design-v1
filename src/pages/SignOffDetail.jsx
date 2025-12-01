import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Plus, Trash2, FileCheck, Shield, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function SignOffDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const signOffId = urlParams.get('id');

  const [formData, setFormData] = useState({
    title: "",
    company_id: "",
    period_type: "quarterly",
    period_start: "",
    period_end: "",
    status: "pending",
    controls_reviewed: [],
    narratives: [],
    open_issues_snapshot: [],
    sign_off_by: "",
    reviewer: "",
    comments: ""
  });

  const [isNarrativeDialogOpen, setIsNarrativeDialogOpen] = useState(false);
  const [newNarrative, setNewNarrative] = useState({ title: "", content: "", author: "" });

  const { data: existingSignOff } = useQuery({
    queryKey: ['signOff', signOffId],
    queryFn: () => base44.entities.SignOff.filter({ id: signOffId }),
    enabled: !!signOffId,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list(),
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues'],
    queryFn: () => base44.entities.Issue.list(),
  });

  useEffect(() => {
    if (existingSignOff?.[0]) {
      setFormData(existingSignOff[0]);
    }
  }, [existingSignOff]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SignOff.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['signOffs']);
      navigate(createPageUrl("SignOffs"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.SignOff.update(signOffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['signOffs']);
      queryClient.invalidateQueries(['signOff', signOffId]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (signOffId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleControl = (control) => {
    const existing = formData.controls_reviewed.find(c => c.control_id === control.id);
    let updated;
    if (existing) {
      updated = formData.controls_reviewed.filter(c => c.control_id !== control.id);
    } else {
      updated = [...formData.controls_reviewed, {
        control_id: control.id,
        status: "reviewed",
        notes: ""
      }];
    }
    setFormData({ ...formData, controls_reviewed: updated });
  };

  const updateControlNote = (controlId, notes) => {
    const updated = formData.controls_reviewed.map(c =>
      c.control_id === controlId ? { ...c, notes } : c
    );
    setFormData({ ...formData, controls_reviewed: updated });
  };

  const loadOpenIssues = () => {
    const openIssues = issues
      .filter(i => i.status === 'open' || i.status === 'in_progress')
      .map(i => ({
        issue_id: i.id,
        title: i.title,
        status: i.status,
        priority: i.priority
      }));
    setFormData({ ...formData, open_issues_snapshot: openIssues });
  };

  const addNarrative = () => {
    if (newNarrative.title && newNarrative.content) {
      const updated = [...formData.narratives, { ...newNarrative }];
      setFormData({ ...formData, narratives: updated });
      setNewNarrative({ title: "", content: "", author: "" });
      setIsNarrativeDialogOpen(false);
    }
  };

  const removeNarrative = (index) => {
    const updated = formData.narratives.filter((_, i) => i !== index);
    setFormData({ ...formData, narratives: updated });
  };

  const handleApprove = () => {
    const updated = {
      ...formData,
      status: "approved",
      sign_off_date: new Date().toISOString()
    };
    setFormData(updated);
    if (signOffId) updateMutation.mutate(updated);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      in_review: 'bg-blue-100 text-blue-700 border-blue-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white'
    };
    return colors[priority] || 'bg-slate-500 text-white';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("SignOffs")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {signOffId ? 'Edit Sign-Off' : 'New Period Sign-Off'}
            </h1>
            <p className="text-slate-600">Review controls, narratives, and open issues</p>
          </div>
        </div>
        {signOffId && formData.status !== 'approved' && (
          <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve Sign-Off
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="controls">
              Controls
              <Badge variant="secondary" className="ml-2">{formData.controls_reviewed.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="narratives">
              Narratives
              <Badge variant="secondary" className="ml-2">{formData.narratives.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="issues">
              Open Issues
              <Badge variant="secondary" className="ml-2">{formData.open_issues_snapshot.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Sign-Off Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g., Q4 2024 Controls Review"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_id">Company *</Label>
                    <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})}>
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
                  <div className="space-y-2">
                    <Label htmlFor="period_type">Period Type *</Label>
                    <Select value={formData.period_type} onValueChange={(value) => setFormData({...formData, period_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period_start">Period Start *</Label>
                    <Input
                      id="period_start"
                      type="date"
                      value={formData.period_start}
                      onChange={(e) => setFormData({...formData, period_start: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period_end">Period End *</Label>
                    <Input
                      id="period_end"
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({...formData, period_end: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sign_off_by">Sign-Off By</Label>
                    <Input
                      id="sign_off_by"
                      value={formData.sign_off_by}
                      onChange={(e) => setFormData({...formData, sign_off_by: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reviewer">Reviewer</Label>
                    <Input
                      id="reviewer"
                      value={formData.reviewer}
                      onChange={(e) => setFormData({...formData, reviewer: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="comments">Comments</Label>
                    <Textarea
                      id="comments"
                      value={formData.comments}
                      onChange={(e) => setFormData({...formData, comments: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="controls">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Controls Review
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {controls.map(control => {
                    const isSelected = formData.controls_reviewed.some(c => c.control_id === control.id);
                    const reviewData = formData.controls_reviewed.find(c => c.control_id === control.id);
                    return (
                      <div key={control.id} className={`p-4 rounded-lg border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleControl(control)}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{control.control_id} - {control.title}</p>
                            <p className="text-sm text-slate-600">{control.category}</p>
                            {isSelected && (
                              <div className="mt-2">
                                <Input
                                  placeholder="Add review notes..."
                                  value={reviewData?.notes || ""}
                                  onChange={(e) => updateControlNote(control.id, e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="narratives">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Period Narratives
                  </CardTitle>
                  <Dialog open={isNarrativeDialogOpen} onOpenChange={setIsNarrativeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-1" /> Add Narrative
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Narrative</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={newNarrative.title}
                            onChange={(e) => setNewNarrative({...newNarrative, title: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Author</Label>
                          <Input
                            value={newNarrative.author}
                            onChange={(e) => setNewNarrative({...newNarrative, author: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Content</Label>
                          <Textarea
                            value={newNarrative.content}
                            onChange={(e) => setNewNarrative({...newNarrative, content: e.target.value})}
                            rows={5}
                          />
                        </div>
                        <Button type="button" onClick={addNarrative} className="w-full">
                          Add Narrative
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {formData.narratives.length > 0 ? (
                  <div className="space-y-4">
                    {formData.narratives.map((narrative, idx) => (
                      <div key={idx} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-900">{narrative.title}</p>
                            {narrative.author && <p className="text-sm text-slate-600">By: {narrative.author}</p>}
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeNarrative(idx)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{narrative.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">No narratives added yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Open Issues Snapshot
                  </CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={loadOpenIssues}>
                    Load Current Open Issues
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {formData.open_issues_snapshot.length > 0 ? (
                  <div className="space-y-2">
                    {formData.open_issues_snapshot.map((issue, idx) => (
                      <div key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-200 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{issue.title}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge className={getPriorityColor(issue.priority)}>{issue.priority}</Badge>
                            <Badge variant="outline" className={getStatusColor(issue.status)}>{issue.status}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">No issues captured. Click "Load Current Open Issues" to snapshot.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end gap-2">
            <Link to={createPageUrl("SignOffs")}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {signOffId ? 'Save Changes' : 'Create Sign-Off'}
            </Button>
          </div>
        </Tabs>
      </form>
    </div>
  );
}
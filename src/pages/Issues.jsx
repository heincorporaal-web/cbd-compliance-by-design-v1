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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Plus, Search, Edit2, Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Issues() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    issue_type: "action_item",
    status: "open",
    priority: "medium",
    linked_entity_type: "Assessment",
    linked_entity_id: "",
    linked_entity_name: "",
    assigned_to: "",
    due_date: "",
    resolution_notes: "",
    resolved_date: ""
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues'],
    queryFn: () => base44.entities.Issue.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Issue.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['issues']);
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Issue.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['issues']);
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      issue_type: "action_item",
      status: "open",
      priority: "medium",
      linked_entity_type: "Assessment",
      linked_entity_id: "",
      linked_entity_name: "",
      assigned_to: "",
      due_date: "",
      resolution_notes: "",
      resolved_date: ""
    });
    setEditingIssue(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingIssue) {
      updateMutation.mutate({ id: editingIssue.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (issue) => {
    setEditingIssue(issue);
    setFormData(issue);
    setIsDialogOpen(true);
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || issue.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openIssues = issues.filter(i => i.status === "open" || i.status === "in_progress");
  const closedIssues = issues.filter(i => i.status === "resolved" || i.status === "closed");

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white'
    };
    return colors[priority] || 'bg-slate-500 text-white';
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-red-100 text-red-700 border-red-200',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
      resolved: 'bg-green-100 text-green-700 border-green-200',
      closed: 'bg-slate-100 text-slate-500 border-slate-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getTypeColor = (type) => {
    const colors = {
      action_item: 'bg-purple-100 text-purple-700 border-purple-200',
      fyi: 'bg-blue-100 text-blue-700 border-blue-200',
      risk: 'bg-orange-100 text-orange-700 border-orange-200',
      finding: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      recommendation: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Issue Management</h1>
          <p className="text-slate-600">Track action items, findings, and recommendations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingIssue ? 'Update Issue' : 'Create New Issue'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="space-y-2">
                  <Label htmlFor="issue_type">Type *</Label>
                  <Select value={formData.issue_type} onValueChange={(value) => setFormData({...formData, issue_type: value})}>
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
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
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
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linked_entity_type">Linked To *</Label>
                  <Select value={formData.linked_entity_type} onValueChange={(value) => setFormData({...formData, linked_entity_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Assessment">Assessment</SelectItem>
                      <SelectItem value="Company">Company</SelectItem>
                      <SelectItem value="ThirdPartyProvider">Third Party Provider</SelectItem>
                      <SelectItem value="ICTSystem">ICT System</SelectItem>
                      <SelectItem value="Framework">Framework</SelectItem>
                      <SelectItem value="Incident">Incident</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linked_entity_id">Entity ID *</Label>
                  <Input
                    id="linked_entity_id"
                    value={formData.linked_entity_id}
                    onChange={(e) => setFormData({...formData, linked_entity_id: e.target.value})}
                    placeholder="ID of the linked entity"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="linked_entity_name">Entity Name</Label>
                  <Input
                    id="linked_entity_name"
                    value={formData.linked_entity_name}
                    onChange={(e) => setFormData({...formData, linked_entity_name: e.target.value})}
                    placeholder="Name for easy reference"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assigned To</Label>
                  <Input
                    id="assigned_to"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              {(formData.status === 'resolved' || formData.status === 'closed') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="resolution_notes">Resolution Notes</Label>
                    <Textarea
                      id="resolution_notes"
                      value={formData.resolution_notes}
                      onChange={(e) => setFormData({...formData, resolution_notes: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resolved_date">Resolved Date</Label>
                    <Input
                      id="resolved_date"
                      type="date"
                      value={formData.resolved_date}
                      onChange={(e) => setFormData({...formData, resolved_date: e.target.value})}
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingIssue ? 'Update' : 'Create'} Issue
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Open Issues</p>
                <p className="text-3xl font-bold text-slate-900">{openIssues.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Closed Issues</p>
                <p className="text-3xl font-bold text-slate-900">{closedIssues.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-between">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Issues</p>
                <p className="text-3xl font-bold text-slate-900">{issues.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredIssues.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredIssues.map((issue) => (
                <div key={issue.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{issue.title}</h3>
                        <Badge className={getPriorityColor(issue.priority)}>
                          {issue.priority}
                        </Badge>
                        <Badge variant="outline" className={`${getTypeColor(issue.issue_type)} border`}>
                          {issue.issue_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={`${getStatusColor(issue.status)} border`}>
                          {issue.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {issue.description && (
                        <p className="text-sm text-slate-600 mb-2">{issue.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        {issue.linked_entity_name && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">{issue.linked_entity_type}:</span> {issue.linked_entity_name}
                          </span>
                        )}
                        {issue.assigned_to && (
                          <span>Assigned: {issue.assigned_to}</span>
                        )}
                        {issue.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due: {format(new Date(issue.due_date), 'MMM d, yyyy')}
                          </span>
                        )}
                        {issue.resolved_date && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            Resolved: {format(new Date(issue.resolved_date), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      {issue.resolution_notes && (
                        <p className="text-sm text-green-700 bg-green-50 p-2 rounded mt-2">
                          <span className="font-medium">Resolution:</span> {issue.resolution_notes}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(issue)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No issues found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
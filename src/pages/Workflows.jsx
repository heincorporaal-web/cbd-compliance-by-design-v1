import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Plus, Edit2, Trash2, Play, Clock, CheckCircle2, XCircle, Search, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WorkflowBuilder from "@/components/workflows/WorkflowBuilder";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";

export default function Workflows() {
  const [globalCompany] = useCompanyFilter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    company_id: "",
    entity_type: "Assessment",
    trigger_condition: "manual",
    status: "active",
    steps: [],
    auto_notify_days_before: 3
  });

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => base44.entities.Workflow.list('-created_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: workflowInstances = [] } = useQuery({
    queryKey: ['workflowInstances'],
    queryFn: () => base44.entities.WorkflowInstance.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Workflow.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Workflow.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Workflow.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      company_id: "",
      entity_type: "Assessment",
      trigger_condition: "manual",
      status: "active",
      steps: [],
      auto_notify_days_before: 3
    });
    setEditingWorkflow(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingWorkflow) {
      updateMutation.mutate({ id: editingWorkflow.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (workflow) => {
    setEditingWorkflow(workflow);
    setFormData(workflow);
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredWorkflows = workflows.filter(w => {
    const matchesSearch = w.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = globalCompany === "all" || !w.company_id || w.company_id === globalCompany;
    return matchesSearch && matchesCompany;
  });

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700 border-green-200',
      inactive: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getInstanceStatusColor = (status) => {
    const colors = {
      pending: 'bg-slate-100 text-slate-700',
      in_progress: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      completed: 'bg-purple-100 text-purple-700',
      returned: 'bg-orange-100 text-orange-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const activeInstances = workflowInstances.filter(wi => wi.status === 'in_progress' || wi.status === 'pending').length;
  const completedToday = workflowInstances.filter(wi => 
    wi.completed_date && new Date(wi.completed_date).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Workflow Automation</h1>
          <p className="text-slate-600">Manage approval workflows and automated notifications</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workflow Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                   <Label htmlFor="entity_type">Applies To *</Label>
                   <Select value={formData.entity_type} onValueChange={(value) => setFormData({...formData, entity_type: value})} required>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Assessment">Assessment</SelectItem>
                       <SelectItem value="ProcessAssessment">Process Assessment</SelectItem>
                       <SelectItem value="BusinessProcess">Business Process (iHPOM)</SelectItem>
                       <SelectItem value="OrgProcess">Org Process</SelectItem>
                       <SelectItem value="Risk">Risk</SelectItem>
                       <SelectItem value="Control">Control</SelectItem>
                       <SelectItem value="Framework">Framework</SelectItem>
                       <SelectItem value="ICTSystem">ICT System</SelectItem>
                       <SelectItem value="Survey">Survey</SelectItem>
                       <SelectItem value="Issue">Issue</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="company_id">Company <span className="text-slate-400 font-normal">(optional — leave blank for global)</span></Label>
                   <Select value={formData.company_id || "global"} onValueChange={(value) => setFormData({...formData, company_id: value === "global" ? "" : value})}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="global">All companies (global)</SelectItem>
                       {companies.map(c => (
                         <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                <div className="space-y-2">
                  <Label htmlFor="trigger_condition">Trigger When</Label>
                  <Select value={formData.trigger_condition} onValueChange={(value) => setFormData({...formData, trigger_condition: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_create">On Create</SelectItem>
                      <SelectItem value="on_update">On Update</SelectItem>
                      <SelectItem value="on_status_change">On Status Change</SelectItem>
                      <SelectItem value="manual">Manual Trigger</SelectItem>
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auto_notify_days_before">Auto-Notify Days Before Due</Label>
                  <Input
                    id="auto_notify_days_before"
                    type="number"
                    value={formData.auto_notify_days_before}
                    onChange={(e) => setFormData({...formData, auto_notify_days_before: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={2}
                />
              </div>
              
              <WorkflowBuilder
                steps={formData.steps}
                onChange={(steps) => setFormData({...formData, steps})}
                entityType={formData.entity_type}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingWorkflow ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Workflows</p>
                <p className="text-3xl font-bold text-slate-900">{workflows.filter(w => w.status === 'active').length}</p>
              </div>
              <GitBranch className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Instances</p>
                <p className="text-3xl font-bold text-slate-900">{activeInstances}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Completed Today</p>
                <p className="text-3xl font-bold text-slate-900">{completedToday}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading workflows...</div>
          ) : filteredWorkflows.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredWorkflows.map((workflow) => {
                const instances = workflowInstances.filter(wi => wi.workflow_id === workflow.id);
                const activeCount = instances.filter(wi => wi.status === 'in_progress' || wi.status === 'pending').length;
                
                return (
                  <div key={workflow.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center">
                          <GitBranch className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                             <h3 className="font-semibold text-slate-900">{workflow.name}</h3>
                             <Badge variant="outline" className={`${getStatusColor(workflow.status)} border`}>
                               {workflow.status}
                             </Badge>
                             <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                               {workflow.entity_type}
                             </Badge>
                             {workflow.company_id ? (
                               <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                                 <Building2 className="w-3 h-3" />
                                 {companies.find(c => c.id === workflow.company_id)?.name || "Company"}
                               </Badge>
                             ) : (
                               <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">Global</Badge>
                             )}
                           </div>
                          <div className="text-sm text-slate-600">
                            <p>{workflow.description}</p>
                            <p className="mt-1">
                              {workflow.steps?.length || 0} steps • Trigger: {workflow.trigger_condition?.replace('_', ' ')}
                              {activeCount > 0 && ` • ${activeCount} active instances`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(workflow)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(workflow.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No workflows found</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Create Your First Workflow
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {workflowInstances.length > 0 && (
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Recent Workflow Instances</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {workflowInstances.slice(0, 10).map((instance) => {
                const workflow = workflows.find(w => w.id === instance.workflow_id);
                return (
                  <Link key={instance.id} to={createPageUrl(`WorkflowApproval?id=${instance.id}`)}>
                    <div className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-900">{instance.entity_name}</span>
                            <Badge className={getInstanceStatusColor(instance.status)}>
                              {instance.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">
                            {workflow?.name} • Step {instance.current_step + 1} of {workflow?.steps?.length || 0}
                          </p>
                        </div>
                        {instance.pending_approvers?.length > 0 && (
                          <div className="text-sm text-slate-500">
                            Pending: {instance.pending_approvers.length} approvers
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
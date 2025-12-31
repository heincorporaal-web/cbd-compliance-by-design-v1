import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function WorkflowApproval() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const instanceId = urlParams.get('id');

  const [comments, setComments] = useState("");

  const { data: instanceData } = useQuery({
    queryKey: ['workflowInstance', instanceId],
    queryFn: async () => {
      const result = await base44.entities.WorkflowInstance.filter({ id: instanceId });
      return result[0];
    },
    enabled: !!instanceId,
  });

  const { data: workflowData } = useQuery({
    queryKey: ['workflow', instanceData?.workflow_id],
    queryFn: async () => {
      const result = await base44.entities.Workflow.filter({ id: instanceData.workflow_id });
      return result[0];
    },
    enabled: !!instanceData?.workflow_id,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ action }) => {
      const currentStep = workflowData.steps[instanceData.current_step];
      const newHistory = [
        ...(instanceData.step_history || []),
        {
          step_id: currentStep.id,
          step_name: currentStep.name,
          action,
          actor: currentUser.email,
          timestamp: new Date().toISOString(),
          comments
        }
      ];

      let newStatus = instanceData.status;
      let newCurrentStep = instanceData.current_step;
      let pendingApprovers = instanceData.pending_approvers || currentStep.approvers || [];

      if (action === 'approved') {
        // Remove current user from pending approvers
        pendingApprovers = pendingApprovers.filter(email => email !== currentUser.email);

        // Check if we can move to next step
        if (pendingApprovers.length === 0 || !currentStep.require_all_approvers) {
          newCurrentStep++;
          if (newCurrentStep >= workflowData.steps.length) {
            newStatus = 'completed';
          } else {
            newStatus = 'in_progress';
            pendingApprovers = workflowData.steps[newCurrentStep].approvers || [];
          }
        }
      } else if (action === 'rejected') {
        newStatus = 'rejected';
      }

      const updateData = {
        step_history: newHistory,
        current_step: newCurrentStep,
        status: newStatus,
        pending_approvers: pendingApprovers,
        completed_date: newStatus === 'completed' || newStatus === 'rejected' ? new Date().toISOString() : undefined
      };

      await base44.entities.WorkflowInstance.update(instanceId, updateData);

      // Send email notification
      if (action === 'approved' && newStatus !== 'completed') {
        const nextStep = workflowData.steps[newCurrentStep];
        if (nextStep?.approvers) {
          for (const approver of nextStep.approvers) {
            await base44.integrations.Core.SendEmail({
              to: approver,
              subject: `Approval Required: ${instanceData.entity_name}`,
              body: `You have a pending approval for ${instanceData.entity_type}: ${instanceData.entity_name}\n\nPlease review and approve at: ${window.location.origin}${createPageUrl('WorkflowApproval?id=' + instanceId)}`
            });
          }
        }
      } else if (newStatus === 'completed' || newStatus === 'rejected') {
        await base44.integrations.Core.SendEmail({
          to: instanceData.created_by,
          subject: `Workflow ${newStatus}: ${instanceData.entity_name}`,
          body: `The workflow for ${instanceData.entity_type} "${instanceData.entity_name}" has been ${newStatus}.${comments ? `\n\nComments: ${comments}` : ''}`
        });
      }

      return updateData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflowInstance']);
      queryClient.invalidateQueries(['workflowInstances']);
      setComments("");
    },
  });

  const handleApproval = (action) => {
    if (confirm(`Are you sure you want to ${action === 'approved' ? 'approve' : 'reject'} this request?`)) {
      approveMutation.mutate({ action });
    }
  };

  if (!instanceData || !workflowData) {
    return <div className="p-12 text-center">Loading...</div>;
  }

  const currentStep = workflowData.steps[instanceData.current_step];
  const canApprove = currentUser && instanceData.pending_approvers?.includes(currentUser.email);
  const isPending = instanceData.status === 'pending' || instanceData.status === 'in_progress';

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-slate-100 text-slate-700',
      in_progress: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      completed: 'bg-purple-100 text-purple-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Workflows")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{instanceData.entity_name}</h1>
          <p className="text-slate-600">Workflow Approval • {workflowData.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle>Workflow Progress</CardTitle>
              <Badge className={getStatusColor(instanceData.status)}>
                {instanceData.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {workflowData.steps.map((step, index) => {
              const isCompleted = index < instanceData.current_step;
              const isCurrent = index === instanceData.current_step && isPending;
              const isPending = index > instanceData.current_step;

              return (
                <div key={step.id} className={`flex items-start gap-4 p-4 rounded-lg ${isCurrent ? 'bg-blue-50 border-2 border-blue-200' : 'bg-slate-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-slate-300'}`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : isCurrent ? (
                      <Clock className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-white text-sm">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{step.name}</h3>
                      <Badge variant="outline">{step.type}</Badge>
                    </div>
                    {step.approvers && step.approvers.length > 0 && (
                      <p className="text-sm text-slate-600">
                        Approvers: {step.approvers.join(', ')}
                      </p>
                    )}
                    {isCurrent && instanceData.pending_approvers?.length > 0 && (
                      <p className="text-sm text-blue-600 mt-1">
                        Awaiting: {instanceData.pending_approvers.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {canApprove && isPending && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="comments">Comments (Optional)</Label>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add your comments..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApproval('approved')}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleApproval('rejected')}
                    variant="destructive"
                    className="flex-1"
                    disabled={approveMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Entity Type</p>
                <p className="font-medium">{instanceData.entity_type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Current Step</p>
                <p className="font-medium">
                  {instanceData.current_step + 1} of {workflowData.steps.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Started</p>
                <p className="font-medium">
                  {format(new Date(instanceData.created_date), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              {instanceData.completed_date && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Completed</p>
                  <p className="font-medium">
                    {format(new Date(instanceData.completed_date), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {instanceData.step_history && instanceData.step_history.length > 0 && (
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>History</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {instanceData.step_history.reverse().map((entry, index) => (
                    <div key={index} className="flex gap-3">
                      <User className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {entry.step_name} - {entry.action}
                        </p>
                        <p className="text-xs text-slate-600">{entry.actor}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}
                        </p>
                        {entry.comments && (
                          <p className="text-sm text-slate-600 mt-1 italic">{entry.comments}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
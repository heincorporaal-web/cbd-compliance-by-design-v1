import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, User,
  CornerDownLeft, GitMerge, GitFork, AlertTriangle, Bell, Zap, RefreshCw, Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { resolveAssignees } from "@/lib/workflowAssigneeResolver";

const STEP_TYPE_ICONS = {
  approval: CheckCircle,
  parallel_approval: GitMerge,
  return_to_originator: CornerDownLeft,
  notification: Bell,
  conditional: GitFork,
  escalation: AlertTriangle,
  delay: Clock,
  action: Zap,
};

const STEP_TYPE_COLORS = {
  approval: "text-green-600",
  parallel_approval: "text-blue-600",
  return_to_originator: "text-orange-600",
  notification: "text-purple-600",
  conditional: "text-indigo-600",
  escalation: "text-red-600",
  delay: "text-slate-600",
  action: "text-yellow-600",
};

const ACTION_COLORS = {
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  returned: "bg-orange-100 text-orange-800",
  notified: "bg-purple-100 text-purple-800",
  completed: "bg-blue-100 text-blue-800",
  escalated: "bg-red-100 text-red-800",
  resubmitted: "bg-teal-100 text-teal-800",
};

const INSTANCE_STATUS_COLORS = {
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-purple-100 text-purple-700",
  returned: "bg-orange-100 text-orange-700",
};

export default function WorkflowApproval() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const instanceId = urlParams.get('id');

  const [comments, setComments] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [showReturnForm, setShowReturnForm] = useState(false);

  const { data: instanceData, isLoading: loadingInstance } = useQuery({
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

  // Load the entity record so we can resolve dynamic roles (e.g. process_owner_id)
  const { data: entityRecord } = useQuery({
    queryKey: ['wf_entity', instanceData?.entity_type, instanceData?.entity_id],
    queryFn: async () => {
      const entityName = instanceData.entity_type;
      try {
        const records = await base44.entities[entityName]?.filter({ id: instanceData.entity_id });
        return records?.[0] || null;
      } catch { return null; }
    },
    enabled: !!instanceData?.entity_type && !!instanceData?.entity_id,
  });

  // If instance has no pending_approvers yet (just created), resolve them from the first step
  const initResolveMutation = useMutation({
    mutationFn: async () => {
      if (!workflowData || !instanceData || !entityRecord) return;
      if ((instanceData.pending_approvers?.length || 0) > 0) return; // already resolved
      const step0 = workflowData.steps[0];
      if (!step0) return;
      const resolved = await resolveAssignees(step0, entityRecord, 'approver');
      if (resolved.length > 0) {
        await base44.entities.WorkflowInstance.update(instanceId, { pending_approvers: resolved, status: 'in_progress' });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['workflowInstance', instanceId]),
  });

  // Trigger init resolution once entity record is available
  React.useEffect(() => {
    if (entityRecord && workflowData && instanceData && (instanceData.pending_approvers?.length || 0) === 0 && (instanceData.status === 'pending' || instanceData.status === 'in_progress')) {
      initResolveMutation.mutate();
    }
  }, [entityRecord, workflowData, instanceData?.id]);

  const actionMutation = useMutation({
    mutationFn: async ({ action, reason }) => {
      const currentStep = workflowData.steps[instanceData.current_step];
      const newHistory = [
        ...(instanceData.step_history || []),
        {
          step_id: currentStep.id,
          step_name: currentStep.name,
          action,
          actor: currentUser.email,
          timestamp: new Date().toISOString(),
          comments: action === 'returned' ? reason : comments
        }
      ];

      let newStatus = instanceData.status;
      let newCurrentStep = instanceData.current_step;
      let pendingApprovers = instanceData.pending_approvers || currentStep.approvers || [];
      let returnedDate = instanceData.returned_date;
      let returnReasonValue = instanceData.return_reason;
      let completedDate = instanceData.completed_date;

      // Helper: resolve approvers for a given step using entity record
      const resolveForStep = async (step) => {
        return resolveAssignees(step, entityRecord || {}, 'approver');
      };

      if (action === 'approved') {
        if (currentStep.type === 'parallel_approval') {
          pendingApprovers = pendingApprovers.filter(email => email !== currentUser.email);
          const totalApprovers = (await resolveForStep(currentStep)).length;
          const minApprovals = currentStep.min_approvals || totalApprovers;
          const approvedCount = totalApprovers - pendingApprovers.length;
          if (approvedCount >= minApprovals) {
            newCurrentStep++;
            if (newCurrentStep >= workflowData.steps.length) {
              newStatus = 'completed';
              completedDate = new Date().toISOString();
            } else {
              pendingApprovers = await resolveForStep(workflowData.steps[newCurrentStep]);
            }
          }
        } else {
          pendingApprovers = pendingApprovers.filter(email => email !== currentUser.email);
          if (pendingApprovers.length === 0 || !currentStep.require_all_approvers) {
            newCurrentStep++;
            if (newCurrentStep >= workflowData.steps.length) {
              newStatus = 'completed';
              completedDate = new Date().toISOString();
            } else {
              newStatus = 'in_progress';
              pendingApprovers = await resolveForStep(workflowData.steps[newCurrentStep]);
            }
          }
        }
      } else if (action === 'rejected') {
        newStatus = 'rejected';
        completedDate = new Date().toISOString();
      } else if (action === 'returned') {
        newStatus = 'returned';
        returnedDate = new Date().toISOString();
        returnReasonValue = reason;
      } else if (action === 'resubmitted') {
        newStatus = 'in_progress';
        newCurrentStep = 0;
        returnedDate = undefined;
        returnReasonValue = undefined;
        pendingApprovers = await resolveForStep(workflowData.steps[0]);
      }

      const updateData = {
        step_history: newHistory,
        current_step: newCurrentStep,
        status: newStatus,
        pending_approvers: pendingApprovers,
        ...(completedDate ? { completed_date: completedDate } : {}),
        ...(returnedDate ? { returned_date: returnedDate } : {}),
        ...(returnReasonValue ? { return_reason: returnReasonValue } : {}),
        ...(action === 'resubmitted' ? { resubmit_count: (instanceData.resubmit_count || 0) + 1 } : {}),
      };

      await base44.entities.WorkflowInstance.update(instanceId, updateData);

      // Notifications
      try {
        if (action === 'returned') {
          const originatorEmail = instanceData.originator_email || instanceData.created_by;
          if (originatorEmail) {
            await base44.integrations.Core.SendEmail({
              to: originatorEmail,
              subject: `Item Returned for Revision: ${instanceData.entity_name}`,
              body: `Your submission "${instanceData.entity_name}" has been returned for revision by ${currentUser.email}.\n\nReason: ${reason}\n\n${currentStep.notification_template || ''}\n\nPlease review and resubmit.`
            });
          }
          // CC recipients if any
          for (const cc of (currentStep.recipients || [])) {
            await base44.integrations.Core.SendEmail({
              to: cc,
              subject: `[FYI] Item Returned: ${instanceData.entity_name}`,
              body: `"${instanceData.entity_name}" was returned to the originator by ${currentUser.email}.\nReason: ${reason}`
            });
          }
        } else if (action === 'approved' && newStatus !== 'completed') {
          // pendingApprovers was already resolved via resolveForStep above
          for (const approver of pendingApprovers) {
            await base44.integrations.Core.SendEmail({
              to: approver,
              subject: `Approval Required: ${instanceData.entity_name}`,
              body: `You have a pending approval for ${instanceData.entity_type}: ${instanceData.entity_name}\n\nPlease review at: ${window.location.origin}${createPageUrl('WorkflowApproval?id=' + instanceId)}`
            });
          }
        } else if (newStatus === 'completed' || newStatus === 'rejected') {
          const originatorEmail = instanceData.originator_email || instanceData.created_by;
          if (originatorEmail) {
            await base44.integrations.Core.SendEmail({
              to: originatorEmail,
              subject: `Workflow ${newStatus === 'completed' ? 'Completed' : 'Rejected'}: ${instanceData.entity_name}`,
              body: `The workflow for "${instanceData.entity_name}" has been ${newStatus}.${comments ? `\n\nComments: ${comments}` : ''}`
            });
          }
        }
      } catch (e) { /* notification errors are non-fatal */ }

      return updateData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflowInstance', instanceId]);
      queryClient.invalidateQueries(['workflowInstances']);
      setComments("");
      setReturnReason("");
      setShowReturnForm(false);
    },
  });

  const handleAction = (action) => {
    if (action === 'returned') {
      const currentStep = workflowData.steps[instanceData.current_step];
      if (currentStep.return_reason_required !== false && !returnReason.trim()) {
        alert("A return reason is required.");
        return;
      }
      actionMutation.mutate({ action, reason: returnReason });
      return;
    }

    const currentStep = workflowData?.steps[instanceData?.current_step];
    if (currentStep?.comment_required && !comments.trim()) {
      alert("A comment is required for this step.");
      return;
    }
    actionMutation.mutate({ action, reason: "" });
  };

  if (loadingInstance || !instanceData || !workflowData) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-3" />
        Loading workflow...
      </div>
    );
  }

  const currentStep = workflowData.steps[instanceData.current_step];
  const isActive = instanceData.status === 'pending' || instanceData.status === 'in_progress';
  const isReturned = instanceData.status === 'returned';
  const canAct = currentUser && instanceData.pending_approvers?.includes(currentUser.email) && isActive;
  const isOriginator = currentUser && (currentUser.email === instanceData.originator_email || currentUser.email === instanceData.created_by);
  const currentStepIsReturn = currentStep?.type === 'return_to_originator';

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Workflows")}>
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{instanceData.entity_name}</h1>
          <p className="text-slate-500 text-sm">{workflowData.name} · {instanceData.entity_type}</p>
        </div>
        <Badge className={INSTANCE_STATUS_COLORS[instanceData.status] || "bg-slate-100 text-slate-700"}>
          {instanceData.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Return banner */}
      {isReturned && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
          <CornerDownLeft className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-orange-800">This item has been returned to you for revision</p>
            {instanceData.return_reason && (
              <p className="text-sm text-orange-700 mt-1"><strong>Reason:</strong> {instanceData.return_reason}</p>
            )}
            {instanceData.returned_date && (
              <p className="text-xs text-orange-600 mt-1">Returned on {format(new Date(instanceData.returned_date), 'MMM d, yyyy HH:mm')}</p>
            )}
          </div>
          {isOriginator && (
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white shrink-0"
              onClick={() => handleAction('resubmitted')}
              disabled={actionMutation.isPending}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Resubmit
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: progress + action panel */}
        <Card className="lg:col-span-2 border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Workflow Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {workflowData.steps.map((step, index) => {
              const isCompleted = index < instanceData.current_step;
              const isCurrent = index === instanceData.current_step && (isActive || isReturned);
              const isPendingStep = index > instanceData.current_step;
              const StepIcon = STEP_TYPE_ICONS[step.type] || CheckCircle;
              const iconColor = STEP_TYPE_COLORS[step.type] || "text-slate-600";

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                    isCurrent ? 'bg-blue-50 border-2 border-blue-200' :
                    isCompleted ? 'bg-green-50 border border-green-100' :
                    'bg-slate-50 border border-slate-100 opacity-60'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-slate-200'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : isCurrent ? (
                      <Clock className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-slate-600 text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <StepIcon className={`w-4 h-4 ${iconColor} shrink-0`} />
                      <h3 className="font-semibold text-slate-900">{step.name}</h3>
                      <Badge variant="outline" className="text-xs capitalize">{step.type.replace(/_/g,' ')}</Badge>
                    </div>
                    {/* Show how approvers are configured */}
                    {step.assignee_type === 'stakeholder_group' && step.stakeholder_group_ids?.length > 0 && (
                      <p className="text-sm text-slate-600 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-purple-500" />
                        Group(s): {step.stakeholder_group_ids.join(', ')}
                        <span className="text-xs text-slate-400">(resolved at runtime)</span>
                      </p>
                    )}
                    {step.assignee_type === 'dynamic_role' && step.dynamic_role_field && (
                      <p className="text-sm text-slate-600">Role: <code className="bg-slate-100 px-1 rounded text-xs">{step.dynamic_role_field}</code></p>
                    )}
                    {(!step.assignee_type || step.assignee_type === 'named_emails') && step.approvers?.length > 0 && (
                      <p className="text-sm text-slate-600">Approvers: {step.approvers.join(', ')}</p>
                    )}
                    {isCurrent && instanceData.pending_approvers?.length > 0 && (
                      <p className="text-sm text-blue-600 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Awaiting: {instanceData.pending_approvers.join(', ')}
                      </p>
                    )}
                    {step.type === 'return_to_originator' && (
                      <p className="text-xs text-orange-600 mt-0.5">Returns item to originator with mandatory reason</p>
                    )}
                    {step.type === 'conditional' && step.condition_field && (
                      <p className="text-xs text-indigo-600 mt-0.5">If {step.condition_field} {step.condition_operator} "{step.condition_value}"</p>
                    )}
                    {step.type === 'escalation' && (
                      <p className="text-xs text-red-600 mt-0.5">Escalates after {step.escalation_after_days} days</p>
                    )}
                    {step.type === 'delay' && (
                      <p className="text-xs text-slate-500 mt-0.5">Waits {step.delay_hours} hours</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Action panel for current approvers */}
            {canAct && currentStep && !currentStepIsReturn && (
              <div className="space-y-4 pt-4 border-t border-slate-100 mt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="comments">
                    Comments {currentStep.comment_required ? <span className="text-red-500">*</span> : <span className="text-slate-400">(optional)</span>}
                  </Label>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add your comments..."
                    rows={3}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleAction('approved')}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    disabled={actionMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  {/* Return to Originator button — always available to approvers */}
                  {!showReturnForm && (
                    <Button
                      onClick={() => setShowReturnForm(true)}
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50 flex-1"
                      disabled={actionMutation.isPending}
                    >
                      <CornerDownLeft className="w-4 h-4 mr-2" />
                      Return to Originator
                    </Button>
                  )}
                  <Button
                    onClick={() => handleAction('rejected')}
                    variant="destructive"
                    className="flex-1"
                    disabled={actionMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>

                {/* Return form */}
                {showReturnForm && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                    <p className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                      <CornerDownLeft className="w-4 h-4" />
                      Return to Originator
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Reason for returning <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        placeholder="Please describe what needs to be corrected or revised..."
                        rows={3}
                        className="border-orange-200 focus:ring-orange-400"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAction('returned')}
                        className="bg-orange-600 hover:bg-orange-700"
                        disabled={actionMutation.isPending}
                        size="sm"
                      >
                        <CornerDownLeft className="w-4 h-4 mr-2" />
                        Confirm Return
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setShowReturnForm(false); setReturnReason(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auto-return step handling — when the current step IS a return_to_originator type */}
            {currentStepIsReturn && isActive && canAct && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-orange-700">This step requires returning the item to the originator.</p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Reason for returning <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder={currentStep.notification_template || "Please describe what needs to be revised..."}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={() => handleAction('returned')}
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={actionMutation.isPending}
                >
                  <CornerDownLeft className="w-4 h-4 mr-2" />
                  Return to Originator
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: details + history */}
        <div className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Entity Type</p>
                <p className="font-medium text-sm">{instanceData.entity_type}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Current Step</p>
                <p className="font-medium text-sm">{instanceData.current_step + 1} of {workflowData.steps.length}</p>
              </div>
              {instanceData.originator_email && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Submitted By</p>
                  <p className="font-medium text-sm">{instanceData.originator_email}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Started</p>
                <p className="font-medium text-sm">{format(new Date(instanceData.created_date), 'MMM d, yyyy HH:mm')}</p>
              </div>
              {instanceData.resubmit_count > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Resubmissions</p>
                  <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">{instanceData.resubmit_count}×</Badge>
                </div>
              )}
              {instanceData.completed_date && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Completed</p>
                  <p className="font-medium text-sm">{format(new Date(instanceData.completed_date), 'MMM d, yyyy HH:mm')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {instanceData.step_history?.length > 0 && (
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-base">Audit History</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  {[...instanceData.step_history].reverse().map((entry, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-sm font-semibold text-slate-900">{entry.step_name}</p>
                          <Badge className={`text-xs ${ACTION_COLORS[entry.action] || "bg-slate-100 text-slate-700"}`}>
                            {entry.action}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">{entry.actor}</p>
                        <p className="text-xs text-slate-400">{format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}</p>
                        {entry.comments && (
                          <p className="text-xs text-slate-600 mt-1 italic bg-slate-50 p-2 rounded border-l-2 border-slate-200">
                            "{entry.comments}"
                          </p>
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
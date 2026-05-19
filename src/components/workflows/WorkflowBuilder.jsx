import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, ArrowDown, CheckCircle, Bell, Zap,
  CornerDownLeft, GitMerge, GitFork, AlertTriangle, Clock, Info
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import StepAssigneePicker from "./StepAssigneePicker";

const STEP_TYPES = [
  { value: "approval",             label: "Approval",              icon: CheckCircle,    color: "text-green-600",  bg: "bg-green-50 border-green-200",  description: "One or more approvers must approve before moving forward." },
  { value: "parallel_approval",    label: "Parallel Approval",     icon: GitMerge,       color: "text-blue-600",   bg: "bg-blue-50 border-blue-200",     description: "Multiple approvers work simultaneously; configure how many must approve." },
  { value: "return_to_originator", label: "Return to Originator",  icon: CornerDownLeft, color: "text-orange-600", bg: "bg-orange-50 border-orange-200", description: "Returns the item to the submitter with a mandatory reason/comment." },
  { value: "notification",         label: "Notification",          icon: Bell,           color: "text-purple-600", bg: "bg-purple-50 border-purple-200", description: "Sends an email notification to specified recipients." },
  { value: "conditional",          label: "Conditional Branch",    icon: GitFork,        color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200", description: "Routes to different steps based on a field condition." },
  { value: "escalation",           label: "Escalation",            icon: AlertTriangle,  color: "text-red-600",    bg: "bg-red-50 border-red-200",       description: "Escalates to another person if no action is taken within N days." },
  { value: "delay",                label: "Delay / Wait",          icon: Clock,          color: "text-slate-600",  bg: "bg-slate-50 border-slate-200",   description: "Pauses the workflow for a set number of hours before continuing." },
  { value: "action",               label: "Action",                icon: Zap,            color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", description: "Records a manual action or task to be performed." },
];

function StepTypeIcon({ type, className = "w-4 h-4" }) {
  const def = STEP_TYPES.find(t => t.value === type);
  if (!def) return <CheckCircle className={className} />;
  const Icon = def.icon;
  return <Icon className={`${className} ${def.color}`} />;
}

function StepTypeBadge({ type }) {
  const def = STEP_TYPES.find(t => t.value === type);
  if (!def) return <Badge variant="outline">{type}</Badge>;
  return (
    <Badge variant="outline" className={`${def.bg} ${def.color} border text-xs font-medium`}>
      {def.label}
    </Badge>
  );
}

export default function WorkflowBuilder({ steps, onChange, entityType = "" }) {
  const [editingStep, setEditingStep] = useState(null);

  const { data: stakeholders = [] } = useQuery({ queryKey: ['stakeholders'], queryFn: () => base44.entities.Stakeholder.list() });
  const { data: stakeholderGroups = [] } = useQuery({ queryKey: ['stakeholderGroups'], queryFn: () => base44.entities.StakeholderGroup.list() });
  const { data: valueChains = [] } = useQuery({ queryKey: ['valueChains'], queryFn: () => base44.entities.ValueChain.list() });
  const { data: workstreams = [] } = useQuery({ queryKey: ['workstreams'], queryFn: () => base44.entities.Workstream.list() });

  const addStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      name: "",
      type: "approval",
      approvers: [],
      notification_template: "",
      recipients: [],
      order: steps.length,
      require_all_approvers: false,
      comment_required: false,
      return_reason_required: true,
      escalation_after_days: 3,
      escalation_emails: [],
      delay_hours: 24,
      condition_field: "",
      condition_operator: "equals",
      condition_value: "",
      condition_true_step: null,
      condition_false_step: null,
    };
    onChange([...steps, newStep]);
    setEditingStep(steps.length);
  };

  const updateStep = (index, field, value) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const updateStepFields = (index, patch) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  };

  const removeStep = (index) => {
    const updated = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i }));
    onChange(updated);
    setEditingStep(null);
  };

  const moveStep = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === steps.length - 1)) return;
    const updated = [...steps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated[index].order = index;
    updated[newIndex].order = newIndex;
    onChange(updated);
  };

  // Handles changes from StepAssigneePicker for approvers
  const handleApproverChange = (index, { assigneeType, emails, groupIds, stakeholderIds, dynamicField }) => {
    const updated = [...steps];
    updated[index] = {
      ...updated[index],
      assignee_type: assigneeType,
      approvers: emails,
      stakeholder_group_ids: groupIds,
      named_stakeholder_ids: stakeholderIds,
      dynamic_role_field: dynamicField,
    };
    onChange(updated);
  };

  // Handles changes from StepAssigneePicker for recipients
  const handleRecipientChange = (index, { assigneeType, emails, groupIds, stakeholderIds, dynamicField }) => {
    const updated = [...steps];
    updated[index] = {
      ...updated[index],
      recipient_assignee_type: assigneeType,
      recipients: emails,
      recipient_stakeholder_group_ids: groupIds,
      recipient_named_stakeholder_ids: stakeholderIds,
      recipient_dynamic_role_field: dynamicField,
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Workflow Steps</Label>
          <p className="text-xs text-slate-500 mt-0.5">Build your workflow by adding steps. Drag to reorder using the arrows.</p>
        </div>
        <Button type="button" onClick={addStep} variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50">
          <Plus className="w-4 h-4 mr-2" />
          Add Step
        </Button>
      </div>

      {steps.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="p-10 text-center text-slate-500">
            <GitMerge className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium mb-1">No steps defined yet</p>
            <p className="text-sm text-slate-400">Click "Add Step" to start building your workflow.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => {
            const typeDef = STEP_TYPES.find(t => t.value === step.type);
            const isEditing = editingStep === index;
            return (
              <div key={step.id}>
                <Card className={`transition-all ${isEditing ? 'border-purple-300 shadow-md ring-1 ring-purple-200' : 'border-slate-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Step number */}
                      <div className="flex flex-col items-center gap-1 mt-0.5 shrink-0">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-purple-700">{index + 1}</span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header row */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <StepTypeIcon type={step.type} />
                            <span className="font-semibold text-slate-900 text-sm">
                              {step.name || `Step ${index + 1}`}
                            </span>
                            <StepTypeBadge type={step.type} />
                            {step.comment_required && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Comment Required</Badge>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {index > 0 && (
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(index, 'up')} title="Move up">
                                <span className="text-sm">↑</span>
                              </Button>
                            )}
                            {index < steps.length - 1 && (
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(index, 'down')} title="Move down">
                                <span className="text-sm">↓</span>
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setEditingStep(isEditing ? null : index)}
                            >
                              {isEditing ? 'Collapse' : 'Configure'}
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeStep(index)}>
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          </div>
                        </div>

                        {/* Summary when collapsed */}
                        {!isEditing && (
                          <p className="text-xs text-slate-500 mt-1">
                            {typeDef?.description}
                            {(step.assignee_type === 'stakeholder_group') && step.stakeholder_group_ids?.length > 0 && ` • Group: ${step.stakeholder_group_ids.map(id => stakeholderGroups.find(g=>g.id===id)?.name || id).join(', ')}`}
                            {(step.assignee_type === 'named_stakeholders') && step.named_stakeholder_ids?.length > 0 && ` • ${step.named_stakeholder_ids.length} named stakeholder(s)`}
                            {(step.assignee_type === 'dynamic_role') && step.dynamic_role_field && ` • Role: ${step.dynamic_role_field}`}
                            {(!step.assignee_type || step.assignee_type === 'named_emails') && step.approvers?.length > 0 && ` • ${step.approvers.length} approver(s)`}
                            {step.recipients?.length > 0 && ` • ${step.recipients.length} recipient(s)`}
                            {step.escalation_after_days && step.type === 'escalation' && ` • Escalate after ${step.escalation_after_days}d`}
                            {step.delay_hours && step.type === 'delay' && ` • Wait ${step.delay_hours}h`}
                            {step.value_chain_name && ` • VC: ${step.value_chain_name}`}
                            {step.workstream_name && ` • WS: ${step.workstream_name}`}
                          </p>
                        )}

                        {/* Edit panel */}
                        {isEditing && (
                          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                            {/* Common: name & type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs">Step Name *</Label>
                                <Input
                                  value={step.name}
                                  onChange={(e) => updateStep(index, 'name', e.target.value)}
                                  placeholder="e.g., Manager Approval"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Step Type *</Label>
                                <Select value={step.type} onValueChange={(v) => updateStep(index, 'type', v)}>
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STEP_TYPES.map(t => (
                                      <SelectItem key={t.value} value={t.value}>
                                        <div className="flex items-center gap-2">
                                          <t.icon className={`w-3.5 h-3.5 ${t.color}`} />
                                          {t.label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Info tooltip for type */}
                            {typeDef && (
                              <div className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${typeDef.bg} ${typeDef.color}`}>
                                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                {typeDef.description}
                              </div>
                            )}

                            {/* === VALUE CHAIN & WORKSTREAM === */}
                            {valueChains.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-slate-600">Value Chain <span className="text-slate-400">(optional)</span></Label>
                                  <Select
                                    value={step.value_chain_id || ""}
                                    onValueChange={(v) => {
                                      const vc = valueChains.find(c => c.id === v);
                                      const ws = workstreams.find(w => w.id === step.workstream_id);
                                      const clearWs = ws && ws.value_chain_id !== v;
                                      updateStepFields(index, {
                                        value_chain_id: v || null,
                                        value_chain_name: vc?.name || '',
                                        ...(clearWs ? { workstream_id: null, workstream_name: '' } : {}),
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue placeholder="All value chains" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={null}>All value chains</SelectItem>
                                      {valueChains.filter(vc => vc.status !== 'archived').map(vc => (
                                        <SelectItem key={vc.id} value={vc.id}>{vc.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-slate-600">Workstream <span className="text-slate-400">(optional)</span></Label>
                                  <Select
                                    value={step.workstream_id || ""}
                                    onValueChange={(v) => {
                                      const ws = workstreams.find(w => w.id === v);
                                      updateStepFields(index, {
                                        workstream_id: v || null,
                                        workstream_name: ws?.name || '',
                                      });
                                    }}
                                    disabled={!step.value_chain_id}
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue placeholder={step.value_chain_id ? "All workstreams" : "Select a value chain first"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={null}>All workstreams</SelectItem>
                                      {workstreams
                                        .filter(w => w.value_chain_id === step.value_chain_id && w.status !== 'archived')
                                        .map(w => (
                                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}

                            {/* === APPROVAL === */}
                            {step.type === 'approval' && (
                              <div className="space-y-3">
                                <StepAssigneePicker
                                  label="Approvers"
                                  assigneeType={step.assignee_type || 'named_emails'}
                                  emails={step.approvers || []}
                                  groupIds={step.stakeholder_group_ids || []}
                                  stakeholderIds={step.named_stakeholder_ids || []}
                                  dynamicField={step.dynamic_role_field || ''}
                                  entityType={entityType}
                                  stakeholders={stakeholders}
                                  stakeholderGroups={stakeholderGroups}
                                  onChange={(v) => handleApproverChange(index, v)}
                                />
                                <div className="flex flex-wrap gap-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                      checked={!!step.require_all_approvers}
                                      onCheckedChange={(c) => updateStep(index, 'require_all_approvers', c)}
                                    />
                                    <span className="text-xs text-slate-700">Require ALL approvers to approve</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                      checked={!!step.comment_required}
                                      onCheckedChange={(c) => updateStep(index, 'comment_required', c)}
                                    />
                                    <span className="text-xs text-slate-700">Require a comment when approving</span>
                                  </label>
                                </div>
                              </div>
                            )}

                            {/* === PARALLEL APPROVAL === */}
                            {step.type === 'parallel_approval' && (
                              <div className="space-y-3">
                                <StepAssigneePicker
                                  label="Approvers"
                                  assigneeType={step.assignee_type || 'named_emails'}
                                  emails={step.approvers || []}
                                  groupIds={step.stakeholder_group_ids || []}
                                  stakeholderIds={step.named_stakeholder_ids || []}
                                  dynamicField={step.dynamic_role_field || ''}
                                  entityType={entityType}
                                  stakeholders={stakeholders}
                                  stakeholderGroups={stakeholderGroups}
                                  onChange={(v) => handleApproverChange(index, v)}
                                />
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Minimum approvals required</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={step.min_approvals || 1}
                                    onChange={(e) => updateStep(index, 'min_approvals', parseInt(e.target.value) || 1)}
                                    className="h-8 text-sm w-32"
                                  />
                                  <p className="text-xs text-slate-400">Leave at 0 to require all approvers</p>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={!!step.comment_required}
                                    onCheckedChange={(c) => updateStep(index, 'comment_required', c)}
                                  />
                                  <span className="text-xs text-slate-700">Require a comment when approving</span>
                                </label>
                              </div>
                            )}

                            {/* === RETURN TO ORIGINATOR === */}
                            {step.type === 'return_to_originator' && (
                              <div className="space-y-3">
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                                  <strong>When this step is reached</strong>, the item is sent back to the person who originally submitted it with a mandatory reason. The workflow pauses until they resubmit.
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Return message / instruction to originator</Label>
                                  <Textarea
                                    value={step.notification_template || ''}
                                    onChange={(e) => updateStep(index, 'notification_template', e.target.value)}
                                    placeholder="Please review the comments below and resubmit with the required changes..."
                                    rows={2}
                                    className="text-sm"
                                  />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={step.return_reason_required !== false}
                                    onCheckedChange={(c) => updateStep(index, 'return_reason_required', c)}
                                  />
                                  <span className="text-xs text-slate-700">Require return reason (recommended)</span>
                                </label>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Additional CC emails when returning <span className="text-slate-400">(optional)</span></Label>
                                  <Input
                                    value={step.recipients?.join(', ') || ''}
                                    onChange={(e) => updateStep(index, 'recipients', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    placeholder="manager@example.com"
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                            )}

                            {/* === NOTIFICATION === */}
                            {step.type === 'notification' && (
                              <div className="space-y-3">
                                <StepAssigneePicker
                                  label="Recipients"
                                  assigneeType={step.recipient_assignee_type || 'named_emails'}
                                  emails={step.recipients || []}
                                  groupIds={step.recipient_stakeholder_group_ids || []}
                                  stakeholderIds={step.recipient_named_stakeholder_ids || []}
                                  dynamicField={step.recipient_dynamic_role_field || ''}
                                  entityType={entityType}
                                  stakeholders={stakeholders}
                                  stakeholderGroups={stakeholderGroups}
                                  onChange={(v) => handleRecipientChange(index, v)}
                                />
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Email Template</Label>
                                  <Textarea
                                    value={step.notification_template || ''}
                                    onChange={(e) => updateStep(index, 'notification_template', e.target.value)}
                                    placeholder="Your item {{entity_name}} requires attention..."
                                    rows={3}
                                    className="text-sm"
                                  />
                                  <p className="text-xs text-slate-400">Use {"{{entity_name}}"}, {"{{entity_type}}"}, {"{{actor}}"} as placeholders.</p>
                                </div>
                              </div>
                            )}

                            {/* === ACTION === */}
                            {step.type === 'action' && (
                              <div className="space-y-3">
                                <StepAssigneePicker
                                  label="Assigned To"
                                  assigneeType={step.recipient_assignee_type || 'named_emails'}
                                  emails={step.recipients || []}
                                  groupIds={step.recipient_stakeholder_group_ids || []}
                                  stakeholderIds={step.recipient_named_stakeholder_ids || []}
                                  dynamicField={step.recipient_dynamic_role_field || ''}
                                  entityType={entityType}
                                  stakeholders={stakeholders}
                                  stakeholderGroups={stakeholderGroups}
                                  onChange={(v) => handleRecipientChange(index, v)}
                                />
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Action Description / Instructions</Label>
                                  <Textarea
                                    value={step.notification_template || ''}
                                    onChange={(e) => updateStep(index, 'notification_template', e.target.value)}
                                    placeholder="Describe the action to be performed..."
                                    rows={2}
                                    className="text-sm"
                                  />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={!!step.comment_required}
                                    onCheckedChange={(c) => updateStep(index, 'comment_required', c)}
                                  />
                                  <span className="text-xs text-slate-700">Require completion comment</span>
                                </label>
                              </div>
                            )}

                            {/* === CONDITIONAL === */}
                            {step.type === 'conditional' && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">Field Name</Label>
                                    <Input
                                      value={step.condition_field || ''}
                                      onChange={(e) => updateStep(index, 'condition_field', e.target.value)}
                                      placeholder="e.g. criticality"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">Operator</Label>
                                    <Select value={step.condition_operator || 'equals'} onValueChange={(v) => updateStep(index, 'condition_operator', v)}>
                                      <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="equals">Equals</SelectItem>
                                        <SelectItem value="not_equals">Not Equals</SelectItem>
                                        <SelectItem value="contains">Contains</SelectItem>
                                        <SelectItem value="greater_than">Greater Than</SelectItem>
                                        <SelectItem value="less_than">Less Than</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">Value</Label>
                                    <Input
                                      value={step.condition_value || ''}
                                      onChange={(e) => updateStep(index, 'condition_value', e.target.value)}
                                      placeholder="e.g. critical"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">If TRUE → go to step #</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={step.condition_true_step != null ? step.condition_true_step + 1 : ''}
                                      onChange={(e) => updateStep(index, 'condition_true_step', e.target.value ? parseInt(e.target.value) - 1 : null)}
                                      placeholder="Step number"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">If FALSE → go to step #</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={step.condition_false_step != null ? step.condition_false_step + 1 : ''}
                                      onChange={(e) => updateStep(index, 'condition_false_step', e.target.value ? parseInt(e.target.value) - 1 : null)}
                                      placeholder="Step number"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* === ESCALATION === */}
                            {step.type === 'escalation' && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">Escalate after (days)</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={step.escalation_after_days || 3}
                                      onChange={(e) => updateStep(index, 'escalation_after_days', parseInt(e.target.value) || 3)}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">Escalate to (emails)</Label>
                                    <Input
                                      value={step.escalation_emails?.join(', ') || ''}
                                      onChange={(e) => updateStep(index, 'escalation_emails', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                      placeholder="manager@example.com"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Escalation message</Label>
                                  <Textarea
                                    value={step.notification_template || ''}
                                    onChange={(e) => updateStep(index, 'notification_template', e.target.value)}
                                    placeholder="This item has been escalated because no action was taken within {{days}} days..."
                                    rows={2}
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                            )}

                            {/* === DELAY === */}
                            {step.type === 'delay' && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Wait duration (hours)</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={step.delay_hours || 24}
                                  onChange={(e) => updateStep(index, 'delay_hours', parseInt(e.target.value) || 24)}
                                  className="h-8 text-sm w-40"
                                />
                                <p className="text-xs text-slate-400">The workflow will pause for this many hours before advancing to the next step.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Connector arrow */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
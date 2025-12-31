import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ArrowRight, CheckCircle, Bell, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function WorkflowBuilder({ steps, onChange }) {
  const [editingStep, setEditingStep] = useState(null);

  const addStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      name: "",
      type: "approval",
      approvers: [],
      notification_template: "",
      recipients: [],
      order: steps.length,
      require_all_approvers: false
    };
    onChange([...steps, newStep]);
    setEditingStep(steps.length);
  };

  const updateStep = (index, field, value) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
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

  const getStepIcon = (type) => {
    const icons = {
      approval: CheckCircle,
      notification: Bell,
      action: Zap
    };
    const Icon = icons[type] || CheckCircle;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Workflow Steps</Label>
        <Button type="button" onClick={addStep} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Step
        </Button>
      </div>

      {steps.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-slate-500">
            <p>No steps defined. Click "Add Step" to start building your workflow.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <Card key={step.id} className={editingStep === index ? 'border-purple-300 shadow-md' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {index + 1}
                    </Badge>
                    {index < steps.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-slate-400 rotate-90" />
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStepIcon(step.type)}
                        <span className="font-medium text-slate-900">
                          {step.name || `Step ${index + 1}`}
                        </span>
                        <Badge variant="outline">{step.type}</Badge>
                      </div>
                      <div className="flex gap-1">
                        {index > 0 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => moveStep(index, 'up')}>
                            ↑
                          </Button>
                        )}
                        {index < steps.length - 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => moveStep(index, 'down')}>
                            ↓
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingStep(editingStep === index ? null : index)}
                        >
                          {editingStep === index ? 'Collapse' : 'Edit'}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeStep(index)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {editingStep === index && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                        <div className="space-y-2">
                          <Label>Step Name</Label>
                          <Input
                            value={step.name}
                            onChange={(e) => updateStep(index, 'name', e.target.value)}
                            placeholder="e.g., Manager Approval"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Step Type</Label>
                          <Select value={step.type} onValueChange={(value) => updateStep(index, 'type', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="approval">Approval</SelectItem>
                              <SelectItem value="notification">Notification</SelectItem>
                              <SelectItem value="action">Action</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {step.type === 'approval' && (
                          <>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Approver Emails (comma-separated)</Label>
                              <Input
                                value={step.approvers?.join(', ') || ''}
                                onChange={(e) => updateStep(index, 'approvers', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                placeholder="user1@example.com, user2@example.com"
                              />
                            </div>
                            <div className="flex items-center space-x-2 md:col-span-2">
                              <Checkbox
                                id={`require-all-${index}`}
                                checked={step.require_all_approvers}
                                onCheckedChange={(checked) => updateStep(index, 'require_all_approvers', checked)}
                              />
                              <Label htmlFor={`require-all-${index}`} className="cursor-pointer">
                                Require all approvers to approve
                              </Label>
                            </div>
                          </>
                        )}

                        {(step.type === 'notification' || step.type === 'action') && (
                          <>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Recipient Emails (comma-separated)</Label>
                              <Input
                                value={step.recipients?.join(', ') || ''}
                                onChange={(e) => updateStep(index, 'recipients', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                placeholder="user1@example.com, user2@example.com"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Notification Template</Label>
                              <Textarea
                                value={step.notification_template}
                                onChange={(e) => updateStep(index, 'notification_template', e.target.value)}
                                placeholder="Your assessment {{entity_name}} requires action..."
                                rows={2}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
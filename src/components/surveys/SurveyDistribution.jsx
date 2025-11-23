import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Plus, Trash2, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SurveyDistribution({ survey, onUpdate }) {
  const [recipients, setRecipients] = useState(survey.recipients || []);
  const [newRecipient, setNewRecipient] = useState({ name: "", email: "" });
  const [reminderSettings, setReminderSettings] = useState(survey.reminder_schedule || {
    enabled: false,
    frequency_days: 3
  });

  const addRecipient = () => {
    if (newRecipient.name && newRecipient.email) {
      const updated = [...recipients, { ...newRecipient, completed: false }];
      setRecipients(updated);
      setNewRecipient({ name: "", email: "" });
      onUpdate({ recipients: updated });
    }
  };

  const removeRecipient = (index) => {
    const updated = recipients.filter((_, i) => i !== index);
    setRecipients(updated);
    onUpdate({ recipients: updated });
  };

  const updateReminderSettings = (field, value) => {
    const updated = { ...reminderSettings, [field]: value };
    setReminderSettings(updated);
    onUpdate({ reminder_schedule: updated });
  };

  const sendSurveyInvitations = async () => {
    try {
      const surveyUrl = `${window.location.origin}${window.location.pathname}?id=${survey.id}`;
      
      for (const recipient of recipients) {
        await base44.integrations.Core.SendEmail({
          to: recipient.email,
          subject: `Survey: ${survey.title}`,
          body: `Hello ${recipient.name},

You have been invited to complete the following survey:

${survey.title}
${survey.description || ''}

Please complete the survey by ${survey.due_date ? new Date(survey.due_date).toLocaleDateString() : 'the due date'}.

Survey Link: ${surveyUrl}

Thank you for your participation.`
        });
      }
      
      toast.success(`Survey invitations sent to ${recipients.length} recipients`);
    } catch (error) {
      toast.error("Failed to send invitations");
      console.error(error);
    }
  };

  const completedCount = recipients.filter(r => r.completed).length;

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Recipients</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Name"
                value={newRecipient.name}
                onChange={(e) => setNewRecipient({...newRecipient, name: e.target.value})}
              />
            </div>
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Email"
                value={newRecipient.email}
                onChange={(e) => setNewRecipient({...newRecipient, email: e.target.value})}
              />
            </div>
            <Button type="button" onClick={addRecipient}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {recipients.length > 0 && (
            <div className="space-y-2">
              {recipients.map((recipient, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    {recipient.completed && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    <div>
                      <p className="text-sm font-medium">{recipient.name}</p>
                      <p className="text-xs text-slate-600">{recipient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {recipient.completed && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                        Completed
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRecipient(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-3">
              {completedCount} of {recipients.length} completed
            </p>
            <Button 
              type="button" 
              onClick={sendSurveyInvitations} 
              disabled={recipients.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Invitations
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Automated Reminders</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-reminders"
              checked={reminderSettings.enabled}
              onCheckedChange={(checked) => updateReminderSettings('enabled', checked)}
            />
            <Label htmlFor="enable-reminders">Enable automatic reminders</Label>
          </div>

          {reminderSettings.enabled && (
            <div className="space-y-2">
              <Label htmlFor="frequency">Reminder Frequency</Label>
              <Select 
                value={reminderSettings.frequency_days?.toString()} 
                onValueChange={(value) => updateReminderSettings('frequency_days', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Daily</SelectItem>
                  <SelectItem value="3">Every 3 days</SelectItem>
                  <SelectItem value="7">Weekly</SelectItem>
                  <SelectItem value="14">Every 2 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
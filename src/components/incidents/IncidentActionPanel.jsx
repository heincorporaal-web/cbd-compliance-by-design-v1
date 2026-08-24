import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useCompanyPreferences } from "@/hooks/useCompanyPreferences";
import { Plus, Trash2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { format, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES = {
  open: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
};

export default function IncidentActionPanel({ incidentId, companyId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    action_type: "remediation",
    assigned_to: "",
    due_date: "",
    priority: "medium",
    status: "open",
    notes: "",
  });

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["incident-actions", incidentId],
    queryFn: () => base44.entities.IncidentAction.filter({ incident_id: incidentId }, "due_date"),
    enabled: !!incidentId,
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.IncidentAction.create({ ...data, incident_id: incidentId, company_id: companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries(["incident-actions", incidentId]);
      setShowForm(false);
      setFormData({ title: "", description: "", action_type: "remediation", assigned_to: "", due_date: "", priority: "medium", status: "open", notes: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.IncidentAction.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(["incident-actions", incidentId]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IncidentAction.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["incident-actions", incidentId]),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    createMutation.mutate(formData);
  };

  const cycleStatus = (action) => {
    const order = ["open", "in_progress", "completed"];
    const next = order[(order.indexOf(action.status) + 1) % order.length];
    const patch = { status: next };
    if (next === "completed") patch.completed_date = new Date().toISOString().slice(0, 10);
    updateMutation.mutate({ id: action.id, data: patch });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">
          Remediation Actions ({actions.length})
        </h4>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-3.5 h-3.5" /> Add Action
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs">Action Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={formData.action_type} onValueChange={(v) => setFormData({ ...formData, action_type: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remediation">Remediation</SelectItem>
                  <SelectItem value="corrective">Corrective</SelectItem>
                  <SelectItem value="preventive">Preventive</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                  <SelectItem value="workaround">Workaround</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Assigned To</Label>
              <Input value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Due Date</Label>
              <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="h-8 text-sm" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" size="sm">Save Action</Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading actions…</p>
      ) : actions.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No remediation actions tracked yet.</p>
      ) : (
        <div className="space-y-2">
          {actions.map((action) => {
            const isOverdue = action.status !== "completed" && action.due_date && isPast(new Date(action.due_date));
            return (
              <div key={action.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800">{action.title}</span>
                      <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[action.status] || STATUS_STYLES.open}`}>
                        {action.status.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{action.action_type}</Badge>
                      {isOverdue && (
                        <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                          <AlertCircle className="w-3 h-3 mr-0.5" /> Overdue
                        </Badge>
                      )}
                    </div>
                    {action.description && <p className="text-xs text-slate-500 mt-1">{action.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      {action.assigned_to && <span>👤 {action.assigned_to}</span>}
                      {action.due_date && (
                        <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {format(new Date(action.due_date), "d MMM yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => cycleStatus(action)} title="Advance status">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(action.id)} title="Delete">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
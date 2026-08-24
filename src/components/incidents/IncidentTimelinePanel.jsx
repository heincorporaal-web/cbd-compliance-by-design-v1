import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Plus, MessageSquare, Flag, ArrowRight, Bell, Wrench, Zap } from "lucide-react";

const EVENT_ICONS = {
  created: Flag,
  status_changed: ArrowRight,
  assigned: ArrowRight,
  escalated: Zap,
  communication: Bell,
  decision: Flag,
  restoration: Wrench,
  milestone: Flag,
  comment: MessageSquare,
  priority_changed: ArrowRight,
  severity_changed: ArrowRight,
};

const EVENT_COLORS = {
  created: "text-blue-500",
  status_changed: "text-indigo-500",
  assigned: "text-cyan-500",
  escalated: "text-orange-500",
  communication: "text-purple-500",
  decision: "text-amber-500",
  restoration: "text-green-500",
  milestone: "text-rose-500",
  comment: "text-slate-500",
  priority_changed: "text-orange-500",
  severity_changed: "text-red-500",
};

export default function IncidentTimelinePanel({ incidentId, companyId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    event_type: "comment",
    event_text: "",
    event_timestamp: new Date().toISOString().slice(0, 16),
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["incident-timeline", incidentId],
    queryFn: () =>
      base44.entities.IncidentTimeline
        .filter({ incident_id: incidentId }, "-event_timestamp")
        .then((r) => [...r].reverse()),
    enabled: !!incidentId,
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.IncidentTimeline.create({
        ...data,
        incident_id: incidentId,
        company_id: companyId,
        actor: "Current User",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["incident-timeline", incidentId]);
      setShowForm(false);
      setFormData({ event_type: "comment", event_text: "", event_timestamp: new Date().toISOString().slice(0, 16) });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.event_text.trim()) return;
    createMutation.mutate({
      ...formData,
      event_timestamp: new Date(formData.event_timestamp).toISOString(),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">Event Timeline ({events.length})</h4>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-3.5 h-3.5" /> Add Event
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Event Type</Label>
              <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="comment">Comment</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="decision">Decision</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="escalated">Escalation</SelectItem>
                  <SelectItem value="restoration">Restoration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Timestamp</Label>
              <Input
                type="datetime-local"
                value={formData.event_timestamp}
                onChange={(e) => setFormData({ ...formData, event_timestamp: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs">Event Description *</Label>
              <Textarea
                value={formData.event_text}
                onChange={(e) => setFormData({ ...formData, event_text: e.target.value })}
                rows={2}
                required
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" size="sm">Add Event</Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading timeline…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No timeline events recorded.</p>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200" />
          <div className="space-y-4">
            {events.map((evt) => {
              const Icon = EVENT_ICONS[evt.event_type] || MessageSquare;
              const color = EVENT_COLORS[evt.event_type] || "text-slate-500";
              return (
                <div key={evt.id} className="relative">
                  <div className={`absolute -left-5 w-4 h-4 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center ${color}`}>
                    <Icon className="w-2.5 h-2.5" />
                  </div>
                  <div className="ml-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-medium text-slate-400">
                        {format(new Date(evt.event_timestamp), "d MMM yyyy HH:mm")}
                      </span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${color}`}>
                        {evt.event_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-0.5">{evt.event_text}</p>
                    {evt.actor && <p className="text-[11px] text-slate-400 mt-0.5">— {evt.actor}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
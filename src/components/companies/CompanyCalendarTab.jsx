import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CalendarDays, Plus, Trash2, Edit2, Send, CheckCircle2,
  Clock, MapPin, Users, RefreshCw, CalendarCheck
} from "lucide-react";
import { format } from "date-fns";

const EVENT_TYPES = [
  { value: "review", label: "Review", color: "bg-blue-100 text-blue-700" },
  { value: "assessment", label: "Assessment", color: "bg-purple-100 text-purple-700" },
  { value: "audit", label: "Audit", color: "bg-orange-100 text-orange-700" },
  { value: "monitoring", label: "Monitoring", color: "bg-teal-100 text-teal-700" },
  { value: "board_meeting", label: "Board Meeting", color: "bg-slate-100 text-slate-700" },
  { value: "regulatory", label: "Regulatory", color: "bg-red-100 text-red-700" },
  { value: "training", label: "Training", color: "bg-green-100 text-green-700" },
  { value: "other", label: "Other", color: "bg-gray-100 text-gray-700" },
];

const EMPTY_FORM = {
  title: "", description: "", event_type: "review",
  start_date: "", end_date: "", all_day: false,
  location: "", attendees: [], recurrence: "none", status: "upcoming",
};

function EventTypeBadge({ type }) {
  const et = EVENT_TYPES.find(e => e.value === type) || EVENT_TYPES[7];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${et.color}`}>{et.label}</span>;
}

export default function CompanyCalendarTab({ companyId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [attendeeInput, setAttendeeInput] = useState("");
  const [pushingId, setPushingId] = useState(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['company-calendar', companyId],
    queryFn: () => base44.entities.CompanyCalendarEvent.filter({ company_id: companyId }, 'start_date'),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CompanyCalendarEvent.create({ ...data, company_id: companyId }),
    onSuccess: () => { queryClient.invalidateQueries(['company-calendar', companyId]); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CompanyCalendarEvent.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['company-calendar', companyId]); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyCalendarEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['company-calendar', companyId]),
  });

  const closeForm = () => { setShowForm(false); setEditingEvent(null); setFormData(EMPTY_FORM); setAttendeeInput(""); };

  const openCreate = () => { setFormData(EMPTY_FORM); setEditingEvent(null); setShowForm(true); };

  const openEdit = (ev) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title || "",
      description: ev.description || "",
      event_type: ev.event_type || "review",
      start_date: ev.start_date ? ev.start_date.slice(0, 16) : "",
      end_date: ev.end_date ? ev.end_date.slice(0, 16) : "",
      all_day: ev.all_day || false,
      location: ev.location || "",
      attendees: ev.attendees || [],
      recurrence: ev.recurrence || "none",
      status: ev.status || "upcoming",
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null, end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null };
    if (editingEvent) updateMutation.mutate({ id: editingEvent.id, data });
    else createMutation.mutate(data);
  };

  const addAttendee = () => {
    const email = attendeeInput.trim();
    if (email && !formData.attendees.includes(email)) {
      setFormData(p => ({ ...p, attendees: [...p.attendees, email] }));
    }
    setAttendeeInput("");
  };

  const pushToCalendar = async (event, target) => {
    setPushingId(`${event.id}-${target}`);
    const res = await base44.functions.invoke('pushCalendarEvent', { event_id: event.id, target });
    if (res.data?.success) queryClient.invalidateQueries(['company-calendar', companyId]);
    setPushingId(null);
  };

  const upcomingEvents = events.filter(e => e.status !== 'completed' && e.status !== 'cancelled');
  const pastEvents = events.filter(e => e.status === 'completed' || e.status === 'cancelled');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Track key GRC events — push directly to Outlook or Google Calendar.</p>
        <Button type="button" size="sm" onClick={openCreate} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400 text-sm">Loading events…</div>
      ) : upcomingEvents.length === 0 && pastEvents.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-xl">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No calendar events yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingEvents.map(ev => <EventRow key={ev.id} ev={ev} onEdit={openEdit} onDelete={id => deleteMutation.mutate(id)} onPush={pushToCalendar} pushingId={pushingId} />)}
          {pastEvents.length > 0 && (
            <>
              <p className="text-xs font-medium text-slate-400 pt-2 uppercase tracking-wide">Past / Cancelled</p>
              {pastEvents.map(ev => <EventRow key={ev.id} ev={ev} onEdit={openEdit} onDelete={id => deleteMutation.mutate(id)} onPush={pushToCalendar} pushingId={pushingId} />)}
            </>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "New Calendar Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Event Type</Label>
                <Select value={formData.event_type} onValueChange={v => setFormData(p => ({ ...p, event_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(et => <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start *</Label>
                <Input type="datetime-local" value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>End</Label>
                <Input type="datetime-local" value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Recurrence</Label>
              <Select value={formData.recurrence} onValueChange={v => setFormData(p => ({ ...p, recurrence: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No recurrence</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="Room / virtual link" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Attendees</Label>
              <div className="flex gap-2">
                <Input value={attendeeInput} onChange={e => setAttendeeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAttendee())} placeholder="email@example.com" type="email" />
                <Button type="button" variant="outline" size="sm" onClick={addAttendee}>Add</Button>
              </div>
              {formData.attendees.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.attendees.map(a => (
                    <span key={a} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs rounded-full px-2 py-0.5">
                      {a}
                      <button type="button" onClick={() => setFormData(p => ({ ...p, attendees: p.attendees.filter(x => x !== a) }))} className="text-slate-400 hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingEvent ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventRow({ ev, onEdit, onDelete, onPush, pushingId }) {
  const isPushingOutlook = pushingId === `${ev.id}-outlook`;
  const isPushingGoogle = pushingId === `${ev.id}-google`;

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50 transition-colors">
      <div className="mt-0.5">
        <CalendarCheck className="w-5 h-5 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-slate-900 truncate">{ev.title}</span>
          <EventTypeBadge type={ev.event_type} />
          {ev.recurrence && ev.recurrence !== 'none' && (
            <span className="text-xs text-slate-400 flex items-center gap-0.5"><RefreshCw className="w-3 h-3" />{ev.recurrence}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
          {ev.start_date && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(ev.start_date), 'dd MMM yyyy, HH:mm')}</span>
          )}
          {ev.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>
          )}
          {ev.attendees?.length > 0 && (
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ev.attendees.length} attendee{ev.attendees.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {/* Push to Outlook */}
        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => onPush(ev, 'outlook')}
          disabled={!!pushingId}
          className={`gap-1 text-xs px-2 ${ev.pushed_to_outlook ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
          title={ev.pushed_to_outlook ? "Pushed to Outlook" : "Push to Outlook"}
        >
          {isPushingOutlook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : ev.pushed_to_outlook ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Outlook</span>
        </Button>
        {/* Push to Google */}
        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => onPush(ev, 'google')}
          disabled={!!pushingId}
          className={`gap-1 text-xs px-2 ${ev.pushed_to_google ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
          title={ev.pushed_to_google ? "Pushed to Google Calendar" : "Push to Google Calendar"}
        >
          {isPushingGoogle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : ev.pushed_to_google ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Google</span>
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(ev)}><Edit2 className="w-3.5 h-3.5" /></Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(ev.id)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
      </div>
    </div>
  );
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { event_id, target } = await req.json(); // target: 'outlook' | 'google'

    const events = await base44.entities.CompanyCalendarEvent.filter({ id: event_id });
    const event = events[0];
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    const startDt = new Date(event.start_date);
    const endDt = event.end_date ? new Date(event.end_date) : new Date(startDt.getTime() + 60 * 60 * 1000);

    if (target === 'outlook') {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

      const body = {
        subject: event.title,
        body: { contentType: 'Text', content: event.description || '' },
        start: { dateTime: startDt.toISOString(), timeZone: 'UTC' },
        end: { dateTime: endDt.toISOString(), timeZone: 'UTC' },
        location: event.location ? { displayName: event.location } : undefined,
        attendees: (event.attendees || []).map(email => ({
          emailAddress: { address: email },
          type: 'required'
        })),
      };

      const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      if (!res.ok) return Response.json({ error: `Outlook error: ${text}` }, { status: 400 });
      const data = JSON.parse(text);

      await base44.entities.CompanyCalendarEvent.update(event_id, {
        pushed_to_outlook: true,
        outlook_event_id: data.id,
      });

      return Response.json({ success: true, provider: 'outlook', external_id: data.id });
    }

    if (target === 'google') {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

      const body = {
        summary: event.title,
        description: event.description || '',
        location: event.location || '',
        start: event.all_day
          ? { date: startDt.toISOString().split('T')[0] }
          : { dateTime: startDt.toISOString(), timeZone: 'UTC' },
        end: event.all_day
          ? { date: endDt.toISOString().split('T')[0] }
          : { dateTime: endDt.toISOString(), timeZone: 'UTC' },
        attendees: (event.attendees || []).map(email => ({ email })),
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      if (!res.ok) return Response.json({ error: `Google error: ${text}` }, { status: 400 });
      const data = JSON.parse(text);

      await base44.entities.CompanyCalendarEvent.update(event_id, {
        pushed_to_google: true,
        google_event_id: data.id,
      });

      return Response.json({ success: true, provider: 'google', external_id: data.id });
    }

    return Response.json({ error: 'Invalid target' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
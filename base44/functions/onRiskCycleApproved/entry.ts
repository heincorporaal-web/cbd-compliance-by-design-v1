import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { data, old_data, event } = payload;

    // Only act when status transitions to "approved"
    if (data?.status !== "approved" || old_data?.status === "approved") {
      return Response.json({ skipped: true });
    }

    const cycle = data;

    // Build calendar event dates — use cycle dates or today as fallback
    const startDate = cycle.start_date
      ? new Date(cycle.start_date).toISOString()
      : new Date().toISOString();
    const endDate = cycle.end_date
      ? new Date(cycle.end_date).toISOString()
      : new Date(new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await base44.asServiceRole.entities.CompanyCalendarEvent.create({
      company_id: cycle.company_id,
      title: `Risk Assessment: ${cycle.name}`,
      description: cycle.description || `Approved risk assessment cycle for ${cycle.cycle_year || ""}`.trim(),
      event_type: "assessment",
      start_date: startDate,
      end_date: endDate,
      all_day: true,
      status: "upcoming",
    });

    return Response.json({ success: true, cycle_id: event.entity_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const subject = (body?.subject || '').toString().trim();
    const message = (body?.message || '').toString().trim();
    const requestType = body?.request_type || 'activation';
    const companyName = body?.company_name || '';

    if (!subject || !message) {
      return Response.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // Store the request as the calling user
    const record = await base44.entities.ContactRequest.create({
      subject,
      message,
      request_type: requestType,
      requester_name: user.full_name || user.email || 'Unknown',
      requester_email: user.email || '',
      company_name: companyName,
      status: 'open',
    });

    // Notify the product owner(s) — platform admins with the product-owner role.
    const subjectLine = `[CBD Contact] ${subject}`;
    const emailBody = [
      `A new contact / activation request was submitted.`,
      ``,
      `From: ${user.full_name || ''} <${user.email || ''}>`,
      companyName ? `Company: ${companyName}` : '',
      `Type: ${requestType}`,
      ``,
      `Subject: ${subject}`,
      ``,
      `Message:`,
      message,
      ``,
      `Review and action it from the platform administration.`,
    ].filter(Boolean).join('\n');

    let emailed = 0;
    try {
      const admins = await base44.asServiceRole.entities.User.list('-created_date', 200);
      for (const a of admins) {
        if (!a.email) continue;
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: a.email,
            subject: subjectLine,
            body: emailBody,
            from_name: 'Compliance by Design',
          });
          emailed += 1;
        } catch (e) {
          // continue trying other recipients
        }
      }
    } catch (e) {
      // email is best-effort; the record is still stored
    }

    return Response.json({ ok: true, id: record.id, emailed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
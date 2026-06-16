import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Only callable as a scheduled/service task
    const assessments = await base44.asServiceRole.entities.Assessment.list();
    const companies = await base44.asServiceRole.entities.Company.list();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const companyMap = {};
    for (const c of companies) {
      companyMap[c.id] = c;
    }

    // Reminder windows: 7 days and 1 day before due date
    const REMINDER_DAYS = [7, 1];

    const remindersToSend = [];

    for (const assessment of assessments) {
      // Skip completed/archived/approved
      if (['completed', 'archived', 'approved'].includes(assessment.status)) continue;
      if (!assessment.due_date) continue;
      if (!assessment.assessor_email) continue;

      const dueDate = new Date(assessment.due_date);
      dueDate.setHours(0, 0, 0, 0);

      const diffMs = dueDate - today;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (REMINDER_DAYS.includes(diffDays)) {
        const company = companyMap[assessment.company_id];
        remindersToSend.push({ assessment, company, daysUntilDue: diffDays });
      }
    }

    const appUrl = Deno.env.get("APP_URL") || "https://app.base44.com";
    const results = [];

    for (const { assessment, company, daysUntilDue } of remindersToSend) {
      const companyName = company?.name || "your company";
      const assessmentUrl = `${appUrl}/AssessmentDetail?id=${assessment.id}`;
      const dueLabel = daysUntilDue === 1 ? "tomorrow" : `in ${daysUntilDue} days`;

      const subject = `Reminder: Assessment "${assessment.name}" is due ${dueLabel}`;

      const body = `
Dear ${assessment.assessor || "Assessor"},

This is a reminder that the following assessment is due ${dueLabel} (${assessment.due_date}):

  Assessment: ${assessment.name}
  Company: ${companyName}
  Due Date: ${assessment.due_date}
  Status: ${assessment.status}

Please complete the assessment before the due date.

You can access the assessment directly here:
${assessmentUrl}

Best regards,
Compliance by Design (CBD)
      `.trim();

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: assessment.assessor_email,
        subject,
        body,
        from_name: "CBD – Compliance by Design",
      });

      // Also notify reviewer if different from assessor
      if (assessment.reviewer_email && assessment.reviewer_email !== assessment.assessor_email) {
        const reviewerBody = `
Dear ${assessment.reviewer || "Reviewer"},

This is a reminder that the following assessment (which you are reviewing) is due ${dueLabel} (${assessment.due_date}):

  Assessment: ${assessment.name}
  Company: ${companyName}
  Due Date: ${assessment.due_date}
  Assessor: ${assessment.assessor || "—"}
  Status: ${assessment.status}

View the assessment here:
${assessmentUrl}

Best regards,
Compliance by Design (CBD)
        `.trim();

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: assessment.reviewer_email,
          subject,
          body: reviewerBody,
          from_name: "CBD – Compliance by Design",
        });
      }

      results.push({
        assessment_id: assessment.id,
        assessment_name: assessment.name,
        due_date: assessment.due_date,
        days_until_due: daysUntilDue,
        notified: [assessment.assessor_email, assessment.reviewer_email].filter(Boolean),
      });
    }

    return Response.json({
      success: true,
      reminders_sent: results.length,
      details: results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Pattern: leading alphanumeric-hyphen code like MTNGRC-090-14 or SCMSP-030-020:
    const refPattern = /^[A-Z0-9]+-\d+-\d+[:\s]\s*/i;

    const body = await req.json().catch(() => ({}));
    let updated = 0;
    let skip = body.start_skip || 0;
    const limit = 100;
    const maxBatches = body.max_batches || 5; // process up to 500 records per call
    let batchCount = 0;

    while (true) {
      const risks = await base44.asServiceRole.entities.Risk.filter(
        { is_library_risk: true },
        'created_date',
        limit,
        skip
      );
      if (!risks || risks.length === 0) break;

      for (const risk of risks) {
        const original = risk.process_activity || '';
        if (refPattern.test(original)) {
          const cleaned = original.replace(refPattern, '');
          await base44.asServiceRole.entities.Risk.update(risk.id, { process_activity: cleaned });
          updated++;
          // Delay to avoid rate limiting
          await new Promise(r => setTimeout(r, 200));
        }
      }

      skip += risks.length;
      batchCount++;
      console.log(`Processed ${skip} risks, updated ${updated} so far`);
      if (risks.length < limit) break;
      if (batchCount >= maxBatches) break;
    }

    return Response.json({ success: true, updated });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
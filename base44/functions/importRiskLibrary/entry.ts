import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as XLSX from 'npm:xlsx@0.18.5';

function mapLikelihood(val) {
  if (!val || val === 0) return 'medium';
  const n = parseInt(val);
  if (n === 1) return 'very_low';
  if (n === 2) return 'low';
  if (n === 3) return 'medium';
  if (n === 4) return 'high';
  if (n === 5) return 'very_high';
  const s = String(val).toLowerCase().trim().replace(/\s+/g, '_');
  const map = { very_low: 'very_low', low: 'low', medium: 'medium', high: 'high', very_high: 'very_high' };
  return map[s] || 'medium';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    // Fetch the Excel file as ArrayBuffer
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) return Response.json({ error: 'Failed to fetch file' }, { status: 400 });

    const arrayBuffer = await fileRes.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Parse with xlsx
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    console.log(`Parsed ${rows.length} rows. Sample keys:`, Object.keys(rows[0] || {}));

    // Map rows to Risk entity schema
    const risks = rows.map(row => ({
      title: String(row['RiskStatement'] || row['Process Activity'] || row['RiskReferenceNr'] || 'Untitled Risk').trim().substring(0, 500),
      description: String(row['RiskStatement'] || '').trim(),
      is_library_risk: true,
      company_id: '',
      status: 'identified',
      category: 'operational',
      likelihood: mapLikelihood(row['RiskLikelihood']),
      impact: mapLikelihood(row['RiskImpact']),
      inherent_risk_score: parseFloat(row['RiskInherentRating']) || 0,
      risk_reference_nr: String(row['RiskReferenceNr'] || '').trim(),
      risk_type: String(row['RiskType'] || '').trim(),
      racm_risk_type: String(row['RACMRiskType'] || '').trim(),
      risk_statement: String(row['RiskStatement'] || '').trim(),
      root_cause: String(row['RootCause'] || '').trim(),
      root_cause_type: String(row['RootcauseType'] || row['RootCauseCategory'] || '').trim(),
      value_chain: String(row['ValueChain'] || '').trim(),
      sub_process: String(row['Sub-Process'] || '').trim(),
      workstream: String(row['Workstream'] || '').trim(),
      ihpom_node_id: row['iHPOM_Node_ID'] ? String(row['iHPOM_Node_ID']).trim() : '',
      racm_l3: String(row['RACML3'] || '').trim(),
      process_activity: String(row['Process Activity'] || '').trim().replace(/^[A-Z0-9]+-\d+-\d+[:\s]\s*/i, ''),
      framework_reference: String(row['Framework'] || '').trim(),
    }));

    // Bulk insert in batches of 100
    const BATCH = 100;
    let created = 0;
    for (let i = 0; i < risks.length; i += BATCH) {
      const batch = risks.slice(i, i + BATCH);
      await base44.asServiceRole.entities.Risk.bulkCreate(batch);
      created += batch.length;
      console.log(`Inserted ${created}/${risks.length}`);
    }

    return Response.json({ success: true, imported: created, total: risks.length });
  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LIKELIHOOD_MAP = {
  1: 'very_low', 2: 'low', 3: 'medium', 4: 'high', 5: 'very_high',
  'very_low': 'very_low', 'low': 'low', 'medium': 'medium', 'high': 'high', 'very_high': 'very_high'
};

const IMPACT_MAP = LIKELIHOOD_MAP;

function mapLikelihood(val) {
  if (!val) return 'medium';
  const n = parseInt(val);
  if (!isNaN(n) && LIKELIHOOD_MAP[n]) return LIKELIHOOD_MAP[n];
  const s = String(val).toLowerCase().replace(/\s/g, '_');
  return LIKELIHOOD_MAP[s] || 'medium';
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

    // Fetch the Excel file
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) return Response.json({ error: 'Failed to fetch file' }, { status: 400 });

    // Use Base44 ExtractDataFromUploadedFile integration
    const extracted = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                RiskID: { type: 'string' },
                ValueChain: { type: 'string' },
                'Sub-Process': { type: 'string' },
                Workstream: { type: 'string' },
                iHPOM_Node_ID: { type: 'string' },
                RACML3: { type: 'string' },
                'Process Activity': { type: 'string' },
                RiskReferenceNr: { type: 'string' },
                RiskType: { type: 'string' },
                RACMRiskType: { type: 'string' },
                RiskStatement: { type: 'string' },
                RootCause: { type: 'string' },
                RiskImpact: { type: 'string' },
                RootCauseCategory: { type: 'string' },
                RootcauseType: { type: 'string' },
                RiskLikelihood: { type: 'string' },
                RiskInherentRating: { type: 'string' },
                Framework: { type: 'string' },
              }
            }
          }
        }
      }
    });

    if (extracted.status !== 'success' || !extracted.output) {
      return Response.json({ error: 'Extraction failed', details: extracted.details }, { status: 500 });
    }

    const rows = Array.isArray(extracted.output) ? extracted.output : extracted.output.rows || [];

    // Map rows to Risk entity schema
    const risks = rows.map(row => ({
      title: row['RiskStatement'] || row['Process Activity'] || `Risk ${row['RiskID']}`,
      description: row['RiskStatement'] || '',
      is_library_risk: true,
      company_id: '',
      status: 'identified',
      category: 'operational',
      likelihood: mapLikelihood(row['RiskLikelihood']),
      impact: mapLikelihood(row['RiskImpact']),
      inherent_risk_score: parseInt(row['RiskInherentRating']) || 0,
      risk_reference_nr: row['RiskReferenceNr'] || '',
      risk_type: row['RiskType'] || '',
      racm_risk_type: row['RACMRiskType'] || '',
      risk_statement: row['RiskStatement'] || '',
      root_cause: row['RootCause'] || '',
      root_cause_type: row['RootcauseType'] || row['RootCauseCategory'] || '',
      value_chain: row['ValueChain'] || '',
      sub_process: row['Sub-Process'] || '',
      workstream: row['Workstream'] || '',
      ihpom_node_id: row['iHPOM_Node_ID'] ? String(row['iHPOM_Node_ID']) : '',
      racm_l3: row['RACML3'] || '',
      process_activity: row['Process Activity'] || '',
      framework_reference: row['Framework'] || '',
    }));

    // Bulk insert in batches of 100
    const BATCH = 100;
    let created = 0;
    for (let i = 0; i < risks.length; i += BATCH) {
      const batch = risks.slice(i, i + BATCH);
      await base44.asServiceRole.entities.Risk.bulkCreate(batch);
      created += batch.length;
    }

    return Response.json({ success: true, imported: created, total: risks.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
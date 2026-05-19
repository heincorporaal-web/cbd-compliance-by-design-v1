import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as XLSX from 'npm:xlsx@0.18.5';

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

    // Get master frameworks to map RiskID to framework_id
    const frameworks = await base44.asServiceRole.entities.Framework.filter({ is_master: true });
    const frameworkMap = new Map();
    frameworks.forEach(fw => {
      // Map by framework code or name
      if (fw.framework_code) frameworkMap.set(fw.framework_code.toLowerCase(), fw.id);
      frameworkMap.set(fw.name.toLowerCase(), fw.id);
    });

    // Map rows to Control entity schema
    const controls = rows.map(row => {
      const controlRef = String(row['ControlRef'] || '').trim();
      // Extract framework code from ControlRef (e.g., CTCM.FINMC.1.01 -> CTCM)
      const frameworkCode = controlRef.split('.')[0]?.toLowerCase();
      const framework_id = frameworkMap.get(frameworkCode) || '';

      return {
        framework_id: framework_id,
        control_id: String(row['ControlRef'] || '').trim(),
        title: String(row['ControlDesc'] || 'Untitled Control').trim().substring(0, 500),
        description: String(row['ControlDesc'] || '').trim(),
        is_library_control: true,
        global: Boolean(row['Global']),
        control_ccm: Boolean(row['ControlCCM']),
        self_assessment: Boolean(row['SelfAssessment']),
        control_criticality: String(row['ControlCriticality'] || 'Should Have').trim(),
        control_owner: String(row['ControlOwner'] || '').trim(),
        key_control: Boolean(row['KeyControl']),
        control_execution_type: String(row['ControlExecutionType'] || 'Manual').trim(),
        control_type: String(row['ControlType'] || 'Preventive').trim(),
        finance_control_consideration: Boolean(row['FinanceControlConsideration']),
        control_frequency: String(row['ControlFrequency'] || 'Monthly').trim(),
        compensating_control: Boolean(row['CompensatingControl']),
        compensating_control_risk: String(row['CompensatingControlRisk'] || '').trim(),
        control_narrative_url: String(row['ControlNarrativeURL'] || '').trim(),
        upload_document: String(row['Upload Document'] || '0').trim(),
        control_objective_id: row['ControlObjectiveID'] ? String(row['ControlObjectiveID']).trim() : '',
        process_phase: String(row['ProcessPhase'] || 'Process - Input').trim(),
        risk_id: row['RiskID'] ? String(row['RiskID']).trim() : '',
        status: 'active',
      };
    });

    // Bulk insert in batches of 100
    const BATCH = 100;
    let created = 0;
    for (let i = 0; i < controls.length; i += BATCH) {
      const batch = controls.slice(i, i + BATCH);
      await base44.asServiceRole.entities.Control.bulkCreate(batch);
      created += batch.length;
      console.log(`Inserted ${created}/${controls.length}`);
    }

    return Response.json({ success: true, imported: created, total: controls.length });
  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
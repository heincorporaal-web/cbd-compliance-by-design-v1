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

    // Get master frameworks to map framework code to framework_id
    const frameworks = await base44.asServiceRole.entities.Framework.filter({ is_master: true });
    const frameworkMap = new Map();
    frameworks.forEach(fw => {
      const code = (fw.framework_code || '').toLowerCase().trim();
      const name = (fw.name || '').toLowerCase().trim();
      if (code) frameworkMap.set(code, fw.id);
      if (name) frameworkMap.set(name, fw.id);
      // Also map common abbreviations
      if (code === 'ctcm') frameworkMap.set('ctcm', fw.id);
      if (code === 'ifrs icfr') frameworkMap.set('ifrs icfr', fw.id);
    });

    console.log('Sample row data:', rows[0]);

    // Map rows to Control entity schema
    const controls = rows.map((row, idx) => {
      const controlRef = (row['ControlRef'] || '').toString().trim();
      const controlDesc = (row['ControlDesc'] || '').toString().trim();
      
      // Extract framework code from ControlRef (e.g., CTCM.FINMC.1.01 -> CTCM)
      const frameworkCode = controlRef.split('.')[0]?.toLowerCase().trim();
      let framework_id = frameworkMap.get(frameworkCode) || '';
      
      // Fallback: try to find by partial match
      if (!framework_id) {
        for (const [key, value] of frameworkMap.entries()) {
          if (key.includes(frameworkCode) || frameworkCode.includes(key)) {
            framework_id = value;
            break;
          }
        }
      }

      return {
        framework_id: framework_id,
        control_id: controlRef,
        title: controlDesc.substring(0, 500),
        description: controlDesc,
        is_library_control: true,
        global: row['Global'] === true || row['Global'] === 'true' || row['Global'] === 1,
        control_ccm: row['ControlCCM'] === true || row['ControlCCM'] === 'true' || row['ControlCCM'] === 1,
        self_assessment: row['SelfAssessment'] === true || row['SelfAssessment'] === 'true' || row['SelfAssessment'] === 1,
        control_criticality: (row['ControlCriticality'] || 'Should Have').toString().trim(),
        control_owner: (row['ControlOwner'] || '').toString().trim(),
        key_control: row['KeyControl'] === true || row['KeyControl'] === 'true' || row['KeyControl'] === 1,
        control_execution_type: (row['ControlExecutionType'] || 'Manual').toString().trim(),
        control_type: (row['ControlType'] || 'Preventive').toString().trim(),
        finance_control_consideration: row['FinanceControlConsideration'] === true || row['FinanceControlConsideration'] === 'true' || row['FinanceControlConsideration'] === 1,
        control_frequency: (row['ControlFrequency'] || 'Monthly').toString().trim(),
        compensating_control: row['CompensatingControl'] === true || row['CompensatingControl'] === 'true' || row['CompensatingControl'] === 1,
        compensating_control_risk: (row['CompensatingControlRisk'] || '').toString().trim(),
        control_narrative_url: (row['ControlNarrativeURL'] || '').toString().trim(),
        upload_document: (row['Upload Document'] || '0').toString().trim(),
        control_objective_id: row['ControlObjectiveID'] ? String(row['ControlObjectiveID']).trim() : '',
        process_phase: (row['ProcessPhase'] || 'Process - Input').toString().trim(),
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
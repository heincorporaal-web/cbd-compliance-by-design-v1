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
    const controls = rows.map(row => {
      const controlRef = String(row['ControlRef'] || row['controlRef'] || '').trim();
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
        title: String(row['ControlDesc'] || row['controlDesc'] || 'Untitled Control').trim().substring(0, 500),
        description: String(row['ControlDesc'] || row['controlDesc'] || '').trim(),
        is_library_control: true,
        global: Boolean(row['Global']) || Boolean(row['global']),
        control_ccm: Boolean(row['ControlCCM']) || Boolean(row['controlCCM']),
        self_assessment: Boolean(row['SelfAssessment']) || Boolean(row['selfAssessment']),
        control_criticality: String(row['ControlCriticality'] || row['controlCriticality'] || 'Should Have').trim(),
        control_owner: String(row['ControlOwner'] || row['controlOwner'] || '').trim(),
        key_control: Boolean(row['KeyControl']) || Boolean(row['keyControl']),
        control_execution_type: String(row['ControlExecutionType'] || row['controlExecutionType'] || 'Manual').trim(),
        control_type: String(row['ControlType'] || row['controlType'] || 'Preventive').trim(),
        finance_control_consideration: Boolean(row['FinanceControlConsideration']) || Boolean(row['financeControlConsideration']),
        control_frequency: String(row['ControlFrequency'] || row['controlFrequency'] || 'Monthly').trim(),
        compensating_control: Boolean(row['CompensatingControl']) || Boolean(row['compensatingControl']),
        compensating_control_risk: String(row['CompensatingControlRisk'] || row['compensatingControlRisk'] || '').trim(),
        control_narrative_url: String(row['ControlNarrativeURL'] || row['controlNarrativeURL'] || '').trim(),
        upload_document: String(row['Upload Document'] || row['uploadDocument'] || '0').trim(),
        control_objective_id: (row['ControlObjectiveID'] || row['controlObjectiveID']) ? String(row['ControlObjectiveID'] || row['controlObjectiveID']).trim() : '',
        process_phase: String(row['ProcessPhase'] || row['processPhase'] || 'Process - Input').trim(),
        risk_id: (row['RiskID'] || row['riskID']) ? String(row['RiskID'] || row['riskID']).trim() : '',
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
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CRITICALITY_MAP = { critical: 'critical', important: 'high', supporting: 'medium' };

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const companyId = body.company_id;
    if (!companyId) return Response.json({ error: 'company_id is required' }, { status: 400 });

    // Check ABD enablement
    const prefs = await base44.asServiceRole.entities.CompanyPreference.filter({ company_id: companyId });
    const abdEnabled = prefs[0]?.enable_assets_by_design === true;

    // Read all ICT Systems for the company (CBD authoritative source)
    const ictSystems = await base44.asServiceRole.entities.ICTSystem.filter({ company_id: companyId });

    // Read existing CBD Application References
    const existingApps = await base44.asServiceRole.entities.CBDApplicationReference.filter({ company_id: companyId });
    const appByCbdId = Object.fromEntries(existingApps.map(a => [a.cbd_application_id, a]));

    let created = 0;
    let updated = 0;
    const now = new Date().toISOString();

    for (const ict of ictSystems) {
      const cbdId = ict.id;
      const appData = {
        cbd_application_id: cbdId,
        application_name: ict.name,
        application_description: ict.description || '',
        application_type: ict.system_type === 'custom' ? (ict.system_type_custom || 'custom') : ict.system_type,
        business_criticality: CRITICALITY_MAP[ict.criticality] || 'medium',
        hosting_type: ict.hosting_type || '',
        lifecycle_status: ict.status || 'active',
        is_active: ict.status !== 'decommissioned',
        last_refreshed: now,
      };

      const existing = appByCbdId[cbdId];
      if (existing) {
        await base44.asServiceRole.entities.CBDApplicationReference.update(existing.id, appData);
        updated++;
      } else {
        await base44.asServiceRole.entities.CBDApplicationReference.create({ ...appData, company_id: companyId });
        created++;
      }
    }

    // Mark disappeared ICT Systems (no longer in CBD) as inactive in CMDB
    const ictIds = new Set(ictSystems.map(s => s.id));
    let deactivated = 0;
    for (const app of existingApps) {
      if (!ictIds.has(app.cbd_application_id) && app.is_active) {
        await base44.asServiceRole.entities.CBDApplicationReference.update(app.id, { is_active: false });
        deactivated++;
      }
    }

    // Write-back: for each ICT System that has linked CIs, set status to "discovered"
    // ONLY if ABD is enabled for the company
    let discoveredCount = 0;
    let writeBackSkipped = false;

    if (abdEnabled) {
      const appRels = await base44.asServiceRole.entities.ApplicationCIRelationship.filter({ company_id: companyId });
      const appsWithCIs = new Set(appRels.map(r => r.cbd_application_reference_id));

      const refreshedApps = await base44.asServiceRole.entities.CBDApplicationReference.filter({ company_id: companyId });
      const ictById = Object.fromEntries(ictSystems.map(s => [s.id, s]));

      for (const app of refreshedApps) {
        if (appsWithCIs.has(app.id)) {
          const ict = ictById[app.cbd_application_id];
          if (ict && ict.status !== 'discovered' && ict.status !== 'decommissioned') {
            await base44.asServiceRole.entities.ICTSystem.update(ict.id, { status: 'discovered' });
            discoveredCount++;
          }
        }
      }
    } else {
      writeBackSkipped = true;
    }

    return Response.json({
      ok: true,
      total_ict_systems: ictSystems.length,
      created,
      updated,
      deactivated,
      discovered_writebacks: discoveredCount,
      write_back_skipped: writeBackSkipped,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    frameworks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          framework_code: { type: "string" },
          version: { type: "string" },
          category: { type: "string" },
          description: { type: "string" },
          pillars: {
            type: "array",
            items: {
              type: "object",
              properties: {
                pillar_ref: { type: "string" },
                pillar_name: { type: "string" },
                pillar_desc: { type: "string" }
              }
            }
          },
          nodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                node_code: { type: "string" },
                node_title: { type: "string" },
                node_text: { type: "string" },
                node_type_name: { type: "string" },
                parent_node_code: { type: "string" },
                level_no: { type: "number" },
                sort_order: { type: "number" },
                is_mandatory: { type: "boolean" },
                external_ref: { type: "string" },
                guidance_text: { type: "string" },
                key_aspects: { type: "string" }
              }
            }
          }
        }
      }
    }
  }
};

const TODAY = new Date().toISOString().slice(0, 10);

async function buildNodes(base44, frameworkId, frameworkName, nodes, retainedCodeToId = {}) {
  const sorted = [...nodes].sort((a, b) => (a.level_no ?? 99) - (b.level_no ?? 99));
  const created = await base44.asServiceRole.entities.FrameworkNode.bulkCreate(
    sorted.map(n => ({
      framework_id: frameworkId,
      node_code: n.node_code || "",
      node_title: n.node_title || "Untitled",
      node_text: n.node_text || "",
      node_type_name: n.node_type_name || "",
      level_no: n.level_no ?? null,
      sort_order: n.sort_order ?? 0,
      is_mandatory: !!n.is_mandatory,
      external_ref: n.external_ref || "",
      guidance_text: n.guidance_text || "",
      key_aspects: n.key_aspects || "",
      status: "active"
    }))
  );
  const codeToId = { ...retainedCodeToId };
  created.forEach(n => { if (n.node_code) codeToId[n.node_code] = n.id; });
  const parentCodes = new Set(sorted.map(n => n.parent_node_code).filter(Boolean));
  const merged = {};
  for (let i = 0; i < sorted.length; i++) {
    const src = sorted[i];
    const dbNode = created[i];
    const parentId = src.parent_node_code ? codeToId[src.parent_node_code] : null;
    const isLeaf = !parentCodes.has(src.node_code);
    const updates = {};
    if (parentId) updates.parent_id = parentId;
    if (isLeaf) updates.is_leaf = true;
    if (Object.keys(updates).length) merged[dbNode.id] = { id: dbNode.id, ...updates };
  }
  const updateArr = Object.values(merged);
  if (updateArr.length) await base44.asServiceRole.entities.FrameworkNode.bulkUpdate(updateArr);
  return created.length;
}

async function buildPillars(base44, frameworkId, frameworkName, pillars) {
  if (!pillars || !pillars.length) return 0;
  await base44.asServiceRole.entities.FrameworkPillar.bulkCreate(
    pillars.map(p => ({
      pillar_ref: p.pillar_ref || "",
      pillar_name: p.pillar_name || "",
      pillar_desc: p.pillar_desc || "",
      framework_id: frameworkId,
      framework_name: frameworkName
    }))
  );
  return pillars.length;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const roles = await base44.asServiceRole.entities.UserRole.list('-created_date', 2000);
    const myRole = roles.find(r => r.id === user.custom_role_id);
    const isMaintainer = user.role === 'admin' || !!myRole?.is_product_owner;
    if (!isMaintainer) return Response.json({ error: 'Only Product Owners and admins may upload to the master library' }, { status: 403 });

    const body = await req.json();
    const { file_url, mode, target_framework_id } = body;
    if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });
    if (!['replace', 'update', 'new'].includes(mode)) return Response.json({ error: 'mode must be replace, update or new' }, { status: 400 });

    const extract = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: EXTRACTION_SCHEMA
    });
    if (extract.status !== 'success' || !extract.output) {
      return Response.json({ error: 'Could not extract data from file', details: extract.details || 'No output' }, { status: 422 });
    }
    const data = extract.output;
    const frameworksIn = data.frameworks || (Array.isArray(data) ? data : [data]);
    if (!frameworksIn.length) return Response.json({ error: 'No frameworks found in the uploaded file' }, { status: 422 });

    const result = { mode, frameworks: [], nodesCreated: 0, pillarsCreated: 0, nodesRetired: 0 };

    for (const fwData of frameworksIn) {
      const fwName = fwData.name || body.framework_name;
      if (!fwName) { result.frameworks.push({ name: '(unnamed)', error: 'Framework name missing' }); continue; }

      if (mode === 'new') {
        const created = await base44.asServiceRole.entities.Framework.create({
          name: fwName,
          framework_code: fwData.framework_code || body.framework_code || "",
          version: fwData.version || body.version || "",
          category: fwData.category || body.category || "other",
          description: fwData.description || body.description || "",
          is_master: true,
          status: "active"
        });
        const p = await buildPillars(base44, created.id, fwName, fwData.pillars);
        const n = await buildNodes(base44, created.id, fwName, fwData.nodes || []);
        result.frameworks.push({ id: created.id, name: fwName, created: true });
        result.pillarsCreated += p; result.nodesCreated += n;
      }

      if (mode === 'replace') {
        const targetId = target_framework_id;
        if (!targetId) { result.frameworks.push({ name: fwName, error: 'target framework required for replace' }); continue; }
        await base44.asServiceRole.entities.FrameworkNode.deleteMany({ framework_id: targetId });
        await base44.asServiceRole.entities.FrameworkPillar.deleteMany({ framework_id: targetId });
        await base44.asServiceRole.entities.Framework.update(targetId, {
          name: fwName,
          framework_code: fwData.framework_code || "",
          version: fwData.version || "",
          category: fwData.category || "other",
          description: fwData.description || ""
        });
        const p = await buildPillars(base44, targetId, fwName, fwData.pillars);
        const n = await buildNodes(base44, targetId, fwName, fwData.nodes || []);
        result.frameworks.push({ id: targetId, name: fwName, replaced: true });
        result.pillarsCreated += p; result.nodesCreated += n;
      }

      if (mode === 'update') {
        const targetId = target_framework_id;
        if (!targetId) { result.frameworks.push({ name: fwName, error: 'target framework required for update' }); continue; }
        const incomingCodes = new Set((fwData.nodes || []).map(n => n.node_code).filter(Boolean));
        const existing = await base44.asServiceRole.entities.FrameworkNode.filter({ framework_id: targetId, status: "active" });
        const toRetire = existing.filter(n => incomingCodes.has(n.node_code));
        if (toRetire.length) {
          await base44.asServiceRole.entities.FrameworkNode.bulkUpdate(
            toRetire.map(n => ({ id: n.id, status: "retired", retired_date: TODAY }))
          );
          result.nodesRetired += toRetire.length;
        }
        // retained active nodes (codes not in the upload) still available for parent resolution
        const retained = existing.filter(n => !incomingCodes.has(n.node_code));
        const retainedCodeToId = {};
        retained.forEach(n => { if (n.node_code) retainedCodeToId[n.node_code] = n.id; });
        const n = await buildNodes(base44, targetId, fwName, fwData.nodes || [], retainedCodeToId);
        // upsert pillars (add new ones)
        const existingPillarRefs = new Set((await base44.asServiceRole.entities.FrameworkPillar.filter({ framework_id: targetId })).map(p => p.pillar_ref));
        const newPillars = (fwData.pillars || []).filter(p => p.pillar_ref && !existingPillarRefs.has(p.pillar_ref));
        const p = await buildPillars(base44, targetId, fwName, newPillars);
        result.frameworks.push({ id: targetId, name: fwName, updated: true, retired: toRetire.length });
        result.pillarsCreated += p; result.nodesCreated += n;
      }
    }

    return Response.json({ status: 'success', ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
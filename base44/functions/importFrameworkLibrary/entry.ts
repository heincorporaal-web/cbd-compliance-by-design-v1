import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const FILE_NODE_TYPE = "https://media.base44.com/files/public/6975dcbcbc9efd8b47128ae3/100478999_tlkpFrameworkNodeType.xlsx";
const FILE_PILLAR = "https://media.base44.com/files/public/6975dcbcbc9efd8b47128ae3/60ea46e7d_tblPillar.xlsx";
const FILE_NODE = "https://media.base44.com/files/public/6975dcbcbc9efd8b47128ae3/0a8c2c4da_tblFrameworkNode.xlsx";

// Legacy FRAMEWORKID (from tblFrameworkNode) -> master Framework name (from tblPillar)
const FW_MAP = { 9: "COBIT", 10: "ISO27001", 12: "DORA", 14: "NIST" };

function buildNode(n, fwIdByLegacy, ntNameById, parentId) {
  return {
    framework_id: fwIdByLegacy[n.FRAMEWORKID] || null,
    parent_id: parentId || null,
    legacy_node_id: n.FrameworkNodeID,
    legacy_parent_node_id: (n.ParentFrameworkNodeID ?? null),
    legacy_node_type_id: (n.NodeTypeID ?? null),
    node_type_name: (ntNameById[n.NodeTypeID]?.node_type_name) || null,
    node_code: n.NodeCode || "",
    node_title: n.NodeTitle || "",
    node_text: n.NodeText || "",
    guidance_text: n.GuidanceText || "",
    sort_order: (n.SortOrder ?? 0),
    level_no: (n.LevelNo ?? null),
    is_leaf: !!n.IsLeaf,
    is_mandatory: !!n.IsMandatory,
    is_checklist_parent: !!n.IsChecklistParent,
    reference_url: n.ReferenceURL || "",
    external_ref: n.ExternalRef || "",
    status: ((n.Status || "active") || "active").toLowerCase(),
    effective_date: n.EffectiveDate || null,
    retired_date: n.RetiredDate || null,
    key_aspects: n.KeyAspects || "",
    implementation_guidance: n.ImplementationGuidance || "",
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const Core = base44.asServiceRole.integrations.Core;

    const nodeTypeSchema = { type:"object", properties: { NodeTypeID:{type:"number"}, NodeTypeName:{type:"string"}, NodeTypeDescription:{type:"string"}, SortOrder:{type:"number"}, IsLeafDefault:{type:"boolean"} } };
    const pillarSchema = { type:"object", properties: { PillarID:{type:"number"}, PillarRef:{type:"string"}, PillarName:{type:"string"}, PillarDesc:{type:"string"}, Framework:{type:"string"} } };
    const nodeSchema = { type:"object", properties: { FrameworkNodeID:{type:"number"}, FRAMEWORKID:{type:"number"}, ParentFrameworkNodeID:{type:"number"}, NodeTypeID:{type:"number"}, NodeCode:{type:"string"}, NodeTitle:{type:"string"}, NodeText:{type:"string"}, GuidanceText:{type:"string"}, SortOrder:{type:"number"}, LevelNo:{type:"number"}, IsLeaf:{type:"boolean"}, IsMandatory:{type:"boolean"}, IsChecklistParent:{type:"boolean"}, ReferenceURL:{type:"string"}, ExternalRef:{type:"string"}, Status:{type:"string"}, EffectiveDate:{type:"string"}, RetiredDate:{type:"string"}, KeyAspects:{type:"string"}, ImplementationGuidance:{type:"string"} } };

    const toArr = (r) => Array.isArray(r.output) ? r.output : (r.output && Array.isArray(r.output.items) ? r.output.items : []);

    const [ntR, plR, ndR] = await Promise.all([
      Core.ExtractDataFromUploadedFile({ file_url: FILE_NODE_TYPE, json_schema: nodeTypeSchema }),
      Core.ExtractDataFromUploadedFile({ file_url: FILE_PILLAR, json_schema: pillarSchema }),
      Core.ExtractDataFromUploadedFile({ file_url: FILE_NODE, json_schema: nodeSchema }),
    ]);

    const nodeTypes = toArr(ntR);
    const pillars = toArr(plR);
    const nodes = toArr(ndR);

    // 1. Node types (idempotent)
    const existingNT = await base44.asServiceRole.entities.FrameworkNodeType.list('-created_date', 2000);
    const existingNTIds = new Set(existingNT.map(x => x.legacy_node_type_id));
    const newNT = nodeTypes.filter(n => n.NodeTypeID != null && !existingNTIds.has(n.NodeTypeID));
    if (newNT.length) await base44.asServiceRole.entities.FrameworkNodeType.bulkCreate(newNT.map(n => ({
      legacy_node_type_id: n.NodeTypeID,
      node_type_name: n.NodeTypeName,
      node_type_description: n.NodeTypeDescription,
      sort_order: (n.SortOrder ?? 0),
      is_leaf_default: !!n.IsLeafDefault,
    })));
    const allNT = newNT.length ? await base44.asServiceRole.entities.FrameworkNodeType.list('-created_date', 2000) : existingNT;
    const ntNameById = {};
    allNT.forEach(x => { if (x.legacy_node_type_id != null) ntNameById[x.legacy_node_type_id] = x; });

    // 2. Master frameworks from pillar names (+ FW_MAP for node frameworks)
    const existingFw = await base44.asServiceRole.entities.Framework.list('-created_date', 2000);
    const fwByName = {};
    existingFw.forEach(f => { if (f.is_master && f.name) fwByName[f.name] = f; });

    const allFwNames = [...new Set([...pillars.map(p => p.Framework).filter(Boolean), ...Object.values(FW_MAP)])];
    for (const name of allFwNames) {
      if (!fwByName[name]) {
        const created = await base44.asServiceRole.entities.Framework.create({
          name, is_master: true, status: "active", category: "compliance",
          framework_code: name, description: `Master library framework: ${name}`,
        });
        fwByName[name] = created;
      }
    }
    // stamp legacy_framework_id where mapped
    const fwIdByLegacy = {};
    for (const [lid, name] of Object.entries(FW_MAP)) {
      const f = fwByName[name];
      if (!f) continue;
      fwIdByLegacy[Number(lid)] = f.id;
      if (f.legacy_framework_id !== Number(lid)) {
        await base44.asServiceRole.entities.Framework.update(f.id, { legacy_framework_id: Number(lid) });
      }
    }

    // 3. Pillars (idempotent)
    const existingP = await base44.asServiceRole.entities.FrameworkPillar.list('-created_date', 2000);
    const existingPLeg = new Set(existingP.map(x => x.legacy_pillar_id));
    const newP = pillars.filter(p => p.PillarID != null && !existingPLeg.has(p.PillarID));
    if (newP.length) await base44.asServiceRole.entities.FrameworkPillar.bulkCreate(newP.map(p => ({
      pillar_ref: p.PillarRef || "",
      pillar_name: p.PillarName || "",
      pillar_desc: p.PillarDesc || "",
      framework_id: (fwByName[p.Framework] && fwByName[p.Framework].id) || null,
      framework_name: p.Framework || "",
      legacy_pillar_id: p.PillarID,
    })));

    // 4. Nodes (idempotent, parent-resolving)
    const existingNodes = await base44.asServiceRole.entities.FrameworkNode.list('-created_date', 2000);
    const existingLeg = new Set(existingNodes.map(x => x.legacy_node_id));
    const legToId = {};
    existingNodes.forEach(x => { if (x.legacy_node_id != null) legToId[x.legacy_node_id] = x.id; });

    const toCreate = nodes.filter(n => n.FrameworkNodeID != null && !existingLeg.has(n.FrameworkNodeID));
    toCreate.sort((a, b) => (a.LevelNo ?? 0) - (b.LevelNo ?? 0));

    let created = 0;
    const orphan = [];
    for (const n of toCreate) {
      const parentLegacy = n.ParentFrameworkNodeID;
      const parentId = (parentLegacy != null && parentLegacy !== "") ? legToId[parentLegacy] : null;
      if (parentLegacy != null && parentLegacy !== "" && !parentId) { orphan.push(n); continue; }
      const rec = buildNode(n, fwIdByLegacy, ntNameById, parentId);
      const createdNode = await base44.asServiceRole.entities.FrameworkNode.create(rec);
      legToId[n.FrameworkNodeID] = createdNode.id;
      created++;
      await new Promise(r => setTimeout(r, 80));
    }
    // second pass: orphans whose parent wasn't in the dataset
    for (const n of orphan) {
      const rec = buildNode(n, fwIdByLegacy, ntNameById, null);
      const createdNode = await base44.asServiceRole.entities.FrameworkNode.create(rec);
      legToId[n.FrameworkNodeID] = createdNode.id;
      created++;
      await new Promise(r => setTimeout(r, 80));
    }

    return Response.json({
      status: "success",
      nodeTypes: newNT.length,
      frameworks: allFwNames.length,
      pillars: newP.length,
      nodes: created,
      totalNodes: (existingNodes.length + created),
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});
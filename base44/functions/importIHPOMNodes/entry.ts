import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as XLSX from 'npm:xlsx@0.18.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const fileUrl = body.file_url;
    if (!fileUrl) return Response.json({ error: 'file_url is required' }, { status: 400 });

    // Fetch and parse the XLSX
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Sort by level (parents first), then by SortKey
    rows.sort((a, b) => {
      if (a.LevelNum !== b.LevelNum) return a.LevelNum - b.LevelNum;
      return String(a.SortKey || '').localeCompare(String(b.SortKey || ''));
    });

    // Build NodeID -> RefCode map for parent lookups later
    const nodeIdToRefCode = {};
    for (const row of rows) {
      nodeIdToRefCode[String(row.NodeID)] = String(row.RefCode || '');
    }

    // Phase 1: Create all records (without parent_id) in batches of 400
    const batchSize = 400;
    let totalCreated = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const records = batch.map(row => ({
        node_code: String(row.RefCode || ''),
        name: String(row.Title || ''),
        description: String(row.Description || ''),
        level: Number(row.LevelNum),
        symbol: String(row.Symbol || ''),
        alias: String(row.Alias || ''),
        sort_order: Number(row.SortKey || 0),
        status: 'active',
        criticality: 'medium'
      }));
      await base44.asServiceRole.entities.IHPOMNode.bulkCreate(records);
      totalCreated += records.length;
    }

    // Phase 2: List all created records and build RefCode -> Base44 ID map
    const allNodes = await base44.asServiceRole.entities.IHPOMNode.list('-created_date', 2000);
    const refCodeToId = {};
    for (const node of allNodes) {
      if (node.node_code) refCodeToId[node.node_code] = node.id;
    }

    // Phase 3: Build parent_id updates using source ParentNodeID -> parent RefCode -> parent Base44 ID
    const updates = [];
    for (const row of rows) {
      if (row.ParentNodeID != null) {
        const parentRefCode = nodeIdToRefCode[String(row.ParentNodeID)];
        const childId = refCodeToId[String(row.RefCode)];
        if (parentRefCode && childId && refCodeToId[parentRefCode]) {
          updates.push({ id: childId, parent_id: refCodeToId[parentRefCode] });
        }
      }
    }

    // Phase 4: Bulk update parent_id
    let totalUpdated = 0;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      await base44.asServiceRole.entities.IHPOMNode.bulkUpdate(batch);
      totalUpdated += batch.length;
    }

    return Response.json({
      success: true,
      totalRows: rows.length,
      totalCreated,
      totalUpdated,
      nodesInDb: allNodes.length
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});
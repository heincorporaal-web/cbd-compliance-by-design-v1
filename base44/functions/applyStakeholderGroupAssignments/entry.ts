import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // --- 1. Parse the CSV payload ---
  const { csvText } = await req.json();

  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  // Skip header
  const rows = lines.slice(1);

  // Build map: employeeNumber -> Set of recommended group names
  const assignmentMap = {};
  for (const line of rows) {
    const parts = line.split(';');
    if (parts.length < 8) continue;
    const empNum = parts[0]?.trim();
    const groupName = parts[7]?.trim();
    if (!empNum || !groupName) continue;
    if (!assignmentMap[empNum]) assignmentMap[empNum] = new Set();
    assignmentMap[empNum].add(groupName);
  }

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  // --- 2. Load all stakeholders and groups (paginated, sequential) ---
  let allStakeholders = [];
  let skip = 0;
  while (true) {
    const page = await base44.asServiceRole.entities.Stakeholder.list(undefined, 100, skip);
    allStakeholders = allStakeholders.concat(page);
    if (page.length < 100) break;
    skip += 100;
    await delay(500);
  }

  await delay(500);
  const allGroups = await base44.asServiceRole.entities.StakeholderGroup.list(undefined, 200);

  // Build group name -> id map (case-insensitive)
  const groupByName = {};
  for (const g of allGroups) {
    groupByName[g.name.toLowerCase().trim()] = g.id;
  }

  // Build employee number -> stakeholder map
  const stakeholderByEmpNum = {};
  for (const s of allStakeholders) {
    if (s.employee_number) {
      stakeholderByEmpNum[s.employee_number.trim()] = s;
    }
  }

  // --- 3. Build update queue ---
  let updated = 0;
  let skippedNoStakeholder = 0;
  const skippedNoGroup = [];
  const notFound = [];
  const updateQueue = []; // { id, group_ids }

  for (const [empNum, groupNames] of Object.entries(assignmentMap)) {
    const stakeholder = stakeholderByEmpNum[empNum];
    if (!stakeholder) {
      notFound.push(empNum);
      skippedNoStakeholder++;
      continue;
    }

    const existingIds = new Set(stakeholder.group_ids || []);
    let changed = false;

    for (const gName of groupNames) {
      const gId = groupByName[gName.toLowerCase().trim()];
      if (!gId) {
        skippedNoGroup.push(gName);
        continue;
      }
      if (!existingIds.has(gId)) {
        existingIds.add(gId);
        changed = true;
      }
    }

    if (changed) {
      updateQueue.push({ id: stakeholder.id, group_ids: Array.from(existingIds) });
    }
  }

  // --- 4. Apply updates sequentially to avoid rate limits ---
  for (const item of updateQueue) {
    await base44.asServiceRole.entities.Stakeholder.update(item.id, { group_ids: item.group_ids });
    updated++;
    await delay(400);
  }

  return Response.json({
    success: true,
    updated,
    skippedNoStakeholder,
    notFound,
    unmatchedGroups: [...new Set(skippedNoGroup)],
    total: Object.keys(assignmentMap).length,
  });
});
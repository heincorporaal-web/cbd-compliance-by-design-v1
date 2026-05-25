import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Fields whose changes are classified as ownership changes
const OWNERSHIP_FIELDS = new Set([
  "owner_stakeholder_id", "owner", "control_owner", "owner_name",
  "reviewer_stakeholder_id", "reviewer", "approver",
  "process_owner_stakeholder_id", "process_owner",
  "module_owner_stakeholder_id", "module_owner_name"
]);

// Fields whose changes are classified as end-dated events
const END_DATE_FIELDS = new Set(["end_date"]);

// Fields whose changes are classified as status changes
const STATUS_FIELDS = new Set(["status"]);

// Fields to always SKIP in diffs (noisy / internal)
const SKIP_FIELDS = new Set([
  "updated_date", "created_date", "created_by_id",
  "workflow_instance_id", "workflow_status_history", "lifecycle_history"
]);

// Human-readable entity name extractor
function getEntityName(data, entityType) {
  if (!data) return "Unknown";
  if (entityType === "Risk")      return data.title || data.risk_reference_nr || data.id;
  if (entityType === "Control")   return data.control_id ? `${data.control_id} — ${data.title}` : data.title;
  if (entityType === "ICTSystem") return data.name;
  if (entityType === "Framework") return data.name;
  return data.title || data.name || data.id || "Unknown";
}

// Compute diff: returns { before, after, changedFields }
function computeDiff(oldData, newData) {
  if (!oldData || !newData) return null;
  const before = {}, after = {}, changedFields = [];

  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  for (const key of allKeys) {
    if (SKIP_FIELDS.has(key)) continue;
    const oldVal = oldData[key];
    const newVal = newData[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      before[key] = oldVal;
      after[key] = newVal;
      changedFields.push(key);
    }
  }
  return changedFields.length > 0 ? { before, after, changed_fields: changedFields } : null;
}

// Determine semantic event_type from changed fields
function determineEventType(changedFields) {
  if (!changedFields || changedFields.length === 0) return "changed";
  if (changedFields.some(f => OWNERSHIP_FIELDS.has(f))) return "ownership_change";
  if (changedFields.some(f => END_DATE_FIELDS.has(f)))  return "end_dated";
  if (changedFields.some(f => STATUS_FIELDS.has(f)))    return "status_change";
  return "changed";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data, args = {} } = payload;
    const entityType = args.entity_type || event?.entity_name || "Unknown";

    let action, event_type, entityName, companyId, changes;

    if (event?.type === "create") {
      action     = "create";
      event_type = "created";
      entityName = getEntityName(data, entityType);
      companyId  = data?.company_id;
      changes    = null;
    } else if (event?.type === "delete") {
      action     = "delete";
      event_type = "deleted";
      entityName = getEntityName(old_data || data, entityType);
      companyId  = (old_data || data)?.company_id;
      changes    = null;
    } else if (event?.type === "update") {
      action     = "update";
      entityName = getEntityName(data, entityType);
      companyId  = data?.company_id;

      const diff = computeDiff(old_data, data);
      if (!diff) {
        // No meaningful changes, skip logging
        return Response.json({ skipped: true, reason: "no_meaningful_changes" });
      }
      event_type = determineEventType(diff.changed_fields);
      changes    = diff;
    } else {
      return Response.json({ error: "Unknown event type" }, { status: 400 });
    }

    // Special handling: Company entity — only log principle_risks or brand_colors changes
    if (entityType === "Company") {
      const interestingFields = ["principle_risks", "objectives", "brand_colors", "status", "end_date"];
      if (event?.type === "update") {
        const hasInteresting = changes?.changed_fields?.some(f => interestingFields.includes(f));
        if (!hasInteresting) {
          return Response.json({ skipped: true, reason: "no_interesting_company_change" });
        }
        // Override event_type for company principle_risks changes
        if (changes?.changed_fields?.includes("principle_risks")) {
          event_type = "changed";
        }
        companyId = data?.id || data?.company_id;
      } else {
        companyId = data?.id;
      }
    }

    await base44.asServiceRole.entities.AuditLog.create({
      action,
      event_type,
      entity_type: entityType,
      entity_id:   event?.entity_id || data?.id,
      entity_name: entityName,
      company_id:  companyId,
      user_email:  "system",
      user_name:   "System (Automation)",
      changes:     changes || undefined,
      metadata: {
        triggered_by: "entity_automation",
        automation_event: event?.type
      }
    });

    return Response.json({ success: true, event_type, entity: entityName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
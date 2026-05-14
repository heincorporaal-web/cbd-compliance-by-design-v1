/**
 * workflowAssigneeResolver.js
 *
 * Resolves workflow step assignees (approvers / recipients) at runtime.
 *
 * Supported assignee_type values:
 *   "named_emails"        — static email list already on the step
 *   "named_stakeholders"  — specific Stakeholder records (resolved via email field)
 *   "stakeholder_group"   — all active members of one or more StakeholderGroups
 *   "dynamic_role"        — read a field on the entity record (e.g. process_owner_id → User → email)
 */

import { base44 } from "@/api/base44Client";

/**
 * Resolve a set of assignee fields from a workflow step into a flat array of email strings.
 *
 * @param {object} step           - Workflow step definition
 * @param {object} entityRecord   - The entity record being processed (e.g. OrgProcess)
 * @param {'approver'|'recipient'} role - Which role to resolve
 * @param {object} [cache]        - Optional shared cache: { stakeholders, stakeholderGroups, users }
 */
export async function resolveAssignees(step, entityRecord, role = 'approver', cache = {}) {
  // Determine which fields to use depending on role
  const assigneeType      = role === 'approver' ? (step.assignee_type      || 'named_emails') : (step.recipient_assignee_type      || 'named_emails');
  const namedEmails       = role === 'approver' ? (step.approvers          || [])             : (step.recipients                   || []);
  const groupIds          = role === 'approver' ? (step.stakeholder_group_ids || [])          : (step.recipient_stakeholder_group_ids || []);
  const namedStakeholders = role === 'approver' ? (step.named_stakeholder_ids || [])          : (step.recipient_named_stakeholder_ids || []);
  const dynamicField      = role === 'approver' ? step.dynamic_role_field                     : step.recipient_dynamic_role_field;

  switch (assigneeType) {

    case 'named_emails':
      return namedEmails.filter(Boolean);

    case 'named_stakeholders': {
      if (!namedStakeholders.length) return [];
      const stakeholders = cache.stakeholders || await base44.entities.Stakeholder.list();
      cache.stakeholders = stakeholders;
      return stakeholders
        .filter(s => namedStakeholders.includes(s.id) && s.email)
        .map(s => s.email);
    }

    case 'stakeholder_group': {
      if (!groupIds.length) return [];
      const stakeholders = cache.stakeholders || await base44.entities.Stakeholder.list();
      cache.stakeholders = stakeholders;
      // Collect all members whose group_ids overlap
      const emails = stakeholders
        .filter(s => s.status !== 'inactive' && s.email && (s.group_ids || []).some(gid => groupIds.includes(gid)))
        .map(s => s.email);
      return [...new Set(emails)];
    }

    case 'dynamic_role': {
      if (!dynamicField || !entityRecord) return [];
      return await resolveDynamicRole(dynamicField, entityRecord, cache);
    }

    default:
      return namedEmails.filter(Boolean);
  }
}

/**
 * Resolve a single dynamic role field on an entity to a list of email addresses.
 * Handles:
 *   - Free-text email fields (e.g. process_owner when it's an email)
 *   - _id fields pointing to a User record  (e.g. process_owner_id)
 *   - _stakeholder_id fields pointing to a Stakeholder (e.g. process_owner_stakeholder_id)
 *   - Plain name fields — lookup Stakeholder by full_name
 */
async function resolveDynamicRole(field, entityRecord, cache) {
  const value = entityRecord[field];
  if (!value) return [];

  // Case 1: field name ends with _id → treat as User ID
  if (field.endsWith('_id') && !field.endsWith('_stakeholder_id')) {
    const users = cache.users || await base44.entities.User.list();
    cache.users = users;
    const user = users.find(u => u.id === value);
    return user?.email ? [user.email] : [];
  }

  // Case 2: field name ends with _stakeholder_id → treat as Stakeholder ID
  if (field.endsWith('_stakeholder_id')) {
    const stakeholders = cache.stakeholders || await base44.entities.Stakeholder.list();
    cache.stakeholders = stakeholders;
    const s = stakeholders.find(s => s.id === value);
    return s?.email ? [s.email] : [];
  }

  // Case 3: value looks like an email address
  if (typeof value === 'string' && value.includes('@')) {
    return [value];
  }

  // Case 4: value is a name — try to find a matching stakeholder
  const stakeholders = cache.stakeholders || await base44.entities.Stakeholder.list();
  cache.stakeholders = stakeholders;
  const match = stakeholders.find(s => s.full_name?.toLowerCase() === value.toLowerCase());
  if (match?.email) return [match.email];

  // Fallback: return as-is (maybe it's a raw email we didn't detect)
  return [value];
}

/**
 * Convenience: resolve both approvers and recipients for a step.
 * Returns { approverEmails, recipientEmails }.
 */
export async function resolveStepEmails(step, entityRecord) {
  const cache = {};
  const [approverEmails, recipientEmails] = await Promise.all([
    resolveAssignees(step, entityRecord, 'approver', cache),
    resolveAssignees(step, entityRecord, 'recipient', cache),
  ]);
  return { approverEmails, recipientEmails };
}
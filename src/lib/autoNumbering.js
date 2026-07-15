// Auto-numbering utility for GRC entities

export const ENTITY_REF_FIELD = {
  risk:     "risk_reference_nr",
  control:  "control_id",
  process:  "process_code",
  issue:    "reference_number",
  evidence: "reference_number",
};

export const SEGMENT_TYPES = [
  { value: "static_text",    label: "Static value" },
  { value: "current_year",   label: "Current year" },
  { value: "current_month",  label: "Current month" },
  { value: "workstream_code", label: "Workstream code" },
];

export const TRAILING_CHARS = [
  { value: "none", label: "None" },
  { value: "-",    label: "Hyphen  ( - )" },
  { value: ".",    label: "Period  ( . )" },
  { value: ",",    label: "Comma   ( , )" },
  { value: "/",    label: "Slash    ( / )" },
  { value: ":",    label: "Colon    ( : )" },
];

export const DEFAULT_NUMBERING_CONFIG = {
  risk:    { alpha_prefix: "RISK", divider: "-", start_number: 1, zero_pad: 4, auto_number_enabled: true, segments: [] },
  control: { alpha_prefix: "CTR",  divider: "-", start_number: 1, zero_pad: 4, auto_number_enabled: true, segments: [] },
  process: { alpha_prefix: "PRO",  divider: "-", start_number: 1, zero_pad: 4, auto_number_enabled: true, segments: [] },
  evidence:{ alpha_prefix: "EVD",  divider: "-", start_number: 1, zero_pad: 4, auto_number_enabled: true, segments: [] },
  issue: {
    alpha_prefix: "ISS",
    divider: "-",
    start_number: 1,
    zero_pad: 4,
    auto_number_enabled: true,
    segments: [],
    linked_prefixes: {
      Assessment:        "ASS",
      Control:           "CTR",
      Risk:              "RSK",
      OrgProcess:        "PRO",
      Process:           "PRO",
      ICTSystem:         "ICT",
      Incident:          "INC",
      Company:           "COM",
      ThirdPartyProvider:"TPP",
    },
  },
};

/** Merge stored prefs with defaults for a given entity key */
export function getEntityNumConfig(companyPref, entityKey) {
  const defaults = DEFAULT_NUMBERING_CONFIG[entityKey] || {};
  const stored   = companyPref?.numbering_config?.[entityKey] || {};
  return {
    ...defaults,
    ...stored,
    auto_number_enabled: stored.auto_number_enabled !== false,
    segments: Array.isArray(stored.segments) ? stored.segments : [],
    // For issue: deep-merge linked_prefixes
    ...(entityKey === "issue" ? {
      linked_prefixes: {
        ...defaults.linked_prefixes,
        ...(stored.linked_prefixes || {}),
      },
    } : {}),
  };
}

/** Resolve a single segment to its string value (without trailing char). */
function segmentValue(seg, context = {}) {
  switch (seg.type) {
    case "static_text":    return seg.value || "";
    case "current_year":   return String(new Date().getFullYear());
    case "current_month":  return String(new Date().getMonth() + 1).padStart(2, "0");
    case "workstream_code": return context.workstreamCode || "";
    default: return "";
  }
}

/** Build the prefix portion of a reference number from advanced segments. */
export function buildSegmentsPrefix(segments, context = {}) {
  if (!Array.isArray(segments) || segments.length === 0) return "";
  return segments.map(seg => {
    const val = segmentValue(seg, context);
    const tc = seg.trailing_char && seg.trailing_char !== "none" ? seg.trailing_char : "";
    return `${val}${tc}`;
  }).join("");
}

/** Build a reference number from config + 1-based sequence */
export function buildRefNumber(cfg, sequence, context = {}) {
  const { start_number = 1, zero_pad = 4, segments } = cfg;
  const num    = (start_number - 1) + sequence;
  const padded = String(num).padStart(zero_pad, "0");
  if (Array.isArray(segments) && segments.length > 0) {
    return `${buildSegmentsPrefix(segments, context)}${padded}`;
  }
  const { alpha_prefix = "REF", divider = "-" } = cfg;
  return `${alpha_prefix}${divider}${padded}`;
}

/**
 * Build an Issue reference number, optionally with a linked-entity sub-prefix.
 * e.g. ISS-RSK-0001 or ISS-0042. Advanced segments take precedence when defined.
 */
export function buildIssueRefNumber(cfg, linkedEntityType, sequence, context = {}) {
  const { start_number = 1, zero_pad = 4, segments } = cfg;
  const num    = (start_number - 1) + sequence;
  const padded = String(num).padStart(zero_pad, "0");
  if (Array.isArray(segments) && segments.length > 0) {
    return `${buildSegmentsPrefix(segments, context)}${padded}`;
  }
  const { alpha_prefix = "ISS", divider = "-", linked_prefixes = {} } = cfg;
  const subPrefix = linked_prefixes[linkedEntityType];
  return subPrefix
    ? `${alpha_prefix}${divider}${subPrefix}${divider}${padded}`
    : `${alpha_prefix}${divider}${padded}`;
}

/**
 * Find the next sequence to use, based on highest numeric suffix in existing records.
 * Falls back to start_number if no existing ref numbers.
 */
export function getNextSequence(existingRecords, cfg) {
  const { start_number = 1 } = cfg;
  let max = start_number - 1;
  for (const rec of existingRecords) {
    if (!rec) continue;
    const ref = rec.reference_number || rec.risk_reference_nr || rec.control_id || rec.process_code || "";
    if (!ref) continue;
    const match = String(ref).match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return max + 1;
}

/**
 * Auto-assign a reference number to a new record when auto-numbering is enabled
 * and the relevant field is not already populated.
 * @param {string} entityKey  risk | control | process | issue | evidence
 * @param {object} data        the record about to be created
 * @param {object} pref        company preference record (or null)
 * @param {Array}  existingRecords  sibling records for the same company (for sequence)
 * @param {object} context     optional { workstreamCode }
 */
export function applyAutoNumber(entityKey, data, pref, existingRecords, context = {}) {
  const cfg = getEntityNumConfig(pref, entityKey);
  if (!cfg.auto_number_enabled) return data;
  const field = ENTITY_REF_FIELD[entityKey];
  if (!field) return data;
  if (data[field]) return data; // keep manually entered value
  const seq = getNextSequence(existingRecords, cfg);
  const refNum = entityKey === "issue"
    ? buildIssueRefNumber(cfg, data.linked_entity_type, seq, context)
    : buildRefNumber(cfg, seq, context);
  return { ...data, [field]: refNum };
}

/** Build action item sub-number: e.g. ISS-RSK-0001.AI01 */
export function buildActionItemRefNumber(issueRef, index) {
  return `${issueRef}.AI${String(index).padStart(2, "0")}`;
}

/** Renumber all action items based on the parent issue reference */
export function renumberActionItems(items, issueRef) {
  return items.map((item, idx) => ({
    ...item,
    reference_number: issueRef ? buildActionItemRefNumber(issueRef, idx + 1) : item.reference_number,
  }));
}
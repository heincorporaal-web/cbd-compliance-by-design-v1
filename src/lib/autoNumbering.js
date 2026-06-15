// Auto-numbering utility for GRC entities

export const DEFAULT_NUMBERING_CONFIG = {
  risk:    { alpha_prefix: "RISK", divider: "-", start_number: 1, zero_pad: 4 },
  control: { alpha_prefix: "CTR",  divider: "-", start_number: 1, zero_pad: 4 },
  process: { alpha_prefix: "PRO",  divider: "-", start_number: 1, zero_pad: 4 },
  evidence:{ alpha_prefix: "EVD",  divider: "-", start_number: 1, zero_pad: 4 },
  issue: {
    alpha_prefix: "ISS",
    divider: "-",
    start_number: 1,
    zero_pad: 4,
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
    // For issue: deep-merge linked_prefixes
    ...(entityKey === "issue" ? {
      linked_prefixes: {
        ...defaults.linked_prefixes,
        ...(stored.linked_prefixes || {}),
      },
    } : {}),
  };
}

/** Build a reference number from config + 1-based sequence */
export function buildRefNumber(cfg, sequence) {
  const { alpha_prefix = "REF", divider = "-", start_number = 1, zero_pad = 4 } = cfg;
  const num    = (start_number - 1) + sequence;
  return `${alpha_prefix}${divider}${String(num).padStart(zero_pad, "0")}`;
}

/**
 * Build an Issue reference number, optionally with a linked-entity sub-prefix.
 * e.g. ISS-RSK-0001 or ISS-0042
 */
export function buildIssueRefNumber(cfg, linkedEntityType, sequence) {
  const { alpha_prefix = "ISS", divider = "-", start_number = 1, zero_pad = 4, linked_prefixes = {} } = cfg;
  const subPrefix = linked_prefixes[linkedEntityType];
  const num       = (start_number - 1) + sequence;
  const padded    = String(num).padStart(zero_pad, "0");
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
    if (!rec.reference_number) continue;
    const match = rec.reference_number.match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return max + 1;
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
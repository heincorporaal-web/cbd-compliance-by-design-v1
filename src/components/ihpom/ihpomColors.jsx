// iHPOM Color Palette — Full Specification
// Maps process group symbols to their brand hex colours

export const SYMBOL_COLORS = {
  'DV': '#002838',
  'GC': '#0C3B60',
  'DP': '#3F7EA4',
  'MP': '#6D859B',
  'SCP': '#2F618C',
  'DS': '#5D8AA2',
  'CS': '#4E778E',
  'HC': '#B7E4F2',
  'IT': '#5B9695',
  'F':  '#ECB63F',
  'AM': '#D7B67C',
  'RI': '#D1862F',
  'ER': '#BA6A2B',
};

export const SYMBOL_LABELS = {
  'DV': 'Develop Vision & Strategy',
  'GC': 'Governance, Legal & Compliance',
  'DP': 'Develop & Manage Products & Services',
  'MP': 'Market & Sell Products & Services',
  'SCP': 'Manage Supply Chain',
  'DS': 'Deliver Services',
  'CS': 'Manage Customer Services',
  'HC': 'Develop & Manage Human Capital',
  'IT': 'Manage Information Technology',
  'F':  'Manage Financial Resources',
  'AM': 'Acquire, Construct & Manage Assets',
  'RI': 'Manage Risk, Remediation & Resiliency',
  'ER': 'Manage External Relationships',
};

export function getSymbolColor(symbol) {
  if (!symbol) return '#64748b';
  return SYMBOL_COLORS[symbol.toUpperCase()] || '#64748b';
}

export function getTextColor(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 160 ? '#1e293b' : '#ffffff';
}

// Column groupings for the Level 1 Organisational view
export const COLUMN_GROUPS = [
  { title: 'LEADERSHIP', symbols: ['DV', 'GC'] },
  { title: 'REVENUE', symbols: ['DP', 'MP'] },
  { title: 'LOGISTICS', symbols: ['SCP', 'DS', 'CS'] },
  { title: 'BACK OFFICE', symbols: ['HC', 'IT', 'F', 'AM'] },
  { title: 'RISK, REGULATIONS, THREATS & ENABLEMENT', symbols: ['RI', 'ER'] },
];
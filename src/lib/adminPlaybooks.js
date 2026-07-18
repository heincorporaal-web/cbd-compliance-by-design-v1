// Curated (code-authored) Admin Playbooks — the baseline library.
// Admins can override any of these in-app via the AdminPlaybook entity
// (matched by `playbook_key`), or add brand-new standalone playbooks.
// Keep entries concise, practical, and step-driven.

export const ADMIN_PLAYBOOK_CATEGORIES = [
  "Custom Icons",
  "Workflows",
  "Bulk Imports",
  "Auto-Numbering",
  "Framework Library",
  "Process Modelling",
  "Stakeholders",
  "General",
];

export const CURATED_PLAYBOOKS = [
  {
    key: "custom_icons",
    category: "Custom Icons",
    title: "Custom Menu Icons — Format & How-To",
    summary: "How to add bespoke SVG icons to the navigation menu.",
    format_spec:
      "ViewBox 0 0 24 24 (renders at 16–20px) • SVG 1.1, raw XML markup (not base64) • single-color or two-tone • stroke or fill • no external assets, fonts, or script tags • self-contained (no external image refs)",
    steps: [
      { id: "s1", title: "Open the customizer", detail: "Configuration → Customize menu icons." },
      { id: "s2", title: "Load your SVG", detail: "Click 'Load custom SVG', paste the raw <svg>…</svg> markup, and give it a display name." },
      { id: "s3", title: "Add it", detail: "Click 'Add icon'. It now appears under a 'Custom SVG' section in the picker." },
      { id: "s4", title: "Assign to a menu item", detail: "Expand any navigation item, then click your custom icon to apply it app-wide." },
      { id: "s5", title: "Reset or delete", detail: "Use the reset arrow on a menu item to revert to its default icon, or delete a custom SVG to clear all items using it." },
    ],
    content: `### Icon format
- **Size:** use a viewBox of "0 0 24 24" (it scales cleanly to the 16–20px nav size; a 32×32 artboard also works if you prefer).
- **Format:** SVG 1.1, pasted as **raw XML markup** — not base64, not an image file.
- **Color:** single-color or **two-tone** are both supported. Colors are preserved as authored — use hex (e.g. #384666) or currentColor.
- **Stroke vs fill:** either is fine. Keep stroke-width ≥ 1.5 so it stays visible at small sizes.
- **Self-contained:** no external image references, web fonts, or script tags. Inline gradients/filters are okay but keep them minimal.

### Tips
- Paste the whole <svg>…</svg> element including the xmlns attribute.
- Two-tone icons read best when one shape is a filled backdrop and the second is a foreground stroke or glyph.
- If an icon looks cramped, simplify the paths — detail is lost below ~18px.`,
  },
  {
    key: "workflows",
    category: "Workflows",
    title: "Building Approval Workflows",
    summary: "How to model multi-step approval routing for risks, frameworks, and cycles.",
    format_spec: null,
    steps: [
      { id: "s1", title: "Create the workflow", detail: "Configuration → Workflows → New. Give it a name and the entity type it governs (Risk, Framework, Control Assessment Cycle, etc.)." },
      { id: "s2", title: "Define steps", detail: "Add ordered steps: Draft → Review → Approve → Published. Each step has a status label and an assignee resolver (stakeholder role, named user, or email)." },
      { id: "s3", title: "Set conditions", detail: "Use conditions to branch (e.g. skip 'Review' for low-criticality items). Conditions compare entity fields." },
      { id: "s4", title: "Assign approvers", detail: "Per step, pick a stakeholder role (e.g. Risk Owner, Process Owner) or a named approver. The resolver expands this at runtime." },
      { id: "s5", title: "Activate & test", detail: "Save as Draft, run it on a test record, then set status to Active. Workflow events drive the item's status history." },
    ],
    content: `### Concepts
A **Workflow** is a reusable template of ordered **steps**. A **WorkflowInstance** is one running execution attached to a specific record (risk, framework, cycle…).

### Assignee resolution
Each step's assignee can be:
- a **stakeholder role** (resolved from the record's linked stakeholder, e.g. the Risk Owner),
- a **named user** (fixed email),
- a **company default approver** (from Company Preferences).

### Good practice
- Always include a **Draft** first step and a terminal **Published/Approved** step.
- Keep branching simple — most workflows need ≤ 4 steps.
- Use Company Preferences → default workflow approver email as a fallback so items never stall.`,
  },
  {
    key: "bulk_imports",
    category: "Bulk Imports",
    title: "Bulk Imports — CSV Guidelines",
    summary: "How to bulk-load records via CSV without breaking references.",
    format_spec: "UTF-8 CSV • comma-delimited • header row required • dates as YYYY-MM-DD • reference columns hold the target's code/ID, not its name • one row per record",
    steps: [
      { id: "s1", title: "Download or build the CSV", detail: "Use the entity's import dialog to see the expected columns. Always include the header row exactly as shown." },
      { id: "s2", title: "Resolve references", detail: "For link columns (e.g. company_id, value_chain_id), put the target's code or existing ID — not its display name. Unresolved references are skipped." },
      { id: "s3", title: "Upload", detail: "Open the entity page → Import → choose file → confirm. A summary reports created/skipped/errored rows." },
      { id: "s4", title: "Review errors", detail: "Fix rows flagged in the summary and re-import just those. Imports append — they do not update existing records." },
    ],
    content: `### General CSV rules
- **Encoding:** UTF-8. **Delimiter:** comma. Quote fields containing commas.
- **Header row:** required, column names must match the entity's expected fields.
- **Dates:** YYYY-MM-DD.
- **Booleans:** true / false.
- **Arrays** (e.g. linked_risk_ids): pipe-delimited IDs "id1|id2|id3".

### Reference columns
Link fields (anything ending in _id or named linked_*_ids) expect the **target record's ID or code**, never its display name. Pre-load parents before children (e.g. Value Chains before Workstreams).

### Entity-specific importers
- **Risks** — importRiskLibrary
- **Controls** — importControlLibrary
- **Framework Library** — importFrameworkLibrary / uploadFrameworkLibrary
- **iHPOM nodes** — importIHPOMNodes
- **Stakeholders / Business Units / Value Chains** — built-in CSV import on each page`,
  },
  {
    key: "auto_numbering",
    category: "Auto-Numbering",
    title: "Auto-Numbering Configuration",
    summary: "How to set per-entity reference numbering (prefix, padding, start number).",
    format_spec: null,
    steps: [
      { id: "s1", title: "Open preferences", detail: "Configuration → Company Preferences (or the company record). Find the Numbering section." },
      { id: "s2", title: "Configure per entity", detail: "For each entity (risk, control, process, issue, evidence) set: alpha prefix, divider, start number, zero-pad width." },
      { id: "s3", title: "Issues — linked prefixes", detail: "Issues can carry per-linked-entity prefixes; map them in the issue numbering block." },
      { id: "s4", title: "Save", detail: "New records get the next number in sequence. Existing records keep their assigned numbers." },
    ],
    content: `Each entity type can have its own numbering scheme, e.g. RISK-0001, CTL-001, ISS-2026-01.

**Fields per entity:**
- **alpha_prefix** — leading letters (RISK)
- **divider** — separator (-)
- **start_number** — first sequential value (1)
- **zero_pad** — width to zero-pad (e.g. 4 → 0001)

For **issues**, linked_prefixes lets an issue inherit a prefix from the entity it relates to (risk issue → RISK-, control issue → CTL-).`,
  },
  {
    key: "framework_library",
    category: "Framework Library",
    title: "Uploading the Framework Library",
    summary: "How to load master frameworks, nodes, pillars, and node types.",
    format_spec: "Master library is flagged is_master=true • frameworks reference legacy_framework_id to map nodes • node hierarchy uses legacy_node_id / legacy_parent_node_id",
    steps: [
      { id: "s1", title: "Upload the file", detail: "Framework Library page → Upload. Use uploadFrameworkLibrary to store the source file." },
      { id: "s2", title: "Run the import", detail: "importFrameworkLibrary parses the file and creates Framework, FrameworkNode, FrameworkPillar, and FrameworkNodeType records." },
      { id: "s3", title: "Verify", detail: "Check the framework tree renders with the expected levels (Domain → Chapter → Section → Clause …)." },
      { id: "s4", title: "Assign to companies", detail: "Master frameworks are templates; assign them to a company to start mapping controls and objectives." },
    ],
    content: `The framework library is a **master** repository: frameworks with is_master=true are templates owned by Product Owners, never tied to a company.

**Mapping fields:**
- legacy_framework_id ties a Framework to its imported nodes.
- legacy_node_id / legacy_parent_node_id reconstruct the node hierarchy.
- legacy_node_type_id links a node to its FrameworkNodeType (Domain, Chapter, Section, Clause…).

Only **Product Owners** maintain the master library. Implementers/Admins assign master frameworks to companies and map controls at company level.`,
  },
  {
    key: "process_modelling",
    category: "Process Modelling",
    title: "Advanced Process Modelling (BPMN)",
    summary: "Enabling and using the BPMN 2.0 designer for process risk assessment.",
    format_spec: null,
    steps: [
      { id: "s1", title: "Enable the module", detail: "Advanced Process Modelling page → toggle on for the company (sets CompanyPreference.enable_advanced_process_modelling)." },
      { id: "s2", title: "Pick a process", detail: "Select an OrgProcess from the list to open its BPMN designer." },
      { id: "s3", title: "Model the flow", detail: "Drag elements from the palette onto the canvas. The diagram auto-saves as BPMN XML." },
      { id: "s4", title: "Attach SOP metadata", detail: "Select an element to edit its SOP metadata in the data pane (owner, frequency, criticality, minimum requirements)." },
      { id: "s5", title: "Publish", detail: "Set the diagram status to Published to snapshot an SVG and lock the model for assessments." },
    ],
    content: `Advanced Process Modelling adds a **BPMN 2.0** designer (bpmn-js) over OrgProcess records, plus risk-based process assessment.

- Each process has one **ProcessDiagram** storing bpmn_xml and an svg_snapshot.
- **Canvas meta** holds the SOP header context; **element_meta** holds per-element SOP fields keyed by BPMN element id.
- Publishing snapshots the SVG for reports/preview thumbnails.

Module is a per-company add-on (CompanyPreference flag). Enable it only for companies that need it.`,
  },
  {
    key: "stakeholder_assignments",
    category: "Stakeholders",
    title: "Stakeholder Assignments & Gap Finder",
    summary: "Assigning stakeholders to records and finding coverage gaps.",
    format_spec: null,
    steps: [
      { id: "s1", title: "Import stakeholders", detail: "Stakeholders page → Import (HR feed) or add manually. Stakeholders belong to a Stakeholder Group." },
      { id: "s2", title: "Assign to records", detail: "On risks, controls, processes, third parties, pick the stakeholder via the owner pickers. Assignment creates the linkage." },
      { id: "s3", title: "Bulk assign by group", detail: "Stakeholder Groups → assign a whole group to a role across a set of records (applyStakeholderGroupAssignments)." },
      { id: "s4", title: "Find gaps", detail: "Run the Assignment Gap Finder (findStakeholderAssignmentGaps) to list records missing a required owner; create issues from gaps." },
    ],
    content: `Stakeholders are the people accountable for records. Each links to a **Stakeholder Group** and carries role history.

- Use **owner pickers** on individual records for precise assignment.
- Use **group assignments** to apply one stakeholder across many records at once.
- The **Gap Finder** surfaces records missing required owners (risk owner, process owner, control owner) and can auto-create Issues to track remediation (createIssuesFromGaps).`,
  },
];
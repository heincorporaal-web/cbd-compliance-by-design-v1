// Curated Admin Playbooks — Add-on Modules (prerequisites & enablement).
// Imported into adminPlaybooks.js.

export const ADDON_MODULE_PLAYBOOKS = [
  {
    key: "addon_overview",
    category: "Add-on Modules",
    title: "Add-on Modules — Overview & Prerequisites",
    summary: "How the four add-on modules relate to the core and what core data each needs before enablement.",
    format_spec: null,
    sort_order: 10,
    steps: [
      { id: "s1", title: "Understand the core → add-on relationship", detail: "The CBD core (Companies, Business Units, Stakeholders, Risks, Controls, Processes, Value Chains, Frameworks) is the foundation. Add-ons extend the core — they cannot run without it." },
      { id: "s2", title: "Complete core setup first", detail: "Before enabling any add-on, ensure the company record exists, at least one Business Unit is created, Stakeholders are imported, and the Risk/Control library is loaded." },
      { id: "s3", title: "Enable per-company", detail: "Each add-on is switched on via a CompanyPreference flag (enable_advanced_process_modelling, enable_third_party_risk_management, enable_assets_by_design, enable_governance_by_design). Only admins toggle these." },
      { id: "s4", title: "Verify prerequisites per module", detail: "See the individual module playbooks below for the exact core data each add-on requires." },
    ],
    content: `CBD ships four add-on modules, each gated by a **CompanyPreference** flag:

| Module | Flag | Landing page |
|---|---|---|
| Operations by Design (OBD) | \`enable_advanced_process_modelling\` | /AdvancedProcessModelling |
| Partner by Design (PBD) | \`enable_third_party_risk_management\` | /AdvancedThirdPartyRiskManagement |
| Assets by Design (ABD) | \`enable_assets_by_design\` | /AssetsByDesign |
| Governance by Design (GBD) | \`enable_governance_by_design\` | /GovernanceByDesignModule |

### Enablement order
1. **Core first** — Companies, Business Units, Stakeholders, Risks, Controls, Processes, Value Chains, Frameworks.
2. **Then one add-on at a time** — enable, verify prerequisites, seed module-specific catalogues, then move to the next.
3. **Cross-module links** — OBD processes link to GBD governance documents; ABD ICT systems link to OBD processes; PBD third parties link to risks and controls. Enable the upstream module first.`,
  },
  {
    key: "addon_obd_prereq",
    category: "Add-on Modules",
    title: "Operations by Design (OBD) — Prerequisites",
    summary: "Core data that must exist before enabling Advanced Process Modelling.",
    format_spec: null,
    sort_order: 20,
    steps: [
      { id: "s1", title: "Company & preferences", detail: "Company record exists; CompanyPreference.enable_advanced_process_modelling set to true." },
      { id: "s2", title: "Business Units", detail: "At least one Business Unit created — processes are scoped to a BU for reporting." },
      { id: "s3", title: "Stakeholders", detail: "Process Owners and Deputy Owners imported as Stakeholders, assigned to Stakeholder Groups." },
      { id: "s4", title: "Value Chains & Workstreams", detail: "Value Chains and their Workstreams defined — processes are linked to a Value Chain / Workstream pair." },
      { id: "s5", title: "Management Chains", detail: "Seeded Management Chain options (CustomOptionList storage_key 'cbd_management_chains') present and active." },
      { id: "s6", title: "OrgProcess hierarchy", detail: "At least Level 0–2 OrgProcess records created (parent processes) so BPMN diagrams have a process to attach to." },
      { id: "s7", title: "Assessment Model", detail: "An Assessment Model configured for process risk assessment (likelihood × impact scales)." },
      { id: "s8", title: "Enable & verify", detail: "Toggle the flag on, open Advanced Process Modelling, confirm the process list renders and the BPMN designer opens for a selected process." },
    ],
    content: `### Why these prerequisites
OBD layers a **BPMN 2.0 designer** on top of OrgProcess records. Without processes, there is nothing to model. Without Value Chains and Workstreams, processes cannot be grouped for reporting. Without Stakeholders, process ownership is blank.

### Checklist
- [ ] Company created
- [ ] \`enable_advanced_process_modelling = true\`
- [ ] ≥ 1 Business Unit
- [ ] Stakeholders imported (Process Owner role)
- [ ] ≥ 1 Value Chain with ≥ 1 Workstream
- [ ] Management Chains seeded (CustomOptionList)
- [ ] ≥ 1 OrgProcess at Level 0–2
- [ ] Assessment Model configured
- [ ] Workflow for process approval (optional but recommended)

### Common issues
- **BPMN designer empty** — no OrgProcess records exist; create the process hierarchy first.
- **Value Chain picker empty** — Value Chains not yet created; seed them before linking processes.
- **Process owner blank** — Stakeholders not imported or not assigned to the Process Owner role.`,
  },
  {
    key: "addon_pbd_prereq",
    category: "Add-on Modules",
    title: "Partner by Design (PBD) — Prerequisites",
    summary: "Core data that must exist before enabling Third Party Risk Management.",
    format_spec: null,
    sort_order: 30,
    steps: [
      { id: "s1", title: "Company & preferences", detail: "Company record exists; CompanyPreference.enable_third_party_risk_management set to true." },
      { id: "s2", title: "Stakeholders", detail: "Third Party Owners and Assessors imported as Stakeholders." },
      { id: "s3", title: "Third Party Providers", detail: "ThirdPartyProvider records created (vendor register) — these are the entities being assessed." },
      { id: "s4", title: "Risk library", detail: "Risk register populated with third-party risk types; Assessment Model configured for TPRM assessments." },
      { id: "s5", title: "Controls library", detail: "Controls loaded — third-party assessments map evidence to controls." },
      { id: "s6", title: "Workflows", detail: "Assessment approval workflow configured (Third Party Assessment → Review → Approve)." },
      { id: "s7", title: "Enable & verify", detail: "Toggle the flag on, open Advanced Third Party Risk Management, confirm the provider list and assessment creation work." },
    ],
    content: `### Why these prerequisites
PBD adds **ThirdPartyAssessment** records over ThirdPartyProvider entries. Without providers, there is nothing to assess. Without risks and controls, assessments have no framework to score against.

### Checklist
- [ ] Company created
- [ ] \`enable_third_party_risk_management = true\`
- [ ] Stakeholders imported (Third Party Owner, Assessor roles)
- [ ] ThirdPartyProvider records created
- [ ] Risk library loaded (third-party risk types)
- [ ] Control library loaded
- [ ] Assessment Model configured
- [ ] Assessment workflow configured
- [ ] Company Preferences → default approver email set

### Common issues
- **No providers to assess** — ThirdPartyProvider register empty; import vendors first.
- **Assessment won't submit** — no Assessment Model assigned in Company Preferences.
- **Workflow stalls** — no default approver email set in Company Preferences.`,
  },
  {
    key: "addon_abd_prereq",
    category: "Add-on Modules",
    title: "Assets by Design (ABD) — Prerequisites",
    summary: "Core data that must exist before enabling the CMDB module.",
    format_spec: null,
    sort_order: 40,
    steps: [
      { id: "s1", title: "Company & preferences", detail: "Company record exists; CompanyPreference.enable_assets_by_design set to true." },
      { id: "s2", title: "ICT Systems register", detail: "ICTSystem records created — these are the CBD applications that CIs are linked to." },
      { id: "s3", title: "Stakeholders", detail: "Technical Owners and Business Owners imported as Stakeholders." },
      { id: "s4", title: "Business Units", detail: "Business Units created — CIs inherit criticality from the BU's applications." },
      { id: "s5", title: "CMDB catalogues", detail: "CIClass, CISubclass, RelationshipType, LifecycleStatus, Environment records seeded (system-seeded on first enable; verify they exist)." },
      { id: "s6", title: "Discovery Sources", detail: "DiscoverySource records configured for Microsoft Defender for Endpoint, Intune, Entra ID, Azure Resource Graph (optional but recommended for auto-discovery)." },
      { id: "s7", title: "Source Precedence", detail: "SourcePrecedenceRule records configured — define which discovery source wins per attribute category." },
      { id: "s8", title: "Enable & verify", detail: "Toggle the flag on, open Assets by Design, confirm the CMDB dashboard renders and the CI inventory is accessible." },
    ],
    content: `### Why these prerequisites
ABD builds a **CMDB** (ConfigurationItem records) linked to the ICT Systems register. Without ICT Systems, discovered CIs have no application to link to. Without catalogues (CIClass, RelationshipType, etc.), CIs cannot be classified.

### Checklist
- [ ] Company created
- [ ] \`enable_assets_by_design = true\`
- [ ] ICTSystem records created (the application register)
- [ ] Stakeholders imported (Technical Owner, Business Owner)
- [ ] Business Units created
- [ ] CIClass / CISubclass catalogues present
- [ ] RelationshipType catalogue present
- [ ] LifecycleStatus / Environment catalogues present
- [ ] DiscoverySource connectors configured (optional)
- [ ] SourcePrecedenceRule configured (optional)

### Common issues
- **CIs unclassified** — CIClass catalogue empty; seed system classes first.
- **No application link** — ICT Systems register empty; create systems before linking CIs.
- **Discovery fails** — DiscoverySource not configured or connector not authorized.
- **Inherited criticality blank** — ICT System has no criticality set; CIs cannot inherit.`,
  },
  {
    key: "addon_gbd_prereq",
    category: "Add-on Modules",
    title: "Governance by Design (GBD) — Prerequisites",
    summary: "Core data that must exist before enabling the Policy & Governance module.",
    format_spec: null,
    sort_order: 50,
    steps: [
      { id: "s1", title: "Company & preferences", detail: "Company record exists; CompanyPreference.enable_governance_by_design set to true." },
      { id: "s2", title: "Stakeholders", detail: "Document Owners, Approvers, and Authors imported as Stakeholders — governance documents require all three roles." },
      { id: "s3", title: "Risk & Control library", detail: "Risks and Controls loaded — governance documents link to these for traceability." },
      { id: "s4", title: "Framework Library", detail: "Master frameworks assigned to the company — documents map to framework nodes for compliance traceability." },
      { id: "s5", title: "OrgProcesses", detail: "Process hierarchy created — governance documents link to processes (e.g. a procedure supports a process)." },
      { id: "s6", title: "Value Chains & Workstreams", detail: "Value Chains and Workstreams defined — documents are scoped to a Value Chain / Workstream." },
      { id: "s7", title: "Approval Workflow", detail: "Document approval workflow configured (Draft → Internal Review → Awaiting Approval → Approved → Published)." },
      { id: "s8", title: "Company mailboxes", detail: "Company Preferences → governance mailbox and notification from name set for workflow email notifications." },
      { id: "s9", title: "Enable & verify", detail: "Toggle the flag on, open Governance by Design, confirm the document library renders and creating a new document works." },
    ],
    content: `### Why these prerequisites
GBD manages the **GovernanceDocument** lifecycle (policies, standards, procedures) and links them to risks, controls, frameworks, and processes. Without the core library, documents have nothing to trace to.

### Checklist
- [ ] Company created
- [ ] \`enable_governance_by_design = true\`
- [ ] Stakeholders imported (Document Owner, Approver, Author)
- [ ] Risk library loaded
- [ ] Control library loaded
- [ ] Frameworks assigned to company
- [ ] OrgProcess hierarchy created
- [ ] Value Chains & Workstreams defined
- [ ] Document approval workflow configured
- [ ] Governance mailbox set in Company Preferences
- [ ] Notification from name set

### Common issues
- **Cannot create document** — Stakeholders missing; document requires an owner.
- **No traceability links** — Risks/Controls/Frameworks not loaded; document has nothing to link to.
- **Workflow stalls** — No approval workflow configured or no default approver email.
- **Value Chain picker empty** — Value Chains not yet created; seed them before linking documents.`,
  },
];
// Curated Admin Playbooks — Config Workbooks (XML extraction templates).
// Imported into adminPlaybooks.js.

export const CONFIG_WORKBOOK_PLAYBOOKS = [
  {
    key: "config_workbook_overview",
    category: "Config Workbooks",
    title: "Config Workbooks — XML Format Overview",
    summary: "How XML config workbooks work and what they extract from each core module.",
    format_spec: "XML 1.0 • UTF-8 • single root <cbd-config-workbook> • one <module> per core area • <extract> defines entity + fields + filters • <related> pulls linked entities",
    sort_order: 10,
    steps: [
      { id: "s1", title: "Understand the workbook structure", detail: "Each workbook is an XML document with a root <cbd-config-workbook> containing one or more <module> elements. Each module defines what to extract." },
      { id: "s2", title: "Use the per-module templates", detail: "Each core module has its own workbook playbook below with a ready-to-use XML template. Copy, adjust filters, and run." },
      { id: "s3", title: "Extract via the API", detail: "Use the base44 SDK (base44.entities.<Entity>.filter) or the bulk export on each page to pull the data matching the workbook spec." },
      { id: "s4", title: "Validate", detail: "Check that all required fields are present and references resolve. Use the workbook as a checklist during implementation." },
    ],
    content: `### XML Config Workbook structure

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<cbd-config-workbook app="CBD" version="1.0">
  <module name="companies">
    <extract entity="Company">
      <fields>
        <field name="id" />
        <field name="name" />
        <field name="status" />
      </fields>
      <filter>
        <eq field="status" value="active" />
      </filter>
    </extract>
    <related entity="CompanyPreference" join="company_id" />
  </module>
</cbd-config-workbook>
\`\`\`

### Elements
- **<module>** — a logical grouping (companies, risks, controls…). Has a \`name\` attribute.
- **<extract>** — defines the entity to extract, the fields to include, and optional filters.
- **<fields>** — the list of <field> elements to include. Omit to extract all fields.
- **<filter>** — optional filter criteria: <eq>, <ne>, <in>, <gt>, <lt>, <like>.
- **<related>** — pulls linked entities by join field (e.g. CompanyPreference joined on company_id).
- **<orderby>** — sort field and direction.
- **<limit>** — max records to return.

### Usage
1. Copy the template for the module you need.
2. Adjust the <filter> to match the target company or scope.
3. Run the extraction via the SDK or the page's Export button.
4. Use the extracted data as a baseline for configuration or migration.`,
  },
  {
    key: "config_workbook_companies",
    category: "Config Workbooks",
    title: "Config Workbook — Companies & Preferences (XML)",
    summary: "Extract company records, preferences, and numbering configuration.",
    format_spec: "XML 1.0 • extracts Company + CompanyPreference • join on company_id",
    sort_order: 20,
    steps: [
      { id: "s1", title: "Copy the XML template", detail: "Use the template below as the extraction specification." },
      { id: "s2", title: "Adjust filters", detail: "Set the company name or status filter to scope the extraction." },
      { id: "s3", title: "Extract", detail: "Run via SDK: base44.entities.Company.list() and base44.entities.CompanyPreference.filter({company_id})." },
    ],
    content: `\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<cbd-config-workbook module="companies" version="1.0">
  <module name="companies">
    <extract entity="Company">
      <fields>
        <field name="id" />
        <field name="name" />
        <field name="legal_name" />
        <field name="status" />
        <field name="country" />
        <field name="industry" />
        <field name="fiscal_year_start" />
        <field name="default_currency" />
      </fields>
      <orderby field="name" direction="asc" />
    </extract>
    <related entity="CompanyPreference" join="company_id">
      <fields>
        <field name="numbering_config" />
        <field name="default_assessment_model_id" />
        <field name="default_workflow_approver_email" />
        <field name="default_issue_approver_email" />
        <field name="risk_mailbox" />
        <field name="compliance_mailbox" />
        <field name="audit_mailbox" />
        <field name="governance_mailbox" />
        <field name="notification_from_name" />
        <field name="default_currency" />
        <field name="fiscal_year_start_month" />
        <field name="risk_review_frequency_days" />
        <field name="issue_escalation_days" />
        <field name="require_evidence_on_assessment" />
        <field name="enable_workflow_email_notifications" />
        <field name="enable_risk_auto_scoring" />
        <field name="default_risk_appetite" />
        <field name="enable_third_party_risk_management" />
        <field name="enable_advanced_process_modelling" />
        <field name="enable_assets_by_design" />
        <field name="enable_governance_by_design" />
      </fields>
    </related>
  </module>
</cbd-config-workbook>
\`\`\``,
  },
  {
    key: "config_workbook_business_units",
    category: "Config Workbooks",
    title: "Config Workbook — Business Units (XML)",
    summary: "Extract the Business Unit hierarchy and ownership.",
    format_spec: "XML 1.0 • extracts BusinessUnit • self-join on parent_id for hierarchy",
    sort_order: 30,
    steps: [
      { id: "s1", title: "Copy the XML template", detail: "Use the template below as the extraction specification." },
      { id: "s2", title: "Scope by company", detail: "Set the company_id filter to extract only the target company's BUs." },
      { id: "s3", title: "Extract", detail: "Run via SDK: base44.entities.BusinessUnit.filter({company_id})." },
    ],
    content: `\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<cbd-config-workbook module="business_units" version="1.0">
  <module name="business_units">
    <extract entity="BusinessUnit">
      <fields>
        <field name="id" />
        <field name="name" />
        <field name="code" />
        <field name="parent_id" />
        <field name="company_id" />
        <field name="head_stakeholder_id" />
        <field name="status" />
        <field name="criticality" />
        <field name="description" />
      </fields>
      <filter>
        <eq field="company_id" value="{COMPANY_ID}" />
        <eq field="status" value="active" />
      </filter>
      <orderby field="name" direction="asc" />
    </extract>
  </module>
</cbd-config-workbook>
\`\`\``,
  },
  {
    key: "config_workbook_stakeholders",
    category: "Config Workbooks",
    title: "Config Workbook — Stakeholders & Groups (XML)",
    summary: "Extract stakeholders, their group memberships, and role history.",
    format_spec: "XML 1.0 • extracts Stakeholder + StakeholderGroup • join on group_id",
    sort_order: 40,
    steps: [
      { id: "s1", title: "Copy the XML template", detail: "Use the template below as the extraction specification." },
      { id: "s2", title: "Scope by company", detail: "Set the company_id filter to extract only the target company's stakeholders." },
      { id: "s3", title: "Extract", detail: "Run via SDK: base44.entities.Stakeholder.filter({company_id}) and base44.entities.StakeholderGroup.filter({company_id})." },
    ],
    content: `\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<cbd-config-workbook module="stakeholders" version="1.0">
  <module name="stakeholder_groups">
    <extract entity="StakeholderGroup">
      <fields>
        <field name="id" />
        <field name="name" />
        <field name="company_id" />
        <field name="description" />
        <field name="is_active" />
      </fields>
      <filter>
        <eq field="company_id" value="{COMPANY_ID}" />
      </filter>
    </extract>
  </module>
  <module name="stakeholders">
    <extract entity="Stakeholder">
      <fields>
        <field name="id" />
        <field name="full_name" />
        <field name="email" />
        <field name="job_title" />
        <field name="department" />
        <field name="group_id" />
        <field name="company_id" />
        <field name="status" />
        <field name="manager_id" />
      </fields>
      <filter>
        <eq field="company_id" value="{COMPANY_ID}" />
        <eq field="status" value="active" />
      </filter>
      <orderby field="full_name" direction="asc" />
    </extract>
    <related entity="StakeholderHistory" join="stakeholder_id">
      <fields>
        <field name="role" />
        <field name="start_date" />
        <field name="end_date" />
      </fields>
    </related>
  </module>
</cbd-config-workbook>
\`\`\``,
  },
  {
    key: "config_workbook_risks",
    category: "Config Workbooks",
    title: "Config Workbook — Risks & Assessments (XML)",
    summary: "Extract the risk register, linked controls, and assessment history.",
    format_spec: "XML 1.0 • extracts Risk + Assessment • join on risk_id",
    sort_order: 50,
    steps: [
      { id: "s1", title: "Copy the XML template", detail: "Use the template below as the extraction specification." },
      { id: "s2", title: "Scope by company and status", detail: "Set the company_id and status filters to extract active risks only." },
      { id: "s3", title: "Extract", detail: "Run via SDK: base44.entities.Risk.filter({company_id, status:'active'})." },
    ],
    content: `\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<cbd-config-workbook module="risks" version="1.0">
  <module name="risks">
    <extract entity="Risk">
      <fields>
        <field name="id" />
        <field name="risk_code" />
        <field name="title" />
        <field name="description" />
        <field name="company_id" />
        <field name="business_unit_id" />
        <field name="value_chain_id" />
        <field name="category" />
        <field name="status" />
        <field name="inherent_likelihood" />
        <field name="inherent_impact" />
        <field name="residual_likelihood" />
        <field name="residual_impact" />
        <field name="owner_stakeholder_id" />
        <field name="linked_control_ids" />
        <field name="linked_framework_ids" />
      </fields>
      <filter>
        <eq field="company_id" value="{COMPANY_ID}" />
        <eq field="status" value="active" />
      </filter>
      <orderby field="risk_code" direction="asc" />
    </extract>
    <related entity="Assessment" join="risk_id">
      <fields>
        <field name="assessment_date" />
        <field name="assessor_stakeholder_id" />
        <field name="likelihood" />
        <field name="impact" />
        <field name="score" />
        <field name="status" />
      </fields>
    </related>
  </module>
</cbd-config-workbook>
\`\`\``,
  },
  {
    key: "config_workbook_controls",
    category: "Config Workbooks",
    title: "Config Workbook — Controls & Assessments (XML)",
    summary: "Extract the control library, linked risks, and assessment cycles.",
    format_spec: "XML 1.0 • extracts Control + ControlAssessment • join on control_id",
    sort_order: 60,
    steps: [
      { id: "s1", title: "Copy the XML template", detail: "Use the template below as the extraction specification." },
      { id: "s2", title: "Scope by company and status", detail: "Set the company_id and status filters." },
      { id: "s3", title: "Extract", detail: "Run via SDK: base44.entities.Control.filter({company_id})." },
    ],
    content: `\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<cbd-config-workbook module="controls" version="1.0">
  <module name="controls">
    <extract entity="Control">
      <fields>
        <field name="id" />
        <field name="control_code" />
        <field name="name" />
        <field name="description" />
        <field name="company_id" />
        <field name="control_type" />
        <field name="frequency" />
        <field name="owner_stakeholder_id" />
        <field name="status" />
        <field name="automation_level" />
        <field name="linked_risk_ids" />
        <field name="linked_framework_ids" />
      </fields>
      <filter>
        <eq field="company_id" value="{COMPANY_ID}" />
        <ne field="status" value="retired" />
      </filter>
      <orderby field="control_code" direction="asc" />
    </extract>
    <related entity="ControlAssessment" join="control_id">
      <fields>
        <field name="assessment_date" />
        <field name="assessor_stakeholder_id" />
        <field name="result" />
        <field name="status" />
        <field name="cycle_id" />
      </fields>
    </related>
  </module>
</cbd-config-workbook>
\`\`\``,
  },
  {
    key: "config_workbook_processes",
    category: "Config Workbooks",
    title: "Config Workbook — Processes & Value Chains (XML)",
    summary: "Extract the OrgProcess hierarchy, Value Chains, and Workstreams.",
    format_spec: "XML 1.0 • extracts OrgProcess + ValueChain + Workstream • self-join on parent_id",
    sort_order: 70,
    steps: [
      { id: "s1", title: "Copy the XML template", detail: "Use the template below as the extraction specification." },
      { id: "s2", title: "Scope by company", detail: "Set the company_id filter." },
      { id: "s3", title: "Extract", detail: "Run via SDK: base44.entities.OrgProcess.filter({company_id}), base44.entities.ValueChain.filter({company_id})." },
    ],
    content: `\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<cbd-config-workbook module="processes" version="1.0">
  <module name="value_chains">
    <extract entity="ValueChain">
      <fields>
        <field name="id" />
        <field name="name" />
        <field name="code" />
        <field name="company_id" />
        <field name="management_chain" />
        <field name="owner_stakeholder_id" />
        <field name="status" />
        <field name="end_date" />
        <field name="sort_order" />
      </fields>
      <filter>
        <eq field="company_id" value="{COMPANY_ID}" />
      </filter>
      <orderby field="sort_order" direction="asc" />
    </extract>
  </module>
  <module name="workstreams">
    <extract entity="Workstream">
      <fields>
        <field name="id" />
        <field name="name" />
        <field name="value_chain_id" />
        <field name="company_id" />
        <field name="status" />
      </fields>
      <filter>
        <eq field="company_id" value="{COMPANY_ID}" />
      </filter>
    </extract>
  </module>
  <module name="org_processes">
    <extract entity="OrgProcess">
      <fields>
        <field name="id" />
        <field name="process_code" />
        <field name="name" />
        <field name="description" />
        <field name="company_id" />
        <field name="level" />
        <field name="parent_id" />
        <field name="value_chain_id" />
        <field name="workstream_id" />
        <field name="process_owner_stakeholder_id" />
        <field name="status" />
        <field name="criticality" />
        <field name="frequency" />
        <field name="automation_level" />
      </fields>
      <filter>
        <eq field="company_id" value="{COMPANY_ID}" />
        <ne field="status" value="archived" />
      </filter>
      <orderby field="process_code" direction="asc" />
    </extract>
  </module>
</cbd-config-workbook>
\`\`\``,
  },
  {
    key: "config_workbook_ict_systems",
    category: "Config Workbooks",
    title: "Config Workbook — ICT Systems (XML)",
    summary: "Extract the ICT system register, modules, and IT capabilities.",
    format_spec: "XML 1.0 • extracts ICTSystem + ICTModule + ITCapability • join on ict_system_id",
    sort_order: 80,
    steps: [
      { id: "s1", title: "Copy the XML template", detail: "Use the template below as the extraction specification." },
      { id: "s2", title: "Scope by company", detail: "Set the company_id filter." },
      { id: "s3", title: "Extract", detail: "Run via SDK: base44.entities.ICTSystem.filter({company_id})." },
    ],
    content: `\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<cbd-config-workbook module="ict_systems" version="1.0">
  <module name="ict_systems">
    <extract entity="ICTSystem">
      <fields>
        <field name="id" />
        <field name="name" />
        <field name="company_id" />
        <field name="system_type" />
        <field name="criticality" />
        <field name="description" />
        <field name="owner_stakeholder_id" />
        <field name="vendor" />
        <field name="hosting_type" />
        <field name="recovery_time_objective" />
        <field name="recovery_point_objective" />
        <field name="status" />
        <field name="value_chain_id" />
        <field name="workstream_id" />
        <field name="data_classification" />
      </fields>
      <filter>
        <eq field="company_id" value="{COMPANY_ID}" />
        <ne field="status" value="decommissioned" />
      </filter>
      <orderby field="name" direction="asc" />
    </extract>
    <related entity="ICTModule" join="ict_system_id">
      <fields>
        <field name="module_name" />
        <field name="criticality" />
        <field name="is_active" />
        <field name="workstream_id" />
        <field name="value_chain_id" />
      </fields>
    </related>
    <related entity="ITCapability" join="id" join_field="ict_system_ids" />
  </module>
</cbd-config-workbook>
\`\`\``,
  },
  {
    key: "config_workbook_frameworks",
    category: "Config Workbooks",
    title: "Config Workbook — Frameworks & Nodes (XML)",
    summary: "Extract assigned frameworks, their node hierarchy, and pillars.",
    format_spec: "XML 1.0 • extracts Framework + FrameworkNode + FrameworkPillar • self-join on parent_node_id",
    sort_order: 90,
    steps: [
      { id: "s1", title: "Copy the XML template", detail: "Use the template below as the extraction specification." },
      { id: "s2", title: "Scope by company or master", detail: "Set is_master=false for company-assigned frameworks, or omit to include master templates." },
      { id: "s3", title: "Extract", detail: "Run via SDK: base44.entities.Framework.filter({company_id}) and base44.entities.FrameworkNode.filter({framework_id})." },
    ],
    content: `\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<cbd-config-workbook module="frameworks" version="1.0">
  <module name="frameworks">
    <extract entity="Framework">
      <fields>
        <field name="id" />
        <field name="name" />
        <field name="legacy_framework_id" />
        <field name="company_id" />
        <field name="is_master" />
        <field name="status" />
        <field name="version" />
        <field name="description" />
      </fields>
      <filter>
        <eq field="company_id" value="{COMPANY_ID}" />
        <eq field="is_master" value="false" />
      </filter>
      <orderby field="name" direction="asc" />
    </extract>
    <related entity="FrameworkPillar" join="framework_id">
      <fields>
        <field name="name" />
        <field name="sort_order" />
      </fields>
    </related>
    <related entity="FrameworkNode" join="framework_id">
      <fields>
        <field name="legacy_node_id" />
        <field name="legacy_parent_node_id" />
        <field name="legacy_node_type_id" />
        <field name="name" />
        <field name="description" />
        <field name="sort_order" />
      </fields>
    </related>
  </module>
</cbd-config-workbook>
\`\`\``,
  },
  {
    key: "config_workbook_issues",
    category: "Config Workbooks",
    title: "Config Workbook — Issues & Incidents (XML)",
    summary: "Extract the issue register and incident log with linked entity references.",
    format_spec: "XML 1.0 • extracts Issue + Incident • join on linked_risk_ids / linked_control_ids",
    sort_order: 100,
    steps: [
      { id: "s1", title: "Copy the XML template", detail: "Use the template below as the extraction specification." },
      { id: "s2", title: "Scope by company and status", detail: "Set the company_id and status filters to extract open issues only." },
      { id: "s3", title: "Extract", detail: "Run via SDK: base44.entities.Issue.filter({company_id}) and base44.entities.Incident.filter({company_id})." },
    ],
    content: `\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<cbd-config-workbook module="issues" version="1.0">
  <module name="issues">
    <extract entity="Issue">
      <fields>
        <field name="id" />
        <field name="issue_code" />
        <field name="title" />
        <field name="description" />
        <field name="company_id" />
        <field name="status" />
        <field name="severity" />
        <field name="owner_stakeholder_id" />
        <field name="approver_stakeholder_id" />
        <field name="due_date" />
        <field name="linked_risk_ids" />
        <field name="linked_control_ids" />
        <field name="linked_process_ids" />
      </fields>
      <filter>
        <eq field="company_id" value="{COMPANY_ID}" />
        <ne field="status" value="closed" />
      </filter>
      <orderby field="due_date" direction="asc" />
    </extract>
  </module>
  <module name="incidents">
    <extract entity="Incident">
      <fields>
        <field name="id" />
        <field name="incident_code" />
        <field name="title" />
        <field name="description" />
        <field name="company_id" />
        <field name="status" />
        <field name="severity" />
        <field name="reported_date" />
        <field name="resolved_date" />
        <field name="linked_risk_ids" />
      </fields>
      <filter>
        <eq field="company_id" value="{COMPANY_ID}" />
      </filter>
      <orderby field="reported_date" direction="desc" />
    </extract>
  </module>
</cbd-config-workbook>
\`\`\``,
  },
  {
    key: "config_workbook_cmdb",
    category: "Config Workbooks",
    title: "Config Workbook — CMDB Catalogues (XML)",
    summary: "Extract CI Classes, Subclasses, Relationship Types, Lifecycle Statuses, and Environments.",
    format_spec: "XML 1.0 • extracts CIClass + CISubclass + RelationshipType + LifecycleStatus + Environment",
    sort_order: 110,
    steps: [
      { id: "s1", title: "Copy the XML template", detail: "Use the template below as the extraction specification." },
      { id: "s2", title: "Scope by company or global", detail: "Set company_id filter for company-specific entries, or omit to include global system catalogues." },
      { id: "s3", title: "Extract", detail: "Run via SDK for each catalogue entity." },
    ],
    content: `\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<cbd-config-workbook module="cmdb_catalogues" version="1.0">
  <module name="ci_classes">
    <extract entity="CIClass">
      <fields>
        <field name="id" />
        <field name="name" />
        <field name="code" />
        <field name="company_id" />
        <field name="is_system" />
        <field name="is_active" />
        <field name="sort_order" />
      </fields>
      <orderby field="sort_order" direction="asc" />
    </extract>
    <related entity="CISubclass" join="ci_class_id">
      <fields>
        <field name="name" />
        <field name="code" />
        <field name="is_active" />
      </fields>
    </related>
  </module>
  <module name="relationship_types">
    <extract entity="RelationshipType">
      <fields>
        <field name="id" />
        <field name="name" />
        <field name="code" />
        <field name="category" />
        <field name="direction" />
        <field name="is_system" />
        <field name="is_active" />
      </fields>
      <orderby field="sort_order" direction="asc" />
    </extract>
  </module>
  <module name="lifecycle_statuses">
    <extract entity="LifecycleStatus">
      <fields>
        <field name="id" />
        <field name="name" />
        <field name="code" />
        <field name="is_terminal" />
        <field name="is_system" />
        <field name="is_active" />
      </fields>
      <orderby field="sort_order" direction="asc" />
    </extract>
  </module>
  <module name="environments">
    <extract entity="Environment">
      <fields>
        <field name="id" />
        <field name="name" />
        <field name="code" />
        <field name="is_system" />
        <field name="is_active" />
      </fields>
      <orderby field="sort_order" direction="asc" />
    </extract>
  </module>
</cbd-config-workbook>
\`\`\``,
  },
];
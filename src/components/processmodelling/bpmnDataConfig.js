// Data-driven field definitions for the BPMN Data Pane.
// Each field has a key, label and type ('text' | 'textarea' | 'select' | 'search').
// 'search' fields are backed by a CBD entity option list (entity key below).
// 'select' fields use a fixed enum list.

export const ENTITY_LABELS = {
  stakeholder: { singular: "Stakeholder" },
  ictsystem: { singular: "ICT System" },
  risk: { singular: "Risk" },
  control: { singular: "Control" },
  framework: { singular: "Framework / Standard" },
  orgprocess: { singular: "Process" },
};

export const FIELDS = {
  // ---- common / core ----
  name: { label: "Name (overrides BPMN label)", type: "text" },
  process_level: {
    label: "Process Level",
    type: "select",
    options: ["L1", "L2", "L3", "L4", "L5", "L6"],
  },
  process_reference: {
    label: "Process Reference",
    type: "text",
    placeholder: "e.g. AACBIT-MIAL-40.030.020.030",
  },
  process_name: { label: "Process Name (override)", type: "text" },
  parent_process_reference: { label: "Parent Process Reference", type: "search", entity: "orgprocess" },
  process_owner: { label: "Process Owner", type: "search", entity: "stakeholder" },
  activity_owner_performer: { label: "Activity Owner / Performer", type: "search", entity: "stakeholder" },
  swimlane_lane_name: { label: "Swimlane / Lane Name", type: "text" },
  pool_name: { label: "Pool Name", type: "text" },
  activity_type: {
    label: "Activity Type",
    type: "select",
    options: ["Task", "Subprocess", "Collapsed subprocess", "Manual task", "User task", "Service task", "Script task", "Review", "Approval", "Control", "Reporting"],
  },
  activity_description: { label: "Activity Description", type: "textarea" },
  input_trigger: { label: "Input / Trigger", type: "textarea" },
  output_outcome: { label: "Output / Outcome", type: "textarea" },
  evidence_artefact: { label: "Evidence / Artefact", type: "text" },
  system_tool: { label: "System / Tool", type: "search", entity: "ictsystem" },
  business_rule: { label: "Business Rule", type: "textarea" },
  control_relevance: {
    label: "Control Relevance",
    type: "select",
    options: ["Key", "Non-key", "Preventive", "Detective", "Corrective"],
  },
  risk_addressed: { label: "Risk Addressed", type: "search", entity: "risk" },
  frequency_timing: {
    label: "Frequency / Timing",
    type: "select",
    options: ["Event-driven", "Daily", "Weekly", "Monthly", "Quarterly", "Annual", "On change", "Ad-hoc"],
  },
  sla_due_date_rule: { label: "SLA / Due Date Rule", type: "text" },
  handoff_next_step: { label: "Handoff / Next Step", type: "text" },
  exception_handling: { label: "Exception Handling", type: "textarea" },
  approval_requirement: { label: "Approval Requirement", type: "text" },
  decision_criteria: { label: "Decision Criteria", type: "textarea" },
  data_objects_updated: { label: "Data Objects Updated", type: "text" },
  reporting_requirement: { label: "Reporting Requirement", type: "text" },
  related_policy_standard: { label: "Related Policy / Standard", type: "search", entity: "framework" },
  version_effective_date: { label: "Version / Effective Date", type: "text" },

  // ---- start event ----
  start_event_id: { label: "Start Event ID", type: "text" },
  trigger_type: {
    label: "Trigger Type",
    type: "select",
    options: ["Time-based", "Event-based", "Message", "Condition", "Manual", "System-generated"],
  },
  trigger_source: { label: "Trigger Source", type: "text" },
  trigger_description: { label: "Trigger Description", type: "textarea" },
  minimum_trigger_criteria: { label: "Minimum Trigger Criteria", type: "textarea" },
  required_evidence: { label: "Required Evidence", type: "text" },
  receiving_process_activity: { label: "Receiving Process / Activity", type: "text" },

  // ---- task / activity ----
  activity_id: { label: "Activity ID", type: "text" },
  performer_role: { label: "Performer Role", type: "search", entity: "stakeholder" },
  supporting_roles: { label: "Supporting Roles", type: "text" },
  input: { label: "Input", type: "textarea" },
  procedure_summary: { label: "Procedure Summary", type: "textarea" },
  output: { label: "Output", type: "textarea" },
  evidence: { label: "Evidence", type: "text" },
  business_rules: { label: "Business Rules", type: "textarea" },
  controls: { label: "Controls", type: "search", entity: "control" },
  failure_condition: { label: "Failure Condition", type: "text" },
  exception_route: { label: "Exception Route", type: "text" },
  completion_criteria: { label: "Completion Criteria", type: "text" },

  // ---- subprocess ----
  subprocess_id: { label: "Subprocess ID", type: "text" },
  expanded_process_link: { label: "Expanded Process Link", type: "text" },
  purpose: { label: "Purpose", type: "textarea" },
  entry_criteria: { label: "Entry Criteria", type: "textarea" },
  exit_criteria: { label: "Exit Criteria", type: "textarea" },
  key_outputs: { label: "Key Outputs", type: "text" },
  responsible_owner: { label: "Responsible Owner", type: "search", entity: "stakeholder" },
  related_controls: { label: "Related Controls", type: "search", entity: "control" },

  // ---- gateway ----
  gateway_id: { label: "Gateway ID", type: "text" },
  gateway_type: {
    label: "Gateway Type",
    type: "select",
    options: ["Exclusive", "Inclusive", "Parallel", "Event-based"],
  },
  decision_question: { label: "Decision Question", type: "textarea" },
  decision_owner: { label: "Decision Owner", type: "search", entity: "stakeholder" },
  possible_outcomes: { label: "Possible Outcomes", type: "text" },
  path_condition: { label: "Path Condition", type: "text" },
  evidence_required: { label: "Evidence Required", type: "text" },
  exception_path: { label: "Exception Path", type: "text" },

  // ---- end event ----
  end_event_id: { label: "End Event ID", type: "text" },
  end_state_description: { label: "End State Description", type: "textarea" },
  final_output: { label: "Final Output", type: "text" },
  evidence_retained: { label: "Evidence Retained", type: "text" },
  next_process_triggered: { label: "Next Process Triggered", type: "search", entity: "orgprocess" },

  // ---- sequence flow ----
  flow_id: { label: "Flow ID", type: "text" },
  from_element: { label: "From Element", type: "text", readOnly: true },
  to_element: { label: "To Element", type: "text", readOnly: true },
  flow_condition: { label: "Flow Condition", type: "textarea" },
  handoff_description: { label: "Handoff Description", type: "textarea" },
  handoff_owner: { label: "Handoff Owner", type: "search", entity: "stakeholder" },
  sla: { label: "SLA", type: "text" },

  // ---- data object / artefact ----
  artefact_id: { label: "Artefact ID", type: "text" },
  artefact_name: { label: "Artefact Name", type: "text" },
  artefact_type: {
    label: "Artefact Type",
    type: "select",
    options: ["Ticket", "Approval", "Register", "Report", "Assessment", "Policy", "Standard", "Log", "Record"],
  },
  created_updated_read: {
    label: "Created / Updated / Read",
    type: "select",
    options: ["Created", "Updated", "Read"],
  },
  system_of_record: { label: "System of Record", type: "search", entity: "ictsystem" },
  retention_requirement: { label: "Retention Requirement", type: "text" },
  owner: { label: "Owner", type: "search", entity: "stakeholder" },
  related_activity: { label: "Related Activity", type: "text" },

  // ---- canvas / global extra ----
  document_owner: { label: "Document Owner", type: "search", entity: "stakeholder" },
  version: { label: "Version", type: "text" },
  effective_date: { label: "Effective Date", type: "text" },
  review_frequency: {
    label: "Review Frequency",
    type: "select",
    options: ["Monthly", "Quarterly", "Annually", "Bi-annually", "On change"],
  },
  classification_confidentiality: { label: "Classification / Confidentiality", type: "text" },
  scope: { label: "Scope", type: "textarea" },
  inclusions: { label: "Inclusions", type: "textarea" },
  exclusions: { label: "Exclusions", type: "textarea" },
  upstream_processes: { label: "Upstream Process", type: "search", entity: "orgprocess" },
  downstream_processes: { label: "Downstream Process", type: "search", entity: "orgprocess" },
  key_risks: { label: "Key Risk", type: "search", entity: "risk" },
  key_controls: { label: "Key Control", type: "search", entity: "control" },
  key_systems: { label: "Key System", type: "search", entity: "ictsystem" },
  key_roles: { label: "Key Role", type: "search", entity: "stakeholder" },
};

const CORE_KEYS = [
  "process_level",
  "process_reference",
  "parent_process_reference",
  "process_owner",
  "activity_owner_performer",
  "swimlane_lane_name",
  "pool_name",
  "activity_type",
  "activity_description",
  "input_trigger",
  "output_outcome",
  "evidence_artefact",
  "system_tool",
  "business_rule",
  "control_relevance",
  "risk_addressed",
  "frequency_timing",
  "sla_due_date_rule",
  "handoff_next_step",
  "exception_handling",
  "approval_requirement",
  "decision_criteria",
  "data_objects_updated",
  "reporting_requirement",
  "related_policy_standard",
  "version_effective_date",
];

const FLOW_CORE_KEYS = [
  "process_reference",
  "handoff_next_step",
  "exception_handling",
  "related_policy_standard",
  "version_effective_date",
];

const DATA_CORE_KEYS = [
  "process_reference",
  "risk_addressed",
  "related_policy_standard",
  "version_effective_date",
];

// category -> ordered sections of field keys
export const CATEGORY_SECTIONS = {
  canvas: [
    {
      title: "SOP Header",
      fields: [
        "process_level",
        "process_reference",
        "process_name",
        "parent_process_reference",
        "process_owner",
        "document_owner",
        "version",
        "effective_date",
        "review_frequency",
        "classification_confidentiality",
      ],
    },
    { title: "Related Standards", fields: ["related_policy_standard"] },
    {
      title: "Process Context",
      fields: ["scope", "inclusions", "exclusions", "upstream_processes", "downstream_processes"],
    },
    { title: "Key Items", fields: ["key_risks", "key_controls", "key_systems", "key_roles"] },
  ],
  start_event: [
    {
      title: "Start Event",
      fields: [
        "name",
        "start_event_id",
        "trigger_type",
        "trigger_source",
        "trigger_description",
        "minimum_trigger_criteria",
        "required_evidence",
        "receiving_process_activity",
      ],
    },
    { title: "Core BPMN-to-SOP", fields: CORE_KEYS },
  ],
  task: [
    {
      title: "Task / Activity",
      fields: [
        "name",
        "activity_id",
        "activity_type",
        "activity_description",
        "performer_role",
        "supporting_roles",
        "input",
        "procedure_summary",
        "output",
        "evidence",
        "system_tool",
        "business_rules",
        "controls",
        "failure_condition",
        "exception_route",
        "completion_criteria",
      ],
    },
    { title: "Core BPMN-to-SOP", fields: CORE_KEYS },
  ],
  subprocess: [
    {
      title: "Subprocess",
      fields: [
        "name",
        "subprocess_id",
        "parent_process_reference",
        "expanded_process_link",
        "purpose",
        "entry_criteria",
        "exit_criteria",
        "key_outputs",
        "responsible_owner",
        "related_controls",
      ],
    },
    { title: "Core BPMN-to-SOP", fields: CORE_KEYS },
  ],
  gateway: [
    {
      title: "Gateway / Decision",
      fields: [
        "name",
        "gateway_id",
        "gateway_type",
        "decision_question",
        "decision_owner",
        "decision_criteria",
        "possible_outcomes",
        "path_condition",
        "evidence_required",
        "exception_path",
      ],
    },
    { title: "Core BPMN-to-SOP", fields: CORE_KEYS },
  ],
  end_event: [
    {
      title: "End Event",
      fields: [
        "name",
        "end_event_id",
        "end_state_description",
        "final_output",
        "evidence_retained",
        "next_process_triggered",
      ],
    },
    { title: "Core BPMN-to-SOP", fields: CORE_KEYS },
  ],
  sequence_flow: [
    {
      title: "Sequence Flow",
      fields: ["flow_id", "from_element", "to_element", "flow_condition", "handoff_description", "handoff_owner", "sla"],
    },
    { title: "Core BPMN-to-SOP", fields: FLOW_CORE_KEYS },
  ],
  data_object: [
    {
      title: "Data Object / Artefact",
      fields: [
        "name",
        "artefact_id",
        "artefact_type",
        "created_updated_read",
        "system_of_record",
        "retention_requirement",
        "owner",
        "related_activity",
      ],
    },
    { title: "Core BPMN-to-SOP", fields: DATA_CORE_KEYS },
  ],
  default: [
    { title: "Element", fields: ["name"] },
    { title: "Core BPMN-to-SOP", fields: CORE_KEYS },
  ],
};

export const CATEGORY_LABELS = {
  canvas: "Canvas (Global / Process)",
  start_event: "Start Event",
  task: "Task / Activity",
  subprocess: "Subprocess",
  gateway: "Gateway / Decision",
  end_event: "End Event",
  sequence_flow: "Sequence Flow",
  data_object: "Data Object / Artefact",
  default: "Element",
};

// Map a bpmn-js element to a Data Pane category.
export function getElementCategory(element) {
  if (!element) return "default";
  const type = element.type;
  if (type === "label") return "default";
  const bo = element.businessObject || {};
  const $type = bo.$type || type || "";
  if ($type === "bpmn:SequenceFlow" || type === "connection") return "sequence_flow";
  if ($type.startsWith("bpmn:StartEvent")) return "start_event";
  if ($type.startsWith("bpmn:EndEvent")) return "end_event";
  if ($type === "bpmn:SubProcess" || $type === "bpmn:Transaction" || $type === "bpmn:AdHocSubProcess" || $type === "bpmn:CallActivity") return "subprocess";
  if ($type.endsWith("Gateway")) return "gateway";
  if ($type === "bpmn:DataObjectReference" || $type === "bpmn:DataStoreReference") return "data_object";
  if ($type === "bpmn:Participant") return "default";
  if ($type === "bpmn:Lane") return "default";
  // tasks
  if ($type === "bpmn:Task" || $type.endsWith("Task")) return "task";
  return "default";
}
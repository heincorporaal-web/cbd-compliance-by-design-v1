import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// SOD violation analysis for BPMN process steps.
// Accepts either:
//   { elements: [...], company_id } — direct element data from the BPMN designer
//   { process_id, company_id }     — fetch the ProcessDiagram and extract element data
// Returns: { violations: [{ element_a_id, element_a_name, element_b_id, element_b_name, reason, severity, sod_pattern }] }

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { company_id, elements, process_id } = body;

    let stepElements = elements;

    // Mode 2: fetch the ProcessDiagram by process_id and extract element metadata
    if ((!stepElements || !Array.isArray(stepElements)) && process_id) {
      const diagrams = await base44.asServiceRole.entities.ProcessDiagram.filter({ process_id });
      const diagram = diagrams[0];
      if (!diagram || !diagram.element_meta) {
        return Response.json({ violations: [], message: "No diagram found for this process" });
      }
      const elementMeta = diagram.element_meta;
      stepElements = Object.entries(elementMeta).map(([id, meta]) => ({
        id,
        name: meta.name || id,
        activity_type: meta.activity_type || "Task",
        performer_role: meta.performer_role || meta.activity_owner_performer || meta.process_owner || "",
        activity_description: meta.activity_description || "",
        linked_process: meta.linked_process || null,
        process_reference: meta.process_reference || "",
      }));
    }

    if (!stepElements || !Array.isArray(stepElements) || stepElements.length === 0) {
      return Response.json({ error: "No process steps provided for analysis" }, { status: 400 });
    }

    // Build a compact summary of process steps for the LLM
    const stepsSummary = stepElements.map((el, idx) => ({
      step: idx + 1,
      id: el.id,
      name: el.name || "(unnamed)",
      activity_type: el.activity_type || "Task",
      performer: el.performer_role || el.activity_owner_performer || el.process_owner || "unassigned",
      description: (el.activity_description || "").slice(0, 200),
    }));

    // Need at least 2 steps to form a conflict pair
    const meaningfulSteps = stepsSummary.filter(s => s.name !== "(unnamed)" || s.description);
    if (meaningfulSteps.length < 2) {
      return Response.json({ violations: [], message: "Not enough process steps with meaningful data to analyze" });
    }

    const prompt = `You are a Segregation of Duties (SOD) compliance analyst. Analyze the following BPMN process steps and identify potential SOD violations.

SOD violations occur when the same person should not perform two incompatible duties. Common SOD conflict patterns include:
- Preparer/Approver: The person who prepares or enters data should not also approve it
- Custody/Recording: The person with custody of assets should not also record them in the books
- Authorization/Execution: The person who authorizes a transaction should not also execute it
- Review/Execution: The person who performs an activity should not also review or audit it

Process steps to analyze:
${JSON.stringify(meaningfulSteps, null, 2)}

Identify pairs of steps that could be SOD violations if performed by the same person. Consider:
1. Whether the same performer is assigned to both steps (strong signal)
2. Whether the activity types are inherently incompatible (e.g. Task + Approval, Manual task + Review, Task + Control)
3. The nature of the activities based on their names and descriptions
4. Whether the steps form part of a transaction chain (preparer → approver, executor → reviewer)

For each violation found, provide:
- element_a_id and element_b_id: the exact step IDs from the input
- element_a_name and element_b_name: the step names
- reason: a clear explanation of why these two steps create an SOD risk if performed by the same person
- severity: "Critical", "High", "Medium", or "Low"
- sod_pattern: one of "Preparer/Approver", "Custody/Recording", "Authorization/Execution", "Review/Execution", "Other"

Only flag genuine SOD risks — do not flag steps that are naturally performed by the same person (e.g. two sequential data-entry steps). If no violations are found, return an empty violations array.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          violations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                element_a_id: { type: "string" },
                element_a_name: { type: "string" },
                element_b_id: { type: "string" },
                element_b_name: { type: "string" },
                reason: { type: "string" },
                severity: { type: "string" },
                sod_pattern: { type: "string" },
              },
            },
          },
        },
      },
    });

    return Response.json({ violations: result.violations || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
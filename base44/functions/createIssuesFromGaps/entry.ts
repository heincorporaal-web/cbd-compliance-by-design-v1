import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";

// Map gap entity_type -> Issue.linked_entity_type. Entity types not present
// here cannot be linked to an Issue (the Issue schema enum does not include
// PrincipalRisk or DelegationOfAuthority) and are returned as skipped.
const LINKABLE: Record<string, string> = {
  Risk: "Risk",
  Control: "Control",
  ICTSystem: "ICTSystem",
  OrgProcess: "OrgProcess",
  ThirdPartyProvider: "ThirdPartyProvider",
};

const safeList = async (fn: () => Promise<any>) => {
  try { return await fn(); } catch { return []; }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Same non-audit guard as the gap finder
    if (user.role !== "admin") {
      const ucr = await safeList(() =>
        base44.asServiceRole.entities.UserCompanyRole.filter({ user_id: user.id })
      );
      if (ucr.some((r: any) => r.role === "auditor")) {
        return Response.json(
          { error: "This feature is not available to audit roles" },
          { status: 403 }
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const gaps: any[] = Array.isArray(body?.gaps) ? body.gaps : [];

    if (gaps.length === 0) {
      return Response.json({ created: [], skipped: [], error: "No gaps provided" }, { status: 400 });
    }

    // Fetch existing issues to compute a non-colliding sequence for the GAP prefix.
    const existing = await safeList(() =>
      base44.asServiceRole.entities.Issue.list("-created_date", 1000)
    );
    let maxGap = 0;
    for (const i of existing) {
      const m = String(i.reference_number || "").match(/^ISS-GAP-(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxGap) maxGap = n;
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const toCreate: any[] = [];
    const created: any[] = [];
    const skipped: any[] = [];
    let seq = maxGap;

    for (const g of gaps) {
      const linkedType = LINKABLE[g.entity_type];
      if (!linkedType) {
        skipped.push({ ...g, reason: "Entity type not linkable to an Issue" });
        continue;
      }
      seq += 1;
      const ref = `ISS-GAP-${String(seq).padStart(4, "0")}`;
      const priority = g.criticality === "High" ? "high" : "medium";
      const title = `${g.stakeholder_name} still assigned as ${g.field_label} on ${g.entity_label}`;
      const description = [
        `Identified via the Assignment Gap Finder on ${today}.`,
        ``,
        `Stakeholder "${g.stakeholder_name}"` +
          (g.end_date ? ` (end-dated ${g.end_date})` : ` (inactive)`) +
          ` is still assigned as "${g.field_label}" on the ${g.entity_type} record "${g.entity_label}".`,
        ``,
        `Criticality: ${g.criticality}.`,
        ``,
        `Recommended action: reassign this role to an active stakeholder, or remove the assignment if no longer required.`,
      ].join("\n");

      toCreate.push({
        reference_number: ref,
        title,
        description,
        issue_type: "finding",
        status: "open",
        priority,
        linked_entity_type: linkedType,
        linked_entity_id: g.entity_id,
        linked_entity_name: g.entity_label,
        company_id: g.company_id || undefined,
        assigned_to: "",
      });
    }

    if (toCreate.length > 0) {
      const res = await base44.asServiceRole.entities.Issue.bulkCreate(toCreate);
      const arr = Array.isArray(res) ? res : (res as any)?.data || [];
      for (const r of arr) {
        created.push({
          reference_number: r.reference_number,
          title: r.title,
          id: r.id,
          linked_entity_type: r.linked_entity_type,
          linked_entity_id: r.linked_entity_id,
        });
      }
    }

    return Response.json({
      created_count: created.length,
      skipped_count: skipped.length,
      created,
      skipped,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
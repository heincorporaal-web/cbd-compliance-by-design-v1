import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";

// Stakeholder groups whose assignment gaps are rated High criticality.
const HIGH_GROUPS = ["Risk Owner", "Performance Owner", "Control Owner", "Process Owner"];

// Each entry: entity + the stakeholder-ID reference fields to scan, the detail route
// for building a record link, and the field that carries the record's display label.
const SCAN_MAP = [
  {
    entity: "Risk",
    route: "RiskDetail",
    labelField: "title",
    fields: [{ field: "owner_stakeholder_id", label: "Risk Owner" }],
  },
  {
    entity: "Control",
    route: "ControlDetail",
    labelField: "title",
    fields: [
      { field: "owner_stakeholder_id", label: "Control Owner" },
      { field: "reviewer_stakeholder_id", label: "Reviewer" },
    ],
  },
  {
    entity: "ICTSystem",
    route: "ICTSystemDetail",
    labelField: "name",
    fields: [{ field: "owner_stakeholder_id", label: "System Owner" }],
  },
  {
    entity: "OrgProcess",
    route: "ProcessManagementDetail",
    labelField: "name",
    fields: [{ field: "process_owner_stakeholder_id", label: "Process Owner" }],
  },
  {
    entity: "PrincipalRisk",
    route: "PrincipalRisksSummary",
    labelField: "risk_title",
    fields: [
      { field: "risk_owner_id", label: "Risk Owner" },
      { field: "risk_manager_id", label: "Risk Manager" },
      { field: "risk_function_owner_id", label: "Risk Function Owner" },
    ],
  },
  {
    entity: "ThirdPartyProvider",
    route: "ThirdPartyDetail",
    labelField: "name",
    fields: [
      { field: "service_owner_id", label: "Service Owner" },
      { field: "relationship_owner_id", label: "Relationship Owner" },
      { field: "procurement_owner_id", label: "Procurement Owner" },
      { field: "risk_owner_id", label: "Risk Owner" },
      { field: "approver_id", label: "Approver" },
    ],
  },
  {
    entity: "DelegationOfAuthority",
    route: "DelegationOfAuthorityDetail",
    labelField: "title",
    fields: [{ field: "owner_stakeholder_id", label: "DOA Owner" }],
  },
];

const safeList = async (fn) => {
  try { return await fn(); } catch { return []; }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Server-side guard: block the built-in "auditor" company role for non-admins.
    if (user.role !== "admin") {
      const ucr = await safeList(() =>
        base44.asServiceRole.entities.UserCompanyRole.filter({ user_id: user.id })
      );
      if (ucr.some((r) => r.role === "auditor")) {
        return Response.json(
          { error: "This feature is not available to audit roles" },
          { status: 403 }
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const companyId = body?.company_id || "all";

    // Stakeholders + groups (service role for cross-company admin access)
    const [stakeholders, groups] = await Promise.all([
      safeList(() => base44.asServiceRole.entities.Stakeholder.list("-created_date", 1000)),
      safeList(() => base44.asServiceRole.entities.StakeholderGroup.list("-created_date", 1000)),
    ]);
    const groupName = Object.fromEntries(groups.map((g) => [g.id, g.name]));

    const today = new Date().toISOString().slice(0, 10);
    const endDated = stakeholders.filter(
      (s) => (s.end_date && s.end_date <= today) || s.status === "inactive"
    );

    // Fetch every scanned entity in parallel
    const [risk, control, ict, orgProcess, principalRisk, thirdParty, doa] = await Promise.all([
      safeList(() => base44.asServiceRole.entities.Risk.list("-created_date", 1000)),
      safeList(() => base44.asServiceRole.entities.Control.list("-created_date", 1000)),
      safeList(() => base44.asServiceRole.entities.ICTSystem.list("-created_date", 1000)),
      safeList(() => base44.asServiceRole.entities.OrgProcess.list("-created_date", 1000)),
      safeList(() => base44.asServiceRole.entities.PrincipalRisk.list("-created_date", 1000)),
      safeList(() => base44.asServiceRole.entities.ThirdPartyProvider.list("-created_date", 1000)),
      safeList(() => base44.asServiceRole.entities.DelegationOfAuthority.list("-created_date", 1000)),
    ]);
    const datasets = {
      Risk: risk,
      Control: control,
      ICTSystem: ict,
      OrgProcess: orgProcess,
      PrincipalRisk: principalRisk,
      ThirdPartyProvider: thirdParty,
      DelegationOfAuthority: doa,
    };

    const endDatedIds = new Set(endDated.map((s) => s.id));
    const gaps = [];

    for (const cfg of SCAN_MAP) {
      const records = datasets[cfg.entity] || [];
      for (const r of records) {
        if (companyId !== "all" && r.company_id && r.company_id !== companyId) continue;
        for (const f of cfg.fields) {
          const val = r[f.field];
          if (!val || !endDatedIds.has(val)) continue;
          const s = endDated.find((x) => x.id === val);
          const groupNames = (s.group_ids || [])
            .map((id) => groupName[id])
            .filter(Boolean);
          const criticality = groupNames.some((n) => HIGH_GROUPS.includes(n))
            ? "High"
            : "Medium";
          gaps.push({
            stakeholder_id: s.id,
            stakeholder_name: s.full_name,
            end_date: s.end_date || null,
            status: s.status,
            group_names: groupNames,
            criticality,
            entity_type: cfg.entity,
            entity_id: r.id,
            entity_label: r[cfg.labelField] || r.title || r.name || "(untitled)",
            field_label: f.label,
            record_url: `/${cfg.route}?id=${r.id}`,
            company_id: r.company_id || null,
          });
        }
      }
    }

    return Response.json({
      generated_at: new Date().toISOString(),
      company_filter: companyId,
      end_dated_count: endDated.length,
      gap_count: gaps.length,
      high_count: gaps.filter((g) => g.criticality === "High").length,
      medium_count: gaps.filter((g) => g.criticality === "Medium").length,
      gaps,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
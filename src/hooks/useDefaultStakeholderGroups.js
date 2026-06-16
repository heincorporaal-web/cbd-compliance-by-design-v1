/**
 * useDefaultStakeholderGroups
 * Ensures the 7 canonical stakeholder groups exist for every company.
 * Call this hook once on app load (e.g. in Layout or Stakeholders page).
 * It is idempotent — it only creates missing groups.
 */
import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

const DEFAULT_GROUPS = [
  { name: "Risk Owner",             color: "#EF4444", description: "Accountable for risks assigned to them" },
  { name: "Control Owner",          color: "#3B82F6", description: "Accountable for the design and operation of controls" },
  { name: "Process Owner",          color: "#8B5CF6", description: "Accountable for the execution and performance of business processes" },
  { name: "ICT System Owners",      color: "#6366F1", description: "Accountable for ICT systems and their lifecycle" },
  { name: "IT Capability Owner",    color: "#6B7280", description: "Accountable for the management of an IT Capability" },
  { name: "Policy Owner",           color: "#2563EB", description: "Responsible for owning and maintaining policies" },
  { name: "Digital asset owner",    color: "#D97706", description: "Accountable for digital assets assigned to them" },
  { name: "Leadership",             color: "#10B981", description: "Executive, board members and non-executive directors" },
  { name: "Objective Owner",        color: "#0EA5E9", description: "Accountable for the achievement of organisational objectives" },
  { name: "Performance Owner",      color: "#F59E0B", description: "Accountable for monitoring and reporting performance against objectives" },
  { name: "Compliance Owner",       color: "#7C3AED", description: "Accountable for compliance obligations linked to objectives" },
  { name: "IT / Capability Owner",  color: "#059669", description: "Accountable for IT capabilities supporting objectives" },
];

export function useDefaultStakeholderGroups(companyIds = []) {
  useEffect(() => {
    if (!companyIds.length) return;

    async function provision() {
      const existing = await base44.entities.StakeholderGroup.list();

      for (const companyId of companyIds) {
        for (const def of DEFAULT_GROUPS) {
          const alreadyExists = existing.some(
            (g) =>
              g.name === def.name &&
              (g.company_id === companyId || (!g.company_id && companyIds.length === 1))
          );
          if (!alreadyExists) {
            await base44.entities.StakeholderGroup.create({
              ...def,
              company_id: companyId,
              status: "active",
              is_default: true,
            });
          } else {
            // Ensure existing default groups are marked is_default=true
            const match = existing.find(
              (g) => g.name === def.name && (g.company_id === companyId || !g.company_id)
            );
            if (match && !match.is_default) {
              await base44.entities.StakeholderGroup.update(match.id, { is_default: true });
            }
          }
        }
      }
    }

    provision();
  }, [companyIds.join(",")]);
}
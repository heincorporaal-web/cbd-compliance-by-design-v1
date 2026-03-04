/**
 * Utility hook: returns stakeholders filtered by a specific group name (case-insensitive).
 *
 * Usage in any component:
 *   import { useStakeholdersByGroup } from "@/components/stakeholders/useStakeholdersByGroup";
 *   const processOwners = useStakeholdersByGroup("Process Owners");
 *
 * Returns array of active Stakeholder records belonging to that group.
 */
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useStakeholdersByGroup(groupName) {
  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders"],
    queryFn: () => base44.entities.Stakeholder.list(),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["stakeholderGroups"],
    queryFn: () => base44.entities.StakeholderGroup.list(),
  });

  if (!groupName) return stakeholders.filter(s => s.status !== "inactive");

  const group = groups.find(g => g.name?.toLowerCase() === groupName?.toLowerCase());
  if (!group) return [];

  return stakeholders.filter(
    s => s.status !== "inactive" && s.group_ids?.includes(group.id)
  );
}

export function useStakeholderGroups() {
  const { data: groups = [] } = useQuery({
    queryKey: ["stakeholderGroups"],
    queryFn: () => base44.entities.StakeholderGroup.list(),
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders"],
    queryFn: () => base44.entities.Stakeholder.list(),
  });

  return groups
    .filter(g => g.status !== "inactive")
    .map(g => ({
      ...g,
      memberCount: stakeholders.filter(s => s.group_ids?.includes(g.id) && s.status !== "inactive").length,
    }));
}
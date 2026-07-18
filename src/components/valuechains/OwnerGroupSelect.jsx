import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SearchableSelect from "@/components/ui/SearchableSelect";

/**
 * Selects a stakeholder group as the owner of a value chain / workstream.
 * Stores the group name as the value (self-displaying, matches the string
 * "owner" field on these entities).
 */
export default function OwnerGroupSelect({ companyId, value, onValueChange, placeholder = "Select owner group…" }) {
  const { data: groups = [] } = useQuery({
    queryKey: ["stakeholder-groups", companyId || "all"],
    queryFn: () =>
      companyId
        ? base44.entities.StakeholderGroup.filter({ company_id: companyId }, "name")
        : base44.entities.StakeholderGroup.list("name"),
  });

  const options = groups
    .filter(g => g.status !== "inactive")
    .map(g => ({ id: g.name, label: g.name }));

  return (
    <SearchableSelect
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      noneLabel="— No owner —"
    />
  );
}
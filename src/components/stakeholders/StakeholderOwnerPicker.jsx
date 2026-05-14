/**
 * StakeholderOwnerPicker
 * A reusable combobox that lets the user pick a stakeholder from a specific group.
 * Props:
 *   groupName      – name of the StakeholderGroup to filter by (e.g. "Risk Owner")
 *   companyId      – filters stakeholders to this company
 *   value          – currently selected stakeholder ID
 *   onChange(id, stakeholder) – called when selection changes
 *   label          – optional field label (defaults to groupName)
 *   placeholder    – select placeholder text
 */
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function StakeholderOwnerPicker({
  groupName,
  companyId,
  value,
  onChange,
  label,
  placeholder = "Select person…",
}) {
  // Load the matching group(s) for this company (or global)
  const { data: groups = [] } = useQuery({
    queryKey: ["stakeholderGroups"],
    queryFn: () => base44.entities.StakeholderGroup.list(),
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders", companyId],
    queryFn: () =>
      companyId
        ? base44.entities.Stakeholder.filter({ company_id: companyId })
        : base44.entities.Stakeholder.list(),
    enabled: true,
  });

  // Find the group by name (match for this company or global groups with no company)
  const matchingGroup = groups.find(
    (g) =>
      g.name === groupName &&
      (g.company_id === companyId || !g.company_id || g.company_id === "")
  );

  // Filter stakeholders that belong to this group
  const groupStakeholders = matchingGroup
    ? stakeholders.filter((s) => s.group_ids?.includes(matchingGroup.id) && s.status !== "inactive")
    : stakeholders.filter((s) => s.status !== "inactive");

  const selected = stakeholders.find((s) => s.id === value);
  const displayLabel = label ?? groupName;

  return (
    <div className="space-y-1.5">
      {displayLabel && <Label>{displayLabel}</Label>}
      <Select
        value={value || ""}
        onValueChange={(id) => {
          const stakeholder = stakeholders.find((s) => s.id === id);
          onChange(id, stakeholder);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {selected ? (
              <span className="flex items-center gap-2">
                <span>{selected.full_name}</span>
                {selected.job_title && (
                  <Badge variant="outline" className="text-xs font-normal hidden sm:inline-flex">
                    {selected.job_title}
                  </Badge>
                )}
              </span>
            ) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>— None —</SelectItem>
          {groupStakeholders.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <span className="flex flex-col">
                <span>{s.full_name}</span>
                {s.job_title && (
                  <span className="text-xs text-slate-500">{s.job_title}</span>
                )}
              </span>
            </SelectItem>
          ))}
          {groupStakeholders.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400 italic">
              No stakeholders in "{groupName}" group
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
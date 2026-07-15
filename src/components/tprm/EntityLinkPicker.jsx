import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SearchableMultiPicker from "@/components/objectives/SearchableMultiPicker";

/**
 * EntityLinkPicker – fetches all records of an entity and lets the user toggle
 * a multi-select of ids. Respects the current company scope when a companyId is
 * provided (and not "all").
 *
 * Props:
 *   label       – section heading
 *   entityName  – base44 entity name (e.g. "Risk")
 *   selectedIds – array of ids
 *   onToggle    – (id) => void
 *   getLabel    – (item) => string
 *   companyId   – optional; filters items by company_id when not "all"
 *   noCompanyFilter – when true, do not filter by company (library data)
 */
export default function EntityLinkPicker({
  label,
  entityName,
  selectedIds = [],
  onToggle,
  getLabel,
  companyId,
  noCompanyFilter = false,
}) {
  const { data: all = [], isLoading } = useQuery({
    queryKey: ["entityLink", entityName],
    queryFn: () => base44.entities[entityName].list("-created_date", 500),
  });

  const items = noCompanyFilter
    ? all
    : (companyId && companyId !== "all"
        ? all.filter(i => i.company_id === companyId)
        : all);

  if (isLoading) return <p className="text-xs text-slate-400">Loading {label}…</p>;

  return (
    <SearchableMultiPicker
      label={label}
      items={items}
      selectedIds={selectedIds}
      onToggle={onToggle}
      getLabel={getLabel}
    />
  );
}
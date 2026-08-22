import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Loads all frameworks and returns a deduplicated, alphabetically sorted list.
 * Deduplication is by name (case-insensitive), preferring master frameworks.
 * This ensures dropdowns never show duplicate framework entries.
 */
export function useFrameworks() {
  const query = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list('-created_date', 500),
  });

  const frameworks = useMemo(() => {
    const all = query.data || [];
    // Sort so master frameworks come first (preferred during dedup)
    const sorted = [...all].sort((a, b) =>
      (b.is_master ? 1 : 0) - (a.is_master ? 1 : 0)
    );
    const seen = new Map();
    for (const f of sorted) {
      const key = (f.name || "").toLowerCase().trim();
      if (key && !seen.has(key)) seen.set(key, f);
    }
    return Array.from(seen.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [query.data]);

  return { ...query, frameworks };
}
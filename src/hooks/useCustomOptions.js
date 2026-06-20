import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Reads custom options from the database for a given storageKey.
 * Returns { customOptions, isCustom(value), reload }
 */
export function useCustomOptions(storageKey) {
  const [customOptions, setCustomOptions] = useState([]);

  const load = useCallback(async () => {
    try {
      const records = await base44.entities.CustomOptionList.filter({ storage_key: storageKey });
      if (records?.[0]?.options) setCustomOptions(records[0].options);
      else setCustomOptions([]);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    load();

    // Also listen for same-page updates dispatched by EditableOptionSelect
    const onUpdate = (e) => {
      if (e.detail?.storageKey === storageKey) setCustomOptions(e.detail.options);
    };
    window.addEventListener("customOptionsUpdated", onUpdate);
    return () => window.removeEventListener("customOptionsUpdated", onUpdate);
  }, [storageKey, load]);

  const isCustom = (value) => customOptions.some(o => o.value === value);
  const getLabel = (value) => customOptions.find(o => o.value === value)?.label ?? value;

  return { customOptions, isCustom, getLabel, reload: load };
}
import { useState, useEffect } from "react";
import { readFromStorage, subscribe } from "@/lib/customOptionsStore";

/**
 * Reads custom options for a given storageKey.
 * Stays in sync with EditableOptionSelect instances on the same page.
 */
export function useCustomOptions(storageKey) {
  const [customOptions, setCustomOptions] = useState(() => readFromStorage(storageKey));

  useEffect(() => {
    setCustomOptions(readFromStorage(storageKey));
    const unsub = subscribe(storageKey, setCustomOptions);
    return unsub;
  }, [storageKey]);

  const isCustom = (value) => customOptions.some(o => o.value === value);
  const getLabel = (value) => customOptions.find(o => o.value === value)?.label ?? value.replace(/_/g, ' ');

  return { customOptions, isCustom, getLabel };
}
import { useState, useEffect } from "react";
import { loadFromDB, subscribe } from "@/lib/customOptionsStore";

export function useCustomOptions(storageKey) {
  const [customOptions, setCustomOptions] = useState([]);

  useEffect(() => {
    loadFromDB(storageKey).then(setCustomOptions);
    const unsub = subscribe(storageKey, setCustomOptions);
    return unsub;
  }, [storageKey]);

  const isCustom = (value) => customOptions.some(o => o.value === value);
  const getLabel = (value) => customOptions.find(o => o.value === value)?.label ?? value?.replace(/_/g, ' ');

  return { customOptions, isCustom, getLabel };
}
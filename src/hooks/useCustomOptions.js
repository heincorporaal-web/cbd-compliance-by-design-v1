import { useState, useEffect } from "react";
import { loadFromDB, subscribe, setDisabledSeeded } from "@/lib/customOptionsStore";

export function useCustomOptions(storageKey) {
  const [customOptions, setCustomOptions] = useState([]);
  const [disabledSeeded, setDisabledSeededState] = useState([]);

  useEffect(() => {
    let cancelled = false;
    loadFromDB(storageKey).then(() => {
      // loadFromDB populates the cache; subscribe will deliver the initial values
    });
    const unsub = subscribe(storageKey, (opts, disabled) => {
      if (cancelled) return;
      setCustomOptions(opts || []);
      setDisabledSeededState(disabled || []);
    });
    return () => { cancelled = true; unsub(); };
  }, [storageKey]);

  const isCustom = (value) => customOptions.some(o => o.value === value);
  const getLabel = (value) => customOptions.find(o => o.value === value)?.label ?? value?.replace(/_/g, ' ');
  const isDisabledSeeded = (value) => disabledSeeded.includes(value);
  const toggleDisabledSeeded = async (value) => {
    const next = disabledSeeded.includes(value)
      ? disabledSeeded.filter(v => v !== value)
      : [...disabledSeeded, value];
    await setDisabledSeeded(storageKey, next);
  };

  return { customOptions, isCustom, getLabel, disabledSeeded, isDisabledSeeded, toggleDisabledSeeded };
}
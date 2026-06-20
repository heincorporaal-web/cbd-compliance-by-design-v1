import { useState, useEffect } from "react";

/**
 * Reads custom options from localStorage for a given storageKey.
 * Returns { customOptions, isCustom(value) }
 */
export function useCustomOptions(storageKey) {
  const [customOptions, setCustomOptions] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setCustomOptions(JSON.parse(stored));
    } catch {}

    // Listen for storage changes (e.g. added via EditableOptionSelect in another tab or same page)
    const onStorage = (e) => {
      if (e.key === storageKey) {
        try {
          setCustomOptions(JSON.parse(e.newValue) || []);
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  const isCustom = (value) => customOptions.some(o => o.value === value);

  return { customOptions, isCustom };
}
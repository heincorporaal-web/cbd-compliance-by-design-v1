import { useState, useEffect } from "react";

// Import the shared in-memory store helpers from EditableOptionSelect
// We replicate the read/subscribe pattern here to stay in sync

const listeners = {};
const cache = {};

function readFromStorage(storageKey) {
  if (cache[storageKey]) return cache[storageKey];
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      cache[storageKey] = JSON.parse(stored);
      return cache[storageKey];
    }
  } catch {}
  return [];
}

function subscribe(storageKey, fn) {
  if (!listeners[storageKey]) listeners[storageKey] = [];
  listeners[storageKey].push(fn);
  return () => { listeners[storageKey] = listeners[storageKey].filter(f => f !== fn); };
}

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
/**
 * Shared in-memory + localStorage store for custom select options.
 * All instances (EditableOptionSelect + useCustomOptions) share the same cache and listener map.
 */

const listeners = {};
const cache = {};

export function readFromStorage(storageKey) {
  if (cache[storageKey] !== undefined) return cache[storageKey];
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      cache[storageKey] = JSON.parse(stored);
      return cache[storageKey];
    }
  } catch {}
  cache[storageKey] = [];
  return [];
}

export function writeToStorage(storageKey, opts) {
  cache[storageKey] = opts;
  try { localStorage.setItem(storageKey, JSON.stringify(opts)); } catch {}
  (listeners[storageKey] || []).forEach(fn => fn(opts));
}

export function subscribe(storageKey, fn) {
  if (!listeners[storageKey]) listeners[storageKey] = [];
  listeners[storageKey].push(fn);
  return () => { listeners[storageKey] = listeners[storageKey].filter(f => f !== fn); };
}
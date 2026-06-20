/**
 * Shared store for custom select options — persisted in DB via CustomOptionList entity.
 * All instances (EditableOptionSelect + useCustomOptions) share the same cache and listener map.
 */
import { base44 } from "@/api/base44Client";

const listeners = {};
const cache = {}; // storageKey -> { options, recordId }
const pending = {}; // storageKey -> Promise (deduplicates concurrent fetches)

export async function loadFromDB(storageKey) {
  if (cache[storageKey]) return cache[storageKey].options;
  if (pending[storageKey]) return pending[storageKey];

  pending[storageKey] = base44.entities.CustomOptionList
    .filter({ storage_key: storageKey })
    .then(records => {
      const record = records?.[0];
      cache[storageKey] = { options: record?.options || [], recordId: record?.id || null };
      delete pending[storageKey];
      return cache[storageKey].options;
    })
    .catch(() => {
      cache[storageKey] = { options: [], recordId: null };
      delete pending[storageKey];
      return [];
    });

  return pending[storageKey];
}

export async function writeToDB(storageKey, opts) {
  cache[storageKey] = { ...cache[storageKey], options: opts };
  notify(storageKey, opts);

  const recordId = cache[storageKey]?.recordId;
  if (recordId) {
    await base44.entities.CustomOptionList.update(recordId, { options: opts });
  } else {
    const record = await base44.entities.CustomOptionList.create({ storage_key: storageKey, options: opts });
    cache[storageKey].recordId = record.id;
  }
}

export function subscribe(storageKey, fn) {
  if (!listeners[storageKey]) listeners[storageKey] = [];
  listeners[storageKey].push(fn);
  return () => { listeners[storageKey] = listeners[storageKey].filter(f => f !== fn); };
}

function notify(storageKey, opts) {
  (listeners[storageKey] || []).forEach(fn => fn(opts));
}
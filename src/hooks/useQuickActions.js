import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { base44 } from "@/api/base44Client";

const getKey = (userId) => `cbd_quick_actions_${userId || "guest"}`;
const defaultState = () => ({ pinned: [], collapsed: false });

const load = (userId) => {
  try {
    const raw = localStorage.getItem(getKey(userId));
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { pinned: Array.isArray(parsed.pinned) ? parsed.pinned : [], collapsed: !!parsed.collapsed };
  } catch {
    return defaultState();
  }
};

const save = (userId, st) => {
  try { localStorage.setItem(getKey(userId), JSON.stringify(st)); } catch {}
};

// ── Module-level store ────────────────────────────────────────────────────────
let globalUserId = null;
let globalState = defaultState();
let initialised = false;
const subscribers = new Set();

const emitChange = () => subscribers.forEach(fn => fn());

const mutate = (newState) => {
  globalState = newState;
  save(globalUserId, newState);
  emitChange();
};

const subscribe = (fn) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};

const getSnapshot = () => globalState;

const init = async () => {
  try {
    const user = await base44.auth.me();
    globalUserId = user?.id || null;
  } catch {
    globalUserId = null;
  }

  const userState = load(globalUserId);
  const guestState = load(null);

  if (globalUserId && guestState.pinned.length > 0) {
    const merged = [...userState.pinned];
    for (const gp of guestState.pinned) {
      if (!merged.some(p => p.id === gp.id && p.entityType === gp.entityType)) {
        merged.push(gp);
      }
    }
    globalState = { ...userState, pinned: merged };
    save(globalUserId, globalState);
    try { localStorage.removeItem(getKey(null)); } catch {}
  } else {
    globalState = userState;
  }

  emitChange();
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useQuickActions() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!initialised) {
      initialised = true;
      init();
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    mutate({ ...globalState, collapsed: !globalState.collapsed });
  }, []);

  const pinRecord = useCallback((record) => {
    if (globalState.pinned.some(p => p.id === record.id && p.entityType === record.entityType)) return;
    mutate({ ...globalState, pinned: [...globalState.pinned, record] });
  }, []);

  const unpinRecord = useCallback((id, entityType) => {
    mutate({ ...globalState, pinned: globalState.pinned.filter(p => !(p.id === id && p.entityType === entityType)) });
  }, []);

  const isPinned = useCallback((id, entityType) => {
    return globalState.pinned.some(p => p.id === id && p.entityType === entityType);
  }, [state]);

  const reorderPinned = useCallback((from, to) => {
    const next = [...globalState.pinned];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    mutate({ ...globalState, pinned: next });
  }, []);

  return { pinned: state.pinned, collapsed: state.collapsed, toggleCollapsed, pinRecord, unpinRecord, isPinned, reorderPinned };
}
import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const getKey = (userId) => `cbd_quick_actions_${userId || "guest"}`;

const defaultState = () => ({ pinned: [], collapsed: false });

const load = (userId) => {
  try {
    const raw = localStorage.getItem(getKey(userId));
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { pinned: parsed.pinned || [], collapsed: parsed.collapsed || false };
  } catch {
    return defaultState();
  }
};

const save = (userId, state) => {
  try {
    localStorage.setItem(getKey(userId), JSON.stringify(state));
  } catch {}
};

// Shared state across hook instances via a simple event bus
const listeners = new Set();
let globalUserId = null;
let globalState = defaultState();

const notify = () => listeners.forEach(fn => fn({ ...globalState }));

const initUser = async () => {
  try {
    const user = await base44.auth.me();
    globalUserId = user?.id || null;
  } catch {
    globalUserId = null;
  }
  globalState = load(globalUserId);
  notify();
};

// Initialise once
let initialised = false;
const ensureInit = () => {
  if (!initialised) {
    initialised = true;
    initUser();
  }
};

export function useQuickActions() {
  ensureInit();
  const [state, setState] = useState({ ...globalState });

  useEffect(() => {
    const listener = (newState) => setState({ ...newState });
    listeners.add(listener);
    // Sync immediately in case globalState already loaded
    setState({ ...globalState });
    return () => listeners.delete(listener);
  }, []);

  const persist = useCallback((newState) => {
    globalState = newState;
    save(globalUserId, newState);
    notify();
  }, []);

  const toggleCollapsed = useCallback(() => {
    persist({ ...globalState, collapsed: !globalState.collapsed });
  }, [persist]);

  const pinRecord = useCallback((record) => {
    // record: { id, label, entityType, url, icon? }
    if (globalState.pinned.some(p => p.id === record.id && p.entityType === record.entityType)) return;
    persist({ ...globalState, pinned: [...globalState.pinned, record] });
  }, [persist]);

  const unpinRecord = useCallback((id, entityType) => {
    persist({
      ...globalState,
      pinned: globalState.pinned.filter(p => !(p.id === id && p.entityType === entityType)),
    });
  }, [persist]);

  const isPinned = useCallback((id, entityType) => {
    return globalState.pinned.some(p => p.id === id && p.entityType === entityType);
  }, [state]); // depend on state so it's reactive

  const reorderPinned = useCallback((from, to) => {
    const next = [...globalState.pinned];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    persist({ ...globalState, pinned: next });
  }, [persist]);

  return {
    pinned: state.pinned,
    collapsed: state.collapsed,
    toggleCollapsed,
    pinRecord,
    unpinRecord,
    isPinned,
    reorderPinned,
  };
}
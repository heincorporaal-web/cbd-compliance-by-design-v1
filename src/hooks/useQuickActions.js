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
let globalReady = false; // true once userId has been resolved
let globalState = defaultState();

const notify = () => listeners.forEach(fn => fn({ ...globalState }));

const initUser = async () => {
  try {
    const user = await base44.auth.me();
    globalUserId = user?.id || null;
  } catch {
    globalUserId = null;
  }
  globalReady = true;

  // Load the user-keyed state
  const userState = load(globalUserId);

  // If anything was saved to "guest" before auth resolved, merge it in
  const guestState = load(null);
  if (guestState.pinned.length > 0 && globalUserId) {
    // Merge guest pins into user state (avoid duplicates)
    const merged = [...userState.pinned];
    for (const gp of guestState.pinned) {
      if (!merged.some(p => p.id === gp.id && p.entityType === gp.entityType)) {
        merged.push(gp);
      }
    }
    globalState = { ...userState, pinned: merged };
    save(globalUserId, globalState);
    // Clear guest state
    try { localStorage.removeItem(getKey(null)); } catch {}
  } else {
    globalState = userState;
  }

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
    const current = globalState;
    if (current.pinned.some(p => p.id === record.id && p.entityType === record.entityType)) return;
    persist({ ...current, pinned: [...current.pinned, record] });
  }, [persist]);

  const unpinRecord = useCallback((id, entityType) => {
    persist({
      ...globalState,
      pinned: globalState.pinned.filter(p => !(p.id === id && p.entityType === entityType)),
    });
  }, [persist]);

  const isPinned = useCallback((id, entityType) => {
    return state.pinned.some(p => p.id === id && p.entityType === entityType);
  }, [state.pinned]);

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
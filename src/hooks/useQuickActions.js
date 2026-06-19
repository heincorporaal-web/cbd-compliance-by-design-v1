import { useState, useEffect, useCallback, useRef } from "react";
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

const save = (userId, state) => {
  try { localStorage.setItem(getKey(userId), JSON.stringify(state)); } catch {}
};

// Module-level shared state
const listeners = new Set();
let globalUserId = null;
let globalState = defaultState();
let initialised = false;

const notify = () => {
  const copy = { ...globalState };
  listeners.forEach(fn => fn(copy));
};

const mutate = (newState) => {
  globalState = newState;
  save(globalUserId, newState);
  notify();
};

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

  notify();
};

export function useQuickActions() {
  const [state, setState] = useState(globalState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    // Start init only once
    if (!initialised) {
      initialised = true;
      init();
    }

    const listener = (newState) => setState(newState);
    listeners.add(listener);
    // Sync immediately with current global state
    setState({ ...globalState });
    return () => listeners.delete(listener);
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
  }, []);

  const reorderPinned = useCallback((from, to) => {
    const next = [...globalState.pinned];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    mutate({ ...globalState, pinned: next });
  }, []);

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
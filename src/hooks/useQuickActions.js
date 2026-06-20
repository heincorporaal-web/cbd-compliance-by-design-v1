import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const getPinnedKey = (userId) => `cbd_pinned_records_${userId || "guest"}`;
const getColKey   = (userId) => `cbd_quick_actions_${userId || "guest"}`;

const loadPinned = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(getPinnedKey(userId)) || "[]");
  } catch { return []; }
};

const savePinned = (userId, items) => {
  try { localStorage.setItem(getPinnedKey(userId), JSON.stringify(items)); } catch {}
};

export function useQuickActions() {
  const [collapsed, setCollapsed] = useState(false);
  const [userId, setUserId]       = useState(null);
  const [pinned, setPinned]       = useState([]);

  useEffect(() => {
    base44.auth.me().then(user => {
      const uid = user?.id || null;
      setUserId(uid);
      try {
        const raw = localStorage.getItem(getColKey(uid));
        if (raw) setCollapsed(!!JSON.parse(raw).collapsed);
      } catch {}
      setPinned(loadPinned(uid));
    }).catch(() => {
      setPinned(loadPinned(null));
    });
  }, []);

  // Listen for cross-component updates
  useEffect(() => {
    const handler = (e) => setPinned(e.detail?.pinned || []);
    window.addEventListener("cbd_pinned_changed", handler);
    return () => window.removeEventListener("cbd_pinned_changed", handler);
  }, []);

  const broadcast = (items) => {
    window.dispatchEvent(new CustomEvent("cbd_pinned_changed", { detail: { pinned: items } }));
  };

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(getColKey(userId), JSON.stringify({ collapsed: next })); } catch {}
      return next;
    });
  };

  const pinRecord = ({ id, label, entityType, url }) => {
    setPinned(prev => {
      if (prev.find(p => p.id === id && p.entityType === entityType)) return prev;
      const next = [...prev, { id, label, entityType, url }];
      savePinned(userId, next);
      broadcast(next);
      return next;
    });
  };

  const unpinRecord = (id, entityType) => {
    setPinned(prev => {
      const next = prev.filter(p => !(p.id === id && p.entityType === entityType));
      savePinned(userId, next);
      broadcast(next);
      return next;
    });
  };

  const isPinned = (id, entityType) => pinned.some(p => p.id === id && p.entityType === entityType);

  const reorderPinned = (fromIdx, toIdx) => {
    setPinned(prev => {
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      savePinned(userId, next);
      broadcast(next);
      return next;
    });
  };

  return { pinned, collapsed, toggleCollapsed, pinRecord, unpinRecord, isPinned, reorderPinned };
}
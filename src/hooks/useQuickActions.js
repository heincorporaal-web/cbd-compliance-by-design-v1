import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const getKey = (userId) => `cbd_quick_actions_${userId || "guest"}`;

const load = (userId) => {
  try {
    const raw = localStorage.getItem(getKey(userId));
    if (!raw) return { collapsed: false };
    const parsed = JSON.parse(raw);
    return { collapsed: !!parsed.collapsed };
  } catch {
    return { collapsed: false };
  }
};

const save = (userId, st) => {
  try { localStorage.setItem(getKey(userId), JSON.stringify(st)); } catch {}
};

export function useQuickActions() {
  const [collapsed, setCollapsed] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(user => {
      const uid = user?.id || null;
      setUserId(uid);
      const st = load(uid);
      setCollapsed(st.collapsed);
    }).catch(() => {});
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      save(userId, { collapsed: next });
      return next;
    });
  };

  return {
    pinned: [],
    collapsed,
    toggleCollapsed,
    pinRecord: () => {},
    unpinRecord: () => {},
    isPinned: () => false,
    reorderPinned: () => {},
  };
}
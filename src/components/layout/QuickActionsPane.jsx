import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CalendarClock, Star, ChevronLeft, ChevronRight, X,
  Pencil, Check, GripVertical, BookmarkX, Pin, ChevronUp, ChevronDown
} from "lucide-react";
import { ALL_NAV_ITEMS } from "@/components/layout/NavTree";
import { base44 } from "@/api/base44Client";
import { useQuickActions } from "@/hooks/useQuickActions";

// ── Favorites from the nav (page-level) ─────────────────────────────────────
const getFavKey = (userId) => `cbd_favorites_${userId || "guest"}`;

function useNavFavorites() {
  const [favIds, setFavIds] = useState([]);
  const [userId, setUserId] = useState(null);

  const reload = (uid) => {
    try {
      setFavIds(JSON.parse(localStorage.getItem(getFavKey(uid)) || "[]"));
    } catch { setFavIds([]); }
  };

  useEffect(() => {
    base44.auth.me().then(user => {
      const uid = user?.id || null;
      setUserId(uid);
      reload(uid);
    }).catch(() => {
      reload(null);
    });
  }, []);

  // Re-sync when NavTree updates favorites (same tab via custom event, or cross-tab via storage event)
  useEffect(() => {
    const onCustom = (e) => {
      setFavIds(e.detail?.favs || []);
    };
    const onStorage = (e) => {
      if (e.key && e.key.startsWith("cbd_favorites_")) {
        try { setFavIds(JSON.parse(e.newValue || "[]")); } catch {}
      }
    };
    window.addEventListener("cbd_favorites_changed", onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("cbd_favorites_changed", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggleFav = (itemId) => {
    setFavIds(prev => {
      const next = prev.includes(itemId) ? prev.filter(f => f !== itemId) : [...prev, itemId];
      try { localStorage.setItem(getFavKey(userId), JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const moveFav = (itemId, direction) => {
    setFavIds(prev => {
      const idx = prev.indexOf(itemId);
      if (idx === -1) return prev;
      const next = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      try { localStorage.setItem(getFavKey(userId), JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return { favIds, toggleFav, moveFav };
}

// ── Entity type icon/colour map ──────────────────────────────────────────────
const ENTITY_META = {
  Risk:               { color: "text-red-500",    bg: "bg-red-50" },
  Control:            { color: "text-blue-500",   bg: "bg-blue-50" },
  PrincipalRisk:      { color: "text-orange-500", bg: "bg-orange-50" },
  Framework:          { color: "text-indigo-500", bg: "bg-indigo-50" },
  OrgObjective:       { color: "text-purple-500", bg: "bg-purple-50" },
  Incident:           { color: "text-amber-500",  bg: "bg-amber-50" },
  Issue:              { color: "text-rose-500",   bg: "bg-rose-50" },
  ICTSystem:          { color: "text-cyan-600",   bg: "bg-cyan-50" },
  ThirdPartyProvider: { color: "text-teal-600",   bg: "bg-teal-50" },
  DelegationOfAuthority: { color: "text-violet-500", bg: "bg-violet-50" },
  default:            { color: "text-slate-500",  bg: "bg-slate-100" },
};

function entityMeta(type) {
  return ENTITY_META[type] || ENTITY_META.default;
}

// ── Draggable pinned record row ──────────────────────────────────────────────
function PinnedRow({ item, editing, onUnpin, dragging, onDragStart, onDragOver, onDrop, onMoveUp, onMoveDown, isFirst, isLast }) {
  const meta = entityMeta(item.entityType);
  return (
    <div
      draggable={editing}
      onDragStart={onDragStart}
      onDragOver={e => { e.preventDefault(); onDragOver(); }}
      onDrop={onDrop}
      className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
        dragging ? "opacity-40" : ""
      } ${editing ? "hover:bg-slate-100 cursor-grab" : "hover:bg-slate-50"}`}
    >
      {editing && <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 text-xs font-bold ${meta.bg} ${meta.color}`}>
        {(item.entityType || "?")[0]}
      </div>
      {editing ? (
        <span className="flex-1 min-w-0 text-xs text-slate-700 truncate">{item.label}</span>
      ) : (
        <Link
          to={item.url}
          className="flex-1 min-w-0 text-xs text-slate-700 hover:text-primary truncate"
          title={item.label}
        >
          {item.label}
        </Link>
      )}
      {!editing && (
        <span className="text-[10px] text-slate-400 shrink-0 hidden group-hover:block">
          {item.entityType}
        </span>
      )}
      {editing && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-0.5 rounded text-slate-300 hover:text-primary transition-colors disabled:opacity-30"
            title="Move up"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-0.5 rounded text-slate-300 hover:text-primary transition-colors disabled:opacity-30"
            title="Move down"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => onUnpin(item.id, item.entityType)}
            className="p-0.5 rounded text-slate-300 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main pane ────────────────────────────────────────────────────────────────
export default function QuickActionsPane() {
  const location = useLocation();
  const { pinned, collapsed, toggleCollapsed, unpinRecord, reorderPinned } = useQuickActions();
  const { favIds, toggleFav, moveFav } = useNavFavorites();
  const [editing, setEditing] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const favItems = ALL_NAV_ITEMS.filter(i => favIds.includes(i.id));

  const handleDrop = (toIdx) => {
    if (dragIdx === null || dragIdx === toIdx) return;
    reorderPinned(dragIdx, toIdx);
    setDragIdx(null);
    setOverIdx(null);
  };

  // Collapsed state: show just a thin strip with toggle button
  if (collapsed) {
    return (
      <div className="hidden lg:flex flex-col items-center w-10 border-l border-slate-200 bg-white/80 pt-4 gap-3">
        <button
          onClick={toggleCollapsed}
          title="Expand Quick Actions"
          className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="w-px flex-1 bg-slate-100" />
        {/* Dot indicators for pinned items */}
        {pinned.slice(0, 6).map((item, i) => {
          const meta = entityMeta(item.entityType);
          return (
            <Link key={i} to={item.url} title={item.label}>
              <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${meta.bg} ${meta.color}`}>
                {(item.entityType || "?")[0]}
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col w-56 border-l border-slate-200 bg-white/80 backdrop-blur-sm shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Pin className="w-3 h-3" /> Quick Actions
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditing(v => !v)}
            title={editing ? "Done editing" : "Manage items"}
            className={`p-1 rounded transition-colors text-xs ${editing ? "bg-primary text-white" : "text-slate-400 hover:text-primary hover:bg-slate-100"}`}
          >
            {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={toggleCollapsed}
            title="Collapse pane"
            className="p-1 rounded text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-3">

        {/* My Actions */}
        <section className="px-2">
          <Link
            to="/MyActions"
            className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
              location.pathname === "/MyActions"
                ? "bg-amber-100 text-amber-700"
                : "bg-amber-50 text-amber-600 hover:bg-amber-100"
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5 shrink-0" />
            <span>My Actions</span>
          </Link>
        </section>

        {/* Page Favorites */}
        <section className="px-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Favourites
          </p>
          {favItems.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic px-2">
              Star pages in the sidebar menu to pin them here.
            </p>
          ) : (
            <div className="space-y-0.5">
              {favItems.map((item, idx) => (
                <div key={item.id} className="group flex items-center rounded-lg hover:bg-slate-50 transition-colors">
                  <Link
                    to={item.url}
                    className={`flex items-center gap-2 px-2 py-1.5 flex-1 min-w-0 text-xs transition-colors ${
                      location.pathname === item.url ? "text-primary font-semibold" : "text-slate-600 hover:text-primary"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                  {editing && (
                    <div className="flex items-center gap-0.5 mr-1 shrink-0">
                      <button
                        onClick={() => moveFav(item.id, "up")}
                        disabled={idx === 0}
                        className="p-0.5 rounded text-slate-300 hover:text-primary transition-colors disabled:opacity-30"
                        title="Move up"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveFav(item.id, "down")}
                        disabled={idx === favItems.length - 1}
                        className="p-0.5 rounded text-slate-300 hover:text-primary transition-colors disabled:opacity-30"
                        title="Move down"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleFav(item.id)}
                        className="p-0.5 rounded text-slate-300 hover:text-red-500 transition-colors"
                        title="Remove from favourites"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pinned Records */}
        <section className="px-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
            <BookmarkX className="w-2.5 h-2.5" style={{ transform: "rotate(180deg)" }} />
            <span>Pinned Records</span>
          </p>
          {pinned.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic px-2">
              Open any risk, control, or record and click the pin icon to save it here.
            </p>
          ) : (
            <div className="space-y-0.5">
              {pinned.map((item, idx) => (
                <PinnedRow
                  key={`${item.entityType}_${item.id}`}
                  item={item}
                  editing={editing}
                  onUnpin={unpinRecord}
                  dragging={dragIdx === idx}
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={() => setOverIdx(idx)}
                  onDrop={() => handleDrop(idx)}
                  onMoveUp={() => reorderPinned(idx, idx - 1)}
                  onMoveDown={() => reorderPinned(idx, idx + 1)}
                  isFirst={idx === 0}
                  isLast={idx === pinned.length - 1}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {editing && (
        <div className="border-t border-slate-100 px-3 py-2">
          <p className="text-[10px] text-slate-400 italic">
            Use ↑↓ or drag to reorder · × to remove
          </p>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Building2, Shield, ClipboardCheck, Server,
  AlertTriangle, Users, AlertCircle, ClipboardList, TriangleAlert,
  Target, FileCheck, Network, GitBranch, Cog, FileText, Star,
  ChevronDown, ChevronRight, BookOpen, Settings, Layers, Globe,
  Activity, X, PlusCircle, Sparkles
} from "lucide-react";
import { base44 } from "@/api/base44Client";

// ─── Navigation tree definition ──────────────────────────────────────────────
export const NAV_GROUPS = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { id: "dashboard", title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
      { id: "companies", title: "Companies", url: createPageUrl("Companies"), icon: Building2 },
      { id: "knowledge", title: "Knowledge", url: createPageUrl("KnowledgeManagement"), icon: BookOpen },
      { id: "reports", title: "Reports", url: createPageUrl("Reports"), icon: FileText },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    icon: Shield,
    items: [
      { id: "frameworks", title: "Frameworks", url: createPageUrl("Frameworks"), icon: Shield },
      { id: "controls", title: "Controls", url: createPageUrl("Controls"), icon: Shield },
      { id: "framework_mapper", title: "Framework Mapper (AI)", url: createPageUrl("FrameworkControlMapper"), icon: Sparkles },
      { id: "grc_goals", title: "GRC Goals", url: createPageUrl("GRCGoals"), icon: Target },
      { id: "sign_offs", title: "Sign-Offs", url: createPageUrl("SignOffs"), icon: FileCheck },
      { id: "workflows", title: "Workflows", url: createPageUrl("Workflows"), icon: GitBranch },
    ],
  },
  {
    id: "risk",
    label: "Risk Management",
    icon: TriangleAlert,
    items: [
      { id: "risk_register", title: "Risk Register", url: createPageUrl("RiskRegister"), icon: TriangleAlert },
      { id: "risk_engine", title: "Risk Engine", url: createPageUrl("RiskControlEngine"), icon: Cog },
      { id: "issues", title: "Issues", url: createPageUrl("Issues"), icon: AlertCircle },
      { id: "incidents", title: "Incidents", url: createPageUrl("Incidents"), icon: AlertTriangle },
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: ClipboardCheck,
    items: [
      { id: "assessments", title: "Assessments", url: createPageUrl("Assessments"), icon: ClipboardCheck },
      { id: "surveys", title: "Surveys", url: createPageUrl("Surveys"), icon: ClipboardList },
      { id: "third_parties", title: "Third Parties", url: createPageUrl("ThirdParties"), icon: Globe },
    ],
  },
  {
    id: "process",
    label: "Process & Systems",
    icon: Network,
    items: [
      { id: "process_mgmt", title: "Process Management", url: createPageUrl("ProcessManagement"), icon: Network },
      { id: "process_assessments", title: "Process Assessments", url: createPageUrl("ProcessAssessments"), icon: ClipboardCheck },
      { id: "ict_systems", title: "ICT Systems", url: createPageUrl("ICTSystems"), icon: Server },
    ],
  },
  {
    id: "stakeholders",
    label: "Stakeholders",
    icon: Users,
    items: [
      { id: "stakeholders", title: "Stakeholder Management", url: createPageUrl("Stakeholders"), icon: Users },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    icon: Settings,
    items: [
      { id: "users", title: "Users", url: createPageUrl("Users"), icon: Users },
      { id: "roles", title: "Roles", url: createPageUrl("Roles"), icon: Layers },
      { id: "audit_logs", title: "Audit Logs", url: createPageUrl("AuditLogs"), icon: Activity },
    ],
  },
];

// Flatten all items for quick lookup
export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);

// ─── Storage helpers ─────────────────────────────────────────────────────────
const getFavKey = (userId) => `cbd_favorites_${userId || "guest"}`;

const loadFavorites = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(getFavKey(userId)) || "[]");
  } catch {
    return [];
  }
};

const saveFavorites = (userId, favs) => {
  localStorage.setItem(getFavKey(userId), JSON.stringify(favs));
};

// ─── Single nav link ──────────────────────────────────────────────────────────
function NavLink({ item, isActive, favorites, onToggleFav, showFavBtn = false }) {
  const isFav = favorites.includes(item.id);
  return (
    <div className="group flex items-center rounded-lg hover:bg-blue-50 transition-colors">
      <Link
        to={item.url}
        className={`flex items-center gap-2.5 px-3 py-2 flex-1 min-w-0 text-sm ${
          isActive ? "text-blue-700 font-semibold" : "text-slate-700"
        }`}
      >
        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
        <span className="truncate">{item.title}</span>
      </Link>
      {showFavBtn && (
        <button
          onClick={(e) => { e.preventDefault(); onToggleFav(item.id); }}
          className={`mr-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
            isFav ? "opacity-100 text-amber-500" : "text-slate-400 hover:text-amber-500"
          }`}
          title={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <Star className={`w-3.5 h-3.5 ${isFav ? "fill-amber-400" : ""}`} />
        </button>
      )}
    </div>
  );
}

// ─── Collapsible group ────────────────────────────────────────────────────────
function NavGroup({ group, location, favorites, onToggleFav, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasActive = group.items.some(i => location.pathname === i.url);

  // Auto-open if any child is active
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
          hasActive ? "text-blue-700 bg-blue-50" : "text-slate-500 hover:bg-slate-100"
        }`}
      >
        <group.icon className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="ml-2 mt-0.5 border-l-2 border-slate-200 pl-2 space-y-0.5">
          {group.items.map(item => (
            <NavLink
              key={item.id}
              item={item}
              isActive={location.pathname === item.url}
              favorites={favorites}
              onToggleFav={onToggleFav}
              showFavBtn
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main NavTree ─────────────────────────────────────────────────────────────
export default function NavTree() {
  const location = useLocation();
  const [userId, setUserId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favOpen, setFavOpen] = useState(true);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user) {
        setUserId(user.id);
        setFavorites(loadFavorites(user.id));
      }
    }).catch(() => {
      setFavorites(loadFavorites(null));
    });
  }, []);

  const toggleFav = (itemId) => {
    const next = favorites.includes(itemId)
      ? favorites.filter(f => f !== itemId)
      : [...favorites, itemId];
    setFavorites(next);
    saveFavorites(userId, next);
  };

  const favItems = ALL_NAV_ITEMS.filter(i => favorites.includes(i.id));

  return (
    <div className="space-y-1 py-2">
      {/* Favorites section */}
      <div className="mb-2">
        <button
          onClick={() => setFavOpen(v => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span className="flex-1 text-left">Favorites</span>
          {favOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        {favOpen && (
          <div className="ml-2 mt-0.5 border-l-2 border-amber-200 pl-2 space-y-0.5">
            {favItems.length > 0 ? favItems.map(item => (
              <NavLink
                key={item.id}
                item={item}
                isActive={location.pathname === item.url}
                favorites={favorites}
                onToggleFav={toggleFav}
                showFavBtn
              />
            )) : (
              <p className="text-xs text-slate-400 px-3 py-2 italic">
                Star any item in the menu below to pin it here.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 my-2" />

      {/* Nav groups */}
      {NAV_GROUPS.map((group, i) => (
        <NavGroup
          key={group.id}
          group={group}
          location={location}
          favorites={favorites}
          onToggleFav={toggleFav}
          defaultOpen={i === 0}
        />
      ))}
    </div>
  );
}
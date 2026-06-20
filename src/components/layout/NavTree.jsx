import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Building2, Shield, ClipboardCheck, Server,
  AlertTriangle, Users, AlertCircle, ClipboardList, TriangleAlert,
  Target, FileCheck, Network, GitBranch, Cog, FileText, Star,
  ChevronDown, ChevronRight, BookOpen, Settings, Layers, Globe,
  Activity, X, PlusCircle, Sparkles, Cpu, Search, ShieldCheck, HelpCircle, MessageCircle, SlidersHorizontal, Folder, ShieldAlert, CalendarClock
} from "lucide-react";
import { base44 } from "@/api/base44Client";

// ─── Navigation tree definition ──────────────────────────────────────────────
export const NAV_GROUPS = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { id: "my_actions", title: "My Actions", url: createPageUrl("MyActions"), icon: CalendarClock },
      { id: "dashboard", title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
      { id: "companies", title: "Companies", url: createPageUrl("Companies"), icon: Building2 },
      { id: "business_units", title: "Business Units", url: createPageUrl("BusinessUnits"), icon: Network },
      { id: "reports", title: "Reports", url: createPageUrl("Reports"), icon: FileText },
      { id: "knowledge", title: "Knowledge", url: createPageUrl("KnowledgeManagement"), icon: BookOpen },
      { id: "getting_started", title: "Getting Started", url: createPageUrl("GettingStarted"), icon: HelpCircle },
      { id: "help_centre", title: "Help Centre", url: createPageUrl("HelpCentre"), icon: MessageCircle },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    icon: Shield,
    items: [
      { id: "frameworks", title: "Frameworks", url: createPageUrl("Frameworks"), icon: Shield },
      { id: "controls", title: "Controls", url: createPageUrl("Controls"), icon: Shield },
      { id: "control_assessment_cycles", title: "Control Assessment Cycles", url: createPageUrl("ControlAssessmentCycles"), icon: ClipboardList },
      { id: "framework_mapper", title: "Framework Mapper (AI)", url: createPageUrl("FrameworkControlMapper"), icon: Sparkles },
      { id: "grc_goals", title: "GRC Goals", url: createPageUrl("GRCGoals"), icon: Target },
      { id: "org_objectives", title: "Org. Objectives", url: createPageUrl("ObjectivesSummary"), icon: Target },
      { id: "root_cause_categories", title: "Root Cause Categories", url: createPageUrl("RootCauseCategories"), icon: AlertCircle },
    ],
  },
  {
    id: "risk",
    label: "Risk Management",
    icon: TriangleAlert,
    items: [
      { id: "risk_register", title: "Risk Register", url: createPageUrl("RiskRegister"), icon: TriangleAlert },
      { id: "risk_assessment_cycles", title: "Assessment Cycles", url: createPageUrl("RiskAssessmentCycles"), icon: ClipboardList },
      { id: "risk_engine", title: "Risk Engine", url: createPageUrl("RiskControlEngine"), icon: Cog },
      { id: "raci_matrix", title: "RACI Matrix", url: createPageUrl("RACIMatrix"), icon: Layers },
      { id: "principal_risks", title: "Principal Risks", url: createPageUrl("PrincipalRisksSummary"), icon: ShieldAlert },
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
      { id: "it_capabilities", title: "IT Capabilities", url: createPageUrl("ITCapabilities"), icon: Cpu },
      { id: "value_chains", title: "Value Chains", url: createPageUrl("ValueChains"), icon: Network },
    ],
  },
  {
    id: "stakeholders",
    label: "Stakeholders",
    icon: Users,
    items: [
      { id: "stakeholders", title: "Stakeholder Management", url: createPageUrl("Stakeholders"), icon: Users },
      { id: "stakeholder_groups", title: "Stakeholder Groups", url: createPageUrl("Stakeholders") + "?tab=groups", icon: Users },
      { id: "stakeholder_hierarchy", title: "Stakeholder Hierarchy", url: createPageUrl("StakeholderHierarchy"), icon: GitBranch },
      { id: "sign_offs", title: "Sign-Offs", url: createPageUrl("SignOffs"), icon: FileCheck },
      { id: "doa", title: "Delegation of Authority", url: createPageUrl("DelegationOfAuthority"), icon: ShieldCheck },
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
  {
    id: "configuration",
    label: "Configuration",
    icon: Cog,
    items: [
      { id: "workflows", title: "Workflows", url: createPageUrl("Workflows"), icon: GitBranch },
      { id: "configuration", title: "Configuration & Imports", url: createPageUrl("Configuration"), icon: Settings },
      { id: "assessment_models", title: "Assessment Models", url: createPageUrl("AssessmentModels"), icon: SlidersHorizontal },
      { id: "evidence_library", title: "Evidence Library", url: createPageUrl("EvidenceLibrary"), icon: Folder },
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
  // Notify same-tab listeners (storage event only fires in other tabs)
  window.dispatchEvent(new CustomEvent("cbd_favorites_changed", { detail: { userId, favs } }));
};

// ─── Single nav link ──────────────────────────────────────────────────────────
function NavLink({ item, isActive, favorites, onToggleFav, showFavBtn = false }) {
  const isFav = favorites.includes(item.id);
  return (
    <div className="group flex items-center rounded-lg hover:bg-slate-50 transition-colors">
      <Link
        to={item.url}
        className={`flex items-center gap-2.5 px-3 py-2 flex-1 min-w-0 text-sm ${
          isActive ? "text-primary font-semibold" : "text-slate-700"
        }`}
      >
        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-slate-500"}`} />
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
const groupColors = {
  overview: "text-secondary font-medium",
  governance: "text-secondary font-medium",
  risk: "text-secondary font-medium",
  compliance: "text-secondary font-medium",
  process: "text-secondary font-medium",
  stakeholders: "text-secondary font-medium",
  admin: "text-secondary font-medium",
  configuration: "text-secondary font-medium",
};

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
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-secondary font-medium uppercase tracking-wider transition-colors hover:bg-slate-100"
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const searchResults = searchQuery.trim()
    ? ALL_NAV_ITEMS.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  return (
    <div className="space-y-1 py-2">
      {/* Search bar */}
      <div className="px-2 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search menu…"
            className="w-full pl-8 pr-8 py-1.5 text-sm bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {searchResults && (
        <div className="mb-2">
          <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
          </p>
          <div className="ml-2 border-l-2 border-primary/30 pl-2 space-y-0.5">
            {searchResults.length === 0 ? (
              <p className="text-xs text-slate-400 px-3 py-2 italic">No matches found.</p>
            ) : searchResults.map(item => (
              <NavLink
                key={item.id}
                item={item}
                isActive={location.pathname === item.url}
                favorites={favorites}
                onToggleFav={toggleFav}
                showFavBtn
              />
            ))}
          </div>
          <div className="border-t border-slate-200 mt-2" />
        </div>
      )}

      <div className="border-t border-slate-200 my-2" />

      {/* Nav groups — hide when searching */}
      {!searchResults && NAV_GROUPS.map((group, i) => (
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
import {
  LayoutDashboard, CalendarClock, Building2, Network, BookOpen, HelpCircle,
  MessageCircle, Info, Shield, ShieldCheck, ShieldAlert, ShieldQuestion,
  ClipboardList, ClipboardCheck, Sparkles, Target, Gauge, AlertCircle,
  AlertTriangle, TriangleAlert, Cog, Settings, SlidersHorizontal, Layers,
  Globe, Server, Cpu, Workflow, FileText, Presentation, FileSpreadsheet,
  Users, GitBranch, FileCheck, Folder, FolderTree, Activity, Star, Briefcase,
  Boxes, ListTree, Database, Cloud, Lock, Key, Bell, Search,
  BarChart3, PieChart, Link2, Flag, Compass, Anchor, GitMerge, ScrollText,
  Stamp, Route, Waypoints, ListChecks, HardDrive, Webhook, Plug, Cable
} from "lucide-react";

// Curated pool of lucide icons available to assign to nav menu items.
export const NAV_ICON_POOL = [
  { name: "LayoutDashboard", Icon: LayoutDashboard },
  { name: "CalendarClock", Icon: CalendarClock },
  { name: "Building2", Icon: Building2 },
  { name: "Network", Icon: Network },
  { name: "BookOpen", Icon: BookOpen },
  { name: "HelpCircle", Icon: HelpCircle },
  { name: "MessageCircle", Icon: MessageCircle },
  { name: "Info", Icon: Info },
  { name: "Shield", Icon: Shield },
  { name: "ShieldCheck", Icon: ShieldCheck },
  { name: "ShieldAlert", Icon: ShieldAlert },
  { name: "ShieldQuestion", Icon: ShieldQuestion },
  { name: "ClipboardList", Icon: ClipboardList },
  { name: "ClipboardCheck", Icon: ClipboardCheck },
  { name: "Sparkles", Icon: Sparkles },
  { name: "Target", Icon: Target },
  { name: "Gauge", Icon: Gauge },
  { name: "AlertCircle", Icon: AlertCircle },
  { name: "AlertTriangle", Icon: AlertTriangle },
  { name: "TriangleAlert", Icon: TriangleAlert },
  { name: "Cog", Icon: Cog },
  { name: "Settings", Icon: Settings },
  { name: "SlidersHorizontal", Icon: SlidersHorizontal },
  { name: "Layers", Icon: Layers },
  { name: "Globe", Icon: Globe },
  { name: "Server", Icon: Server },
  { name: "Cpu", Icon: Cpu },
  { name: "Workflow", Icon: Workflow },
  { name: "FileText", Icon: FileText },
  { name: "Presentation", Icon: Presentation },
  { name: "FileSpreadsheet", Icon: FileSpreadsheet },
  { name: "Users", Icon: Users },
  { name: "GitBranch", Icon: GitBranch },
  { name: "FileCheck", Icon: FileCheck },
  { name: "Folder", Icon: Folder },
  { name: "FolderTree", Icon: FolderTree },
  { name: "Activity", Icon: Activity },
  { name: "Star", Icon: Star },
  { name: "Briefcase", Icon: Briefcase },
  { name: "Boxes", Icon: Boxes },
  { name: "ListTree", Icon: ListTree },
  { name: "Database", Icon: Database },
  { name: "Cloud", Icon: Cloud },
  { name: "Lock", Icon: Lock },
  { name: "Key", Icon: Key },
  { name: "Bell", Icon: Bell },
  { name: "Search", Icon: Search },
  { name: "BarChart3", Icon: BarChart3 },
  { name: "PieChart", Icon: PieChart },
  { name: "Link2", Icon: Link2 },
  { name: "Flag", Icon: Flag },
  { name: "Compass", Icon: Compass },
  { name: "Anchor", Icon: Anchor },
  { name: "GitMerge", Icon: GitMerge },
  { name: "ScrollText", Icon: ScrollText },
  { name: "Stamp", Icon: Stamp },
  { name: "Route", Icon: Route },
  { name: "Waypoints", Icon: Waypoints },
  { name: "ListChecks", Icon: ListChecks },
  { name: "HardDrive", Icon: HardDrive },
  { name: "Webhook", Icon: Webhook },
  { name: "Plug", Icon: Plug },
  { name: "Cable", Icon: Cable },
];

const ICON_BY_NAME = Object.fromEntries(NAV_ICON_POOL.map((p) => [p.name, p.Icon]));

// Returns the icon component for a nav item: the admin-chosen override if set,
// otherwise the item's default icon component.
export function resolveIcon(customIcons, itemId, defaultIcon) {
  const name = customIcons?.[itemId];
  if (name && ICON_BY_NAME[name]) return ICON_BY_NAME[name];
  return defaultIcon;
}

// Returns the lucide icon name for a default icon component (for highlighting
// the currently-active option in the picker when no override is set).
export function nameForDefaultIcon(defaultIcon) {
  const found = NAV_ICON_POOL.find((p) => p.Icon === defaultIcon);
  return found ? found.name : null;
}
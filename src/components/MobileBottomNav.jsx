import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarClock, FileCheck, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Mobile is restricted to manager self-service: an optimised dashboard with
// basic stats (low GUI interaction), action items, pending approvals, and
// self-service help. No setup or maintenance surfaces are exposed.
const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/Dashboard" },
  { label: "Actions", icon: CalendarClock, path: "/MyActions" },
  { label: "Approvals", icon: FileCheck, path: "/SignOffs" },
  { label: "Help", icon: HelpCircle, path: "/HelpCentre" },
];

export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
        const active = location.pathname === path || location.pathname.startsWith(path + "?");
        return (
          <Link
            key={path}
            to={path}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 no-select transition-colors",
              active ? "text-primary" : "text-slate-400"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
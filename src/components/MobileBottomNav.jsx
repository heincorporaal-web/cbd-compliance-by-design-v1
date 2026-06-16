import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShieldAlert, ShieldCheck, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/Dashboard" },
  { label: "Risks", icon: ShieldAlert, path: "/RiskRegister" },
  { label: "Controls", icon: ShieldCheck, path: "/Controls" },
  { label: "Settings", icon: Settings, path: "/MobileSettings" },
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
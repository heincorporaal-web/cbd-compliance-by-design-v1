import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";

import NotificationCenter from "@/components/notifications/NotificationCenter";
import NavTree from "@/components/layout/NavTree";
import QuickActionsPane from "@/components/layout/QuickActionsPane";
import CompanyFilterBar from "@/components/CompanyFilterBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { base44 } from "@/api/base44Client";
import { useIsMobile } from "@/hooks/use-mobile";
import { brandForRoute } from "@/lib/moduleBrands";
import { ArrowLeft } from "lucide-react";

function UserFooter() {
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
        <span className="text-white font-semibold text-sm">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm truncate">{user?.full_name || "User"}</p>
        <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
      </div>
    </div>
  );
}

function CBDLogo() {
  return (
    <svg viewBox="0 0 40 40" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
      {/* Left column - tall, navy */}
      <rect x="3" y="10" width="10" height="24" rx="1.5" fill="#0f2d4a" />
      <rect x="3" y="22" width="10" height="12" rx="1.5" fill="#0a3d6b" />
      {/* Left column top accent - cyan */}
      <rect x="3" y="10" width="10" height="8" rx="1.5" fill="#0891b2" />

      {/* Middle column - tallest, dark teal + cyan */}
      <rect x="15" y="6" width="10" height="28" rx="1.5" fill="#0f4c5c" />
      <rect x="15" y="6" width="10" height="12" rx="1.5" fill="#06b6d4" />
      <rect x="15" y="18" width="10" height="16" rx="1.5" fill="#0e7490" />

      {/* Right column - shorter, orange bottom */}
      <rect x="27" y="14" width="10" height="20" rx="1.5" fill="#155e75" />
      <rect x="27" y="14" width="10" height="10" rx="1.5" fill="#0ea5e9" />
      <rect x="27" y="28" width="10" height="6" rx="1.5" fill="#f97316" />
    </svg>
  );
}

function ModuleBrandMark() {
  const { pathname } = useLocation();
  const brand = brandForRoute(pathname);
  if (!brand) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shadow flex items-center justify-center">
          <CBDLogo />
        </div>
        <h1 className="text-xl font-bold text-slate-900">CBD</h1>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shadow flex items-center justify-center shrink-0 ring-1 ring-slate-200">
        <img src={brand.logoUrl} alt={brand.name} className="w-6 h-6 object-contain" />
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        <h1 className="text-base font-bold text-slate-900 truncate">{brand.name}</h1>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${brand.badgeBg} shrink-0`}>
          {brand.short}
        </span>
      </div>
      <Link
        to={brand.landingPath}
        className={`hidden md:inline-flex items-center gap-1 ml-1 text-xs ${brand.text} font-medium hover:underline shrink-0`}
      >
        <ArrowLeft className="w-3 h-3" /> overview
      </Link>
    </div>
  );
}

export default function Layout({ children }) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
        {!isMobile && (
          <Sidebar className="border-r border-slate-200">
            <SidebarHeader
              className="border-b border-slate-200 p-4"
              style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg bg-white flex items-center justify-center">
                  <CBDLogo />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">CBD</h2>
                  <p className="text-xs text-primary/70">Compliance by Design</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="px-2 overflow-y-auto">
              <NavTree />
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200 p-4">
              <UserFooter />
            </SidebarFooter>
          </Sidebar>
        )}

        <main className="flex-1 flex flex-col min-w-0">
          <header
            className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-10"
            style={{ paddingTop: isMobile ? "max(0.75rem, env(safe-area-inset-top))" : undefined }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {!isMobile && (
                  <SidebarTrigger className="lg:hidden hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                )}
                <ModuleBrandMark />
              </div>
              <div className="ml-auto flex items-center gap-3">
                <CompanyFilterBar />
                <NotificationCenter />
              </div>
            </div>
          </header>

          <div
            className="flex-1 overflow-auto min-w-0"
            style={{ paddingBottom: isMobile ? "calc(4rem + env(safe-area-inset-bottom))" : undefined }}
          >
            {children}
          </div>
        </main>

        {!isMobile && <QuickActionsPane />}

        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
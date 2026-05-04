import React from "react";

import NotificationCenter from "@/components/notifications/NotificationCenter";
import NavTree from "@/components/layout/NavTree";
import CompanyFilterBar from "@/components/CompanyFilterBar";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { base44 } from "@/api/base44Client";

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

export default function Layout({ children }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar className="border-r border-slate-200">
          <SidebarHeader className="border-b border-slate-200 p-4">
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

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                <div className="flex items-center gap-2 lg:hidden">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shadow flex items-center justify-center">
                    <CBDLogo />
                  </div>
                  <h1 className="text-xl font-bold text-slate-900">CBD</h1>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <CompanyFilterBar />
                <NotificationCenter />
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
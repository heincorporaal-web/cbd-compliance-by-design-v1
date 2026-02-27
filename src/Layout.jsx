import React from "react";
import { Shield } from "lucide-react";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import NavTree from "@/components/layout/NavTree";
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

export default function Layout({ children }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar className="border-r border-slate-200">
          <SidebarHeader className="border-b border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">CBD</h2>
                <p className="text-xs text-slate-500">Compliance by Design</p>
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
                <h1 className="text-xl font-bold text-slate-900 lg:hidden">CBD</h1>
              </div>
              <div className="ml-auto">
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
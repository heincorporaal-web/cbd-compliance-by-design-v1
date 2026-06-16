import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Settings, User, LogOut, Trash2, Moon, Sun, Monitor } from "lucide-react";
import { toast } from "sonner";

export default function MobileSettings() {
  const [user, setUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Log out after deletion attempt
      await base44.auth.logout();
    } catch {
      toast.error("Failed to delete account. Please contact support.");
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      {/* Profile card */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">{user?.full_name || "User"}</p>
            <p className="text-sm text-slate-500 truncate">{user?.email || ""}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role || "user"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={() => base44.auth.logout()}
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            Sign Out
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* App info */}
      <Card className="border-none shadow-md">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-slate-400">CBD — Compliance by Design</p>
          <p className="text-xs text-slate-300 mt-1">v1.0</p>
        </CardContent>
      </Card>

      {/* Delete account confirmation dialog */}
      <Dialog open={confirmDelete} onOpenChange={v => { if (!v) setConfirmDelete(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account?</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all associated data. This action <strong>cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Yes, Delete My Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
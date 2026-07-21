import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Users as UsersIcon, Plus, Search, Shield, Mail, Briefcase,
  Building2, Edit2, ChevronDown, ChevronUp, UserCheck, Crown, Lock
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserCompanyAssignments from "@/components/users/UserCompanyAssignments";
import { format } from "date-fns";
import PageHeader from "@/components/layout/PageHeader";

function permissionCount(permissions) {
  if (!permissions) return 0;
  return Object.values(permissions).reduce((sum, mod) => sum + Object.values(mod).filter(Boolean).length, 0);
}

function UserAvatar({ user }) {
  const initials = user.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : (user.email?.[0] || "U").toUpperCase();
  return (
    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/80 to-secondary flex items-center justify-center shrink-0">
      <span className="text-white font-semibold text-base">{initials}</span>
    </div>
  );
}

export default function Users() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list("-created_date"),
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ["userRoles"],
    queryFn: () => base44.entities.UserRole.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: allCompanyRoles = [] } = useQuery({
    queryKey: ["allUserCompanyRoles"],
    queryFn: () => base44.entities.UserCompanyRole.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["users"]); setEditingUser(null); toast.success("User updated"); },
  });

  const handleInvite = async () => {
    await base44.users.inviteUser(inviteEmail, inviteRole);
    setIsInviteOpen(false);
    setInviteEmail("");
    setInviteRole("user");
    toast.success("Invitation sent");
  };

  const filtered = useMemo(() => users.filter(u => {
    if (filterStatus !== "all" && (u.status || "active") !== filterStatus) return false;
    if (filterRole === "admin" && u.role !== "admin") return false;
    if (filterRole === "user" && u.role !== "user") return false;
    if (filterRole === "custom" && !u.custom_role_id) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
    }
    return true;
  }), [users, search, filterRole, filterStatus]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => (u.status || "active") === "active").length,
    admins: users.filter(u => u.role === "admin").length,
    withCustomRole: users.filter(u => u.custom_role_id).length,
  }), [users]);

  const getRole = (id) => userRoles.find(r => r.id === id);
  const getCompanyRoles = (userId) => allCompanyRoles.filter(r => r.user_id === userId);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <PageHeader
          navItemId="users"
          icon={UsersIcon}
          title="User Management"
          tagline="Invite, manage, and assign GRC roles to platform users"
          gradient="from-blue-600 to-indigo-700"
        />
        <Button onClick={() => setIsInviteOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Invite User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users",            value: stats.total,          icon: UsersIcon,  color: "text-primary" },
          { label: "Active Users",           value: stats.active,         icon: UserCheck,  color: "text-green-600" },
          { label: "Admins",                 value: stats.admins,         icon: Crown,      color: "text-purple-600" },
          { label: "Custom Roles Assigned",  value: stats.withCustomRole, icon: Shield,     color: "text-blue-600" },
        ].map(s => (
          <Card key={s.label} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-7 h-7 ${s.color}`} />
              <div>
                <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search name, email, or department…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All system roles</SelectItem>
            <SelectItem value="admin">Admins only</SelectItem>
            <SelectItem value="user">Standard users</SelectItem>
            <SelectItem value="custom">Has custom role</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User list */}
      <Card className="border-none shadow-sm">
        <CardHeader className="border-b border-slate-100 py-3 px-5">
          <CardTitle className="text-sm font-semibold text-slate-500">Users ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <UsersIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No users match your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(user => {
                const customRole = getRole(user.custom_role_id);
                const companyRoles = getCompanyRoles(user.id);
                const isExpanded = expandedUserId === user.id;
                const isActive = (user.status || "active") === "active";

                return (
                  <div key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <div className="px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <UserAvatar user={user} />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isActive ? "bg-green-400" : "bg-slate-300"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-slate-900">{user.full_name || "—"}</span>
                            <Badge className={`text-xs border-0 ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                              {user.role === "admin" ? <><Crown className="w-2.5 h-2.5 mr-1 inline" />Admin</> : "User"}
                            </Badge>
                            {customRole && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Shield className="w-2.5 h-2.5 inline mr-0.5" />{customRole.name}
                              </Badge>
                            )}
                            {!isActive && <Badge variant="outline" className="text-xs bg-slate-50 text-slate-400">Inactive</Badge>}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>
                            {user.department && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{user.department}</span>}
                            {user.created_date && <span>Joined {format(new Date(user.created_date), "dd MMM yyyy")}</span>}
                          </div>
                          {user.assigned_company_id && (
                            <div className="mt-2">
                              <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 rounded px-2 py-0.5">
                                <Lock className="w-3 h-3" />Login: {user.assigned_company_name || companies.find(c => c.id === user.assigned_company_id)?.name || "Assigned"}
                              </span>
                            </div>
                          )}
                          {companyRoles.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {companyRoles.map(cr => {
                                const co = companies.find(c => c.id === cr.company_id);
                                return (
                                  <span key={cr.id} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded px-2 py-0.5">
                                    <Building2 className="w-3 h-3" />
                                    {co?.name || cr.company_name} · <span className="font-medium">{cr.role}</span>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setExpandedUserId(isExpanded ? null : user.id)}>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingUser({ ...user })}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded: permission detail */}
                    {isExpanded && customRole?.permissions && (
                      <div className="px-5 pb-4 bg-slate-50/60 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-3 mb-2">
                          Permissions via &quot;{customRole.name}&quot; — {permissionCount(customRole.permissions)} granted
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(customRole.permissions).map(([modKey, perms]) => {
                            const granted = Object.entries(perms).filter(([, v]) => v).map(([k]) => k);
                            if (granted.length === 0) return null;
                            return (
                              <span key={modKey} className="text-xs bg-white border border-slate-200 text-slate-600 rounded px-2 py-0.5">
                                <span className="font-medium capitalize">{modKey.replace(/_/g, " ")}</span>: {granted.join(", ")}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Invite New User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" />
            </div>
            <div className="space-y-2">
              <Label>System Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User — standard access</SelectItem>
                  <SelectItem value="admin">Admin — full platform access</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">System role controls platform-level access. Assign a custom GRC role after the user joins.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={!inviteEmail}>
                <Mail className="w-4 h-4 mr-2" />Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={v => !v && setEditingUser(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit User — {editingUser?.full_name || editingUser?.email}</DialogTitle></DialogHeader>
          {editingUser && (
            <Tabs defaultValue="profile">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="role">Role</TabsTrigger>
                <TabsTrigger value="companies">Companies</TabsTrigger>
              </TabsList>
              <TabsContent value="profile" className="space-y-4 pt-2">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <UserAvatar user={editingUser} />
                  <div>
                    <p className="font-semibold text-slate-800">{editingUser.full_name}</p>
                    <p className="text-sm text-slate-500">{editingUser.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={editingUser.department || ""} onChange={e => setEditingUser(p => ({ ...p, department: e.target.value }))} placeholder="e.g., Compliance" />
                </div>
                <div className="space-y-2">
                  <Label>Login Company {editingUser.role === "admin" ? "(N/A — admins access all companies)" : "*"}</Label>
                  <Select
                    value={editingUser.assigned_company_id || ""}
                    onValueChange={v => {
                      const co = companies.find(c => c.id === v);
                      setEditingUser(p => ({ ...p, assigned_company_id: v || null, assigned_company_name: co?.name || "" }));
                    }}
                    disabled={editingUser.role === "admin"}
                  >
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">Standard users are locked to this company on login and the company selector is hidden for them. Admins retain access to all companies.</p>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editingUser.status || "active"} onValueChange={v => setEditingUser(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              <TabsContent value="role" className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>System Role</Label>
                  <div className="flex gap-2">
                    {["user","admin"].map(r => (
                      <button key={r} type="button"
                        onClick={() => setEditingUser(p => ({ ...p, role: r }))}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${editingUser.role === r ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                      >
                        {r === "admin" ? "Admin" : "User"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Custom GRC Role</Label>
                  <Select value={editingUser.custom_role_id || ""} onValueChange={v => setEditingUser(p => ({ ...p, custom_role_id: v || null }))}>
                    <SelectTrigger><SelectValue placeholder="No custom role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {userRoles.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editingUser.custom_role_id && (() => {
                    const role = getRole(editingUser.custom_role_id);
                    if (!role) return null;
                    return (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                        <p className="text-xs font-semibold text-slate-700">{role.name}</p>
                        <p className="text-xs text-slate-400">{role.description}</p>
                        <p className="text-xs text-primary font-medium">{permissionCount(role.permissions)} permissions granted</p>
                      </div>
                    );
                  })()}
                </div>
              </TabsContent>
              <TabsContent value="companies" className="pt-2">
                <UserCompanyAssignments user={editingUser} />
              </TabsContent>
            </Tabs>
          )}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ id: editingUser.id, data: editingUser })} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
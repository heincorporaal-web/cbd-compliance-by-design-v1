import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users as UsersIcon, Plus, Search, Shield, Mail, Phone, Briefcase, Edit2, Building2 } from "lucide-react";
import { toast } from "sonner";
import UserCompanyAssignments from "@/components/users/UserCompanyAssignments";

export default function Users() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date'),
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ['userRoles'],
    queryFn: () => base44.entities.UserRole.list(),
  });

  const { data: allUserCompanyRoles = [] } = useQuery({
    queryKey: ['allUserCompanyRoles'],
    queryFn: () => base44.entities.UserCompanyRole.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setEditingUser(null);
      toast.success('User updated successfully');
    },
  });

  const handleInvite = async () => {
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("user");
      toast.success('User invitation sent');
    } catch (error) {
      toast.error('Failed to invite user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700';
  };

  const getRoleColor = (role) => {
    return role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <UsersIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
              <p className="text-slate-600">Manage users, roles, and permissions</p>
            </div>
          </div>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>System Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleInvite} disabled={!inviteEmail}>Send Invitation</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No users found</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredUsers.map(user => {
                const customRole = userRoles.find(r => r.id === user.custom_role_id);
                return (
                  <div key={user.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                          <span className="text-slate-700 font-semibold text-lg">
                            {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{user.full_name || 'Unnamed User'}</h3>
                            <Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                            {customRole && (
                              <Badge variant="outline">{customRole.name}</Badge>
                            )}
                            <Badge className={getStatusColor(user.status || 'active')}>
                              {user.status || 'active'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </div>
                            )}
                            {user.department && (
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {user.department}
                              </div>
                            )}
                          </div>
                          {user.assigned_workflow_tasks?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-slate-500">
                                {user.assigned_workflow_tasks.filter(t => t.status === 'pending').length} pending workflow tasks
                              </p>
                            </div>
                          )}
                          {(() => {
                            const userAssignments = allUserCompanyRoles.filter(r => r.user_id === user.id);
                            if (userAssignments.length === 0) return null;
                            return (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {userAssignments.map(a => {
                                  const co = companies.find(c => c.id === a.company_id);
                                  return (
                                    <span key={a.id} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">
                                      <Building2 className="w-3 h-3" />
                                      {co?.name || a.company_name} · {a.role}
                                    </span>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setEditingUser(user)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Custom Role</Label>
                              <Select
                                value={editingUser?.custom_role_id || ''}
                                onValueChange={(value) => setEditingUser({ ...editingUser, custom_role_id: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select custom role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={null}>None</SelectItem>
                                  {userRoles.map(role => (
                                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Department</Label>
                              <Input
                                value={editingUser?.department || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                                placeholder="e.g., Compliance"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Phone</Label>
                              <Input
                                value={editingUser?.phone || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                                placeholder="+1234567890"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Status</Label>
                              <Select
                                value={editingUser?.status || 'active'}
                                onValueChange={(value) => setEditingUser({ ...editingUser, status: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Separator />
                            {editingUser && <UserCompanyAssignments user={editingUser} />}
                            <Separator />
                            <div className="flex justify-end gap-2">
                               <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                               <Button onClick={() => updateUserMutation.mutate({ id: editingUser.id, data: editingUser })}>
                                 Save Changes
                               </Button>
                             </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
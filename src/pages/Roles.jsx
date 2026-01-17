import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Roles() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    permissions: {
      companies: { view: false, create: false, edit: false, delete: false },
      frameworks: { view: false, create: false, edit: false, delete: false },
      assessments: { view: false, create: false, edit: false, delete: false },
      risks: { view: false, create: false, edit: false, delete: false },
      controls: { view: false, create: false, edit: false, delete: false },
      processes: { view: false, create: false, edit: false, delete: false },
      workflows: { view: false, create: false, edit: false, delete: false },
      users: { view: false, create: false, edit: false, delete: false }
    },
    restricted_company_ids: [],
    status: "active"
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['userRoles'],
    queryFn: () => base44.entities.UserRole.list('-created_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const createRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.UserRole.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['userRoles']);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Role created successfully');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserRole.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['userRoles']);
      setEditingRole(null);
      resetForm();
      toast.success('Role updated successfully');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.UserRole.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['userRoles']);
      toast.success('Role deleted successfully');
    },
  });

  useEffect(() => {
    if (roles.length === 0 && !createRoleMutation.isPending) {
      createRoleMutation.mutate({
        name: "Admin",
        description: "Full system access",
        is_system_role: true,
        permissions: {
          companies: { view: true, create: true, edit: true, delete: true },
          frameworks: { view: true, create: true, edit: true, delete: true },
          assessments: { view: true, create: true, edit: true, delete: true },
          risks: { view: true, create: true, edit: true, delete: true },
          controls: { view: true, create: true, edit: true, delete: true },
          processes: { view: true, create: true, edit: true, delete: true },
          workflows: { view: true, create: true, edit: true, delete: true },
          users: { view: true, create: true, edit: true, delete: true }
        },
        status: "active"
      });
    }
  }, [roles.length, createRoleMutation.isPending]);

  const resetForm = () => {
    setRoleFormData({
      name: "",
      description: "",
      permissions: {
        companies: { view: false, create: false, edit: false, delete: false },
        frameworks: { view: false, create: false, edit: false, delete: false },
        assessments: { view: false, create: false, edit: false, delete: false },
        risks: { view: false, create: false, edit: false, delete: false },
        controls: { view: false, create: false, edit: false, delete: false },
        processes: { view: false, create: false, edit: false, delete: false },
        workflows: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false }
      },
      restricted_company_ids: [],
      status: "active"
    });
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setRoleFormData(role);
  };

  const handleSubmit = () => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data: roleFormData });
    } else {
      createRoleMutation.mutate(roleFormData);
    }
  };

  const togglePermission = (module, action) => {
    setRoleFormData({
      ...roleFormData,
      permissions: {
        ...roleFormData.permissions,
        [module]: {
          ...roleFormData.permissions[module],
          [action]: !roleFormData.permissions[module][action]
        }
      }
    });
  };

  const toggleCompanyRestriction = (companyId) => {
    const current = roleFormData.restricted_company_ids || [];
    const updated = current.includes(companyId)
      ? current.filter(id => id !== companyId)
      : [...current, companyId];
    setRoleFormData({ ...roleFormData, restricted_company_ids: updated });
  };

  const modules = [
    { key: 'companies', label: 'Companies' },
    { key: 'frameworks', label: 'Frameworks' },
    { key: 'assessments', label: 'Assessments' },
    { key: 'risks', label: 'Risks' },
    { key: 'controls', label: 'Controls' },
    { key: 'processes', label: 'Processes' },
    { key: 'workflows', label: 'Workflows' },
    { key: 'users', label: 'Users' }
  ];

  const actions = ['view', 'create', 'edit', 'delete'];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Role Management</h1>
              <p className="text-slate-600">Define custom roles and permissions</p>
            </div>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="companies">Company Access</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-2">
                  <Label>Role Name</Label>
                  <Input
                    value={roleFormData.name}
                    onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                    placeholder="e.g., Compliance Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>
              <TabsContent value="permissions">
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Define what actions this role can perform</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium text-slate-700">Module</th>
                          {actions.map(action => (
                            <th key={action} className="text-center p-3 text-sm font-medium text-slate-700 capitalize">
                              {action}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {modules.map(module => (
                          <tr key={module.key}>
                            <td className="p-3 font-medium text-slate-900">{module.label}</td>
                            {actions.map(action => (
                              <td key={action} className="p-3 text-center">
                                <Checkbox
                                  checked={roleFormData.permissions[module.key]?.[action]}
                                  onCheckedChange={() => togglePermission(module.key, action)}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="companies">
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Leave empty for access to all companies, or select specific companies
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {companies.map(company => (
                      <div key={company.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                        <Checkbox
                          checked={roleFormData.restricted_company_ids?.includes(company.id)}
                          onCheckedChange={() => toggleCompanyRestriction(company.id)}
                        />
                        <Label className="cursor-pointer">{company.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!roleFormData.name}>
                Create Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Roles ({roles.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {roles.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              Creating default Admin role...
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {roles.map(role => (
                <div key={role.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{role.name}</h3>
                        {role.is_system_role && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">System</Badge>
                        )}
                        <Badge className={role.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                          {role.status}
                        </Badge>
                      </div>
                      {role.description && (
                        <p className="text-sm text-slate-600 mb-2">{role.description}</p>
                      )}
                      {role.restricted_company_ids?.length > 0 && (
                        <p className="text-xs text-slate-500">
                          Access restricted to {role.restricted_company_ids.length} companies
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(role)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Role: {role.name}</DialogTitle>
                          </DialogHeader>
                          <Tabs defaultValue="details">
                            <TabsList>
                              <TabsTrigger value="details">Details</TabsTrigger>
                              <TabsTrigger value="permissions">Permissions</TabsTrigger>
                              <TabsTrigger value="companies">Company Access</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details" className="space-y-4">
                              <div className="space-y-2">
                                <Label>Role Name</Label>
                                <Input
                                  value={roleFormData.name}
                                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                                  disabled={role.is_system_role}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={roleFormData.description}
                                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                                  rows={3}
                                />
                              </div>
                            </TabsContent>
                            <TabsContent value="permissions">
                              <div className="space-y-4">
                                <div className="border rounded-lg overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-slate-50">
                                      <tr>
                                        <th className="text-left p-3 text-sm font-medium text-slate-700">Module</th>
                                        {actions.map(action => (
                                          <th key={action} className="text-center p-3 text-sm font-medium text-slate-700 capitalize">
                                            {action}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {modules.map(module => (
                                        <tr key={module.key}>
                                          <td className="p-3 font-medium text-slate-900">{module.label}</td>
                                          {actions.map(action => (
                                            <td key={action} className="p-3 text-center">
                                              <Checkbox
                                                checked={roleFormData.permissions[module.key]?.[action]}
                                                onCheckedChange={() => togglePermission(module.key, action)}
                                              />
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </TabsContent>
                            <TabsContent value="companies">
                              <div className="space-y-4">
                                <p className="text-sm text-slate-600">
                                  Leave empty for access to all companies
                                </p>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                  {companies.map(company => (
                                    <div key={company.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                                      <Checkbox
                                        checked={roleFormData.restricted_company_ids?.includes(company.id)}
                                        onCheckedChange={() => toggleCompanyRestriction(company.id)}
                                      />
                                      <Label className="cursor-pointer">{company.name}</Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => { setEditingRole(null); resetForm(); }}>
                              Cancel
                            </Button>
                            <Button onClick={handleSubmit}>
                              Save Changes
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {!role.is_system_role && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRoleMutation.mutate(role.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
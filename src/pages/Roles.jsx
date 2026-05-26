import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Plus, Edit2, Trash2, ChevronDown, ChevronRight, CheckCircle2, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Module Groups & Actions ─────────────────────────────────────────────────
const MODULE_GROUPS = [
  {
    label: "Governance",
    color: "text-blue-700 bg-blue-50",
    modules: [
      { key: "companies",   label: "Companies & Entities" },
      { key: "frameworks",  label: "Frameworks & Standards" },
      { key: "objectives",  label: "Objectives & Principle Risks" },
      { key: "doa",         label: "Delegation of Authority" },
    ],
  },
  {
    label: "Risk Management",
    color: "text-red-700 bg-red-50",
    modules: [
      { key: "risks",         label: "Risk Register" },
      { key: "risk_cycles",   label: "Risk Assessment Cycles" },
      { key: "incidents",     label: "Incidents" },
      { key: "issues",        label: "Issues & Actions" },
    ],
  },
  {
    label: "Controls & Audit",
    color: "text-green-700 bg-green-50",
    modules: [
      { key: "controls",       label: "Controls Library" },
      { key: "control_cycles", label: "Control Assessment Cycles" },
      { key: "workpapers",     label: "Control Workpapers" },
      { key: "test_plans",     label: "Test Plans" },
    ],
  },
  {
    label: "Evidence & Assessments",
    color: "text-purple-700 bg-purple-50",
    modules: [
      { key: "evidence",          label: "Evidence Library" },
      { key: "assessments",       label: "Assessments" },
      { key: "assessment_models", label: "Assessment Models" },
    ],
  },
  {
    label: "Processes & Systems",
    color: "text-cyan-700 bg-cyan-50",
    modules: [
      { key: "processes",     label: "Processes & Value Chains" },
      { key: "ict_systems",   label: "ICT Systems" },
      { key: "third_parties", label: "Third Parties" },
      { key: "surveys",       label: "Surveys" },
    ],
  },
  {
    label: "People & Stakeholders",
    color: "text-amber-700 bg-amber-50",
    modules: [
      { key: "stakeholders", label: "Stakeholders & Groups" },
      { key: "sign_offs",    label: "Sign-offs" },
      { key: "grc_goals",    label: "GRC Goals" },
    ],
  },
  {
    label: "Administration",
    color: "text-slate-700 bg-slate-100",
    modules: [
      { key: "workflows",     label: "Workflows" },
      { key: "users",         label: "User Management" },
      { key: "reports",       label: "Reports & Exports" },
      { key: "configuration", label: "Configuration & Imports" },
      { key: "audit_logs",    label: "Audit Logs" },
    ],
  },
];

const ACTIONS = [
  { key: "view",    label: "View" },
  { key: "create",  label: "Create" },
  { key: "edit",    label: "Edit" },
  { key: "delete",  label: "Delete" },
  { key: "approve", label: "Approve" },
  { key: "export",  label: "Export" },
];

const ALL_MODULE_KEYS = MODULE_GROUPS.flatMap(g => g.modules.map(m => m.key));

const buildEmptyPermissions = () =>
  Object.fromEntries(ALL_MODULE_KEYS.map(k => [k, Object.fromEntries(ACTIONS.map(a => [a.key, false]))]));

// ─── Computed Status (never manually set) ────────────────────────────────────
function computeRoleStatus(role) {
  const today = new Date().toISOString().slice(0, 10);
  if (role.active_from && today < role.active_from) return "scheduled";
  if (role.active_to && today > role.active_to) return "expired";
  return "active";
}

const STATUS_STYLE = {
  active:    "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  expired:   "bg-slate-100 text-slate-500",
};

// ─── Role Templates ───────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    name: "Platform Admin",
    description: "Full access to all modules and administration",
    color: "bg-purple-100 text-purple-800",
    build: () => Object.fromEntries(ALL_MODULE_KEYS.map(k => [k, Object.fromEntries(ACTIONS.map(a => [a.key, true]))])),
  },
  {
    name: "GRC Manager",
    description: "Manage all GRC activities; no user/config admin",
    color: "bg-blue-100 text-blue-800",
    build: () => {
      const p = buildEmptyPermissions();
      const full = ["companies","frameworks","objectives","doa","risks","risk_cycles","incidents","issues","controls","control_cycles","workpapers","test_plans","evidence","assessments","assessment_models","processes","ict_systems","third_parties","surveys","stakeholders","sign_offs","grc_goals","workflows","reports"];
      full.forEach(k => ACTIONS.forEach(a => { p[k][a.key] = true; }));
      ["users","configuration","audit_logs"].forEach(k => { p[k].view = true; });
      return p;
    },
  },
  {
    name: "Compliance Analyst",
    description: "Create and manage risk, control, and assessment records; cannot approve or administer",
    color: "bg-cyan-100 text-cyan-800",
    build: () => {
      const p = buildEmptyPermissions();
      const rw = ["risks","risk_cycles","controls","control_cycles","workpapers","test_plans","evidence","assessments","issues","incidents","surveys"];
      rw.forEach(k => { p[k].view = true; p[k].create = true; p[k].edit = true; p[k].export = true; });
      ["companies","frameworks","objectives","processes","ict_systems","stakeholders","reports"].forEach(k => { p[k].view = true; p[k].export = true; });
      return p;
    },
  },
  {
    name: "Control Owner",
    description: "View and update controls and workpapers assigned to them; read-only elsewhere",
    color: "bg-green-100 text-green-800",
    build: () => {
      const p = buildEmptyPermissions();
      ["controls","workpapers","test_plans","evidence"].forEach(k => { p[k].view = true; p[k].edit = true; p[k].create = true; });
      ["companies","frameworks","risks","assessments","processes","ict_systems"].forEach(k => { p[k].view = true; });
      return p;
    },
  },
  {
    name: "Assessor / Auditor",
    description: "Perform assessments and upload evidence; cannot approve or delete",
    color: "bg-amber-100 text-amber-800",
    build: () => {
      const p = buildEmptyPermissions();
      ["workpapers","evidence","assessments","issues"].forEach(k => { p[k].view = true; p[k].create = true; p[k].edit = true; });
      ["controls","control_cycles","risks","risk_cycles","processes","stakeholders","reports"].forEach(k => { p[k].view = true; p[k].export = true; });
      return p;
    },
  },
  {
    name: "Read Only",
    description: "View-only access across all modules",
    color: "bg-slate-100 text-slate-700",
    build: () => Object.fromEntries(ALL_MODULE_KEYS.map(k => [k, { ...Object.fromEntries(ACTIONS.map(a => [a.key, false])), view: true }])),
  },
];

function permissionCount(permissions) {
  if (!permissions) return 0;
  return Object.values(permissions).reduce((sum, mod) => sum + (mod ? Object.values(mod).filter(Boolean).length : 0), 0);
}

function PermissionMatrix({ permissions, onChange, readOnly = false }) {
  const [collapsed, setCollapsed] = useState({});

  const toggleGroup = (label) => setCollapsed(p => ({ ...p, [label]: !p[label] }));
  const toggleAll = (moduleKey, checked) => ACTIONS.forEach(a => onChange(moduleKey, a.key, checked));
  const isRowFull = (moduleKey) => ACTIONS.every(a => permissions[moduleKey]?.[a.key]);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-2.5 font-semibold text-slate-600 w-56">Module</th>
            {ACTIONS.map(a => (
              <th key={a.key} className="text-center px-2 py-2.5 font-semibold text-slate-600 text-xs min-w-[54px]">{a.label}</th>
            ))}
            {!readOnly && <th className="text-center px-2 py-2.5 font-semibold text-slate-600 text-xs w-14">All</th>}
          </tr>
        </thead>
        <tbody>
          {MODULE_GROUPS.map(group => (
            <React.Fragment key={group.label}>
              <tr className="cursor-pointer" onClick={() => toggleGroup(group.label)}>
                <td colSpan={ACTIONS.length + (readOnly ? 1 : 2)} className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {collapsed[group.label] ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${group.color}`}>{group.label}</span>
                  </div>
                </td>
              </tr>
              {!collapsed[group.label] && group.modules.map(mod => (
                <tr key={mod.key} className="border-t border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-2 pl-8 text-slate-700">{mod.label}</td>
                  {ACTIONS.map(a => (
                    <td key={a.key} className="text-center px-2 py-2">
                      <Checkbox
                        checked={permissions[mod.key]?.[a.key] || false}
                        onCheckedChange={checked => !readOnly && onChange(mod.key, a.key, checked)}
                        disabled={readOnly}
                        className="mx-auto"
                      />
                    </td>
                  ))}
                  {!readOnly && (
                    <td className="text-center px-2 py-2">
                      <Checkbox
                        checked={isRowFull(mod.key)}
                        onCheckedChange={checked => toggleAll(mod.key, checked)}
                        className="mx-auto"
                      />
                    </td>
                  )}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleDialog({ open, onOpenChange, editingRole, companies }) {
  const queryClient = useQueryClient();
  const emptyForm = { name: "", description: "", permissions: buildEmptyPermissions(), restricted_company_ids: [], active_from: "", active_to: "" };
  const [form, setForm] = useState(emptyForm);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  useEffect(() => {
    if (editingRole) {
      setForm({
        name: editingRole.name || "",
        description: editingRole.description || "",
        permissions: editingRole.permissions || buildEmptyPermissions(),
        restricted_company_ids: editingRole.restricted_company_ids || [],
        active_from: editingRole.active_from || "",
        active_to: editingRole.active_to || "",
      });
    } else {
      setForm(emptyForm);
      setSelectedTemplate("");
    }
  }, [editingRole, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UserRole.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["userRoles"]); onOpenChange(false); toast.success("Role created"); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserRole.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["userRoles"]); onOpenChange(false); toast.success("Role updated"); },
  });

  const applyTemplate = (tpl) => {
    const t = TEMPLATES.find(t => t.name === tpl);
    if (!t) return;
    setForm(p => ({ ...p, name: p.name || t.name, description: p.description || t.description, permissions: t.build() }));
    setSelectedTemplate(tpl);
  };

  const togglePermission = (moduleKey, actionKey, checked) => {
    setForm(p => ({
      ...p,
      permissions: { ...p.permissions, [moduleKey]: { ...p.permissions[moduleKey], [actionKey]: checked } }
    }));
  };

  const toggleCompany = (id) => {
    setForm(p => ({
      ...p,
      restricted_company_ids: p.restricted_company_ids.includes(id)
        ? p.restricted_company_ids.filter(x => x !== id)
        : [...p.restricted_company_ids, id]
    }));
  };

  const handleSubmit = () => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const previewStatus = computeRoleStatus(form);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRole ? `Edit Role: ${editingRole.name}` : "Create New Role"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="companies">Company Scope</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {!editingRole && (
              <div className="space-y-2">
                <Label>Start from a template <span className="text-slate-400 text-xs">(optional)</span></Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => applyTemplate(t.name)}
                      className={`text-left p-3 rounded-lg border text-sm transition-all ${selectedTemplate === t.name ? "border-primary ring-1 ring-primary/30" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.color}`}>{t.name}</span>
                        {selectedTemplate === t.name && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-tight">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Role Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Compliance Manager" disabled={editingRole?.is_system_role} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe what this role is responsible for…" />
            </div>

            {/* Active period — status is computed, never manual */}
            <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalendarRange className="w-4 h-4" />
                Active Period
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Active From <span className="text-slate-400">(optional)</span></Label>
                  <Input type="date" value={form.active_from} onChange={e => setForm(p => ({ ...p, active_from: e.target.value }))} />
                  <p className="text-xs text-slate-400">Leave blank to activate immediately</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Active To <span className="text-slate-400">(optional)</span></Label>
                  <Input type="date" value={form.active_to} onChange={e => setForm(p => ({ ...p, active_to: e.target.value }))} />
                  <p className="text-xs text-slate-400">Leave blank for no expiry</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200">
                <span className="text-slate-400">Computed status:</span>
                <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_STYLE[previewStatus]}`}>{previewStatus}</span>
                {form.active_from && <span className="text-slate-400 ml-2">From {form.active_from}</span>}
                {form.active_to && <span className="text-slate-400">{form.active_from ? " · " : ""}Expires {form.active_to}</span>}
                {!form.active_from && !form.active_to && <span className="text-slate-400">No date restrictions — always active</span>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-slate-500">Define what actions this role can perform across all platform modules.</p>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{permissionCount(form.permissions)} permissions granted</span>
            </div>
            <PermissionMatrix permissions={form.permissions} onChange={togglePermission} readOnly={editingRole?.is_system_role} />
          </TabsContent>

          <TabsContent value="companies">
            <p className="text-sm text-slate-500 mb-4">Restrict this role to specific companies. Leave all unchecked for access to all companies.</p>
            {companies.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No companies configured yet.</p>
            ) : (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-50 max-h-80 overflow-y-auto">
                {companies.map(c => (
                  <label key={c.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 ${form.restricted_company_ids.includes(c.id) ? "bg-primary/5" : ""}`}>
                    <Checkbox checked={form.restricted_company_ids.includes(c.id)} onCheckedChange={() => toggleCompany(c.id)} />
                    <span className="text-sm text-slate-700 font-medium">{c.name}</span>
                    {c.industry && <span className="text-xs text-slate-400 ml-auto">{c.industry}</span>}
                  </label>
                ))}
              </div>
            )}
            {form.restricted_company_ids.length > 0 && (
              <p className="text-xs text-amber-600 mt-2">
                This role is scoped to {form.restricted_company_ids.length} company(ies). Users will only see data for those companies.
              </p>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.name || isPending}>
            {isPending ? "Saving…" : editingRole ? "Save Changes" : "Create Role"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Roles() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [search, setSearch] = useState("");

  const { data: roles = [] } = useQuery({
    queryKey: ["userRoles"],
    queryFn: () => base44.entities.UserRole.list("-created_date"),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserRole.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["userRoles"]); toast.success("Role deleted"); },
  });

  const filteredRoles = roles.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase())
  );

  const getUsersWithRole = (roleId) => users.filter(u => u.custom_role_id === roleId).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Role Management</h1>
            <p className="text-slate-500 text-sm">Define granular roles with per-module permissions across all GRC workflows</p>
          </div>
        </div>
        <Button onClick={() => { setEditingRole(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Create Role
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Roles",         value: roles.length },
          { label: "Active",              value: roles.filter(r => computeRoleStatus(r) === "active").length },
          { label: "Scheduled / Expired", value: roles.filter(r => computeRoleStatus(r) !== "active").length },
          { label: "Users Assigned",      value: users.filter(u => u.custom_role_id).length },
        ].map(s => (
          <Card key={s.label} className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-800">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input className="pl-9" placeholder="Search roles…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filteredRoles.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50">
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No roles found. Create your first role to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRoles.map(role => {
            const status = computeRoleStatus(role);
            const count = permissionCount(role.permissions);
            const userCount = getUsersWithRole(role.id);
            const scopedCount = role.restricted_company_ids?.length || 0;
            return (
              <Card key={role.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-slate-900 text-base">{role.name}</h3>
                        {role.is_system_role && <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">System</Badge>}
                        <Badge className={`border-0 capitalize ${STATUS_STYLE[status]}`}>{status}</Badge>
                      </div>
                      {role.description && <p className="text-sm text-slate-500 line-clamp-2">{role.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingRole(role); setDialogOpen(true); }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      {!role.is_system_role && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600" onClick={() => deleteMutation.mutate(role.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Permission summary */}
                  {role.permissions && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {MODULE_GROUPS.map(group =>
                        group.modules.filter(m => {
                          const perms = role.permissions[m.key];
                          return perms && Object.values(perms).some(Boolean);
                        }).map(m => {
                          const perms = role.permissions[m.key];
                          const granted = ACTIONS.filter(a => perms[a.key]).map(a => a.label[0]).join("");
                          return (
                            <span key={m.key} className={`text-xs px-2 py-0.5 rounded-full font-medium ${group.color}`} title={`${m.label}: ${ACTIONS.filter(a => perms[a.key]).map(a => a.label).join(", ")}`}>
                              {m.label.split(" ")[0]} <span className="opacity-60">[{granted}]</span>
                            </span>
                          );
                        })
                      )}
                    </div>
                  )}

                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 pt-2 border-t border-slate-50">
                    <span><span className="font-semibold text-slate-600">{count}</span> permissions</span>
                    <span><span className="font-semibold text-slate-600">{userCount}</span> user{userCount !== 1 ? "s" : ""}</span>
                    {scopedCount > 0
                      ? <span className="text-amber-600"><span className="font-semibold">{scopedCount}</span> companies scoped</span>
                      : <span className="text-green-600">All companies</span>
                    }
                    {role.active_from && <span className="flex items-center gap-1"><CalendarRange className="w-3 h-3" />From {role.active_from}</span>}
                    {role.active_to && <span className="text-slate-400">Expires {role.active_to}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RoleDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingRole(null); }}
        editingRole={editingRole}
        companies={companies}
      />
    </div>
  );
}
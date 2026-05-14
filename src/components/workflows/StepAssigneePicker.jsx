/**
 * StepAssigneePicker
 *
 * A reusable sub-form for choosing WHO is assigned to a workflow step.
 * Supports four modes:
 *   1. named_emails        — free-text comma-separated emails (legacy)
 *   2. named_stakeholders  — pick individual stakeholders from the register
 *   3. stakeholder_group   — pick one or more stakeholder groups (all members are assigned)
 *   4. dynamic_role        — pick an entity field that holds the person at runtime
 *
 * Props:
 *   label            {string}   — e.g. "Approvers" or "Recipients"
 *   assigneeType     {string}   — current mode
 *   emails           {string[]} — named_emails list
 *   groupIds         {string[]} — stakeholder_group_ids
 *   stakeholderIds   {string[]} — named_stakeholder_ids
 *   dynamicField     {string}   — dynamic_role_field
 *   entityType       {string}   — e.g. "OrgProcess" (drives dynamic field options)
 *   onChange         {fn({assigneeType, emails, groupIds, stakeholderIds, dynamicField})}
 *
 *   stakeholders     {array}    — pre-loaded Stakeholder records
 *   stakeholderGroups {array}   — pre-loaded StakeholderGroup records
 */
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, User, Mail, Cpu, X, Search } from "lucide-react";

// Dynamic role options per entity type — maps to entity field names
const DYNAMIC_ROLE_OPTIONS = {
  OrgProcess: [
    { value: "process_owner",                label: "Process Owner (free text / email)" },
    { value: "process_owner_id",             label: "Process Owner (system user)" },
    { value: "process_owner_stakeholder_id", label: "Process Owner (stakeholder)" },
    { value: "deputy_owner",                 label: "Deputy Owner" },
    { value: "global_control_owner",         label: "Global Control Owner" },
  ],
  Assessment: [
    { value: "assessor_email",  label: "Assessor" },
    { value: "reviewer_email",  label: "Reviewer" },
    { value: "approver",        label: "Approver" },
  ],
  Risk: [
    { value: "owner", label: "Risk Owner" },
  ],
  Issue: [
    { value: "assigned_to", label: "Assigned To" },
  ],
  Framework: [
    { value: "reviewer", label: "Reviewer" },
    { value: "approver", label: "Approver" },
  ],
};

const ASSIGNEE_MODES = [
  { value: "named_emails",       label: "Named Emails",        icon: Mail,  description: "Enter email addresses directly" },
  { value: "named_stakeholders", label: "Named Stakeholders",  icon: User,  description: "Pick individuals from the stakeholder register" },
  { value: "stakeholder_group",  label: "Stakeholder Group",   icon: Users, description: "Route to all members of a group (resolved at runtime)" },
  { value: "dynamic_role",       label: "Dynamic Role",        icon: Cpu,   description: "Route to the person assigned to a specific role on the item" },
];

export default function StepAssigneePicker({
  label = "Assignees",
  assigneeType = "named_emails",
  emails = [],
  groupIds = [],
  stakeholderIds = [],
  dynamicField = "",
  entityType = "",
  onChange,
  stakeholders = [],
  stakeholderGroups = [],
}) {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const emit = (patch) => onChange({ assigneeType, emails, groupIds, stakeholderIds, dynamicField, ...patch });

  const dynamicOptions = DYNAMIC_ROLE_OPTIONS[entityType] || [];

  // Summary chips for collapsed view
  const summary = () => {
    if (assigneeType === 'named_emails') return emails.length ? emails.join(', ') : 'Not set';
    if (assigneeType === 'stakeholder_group') {
      const names = groupIds.map(id => stakeholderGroups.find(g => g.id === id)?.name || id);
      return names.length ? names.join(', ') : 'Not set';
    }
    if (assigneeType === 'named_stakeholders') {
      const names = stakeholderIds.map(id => stakeholders.find(s => s.id === id)?.full_name || id);
      return names.length ? names.join(', ') : 'Not set';
    }
    if (assigneeType === 'dynamic_role') {
      const opt = dynamicOptions.find(o => o.value === dynamicField);
      return opt ? opt.label : (dynamicField || 'Not set');
    }
    return 'Not set';
  };

  const filteredStakeholders = stakeholders.filter(s => {
    const q = search.toLowerCase();
    return !q || s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.job_title?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>

      {/* Mode selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
        {ASSIGNEE_MODES.map(mode => {
          const Icon = mode.icon;
          const active = assigneeType === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => emit({ assigneeType: mode.value })}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all ${
                active
                  ? 'border-purple-400 bg-purple-50 text-purple-800 shadow-sm'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              }`}
              title={mode.description}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-purple-600' : 'text-slate-400'}`} />
              {mode.label}
            </button>
          );
        })}
      </div>

      {/* === Named Emails === */}
      {assigneeType === 'named_emails' && (
        <Input
          value={emails.join(', ')}
          onChange={e => emit({ emails: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="user1@example.com, user2@example.com"
          className="h-8 text-sm"
        />
      )}

      {/* === Stakeholder Group === */}
      {assigneeType === 'stakeholder_group' && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {groupIds.map(gid => {
              const group = stakeholderGroups.find(g => g.id === gid);
              return (
                <Badge key={gid} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1.5">
                  <Users className="w-3 h-3" />
                  {group?.name || gid}
                  <button type="button" onClick={() => emit({ groupIds: groupIds.filter(id => id !== gid) })}>
                    <X className="w-3 h-3 text-purple-400 hover:text-red-500" />
                  </button>
                </Badge>
              );
            })}
          </div>
          <Select
            value=""
            onValueChange={v => { if (!groupIds.includes(v)) emit({ groupIds: [...groupIds, v] }); }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Add a stakeholder group…" />
            </SelectTrigger>
            <SelectContent>
              {stakeholderGroups.filter(g => g.status !== 'inactive' && !groupIds.includes(g.id)).map(g => (
                <SelectItem key={g.id} value={g.id}>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-purple-500" />
                    {g.name}
                  </div>
                </SelectItem>
              ))}
              {stakeholderGroups.filter(g => g.status !== 'inactive' && !groupIds.includes(g.id)).length === 0 && (
                <div className="px-3 py-2 text-xs text-slate-400">All groups already added</div>
              )}
            </SelectContent>
          </Select>
          {groupIds.length > 0 && (
            <p className="text-xs text-slate-400">
              All active members of the selected group(s) will be notified/assigned at runtime.
            </p>
          )}
        </div>
      )}

      {/* === Named Stakeholders === */}
      {assigneeType === 'named_stakeholders' && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {stakeholderIds.map(sid => {
              const s = stakeholders.find(x => x.id === sid);
              return (
                <Badge key={sid} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1.5">
                  <User className="w-3 h-3" />
                  {s ? `${s.full_name}${s.job_title ? ` (${s.job_title})` : ''}` : sid}
                  <button type="button" onClick={() => emit({ stakeholderIds: stakeholderIds.filter(id => id !== sid) })}>
                    <X className="w-3 h-3 text-indigo-400 hover:text-red-500" />
                  </button>
                </Badge>
              );
            })}
          </div>
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              className="w-full pl-7 pr-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Search stakeholder by name, title or email…"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            />
          </div>
          {showSearch && search && (
            <div className="border border-border rounded-md shadow-sm bg-white max-h-48 overflow-y-auto">
              {filteredStakeholders.filter(s => !stakeholderIds.includes(s.id)).slice(0, 20).map(s => (
                <div
                  key={s.id}
                  className="px-3 py-2 text-sm hover:bg-accent cursor-pointer flex items-center gap-2"
                  onMouseDown={() => {
                    emit({ stakeholderIds: [...stakeholderIds, s.id] });
                    setSearch("");
                  }}
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                    {(s.full_name || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{s.job_title}{s.department ? ` · ${s.department}` : ''}</p>
                  </div>
                </div>
              ))}
              {filteredStakeholders.filter(s => !stakeholderIds.includes(s.id)).length === 0 && (
                <p className="px-3 py-2 text-xs text-slate-400">No stakeholders found</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* === Dynamic Role === */}
      {assigneeType === 'dynamic_role' && (
        <div className="space-y-2">
          {dynamicOptions.length > 0 ? (
            <Select value={dynamicField || ''} onValueChange={v => emit({ dynamicField: v })}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select a role field on the entity…" />
              </SelectTrigger>
              <SelectContent>
                {dynamicOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={dynamicField || ''}
              onChange={e => emit({ dynamicField: e.target.value })}
              placeholder="Entity field name, e.g. process_owner_id"
              className="h-8 text-sm"
            />
          )}
          {dynamicField && (
            <p className="text-xs text-slate-400">
              At runtime, the workflow will read <code className="bg-slate-100 px-1 rounded">{dynamicField}</code> from the item and resolve the assigned person automatically.
            </p>
          )}
        </div>
      )}

      {/* Summary hint when mode is not named_emails */}
      {assigneeType !== 'named_emails' && (
        <p className="text-xs text-slate-500 italic">Resolved: {summary()}</p>
      )}
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users, Grid3X3, Building2 } from "lucide-react";
import StakeholderGroupsPanel from "@/components/stakeholders/StakeholderGroupsPanel";
import StakeholderListPanel from "@/components/stakeholders/StakeholderListPanel";
import StakeholderMatrixPanel from "@/components/stakeholders/StakeholderMatrixPanel";
import StakeholderDialog from "@/components/stakeholders/StakeholderDialog";
import HRImportDialog from "@/components/stakeholders/HRImportDialog";
import StakeholderHistoryDialog from "@/components/stakeholders/StakeholderHistoryDialog";
import { Upload } from "lucide-react";
import { useDefaultStakeholderGroups } from "@/hooks/useDefaultStakeholderGroups";
import StakeholderGroupReportButton from "@/components/stakeholders/StakeholderGroupReportButton";
import GroupAssignmentImportButton from "@/components/stakeholders/GroupAssignmentImportButton";
import { useIsImplementerRole } from "@/hooks/useIsImplementerRole";

export default function Stakeholders() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(urlParams.get("tab") || "list");
  const [search, setSearch] = useState("");
  const [filterGroupId, setFilterGroupId] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hrImportOpen, setHrImportOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState(null);
  const [historyStakeholder, setHistoryStakeholder] = useState(null);
  const { canImport } = useIsImplementerRole();

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders"],
    queryFn: () => base44.entities.Stakeholder.list(),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["stakeholderGroups"],
    queryFn: () => base44.entities.StakeholderGroup.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: businessUnits = [] } = useQuery({
    queryKey: ["businessUnits"],
    queryFn: () => base44.entities.BusinessUnit.list(),
  });

  // Auto-provision default groups for all companies
  useDefaultStakeholderGroups(companies.map(c => c.id));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Stakeholder.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["stakeholders"]); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Stakeholder.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["stakeholders"]); setDialogOpen(false); setEditingStakeholder(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Stakeholder.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["stakeholders"]),
  });

  const [filterCompanyId, setFilterCompanyId] = useState("all");

  const filteredStakeholders = stakeholders.filter(s => {
    const matchesSearch = !search ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.department?.toLowerCase().includes(search.toLowerCase()) ||
      s.job_title?.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = filterGroupId === "all" || s.group_ids?.includes(filterGroupId);
    const matchesCompany = filterCompanyId === "all" || s.company_id === filterCompanyId;
    return matchesSearch && matchesGroup && matchesCompany && s.status !== "inactive";
  });

  const handleEdit = (s) => { setEditingStakeholder(s); setDialogOpen(true); };
  const handleNew = () => { setEditingStakeholder(null); setDialogOpen(true); };

  const recordHistory = async (stakeholderId, stakeholderName, empNumber, companyId, changeType, fieldChanged, fromValue, toValue) => {
    const today = new Date().toISOString().split("T")[0];
    await base44.entities.StakeholderHistory.create({
      stakeholder_id: stakeholderId,
      stakeholder_name: stakeholderName,
      employee_number: empNumber || "",
      company_id: companyId || "",
      change_type: changeType,
      field_changed: fieldChanged,
      from_value: fromValue || "",
      to_value: toValue || "",
      to_date: fromValue ? today : undefined,
    });
  };

  const handleSave = async (data) => {
    if (editingStakeholder) {
      const prev = editingStakeholder;
      // Detect changes and record history
      const fieldsToTrack = [
        { key: "job_title", label: "job_title", changeType: "job_change" },
        { key: "department", label: "department", changeType: "job_change" },
        { key: "status", label: "status", changeType: data.status === "inactive" ? "termination" : "reactivation" },
      ];
      for (const f of fieldsToTrack) {
        if (prev[f.key] !== data[f.key]) {
          await recordHistory(prev.id, data.full_name, data.employee_number, data.company_id,
            f.changeType, f.label, prev[f.key] || "", data[f.key] || "");
        }
      }
      // Group changes
      const prevGroups = (prev.group_ids || []).join(",");
      const newGroups = (data.group_ids || []).join(",");
      if (prevGroups !== newGroups) {
        const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]));
        const fromNames = (prev.group_ids || []).map(id => groupMap[id] || id).join(", ");
        const toNames = (data.group_ids || []).map(id => groupMap[id] || id).join(", ");
        await recordHistory(prev.id, data.full_name, data.employee_number, data.company_id,
          "group_change", "group_ids", fromNames, toNames);
      }
      updateMutation.mutate({ id: editingStakeholder.id, data });
    } else {
      const created = await base44.entities.Stakeholder.create(data);
      await recordHistory(created.id, data.full_name, data.employee_number, data.company_id,
        "new_hire", "status", "", "active");
      queryClient.invalidateQueries(["stakeholders"]);
      setDialogOpen(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Stakeholder Management</h1>
          <p className="text-slate-500 mt-1">Manage stakeholders, groups and matrix assignments</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <GroupAssignmentImportButton onDone={() => queryClient.invalidateQueries(["stakeholders"])} />
          <StakeholderGroupReportButton stakeholders={stakeholders} groups={groups} companies={companies} />
          {canImport && (
            <Button variant="outline" onClick={() => setHrImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" /> Import HR Data
            </Button>
          )}
          <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Add Stakeholder
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total Stakeholders</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stakeholders.filter(s => s.status !== "inactive").length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Groups</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{groups.filter(g => g.status !== "inactive").length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Multi-group Members</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {stakeholders.filter(s => (s.group_ids?.length || 0) > 1).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Unassigned</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {stakeholders.filter(s => !s.group_ids?.length && s.status !== "inactive").length}
          </p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, job title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {companies.length > 1 && (
          <div className="flex gap-2 flex-wrap items-center">
            <Building2 className="w-4 h-4 text-slate-400" />
            <Button variant={filterCompanyId === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterCompanyId("all")}>All Companies</Button>
            {companies.map(c => (
              <Button key={c.id} variant={filterCompanyId === c.id ? "default" : "outline"} size="sm" onClick={() => setFilterCompanyId(c.id)}>
                {c.name}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {stakeholders.filter(s => s.company_id === c.id && s.status !== "inactive").length}
                </Badge>
              </Button>
            ))}
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterGroupId === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterGroupId("all")}
          >
            All
          </Button>
          {groups.filter(g => g.status !== "inactive").map(g => (
            <Button
              key={g.id}
              variant={filterGroupId === g.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterGroupId(g.id)}
            >
              {g.name}
              <Badge variant="secondary" className="ml-1 text-xs">
                {stakeholders.filter(s => s.group_ids?.includes(g.id)).length}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list"><Users className="w-4 h-4 mr-1.5" />Stakeholders</TabsTrigger>
          <TabsTrigger value="matrix"><Grid3X3 className="w-4 h-4 mr-1.5" />Group Matrix</TabsTrigger>
          <TabsTrigger value="groups">Manage Groups</TabsTrigger>

        </TabsList>

        <TabsContent value="list" className="mt-4">
          <StakeholderListPanel
            stakeholders={filteredStakeholders}
            groups={groups}
            onEdit={handleEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
            onViewHistory={(s) => setHistoryStakeholder(s)}
          />
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <StakeholderMatrixPanel
            stakeholders={filteredStakeholders}
            groups={filterGroupId === "all" ? groups : groups.filter(g => g.id === filterGroupId)}
          />
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          <StakeholderGroupsPanel groups={groups} companies={companies} />
        </TabsContent>

      </Tabs>

      <HRImportDialog open={hrImportOpen} onOpenChange={setHrImportOpen} />

      <StakeholderHistoryDialog
        open={!!historyStakeholder}
        onOpenChange={(v) => { if (!v) setHistoryStakeholder(null); }}
        stakeholder={historyStakeholder}
      />

      <StakeholderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        stakeholder={editingStakeholder}
        groups={groups}
        companies={companies}
        users={users}
        allStakeholders={stakeholders}
        businessUnits={businessUnits}
        onSave={handleSave}
      />
    </div>
  );
}
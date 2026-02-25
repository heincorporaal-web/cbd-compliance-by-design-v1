import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cpu, Plus, Search, List, GitBranch, Layers, User, Server } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import OrgProcessTreeView from "@/components/processmanagement/OrgProcessTreeView";

const levelLabels = {
  0: "Value Chain", 1: "Process Group", 2: "Process",
  3: "Sub-Process", 4: "Procedure", 5: "Task", 6: "Activity/Keystroke"
};

const getLevelColor = (level) => {
  const colors = {
    0: "bg-purple-500 text-white", 1: "bg-blue-500 text-white",
    2: "bg-indigo-500 text-white", 3: "bg-cyan-500 text-white",
    4: "bg-teal-500 text-white", 5: "bg-green-500 text-white",
    6: "bg-emerald-500 text-white"
  };
  return colors[level] || "bg-slate-500 text-white";
};

const getCriticalityColor = (c) => ({
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200"
}[c] || "bg-slate-100 text-slate-700");

export default function ProcessManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");

  const { data: processes = [], isLoading } = useQuery({
    queryKey: ["orgProcesses"],
    queryFn: () => base44.entities.OrgProcess.list("process_code"),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: systems = [] } = useQuery({
    queryKey: ["ictSystems"],
    queryFn: () => base44.entities.ICTSystem.list(),
  });

  const filteredProcesses = processes.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.process_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.process_owner?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || p.level === parseInt(levelFilter);
    const matchesCompany = companyFilter === "all" || p.company_id === companyFilter;
    const matchesOwner = ownerFilter === "all" ||
      (ownerFilter === "assigned" && (p.process_owner || p.process_owner_id)) ||
      (ownerFilter === "unassigned" && !p.process_owner && !p.process_owner_id);
    return matchesSearch && matchesLevel && matchesCompany && matchesOwner;
  });

  const buildHierarchy = (procs) => {
    const map = {};
    const roots = [];
    procs.forEach(p => { map[p.id] = { ...p, children: [] }; });
    procs.forEach(p => {
      if (p.parent_id && map[p.parent_id]) map[p.parent_id].children.push(map[p.id]);
      else if (!p.parent_id) roots.push(map[p.id]);
    });
    return roots;
  };

  const renderListProcess = (process, depth = 0) => {
    const hasChildren = process.children?.length > 0;
    const linkedSystems = systems.filter(s => process.linked_system_ids?.includes(s.id));
    const company = companies.find(c => c.id === process.company_id);

    return (
      <div key={process.id} style={{ marginLeft: `${depth * 20}px` }}>
        <div className="group hover:bg-slate-50 rounded-lg transition-colors">
          <div className="flex items-center gap-3 py-3 px-4 flex-wrap">
            <Badge className={`${getLevelColor(process.level)} shrink-0`}>L{process.level}</Badge>
            <span className="font-mono text-sm text-slate-500">{process.process_code}</span>
            <Link to={createPageUrl(`ProcessManagementDetail?id=${process.id}`)}>
              <span className="font-medium text-slate-900 hover:text-blue-600">{process.name}</span>
            </Link>
            {process.criticality && (
              <Badge variant="outline" className={`${getCriticalityColor(process.criticality)} border text-xs`}>
                {process.criticality}
              </Badge>
            )}
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {(process.process_owner || process.process_owner_id) && (
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {process.process_owner || "Assigned"}
                </Badge>
              )}
              {linkedSystems.length > 0 && (
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs flex items-center gap-1">
                  <Server className="w-3 h-3" />
                  {linkedSystems.length} system{linkedSystems.length > 1 ? "s" : ""}
                </Badge>
              )}
              {(process.linked_risk_ids?.length || 0) > 0 && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                  {process.linked_risk_ids.length} risks
                </Badge>
              )}
            </div>
          </div>
        </div>
        {hasChildren && process.children.map(c => renderListProcess(c, depth + 1))}
      </div>
    );
  };

  const hierarchy = buildHierarchy(filteredProcesses);

  const stats = {
    total: processes.length,
    withOwner: processes.filter(p => p.process_owner || p.process_owner_id).length,
    withSystems: processes.filter(p => p.linked_system_ids?.length > 0).length,
    critical: processes.filter(p => p.criticality === "critical").length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-cyan-700 rounded-xl flex items-center justify-center shadow-lg">
            <Cpu className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Process Management</h1>
            <p className="text-slate-600">Manage process ownership and system allocations</p>
          </div>
        </div>
        <Link to={createPageUrl("ProcessManagementDetail?new=true")}>
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Process
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Processes", value: stats.total, icon: Layers, color: "text-teal-600" },
          { label: "With Owner", value: stats.withOwner, icon: User, color: "text-indigo-600" },
          { label: "With Systems", value: stats.withSystems, icon: Server, color: "text-cyan-600" },
          { label: "Critical", value: stats.critical, icon: Cpu, color: "text-red-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">{label}</p>
                  <p className="text-3xl font-bold text-slate-900">{value}</p>
                </div>
                <Icon className={`w-8 h-8 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + Table */}
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col lg:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input placeholder="Search processes or owner..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {Object.entries(levelLabels).map(([l, label]) => (
                  <SelectItem key={l} value={l}>L{l}: {label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Ownership" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ownership</SelectItem>
                <SelectItem value="assigned">With Owner</SelectItem>
                <SelectItem value="unassigned">No Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading processes...</div>
          ) : filteredProcesses.length > 0 ? (
            <Tabs defaultValue="tree" className="w-full">
              <div className="border-b px-4">
                <TabsList>
                  <TabsTrigger value="tree" className="gap-2">
                    <GitBranch className="w-4 h-4" /> Tree View
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-2">
                    <List className="w-4 h-4" /> List View
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="tree" className="p-4 m-0">
                <OrgProcessTreeView processes={filteredProcesses} systems={systems} searchTerm={searchTerm} />
              </TabsContent>
              <TabsContent value="list" className="m-0">
                <div className="divide-y divide-slate-100">
                  {hierarchy.map(p => renderListProcess(p))}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="p-12 text-center">
              <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No processes found</p>
              <Link to={createPageUrl("ProcessManagementDetail?new=true")}>
                <Button className="bg-teal-600 hover:bg-teal-700">Create Your First Process</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
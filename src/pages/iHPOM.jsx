import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Plus, Search, ChevronRight, ChevronDown, Layers, List, GitBranch } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProcessTreeView from "@/components/ihpom/ProcessTreeView";

export default function iHPOM() {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['businessProcesses'],
    queryFn: () => base44.entities.BusinessProcess.list('process_code'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const levelLabels = {
    0: "Value Chain",
    1: "Process Group",
    2: "Process",
    3: "Sub-Process",
    4: "Procedure",
    5: "Task",
    6: "Activity/Keystroke"
  };

  const getLevelColor = (level) => {
    const colors = {
      0: "bg-purple-500 text-white",
      1: "bg-blue-500 text-white",
      2: "bg-indigo-500 text-white",
      3: "bg-cyan-500 text-white",
      4: "bg-teal-500 text-white",
      5: "bg-green-500 text-white",
      6: "bg-emerald-500 text-white"
    };
    return colors[level] || "bg-slate-500 text-white";
  };

  const getCriticalityColor = (criticality) => {
    const colors = {
      critical: "bg-red-100 text-red-700 border-red-200",
      high: "bg-orange-100 text-orange-700 border-orange-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      low: "bg-blue-100 text-blue-700 border-blue-200"
    };
    return colors[criticality] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const toggleNode = (processId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(processId)) {
      newExpanded.delete(processId);
    } else {
      newExpanded.add(processId);
    }
    setExpandedNodes(newExpanded);
  };

  const filteredProcesses = processes.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.process_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || p.level === parseInt(levelFilter);
    const matchesCompany = companyFilter === "all" || p.company_id === companyFilter;
    return matchesSearch && matchesLevel && matchesCompany;
  });

  const buildHierarchy = (procs) => {
    const map = {};
    const roots = [];

    procs.forEach(p => {
      map[p.id] = { ...p, children: [] };
    });

    procs.forEach(p => {
      if (p.parent_id && map[p.parent_id]) {
        map[p.parent_id].children.push(map[p.id]);
      } else if (!p.parent_id) {
        roots.push(map[p.id]);
      }
    });

    return roots;
  };

  const renderProcess = (process, depth = 0) => {
    const hasChildren = process.children && process.children.length > 0;
    const isExpanded = expandedNodes.has(process.id);
    const company = companies.find(c => c.id === process.company_id);

    return (
      <div key={process.id} style={{ marginLeft: `${depth * 24}px` }}>
        <div className="group hover:bg-slate-50 rounded-lg transition-colors">
          <div className="flex items-center gap-3 py-3 px-4">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(process.id)}
                className="hover:bg-slate-200 rounded p-1 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            
            <Badge className={`${getLevelColor(process.level)} shrink-0`}>
              L{process.level}
            </Badge>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm text-slate-600">{process.process_code}</span>
                <Link to={createPageUrl(`ProcessDetail?id=${process.id}`)}>
                  <span className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
                    {process.name}
                  </span>
                </Link>
                {process.criticality && (
                  <Badge variant="outline" className={`${getCriticalityColor(process.criticality)} border text-xs`}>
                    {process.criticality}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-slate-500 space-x-3">
                <span>{company?.name || 'Unknown Company'}</span>
                {process.process_owner && <span>• Owner: {process.process_owner}</span>}
                {process.workstream && <span>• Workstream: {process.workstream}</span>}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {(process.linked_risk_ids?.length || 0) > 0 && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {process.linked_risk_ids.length} risks
                </Badge>
              )}
              {(process.linked_control_ids?.length || 0) > 0 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {process.linked_control_ids.length} controls
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {process.children.map(child => renderProcess(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const hierarchy = buildHierarchy(filteredProcesses);

  const stats = {
    total: processes.length,
    byLevel: processes.reduce((acc, p) => {
      acc[p.level] = (acc[p.level] || 0) + 1;
      return acc;
    }, {}),
    critical: processes.filter(p => p.criticality === 'critical').length
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <Network className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">iHPOM</h1>
              <p className="text-slate-600">Integrated High Performance Organisational Model</p>
            </div>
          </div>
        </div>
        <Link to={createPageUrl("ProcessDetail?new=true")}>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Process
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Layers className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        {[0, 1, 2, 3, 4].map(level => (
          <Card key={level} className="border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">Level {level}</p>
                  <Badge className={getLevelColor(level)}>L{level}</Badge>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.byLevel[level] || 0}</p>
                <p className="text-xs text-slate-500">{levelLabels[level]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search processes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {Object.entries(levelLabels).map(([level, label]) => (
                  <SelectItem key={level} value={level}>Level {level}: {label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
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
                    <GitBranch className="w-4 h-4" />
                    Tree View
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-2">
                    <List className="w-4 h-4" />
                    List View
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="tree" className="p-4 m-0">
                <ProcessTreeView
                  processes={filteredProcesses}
                  companies={companies}
                  searchTerm={searchTerm}
                />
              </TabsContent>

              <TabsContent value="list" className="m-0">
                <div className="divide-y divide-slate-100">
                  {hierarchy.map(process => renderProcess(process))}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="p-12 text-center">
              <Network className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No processes found</p>
              <Link to={createPageUrl("ProcessDetail?new=true")}>
                <Button>Create Your First Process</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
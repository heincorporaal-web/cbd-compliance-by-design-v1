import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Plus, Search, ChevronRight, ChevronDown, Layers, List, GitBranch, Upload, Pencil, Trash2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import IHPOMImportDialog from "@/components/ihpom/IHPOMImportDialog";
import IHPOMNodeDialog from "@/components/ihpom/IHPOMNodeDialog";
import IHPOMLevel1View from "@/components/ihpom/IHPOMLevel1View";
import IHPOMPeriodicTable from "@/components/ihpom/IHPOMPeriodicTable";
import { useIsImplementerRole } from "@/hooks/useIsImplementerRole";

const levelLabels = {
  1: "Process Group",
  2: "Process",
  3: "Sub-Process",
  4: "Procedure",
  5: "Task",
  6: "Activity/Keystroke",
};

const getLevelColor = (level) => {
  const colors = {
    1: "bg-blue-500 text-white",
    2: "bg-indigo-500 text-white",
    3: "bg-cyan-500 text-white",
    4: "bg-teal-500 text-white",
    5: "bg-green-500 text-white",
    6: "bg-emerald-500 text-white",
  };
  return colors[level] || "bg-slate-500 text-white";
};

const getCriticalityColor = (c) => ({
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
}[c] || "bg-slate-100 text-slate-700");

export default function IHPOM() {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("tree");
  const { canImport } = useIsImplementerRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNode, setEditNode] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ["ihpomNodes"],
    queryFn: () => base44.entities.IHPOMNode.list("node_code"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IHPOMNode.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(["ihpomNodes"]);
      toast.success("Node deleted");
      setDeleteId(null);
    },
    onError: e => toast.error(e.message),
  });

  const toggleNode = (nodeId) => {
    const next = new Set(expandedNodes);
    if (next.has(nodeId)) next.delete(nodeId);
    else next.add(nodeId);
    setExpandedNodes(next);
  };

  const filteredNodes = nodes.filter(n => {
    const matchesSearch = !searchTerm ||
      n.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.node_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || n.level === parseInt(levelFilter);
    return matchesSearch && matchesLevel;
  });

  const buildHierarchy = (items) => {
    const map = {};
    const roots = [];
    items.forEach(n => { map[n.id] = { ...n, children: [] }; });
    items.forEach(n => {
      if (n.parent_id && map[n.parent_id]) map[n.parent_id].children.push(map[n.id]);
      else if (!n.parent_id) roots.push(map[n.id]);
    });
    return roots;
  };

  const renderNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id} style={{ marginLeft: `${depth * 24}px` }}>
        <div className="group hover:bg-slate-50 rounded-lg transition-colors">
          <div className="flex items-center gap-3 py-3 px-4">
            {hasChildren ? (
              <button onClick={() => toggleNode(node.id)} className="hover:bg-slate-200 rounded p-1 transition-colors">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <Badge className={`${getLevelColor(node.level)} shrink-0`}>L{node.level}</Badge>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm text-slate-600">{node.node_code}</span>
                <span className="font-medium text-slate-900">{node.name}</span>
                {node.criticality && (
                  <Badge variant="outline" className={`${getCriticalityColor(node.criticality)} border text-xs`}>
                    {node.criticality}
                  </Badge>
                )}
              </div>
              {node.description && (
                <div className="text-xs text-slate-500 line-clamp-1">{node.description}</div>
              )}
              <div className="text-xs text-slate-500 space-x-3 mt-0.5">
                {node.process_owner && <span>Owner: {node.process_owner}</span>}
                {(node.linked_process_ids?.length || 0) > 0 && (
                  <span>• {node.linked_process_ids.length} linked company processes</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditNode(node); setDialogOpen(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setDeleteId(node.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>{node.children.map(child => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  const hierarchy = buildHierarchy(filteredNodes);

  const stats = {
    total: nodes.length,
    byLevel: nodes.reduce((acc, n) => { acc[n.level] = (acc[n.level] || 0) + 1; return acc; }, {}),
    critical: nodes.filter(n => n.criticality === "critical").length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <Network className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">iHPOM</h1>
              <p className="text-slate-600">Integrated High Performance Organisational Model — Reference Repository</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 ml-15">Company-independent 6-level process hierarchy for benchmarking and comparison.</p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("iHPOMTreeReport")}>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Tree Report
            </Button>
          </Link>
          {canImport && (
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
          )}
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setEditNode(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Node
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
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
        {[1, 2, 3, 4, 5, 6].map(level => (
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

      {/* Filters + Tree */}
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          {(activeTab === "tree" || activeTab === "list") && (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search nodes by code or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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
          </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading iHPOM nodes…</div>
          ) : filteredNodes.length > 0 ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-4">
                <TabsList>
                  <TabsTrigger value="tree" className="gap-2">
                    <GitBranch className="w-4 h-4" /> Tree View
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-2">
                    <List className="w-4 h-4" /> List View
                  </TabsTrigger>
                  <TabsTrigger value="level1" className="gap-2">
                    <Layers className="w-4 h-4" /> Level 1
                  </TabsTrigger>
                  <TabsTrigger value="periodic" className="gap-2">
                    <Network className="w-4 h-4" /> Periodic Table
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="tree" className="p-4 m-0">
                <div className="space-y-1">
                  {hierarchy.map(node => renderNode(node))}
                </div>
              </TabsContent>

              <TabsContent value="list" className="m-0">
                <div className="divide-y divide-slate-100">
                  {hierarchy.map(node => renderNode(node))}
                </div>
              </TabsContent>

              <TabsContent value="level1" className="p-6 m-0 bg-slate-50">
                <IHPOMLevel1View nodes={nodes} />
              </TabsContent>

              <TabsContent value="periodic" className="p-6 m-0 bg-slate-50">
                <IHPOMPeriodicTable nodes={nodes} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="p-12 text-center">
              <Network className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No iHPOM nodes found. Import a CSV or add nodes manually.</p>
              <div className="flex justify-center gap-2">
                {canImport && (
                  <Button variant="outline" onClick={() => setImportOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" /> Import CSV
                  </Button>
                )}
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setEditNode(null); setDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Node
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <IHPOMImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <IHPOMNodeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editNode={editNode}
        allNodes={nodes}
      />

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteId(null)}>
          <Card className="max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Delete Node?</h3>
              <p className="text-sm text-slate-600">This will remove the node from the iHPOM repository. Child nodes will not be automatically re-parented.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
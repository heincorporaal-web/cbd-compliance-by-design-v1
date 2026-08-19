import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, ChevronRight, ChevronDown, Network, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function IHPOMTreeReport() {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [expandLevel, setExpandLevel] = useState(null);

  const { data: processes = [] } = useQuery({
    queryKey: ['ihpomNodes'],
    queryFn: () => base44.entities.IHPOMNode.list('node_code'),
  });

  const filteredProcesses = processes;

  const levelLabels = {
    1: "Process Group",
    2: "Process",
    3: "Sub-Process",
    4: "Procedure",
    5: "Task",
    6: "Activity/Keystroke"
  };

  const getLevelColor = (level) => {
    const colors = {
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
      critical: "bg-red-100 text-red-700",
      high: "bg-orange-100 text-orange-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-blue-100 text-blue-700"
    };
    return colors[criticality] || "bg-slate-100 text-slate-700";
  };

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

  const toggleNode = (processId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(processId)) {
      newExpanded.delete(processId);
    } else {
      newExpanded.add(processId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandToLevel = (level) => {
    if (level === null) {
      setExpandedNodes(new Set());
      setExpandLevel(null);
      return;
    }

    const newExpanded = new Set();
    filteredProcesses.forEach(p => {
      if (p.level < level) {
        newExpanded.add(p.id);
      }
    });
    setExpandedNodes(newExpanded);
    setExpandLevel(level);
  };

  const renderProcessNode = (process, depth = 0) => {
    const hasChildren = process.children && process.children.length > 0;
    const isExpanded = expandedNodes.has(process.id);

    return (
      <div key={process.id} className="print-avoid-break">
        <div className="flex items-start gap-2 py-2 px-3 hover:bg-slate-50 rounded" style={{ marginLeft: `${depth * 24}px` }}>
          {hasChildren ? (
            <button
              onClick={() => toggleNode(process.id)}
              className="mt-1 hover:bg-slate-200 rounded p-1 transition-colors flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
            </button>
          ) : (
            <div className="w-6 flex-shrink-0" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`${getLevelColor(process.level)} text-xs flex-shrink-0`}>
                L{process.level}
              </Badge>
              <span className="font-mono text-xs text-slate-600 flex-shrink-0">{process.node_code}</span>
              <span className="font-medium text-slate-900">{process.name}</span>
              {process.criticality && (
                <Badge variant="outline" className={`${getCriticalityColor(process.criticality)} text-xs`}>
                  {process.criticality}
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="text-xs text-slate-400 italic">Company-independent reference node</span>
              {process.process_owner && <span>• Owner: {process.process_owner}</span>}
            </div>
            
            {process.description && (
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{process.description}</p>
            )}

            <div className="flex gap-2 mt-1">
              {(process.linked_process_ids?.length || 0) > 0 && (
                <span className="text-xs text-purple-600">{process.linked_process_ids.length} linked company processes</span>
              )}
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {process.children.map(child => renderProcessNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const hierarchy = buildHierarchy(filteredProcesses);
  
  const stats = {
    total: filteredProcesses.length,
    byLevel: filteredProcesses.reduce((acc, p) => {
      acc[p.level] = (acc[p.level] || 0) + 1;
      return acc;
    }, {}),
    critical: filteredProcesses.filter(p => p.criticality === 'critical').length
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-content { 
            background: white !important; 
            padding: 20px !important;
            max-width: 100% !important;
          }
          .print-avoid-break { 
            page-break-inside: avoid;
            break-inside: avoid;
          }
          body { background: white !important; }
        }
      `}</style>

      <div className="no-print p-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Reports")}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Network className="w-6 h-6 text-purple-600" />
                iHPOM Tree View Report
              </h1>
              <p className="text-slate-600">Hierarchical business process structure</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("iHPOM")}>
              <Button variant="outline">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to iHPOM
              </Button>
            </Link>
            <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700">
              <Download className="w-4 h-4 mr-2" />
              Export/Print
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 print-content">
        <Card className="border-none shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Process Statistics</h2>
                <p className="text-sm text-slate-600">Total processes: {stats.total}</p>
              </div>
              <Layers className="w-8 h-8 text-purple-600" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map(level => (
                <div key={level} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <Badge className={`${getLevelColor(level)} text-xs mb-2`}>
                    L{level}
                  </Badge>
                  <p className="text-2xl font-bold text-slate-900">{stats.byLevel[level] || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">{levelLabels[level]}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 no-print">
              <p className="text-sm font-medium text-slate-700 mb-2">Expand tree to level:</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={expandLevel === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => expandToLevel(null)}
                >
                  Collapse All
                </Button>
                {[1, 2, 3, 4, 5].map(level => (
                  <Button
                    key={level}
                    variant={expandLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => expandToLevel(level)}
                    className={expandLevel === level ? getLevelColor(level) : ""}
                  >
                    Level {level}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Process Hierarchy</h2>
            
            {hierarchy.length > 0 ? (
              <div className="space-y-1">
                {hierarchy.map(process => renderProcessNode(process))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Network className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No processes found for the selected company</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-xs text-slate-500 text-center">
          Report generated on {new Date().toLocaleString("en-GB")} | CBD Compliance Platform
        </div>
      </div>
    </div>
  );
}
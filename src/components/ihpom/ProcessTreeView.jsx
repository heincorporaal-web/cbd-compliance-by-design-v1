import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Network, Circle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ProcessNode = ({ process, companies, expandedNodes, toggleNode, searchTerm }) => {
  const isExpanded = expandedNodes.has(process.id);
  const hasChildren = process.children && process.children.length > 0;
  const company = companies.find(c => c.id === process.company_id);

  const matchesSearch = !searchTerm || 
    process.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.process_code?.toLowerCase().includes(searchTerm.toLowerCase());

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

  if (!matchesSearch && !hasChildren) return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 py-2 group hover:bg-slate-50 rounded-lg px-2 transition-colors">
        {hasChildren ? (
          <button
            onClick={() => toggleNode(process.id)}
            className="hover:bg-slate-200 rounded p-1 transition-colors shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-600" />
            )}
          </button>
        ) : (
          <Circle className="w-2 h-2 text-slate-400 ml-2 shrink-0" />
        )}

        <Badge className={`${getLevelColor(process.level)} shrink-0 text-xs`}>
          L{process.level}
        </Badge>

        <span className="font-mono text-xs text-slate-600 shrink-0">
          {process.process_code}
        </span>

        <Link 
          to={createPageUrl(`ProcessDetail?id=${process.id}`)}
          className="flex-1 min-w-0"
        >
          <span className="font-medium text-slate-900 hover:text-blue-600 transition-colors truncate block">
            {process.name}
          </span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          {process.criticality && (
            <Badge variant="outline" className={`${getCriticalityColor(process.criticality)} border text-xs`}>
              {process.criticality}
            </Badge>
          )}
          {(process.linked_risk_ids?.length || 0) > 0 && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
              {process.linked_risk_ids.length} risks
            </Badge>
          )}
          {(process.linked_control_ids?.length || 0) > 0 && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              {process.linked_control_ids.length} controls
            </Badge>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-6 border-l-2 border-slate-200 pl-2 mt-1">
          {process.children.map(child => (
            <ProcessNode
              key={child.id}
              process={child}
              companies={companies}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ProcessTreeView({ processes, companies, searchTerm }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const toggleNode = (processId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(processId)) {
      newExpanded.delete(processId);
    } else {
      newExpanded.add(processId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set();
    const collectIds = (procs) => {
      procs.forEach(p => {
        allIds.add(p.id);
        if (p.children) collectIds(p.children);
      });
    };
    collectIds(processes);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
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

  const hierarchy = buildHierarchy(processes);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={expandAll} variant="outline" size="sm">
          Expand All
        </Button>
        <Button onClick={collapseAll} variant="outline" size="sm">
          Collapse All
        </Button>
      </div>

      {hierarchy.length > 0 ? (
        <div className="space-y-2">
          {hierarchy.map(process => (
            <ProcessNode
              key={process.id}
              process={process}
              companies={companies}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <Network className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p>No processes found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
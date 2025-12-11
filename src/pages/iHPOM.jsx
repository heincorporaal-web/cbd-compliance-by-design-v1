import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, Plus, Search, Network } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function iHPOM() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedCompany, setSelectedCompany] = useState("");

  const { data: processes = [] } = useQuery({
    queryKey: ['businessProcesses'],
    queryFn: () => base44.entities.BusinessProcess.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const getLevelName = (level) => {
    const names = {
      0: "Value Chain",
      1: "Level 1 - Process",
      2: "Level 2 - Sub-Process",
      3: "Level 3 - Procedure",
      4: "Level 4 - Task",
      5: "Level 5 - Step",
      6: "Level 6 - Activity/Keystroke"
    };
    return names[level] || `Level ${level}`;
  };

  const getLevelColor = (level) => {
    const colors = {
      0: "bg-purple-100 text-purple-700 border-purple-200",
      1: "bg-blue-100 text-blue-700 border-blue-200",
      2: "bg-cyan-100 text-cyan-700 border-cyan-200",
      3: "bg-green-100 text-green-700 border-green-200",
      4: "bg-yellow-100 text-yellow-700 border-yellow-200",
      5: "bg-orange-100 text-orange-700 border-orange-200",
      6: "bg-red-100 text-red-700 border-red-200"
    };
    return colors[level] || "bg-slate-100 text-slate-700";
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-slate-100 text-slate-700 border-slate-200",
      active: "bg-green-100 text-green-700 border-green-200",
      under_review: "bg-amber-100 text-amber-700 border-amber-200",
      archived: "bg-slate-100 text-slate-500 border-slate-200"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const toggleNode = (id) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const filteredProcesses = processes.filter(p => {
    const matchesSearch = !searchTerm || 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.process_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = !selectedCompany || p.company_id === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const getChildProcesses = (parentId) => {
    return filteredProcesses.filter(p => p.parent_process_id === parentId);
  };

  const rootProcesses = filteredProcesses.filter(p => !p.parent_process_id || p.level === 0);

  const renderProcessTree = (process, depth = 0) => {
    const children = getChildProcesses(process.id);
    const isExpanded = expandedNodes.has(process.id);
    const hasChildren = children.length > 0;

    return (
      <div key={process.id} className={depth > 0 ? "ml-6 border-l-2 border-slate-200 pl-4" : ""}>
        <div className="py-2">
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all">
            {hasChildren && (
              <button 
                onClick={() => toggleNode(process.id)}
                className="mt-1 hover:bg-slate-100 rounded p-1"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="outline" className={`${getLevelColor(process.level)} border font-mono text-xs`}>
                  {process.process_number}
                </Badge>
                <Badge variant="outline" className={`${getLevelColor(process.level)} border text-xs`}>
                  {getLevelName(process.level)}
                </Badge>
                <Badge variant="outline" className={`${getStatusColor(process.status)} border text-xs`}>
                  {process.status}
                </Badge>
              </div>
              
              <Link to={createPageUrl(`ProcessDetail?id=${process.id}`)}>
                <h3 className="font-semibold text-slate-900 hover:text-blue-600 mb-1">
                  {process.name}
                </h3>
              </Link>
              
              {process.description && (
                <p className="text-sm text-slate-600 mb-2">{process.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-slate-500">
                {process.process_owner && <span>Owner: {process.process_owner}</span>}
                {process.global_control_owner && <span>GCO: {process.global_control_owner}</span>}
                {process.value_chain && <span>Chain: {process.value_chain}</span>}
              </div>

              {(process.linked_risk_ids?.length > 0 || 
                process.linked_control_ids?.length > 0 || 
                process.linked_issue_ids?.length > 0 ||
                process.linked_goal_ids?.length > 0 ||
                process.linked_workstream_ids?.length > 0 ||
                process.linked_assessment_ids?.length > 0) && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {process.linked_risk_ids?.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {process.linked_risk_ids.length} Risk{process.linked_risk_ids.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {process.linked_control_ids?.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {process.linked_control_ids.length} Control{process.linked_control_ids.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {process.linked_issue_ids?.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {process.linked_issue_ids.length} Issue{process.linked_issue_ids.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {process.linked_goal_ids?.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {process.linked_goal_ids.length} Goal{process.linked_goal_ids.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {process.linked_workstream_ids?.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {process.linked_workstream_ids.length} Workstream{process.linked_workstream_ids.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {process.linked_assessment_ids?.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {process.linked_assessment_ids.length} Assessment{process.linked_assessment_ids.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {isExpanded && children.length > 0 && (
          <div className="mt-2">
            {children.map(child => renderProcessTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            iHPOM - Integrated High Performance Organisational Model
          </h1>
          <p className="text-slate-600">
            Manage business process hierarchy from value chains (L0) to activities (L6)
          </p>
        </div>
        <Link to={createPageUrl("ProcessDetail?new=true")}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Process
          </Button>
        </Link>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search processes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Companies</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {rootProcesses.length === 0 ? (
            <div className="text-center py-12">
              <Network className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Processes Found</h3>
              <p className="text-slate-600 mb-6">
                Start building your organisational model by creating a value chain (Level 0)
              </p>
              <Link to={createPageUrl("ProcessDetail?new=true")}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Process
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {rootProcesses.map(process => renderProcessTree(process))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
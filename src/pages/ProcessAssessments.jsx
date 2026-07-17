import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck, Plus, Search, ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import CSVUploader from "@/components/CSVUploader";
import { useIsImplementerRole } from "@/hooks/useIsImplementerRole";

export default function ProcessAssessments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { canImport } = useIsImplementerRole();

  const { data: assessments = [], isLoading, refetch } = useQuery({
    queryKey: ['processAssessments'],
    queryFn: () => base44.entities.ProcessAssessment.list('-assessment_date'),
  });

  const { data: processes = [] } = useQuery({
    queryKey: ['businessProcesses'],
    queryFn: () => base44.entities.BusinessProcess.list(),
  });

  const filteredAssessments = assessments.filter(a => {
    const process = processes.find(p => p.id === a.process_id);
    const matchesSearch = process?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process?.process_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.assessor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getRatingColor = (rating) => {
    const colors = {
      excellent: "bg-green-100 text-green-700 border-green-200",
      satisfactory: "bg-blue-100 text-blue-700 border-blue-200",
      needs_improvement: "bg-yellow-100 text-yellow-700 border-yellow-200",
      unsatisfactory: "bg-red-100 text-red-700 border-red-200"
    };
    return colors[rating] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-slate-100 text-slate-700 border-slate-200",
      completed: "bg-blue-100 text-blue-700 border-blue-200",
      approved: "bg-green-100 text-green-700 border-green-200"
    };
    return colors[status] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const stats = {
    total: assessments.length,
    completed: assessments.filter(a => a.status === 'completed' || a.status === 'approved').length,
    needsAttention: assessments.filter(a => a.overall_rating === 'unsatisfactory' || a.overall_rating === 'needs_improvement').length
  };

  const assessmentSchema = {
    type: "object",
    properties: {
      process_id: { type: "string" },
      assessment_date: { type: "string" },
      assessor: { type: "string" },
      assessment_type: { type: "string" },
      scope: { type: "string" },
      findings: { type: "string" },
      outcomes: { type: "string" },
      overall_rating: { type: "string" },
      status: { type: "string" },
      notes: { type: "string" }
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Process Assessments</h1>
          <p className="text-slate-600">Evaluate and track business process performance</p>
        </div>
        <div className="flex gap-2">
          {canImport && (
            <CSVUploader
              entityName="ProcessAssessment"
              entitySchema={assessmentSchema}
              onComplete={refetch}
            />
          )}
          <Link to={createPageUrl("ProcessAssessmentDetail?new=true")}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Assessments</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <ClipboardCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-slate-900">{stats.completed}</p>
              </div>
              <ClipboardCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Needs Attention</p>
                <p className="text-3xl font-bold text-slate-900">{stats.needsAttention}</p>
              </div>
              <ClipboardCheck className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading assessments...</div>
          ) : filteredAssessments.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredAssessments.map((assessment) => {
                const process = processes.find(p => p.id === assessment.process_id);
                const openActions = assessment.actions?.filter(a => a.status === 'open' || a.status === 'in_progress').length || 0;
                
                return (
                  <div key={assessment.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900">
                            {process?.name || 'Unknown Process'}
                          </h3>
                          {process?.process_code && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {process.process_code}
                            </Badge>
                          )}
                          <Badge variant="outline" className={`${getStatusColor(assessment.status)} border`}>
                            {assessment.status}
                          </Badge>
                          {assessment.overall_rating && (
                            <Badge variant="outline" className={`${getRatingColor(assessment.overall_rating)} border`}>
                              {assessment.overall_rating.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-slate-600 space-y-1">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
                            </span>
                            {assessment.assessor && <span>Assessor: {assessment.assessor}</span>}
                            {assessment.assessment_type && (
                              <span className="capitalize">{assessment.assessment_type} Assessment</span>
                            )}
                          </div>
                          {openActions > 0 && (
                            <span className="text-orange-600 font-medium">
                              {openActions} open action{openActions !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        
                        {assessment.outcomes && (
                          <p className="text-sm text-slate-500 mt-2 line-clamp-2">{assessment.outcomes}</p>
                        )}
                      </div>
                      
                      <Link to={createPageUrl(`ProcessAssessmentDetail?id=${assessment.id}`)}>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No process assessments found</p>
              <Link to={createPageUrl("ProcessAssessmentDetail?new=true")}>
                <Button>Create First Assessment</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
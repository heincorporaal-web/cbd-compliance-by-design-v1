import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCheck, Plus, Search, ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function SignOffs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: signOffs = [] } = useQuery({
    queryKey: ['signOffs'],
    queryFn: () => base44.entities.SignOff.list('-created_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const filteredSignOffs = signOffs.filter(so => {
    const matchesSearch = so.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || so.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      in_review: 'bg-blue-100 text-blue-700 border-blue-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getPeriodLabel = (type) => {
    const labels = {
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      semi_annual: 'Semi-Annual',
      annual: 'Annual',
      custom: 'Custom'
    };
    return labels[type] || type;
  };

  const pendingCount = signOffs.filter(s => s.status === 'pending').length;
  const approvedCount = signOffs.filter(s => s.status === 'approved').length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Period Sign-Offs</h1>
          <p className="text-slate-600">Review and approve controls, narratives, and issues by period</p>
        </div>
        <Link to={createPageUrl("SignOffDetail")}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Sign-Off
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-700">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Approved</p>
            <p className="text-3xl font-bold text-green-700">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Total Sign-Offs</p>
            <p className="text-3xl font-bold text-blue-700">{signOffs.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search sign-offs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSignOffs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredSignOffs.map((signOff) => {
                const company = companies.find(c => c.id === signOff.company_id);
                return (
                  <div key={signOff.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                          <FileCheck className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{signOff.title}</h3>
                            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                              {getPeriodLabel(signOff.period_type)}
                            </Badge>
                            <Badge variant="outline" className={`${getStatusColor(signOff.status)} border`}>
                              {signOff.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            {company && <span>{company.name}</span>}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(signOff.period_start), 'MMM d')} - {format(new Date(signOff.period_end), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <div className="flex gap-4 mt-2 text-xs text-slate-500">
                            <span>{signOff.controls_reviewed?.length || 0} controls</span>
                            <span>{signOff.narratives?.length || 0} narratives</span>
                            <span>{signOff.open_issues_snapshot?.length || 0} open issues</span>
                          </div>
                        </div>
                      </div>
                      <Link to={createPageUrl(`SignOffDetail?id=${signOff.id}`)}>
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
              <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No sign-offs found</p>
              <Link to={createPageUrl("SignOffDetail")}>
                <Button className="mt-4">Create First Sign-Off</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
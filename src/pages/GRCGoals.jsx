import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Plus, Search, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MaturityBadge from "../components/grc/MaturityBadge";

export default function GRCGoals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: goals = [] } = useQuery({
    queryKey: ['grcGoals'],
    queryFn: () => base44.entities.GRCGoal.list('-created_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = filterCompany === "all" || goal.company_id === filterCompany;
    const matchesCategory = filterCategory === "all" || goal.category === filterCategory;
    return matchesSearch && matchesCompany && matchesCategory;
  });

  const getStatusColor = (status) => {
    const colors = {
      not_started: 'bg-slate-100 text-slate-700 border-slate-200',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
      on_track: 'bg-green-100 text-green-700 border-green-200',
      at_risk: 'bg-orange-100 text-orange-700 border-orange-200',
      achieved: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getCategoryColor = (category) => {
    const colors = {
      governance: 'bg-purple-100 text-purple-700 border-purple-200',
      risk_management: 'bg-orange-100 text-orange-700 border-orange-200',
      compliance: 'bg-blue-100 text-blue-700 border-blue-200',
      security: 'bg-red-100 text-red-700 border-red-200',
      operational: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      strategic: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    };
    return colors[category] || 'bg-slate-100 text-slate-700';
  };

  // Stats
  const totalGoals = goals.length;
  const achievedGoals = goals.filter(g => g.status === 'achieved').length;
  const atRiskGoals = goals.filter(g => g.status === 'at_risk').length;
  const avgGap = goals.length > 0 
    ? (goals.reduce((sum, g) => sum + (g.maturity_gap || 0), 0) / goals.length).toFixed(1) 
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">GRC Goals</h1>
          <p className="text-slate-600">Manage goals with maturity assessments</p>
        </div>
        <Link to={createPageUrl("GRCGoalDetail")}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Total Goals</p>
            <p className="text-3xl font-bold text-slate-900">{totalGoals}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Achieved</p>
            <p className="text-3xl font-bold text-green-700">{achievedGoals}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">At Risk</p>
            <p className="text-3xl font-bold text-orange-700">{atRiskGoals}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Avg Maturity Gap</p>
            <p className="text-3xl font-bold text-purple-700">{avgGap}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="governance">Governance</SelectItem>
                <SelectItem value="risk_management">Risk Management</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="strategic">Strategic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredGoals.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredGoals.map((goal) => {
                const company = companies.find(c => c.id === goal.company_id);
                return (
                  <div key={goal.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                          <Target className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{goal.title}</h3>
                            <Badge variant="outline" className={`${getCategoryColor(goal.category)} border`}>
                              {goal.category?.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className={`${getStatusColor(goal.status)} border`}>
                              {goal.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                          {goal.description && (
                            <p className="text-sm text-slate-600 mb-2">{goal.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            {company && <span>{company.name}</span>}
                            {goal.owner && <span>• Owner: {goal.owner}</span>}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">Current:</span>
                              <MaturityBadge level={goal.current_maturity} />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">Target:</span>
                              <MaturityBadge level={goal.target_maturity} />
                            </div>
                            {goal.maturity_gap > 0 && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Gap: {goal.maturity_gap}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link to={createPageUrl(`GRCGoalDetail?id=${goal.id}`)}>
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
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No GRC goals found</p>
              <Link to={createPageUrl("GRCGoalDetail")}>
                <Button className="mt-4">Create First Goal</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
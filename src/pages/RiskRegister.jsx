import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Search, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CompanyFilterBar from "@/components/CompanyFilterBar";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";

export default function RiskRegister() {
  const [globalCompany] = useCompanyFilter();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.Risk.list('-created_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const filteredRisks = risks.filter(risk => {
    const matchesSearch = risk.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      risk.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = globalCompany === "all" || risk.company_id === globalCompany;
    return matchesSearch && matchesCompany;
  });

  const getRiskLevel = (likelihood, impact) => {
    const values = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
    return (values[likelihood] || 3) * (values[impact] || 3);
  };

  const getRiskColor = (score) => {
    if (score >= 20) return 'bg-red-500 text-white';
    if (score >= 12) return 'bg-orange-500 text-white';
    if (score >= 6) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  const getStatusColor = (status) => {
    const colors = {
      identified: 'bg-blue-100 text-blue-700 border-blue-200',
      assessed: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      mitigated: 'bg-green-100 text-green-700 border-green-200',
      accepted: 'bg-slate-100 text-slate-700 border-slate-200',
      closed: 'bg-slate-100 text-slate-500 border-slate-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const highRisks = risks.filter(r => getRiskLevel(r.likelihood, r.impact) >= 12);
  const openRisks = risks.filter(r => r.status !== 'closed');

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Risk Register</h1>
          <p className="text-slate-600">Identify, assess, and manage organizational risks</p>
        </div>
        <Link to={createPageUrl("RiskDetail?new=true")}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Risk
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Risks</p>
                <p className="text-3xl font-bold text-slate-900">{risks.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">High/Critical Risks</p>
                <p className="text-3xl font-bold text-slate-900">{highRisks.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Open Risks</p>
                <p className="text-3xl font-bold text-slate-900">{openRisks.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search risks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRisks.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredRisks.map((risk) => {
                const company = companies.find(c => c.id === risk.company_id);
                const riskScore = getRiskLevel(risk.likelihood, risk.impact);
                
                return (
                  <div key={risk.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900">{risk.title}</h3>
                          <Badge className={getRiskColor(riskScore)}>
                            Risk: {riskScore}
                          </Badge>
                          <Badge variant="outline" className={`${getStatusColor(risk.status)} border`}>
                            {risk.status}
                          </Badge>
                          <Badge variant="outline">
                            {risk.category?.replace('_', ' ')}
                          </Badge>
                        </div>
                        {risk.description && (
                          <p className="text-sm text-slate-600 mb-2">{risk.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          {company && <span>{company.name}</span>}
                          {risk.owner && <span>Owner: {risk.owner}</span>}
                          {risk.control_ids?.length > 0 && (
                            <span>{risk.control_ids.length} controls</span>
                          )}
                        </div>
                      </div>
                      <Link to={createPageUrl(`RiskDetail?id=${risk.id}`)}>
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
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No risks found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
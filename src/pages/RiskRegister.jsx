import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Search, ArrowRight, BookOpen, Building2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";

export default function RiskRegister() {
  const [globalCompany] = useCompanyFilter();
  const [searchTerm, setSearchTerm] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [assigningRisk, setAssigningRisk] = useState(null); // library risk being assigned
  const queryClient = useQueryClient();

  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.Risk.list('-created_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  // Company risks: has a company_id and is NOT a library risk
  const companyRisks = risks.filter(r => r.company_id && !r.is_library_risk);
  // Library risks: explicitly marked as library OR has no company_id
  const libraryRisks = risks.filter(r => r.is_library_risk || !r.company_id);

  const filteredCompanyRisks = companyRisks.filter(risk => {
    const matchesSearch = risk.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      risk.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = globalCompany === "all" || risk.company_id === globalCompany;
    return matchesSearch && matchesCompany;
  });

  const filteredLibraryRisks = libraryRisks.filter(risk =>
    risk.title?.toLowerCase().includes(librarySearch.toLowerCase()) ||
    risk.description?.toLowerCase().includes(librarySearch.toLowerCase()) ||
    risk.risk_reference_nr?.toLowerCase().includes(librarySearch.toLowerCase()) ||
    risk.risk_type?.toLowerCase().includes(librarySearch.toLowerCase())
  );

  const assignMutation = useMutation({
    mutationFn: async ({ libraryRisk, companyId }) => {
      const company = companies.find(c => c.id === companyId);
      
      // Check for duplicate: risk with same library_risk_id already assigned to this company
      const existingRisks = await base44.entities.Risk.filter({ 
        library_risk_id: libraryRisk.id, 
        company_id: companyId 
      });
      
      if (existingRisks && existingRisks.length > 0) {
        throw new Error(`Risk already assigned to ${company?.name}`);
      }
      
      return base44.entities.Risk.create({
        title: libraryRisk.title,
        description: libraryRisk.description,
        company_id: companyId,
        category: libraryRisk.category || "operational",
        likelihood: libraryRisk.likelihood || "medium",
        impact: libraryRisk.impact || "medium",
        status: "auto_assigned",
        framework_ids: libraryRisk.framework_ids || [],
        framework_reference: libraryRisk.framework_reference || "",
        risk_reference_nr: libraryRisk.risk_reference_nr || "",
        risk_type: libraryRisk.risk_type || "",
        racm_risk_type: libraryRisk.racm_risk_type || "",
        risk_statement: libraryRisk.risk_statement || "",
        root_cause: libraryRisk.root_cause || "",
        root_cause_type: libraryRisk.root_cause_type || "",
        value_chain: libraryRisk.value_chain || "",
        sub_process: libraryRisk.sub_process || "",
        workstream: libraryRisk.workstream || "",
        racm_l3: libraryRisk.racm_l3 || "",
        process_activity: libraryRisk.process_activity || "",
        is_library_risk: false,
        library_risk_id: libraryRisk.id,
        identified_date: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: (_, { companyId }) => {
      const company = companies.find(c => c.id === companyId);
      queryClient.invalidateQueries(['risks']);
      toast.success(`Risk assigned to ${company?.name || "company"} with status "Auto Assigned"`);
      setAssigningRisk(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign risk");
      setAssigningRisk(null);
    },
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
      auto_assigned: 'bg-purple-100 text-purple-700 border-purple-200',
      assessed: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      mitigated: 'bg-green-100 text-green-700 border-green-200',
      accepted: 'bg-slate-100 text-slate-700 border-slate-200',
      approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      pending_review: 'bg-orange-100 text-orange-700 border-orange-200',
      closed: 'bg-slate-100 text-slate-500 border-slate-200',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const formatStatus = (status) => status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || status;

  const highRisks = companyRisks.filter(r => getRiskLevel(r.likelihood, r.impact) >= 12);
  const openRisks = companyRisks.filter(r => !['closed', 'mitigated', 'accepted'].includes(r.status));
  const autoAssignedCount = companyRisks.filter(r => r.status === 'auto_assigned').length;

  // Which companies already have this library risk assigned?
  const getAssignedCompanies = (libraryRiskId) =>
    risks.filter(r => r.library_risk_id === libraryRiskId).map(r => r.company_id);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          navItemId="risk_register"
          icon={AlertTriangle}
          title="Risk Register"
          tagline="Identify, assess, and manage organizational risks"
          gradient="from-orange-600 to-red-700"
        />
        <Link to={createPageUrl("RiskDetail?new=true")}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Risk
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Company Risks</p>
                <p className="text-3xl font-bold text-slate-900">{companyRisks.length}</p>
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
                <p className="text-sm text-slate-600 mb-1">High / Critical</p>
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

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Auto Assigned</p>
                <p className="text-3xl font-bold text-slate-900">{autoAssignedCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Company Risks ({companyRisks.length})</TabsTrigger>
          <TabsTrigger value="library">Master Library ({libraryRisks.length})</TabsTrigger>
        </TabsList>

        {/* ── Company Risks Tab ── */}
        <TabsContent value="company">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search risks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredCompanyRisks.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredCompanyRisks.map((risk) => {
                    const company = companies.find(c => c.id === risk.company_id);
                    const riskScore = getRiskLevel(risk.likelihood, risk.impact);
                    return (
                      <div key={risk.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold text-slate-900">{risk.title}</h3>
                              <Badge className={getRiskColor(riskScore)}>Risk: {riskScore}</Badge>
                              <Badge variant="outline" className={`${getStatusColor(risk.status)} border`}>
                                {formatStatus(risk.status)}
                              </Badge>
                              <Badge variant="outline">{risk.category?.replace(/_/g, ' ')}</Badge>
                            </div>
                            {risk.description && (
                              <p className="text-sm text-slate-600 mb-2 line-clamp-2">{risk.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                              {company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{company.name}</span>}
                              {risk.owner && <span>Owner: {risk.owner}</span>}
                              {risk.risk_reference_nr && <span className="font-mono text-xs">{risk.risk_reference_nr}</span>}
                              {risk.control_ids?.length > 0 && <span>{risk.control_ids.length} controls</span>}
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
                  <p className="text-slate-500 mb-2">No company risks found</p>
                  <p className="text-sm text-slate-400">Assign risks from the Master Library or add a new risk manually.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Master Library Tab ── */}
        <TabsContent value="library">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search library risks by title, type, reference..."
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Assign risks from the master library to a company. The risk will be created with status <strong>"Auto Assigned"</strong> and can then be reviewed and activated.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {filteredLibraryRisks.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-2">No library risks found</p>
                  <p className="text-sm text-slate-400">Create risks and mark them as "Library Risk" in the risk detail form.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredLibraryRisks.map((risk) => {
                    const assignedToCompanyIds = getAssignedCompanies(risk.id);
                    return (
                      <div key={risk.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {risk.risk_reference_nr && (
                                <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{risk.risk_reference_nr}</span>
                              )}
                              {risk.risk_type && (
                                <Badge variant="outline" className="text-xs">{risk.risk_type}</Badge>
                              )}
                              <Badge variant="outline" className="text-xs">{risk.category?.replace(/_/g, ' ')}</Badge>
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-1">{risk.title}</h3>
                            {risk.description && (
                              <p className="text-sm text-slate-600 mb-2 line-clamp-2">{risk.description}</p>
                            )}
                            {assignedToCompanyIds.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap mt-1">
                                <span className="text-xs text-slate-400">Assigned to:</span>
                                {assignedToCompanyIds.map(cid => {
                                  const c = companies.find(co => co.id === cid);
                                  return c ? (
                                    <Badge key={cid} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 gap-1">
                                      <Check className="w-2.5 h-2.5" />{c.name}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                              onClick={() => setAssigningRisk(risk)}
                            >
                              <Building2 className="w-3.5 h-3.5 mr-1.5" />
                              Assign to Company
                            </Button>
                            <Link to={createPageUrl(`RiskDetail?id=${risk.id}`)}>
                              <Button variant="ghost" size="icon">
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign to Company Dialog */}
      <Dialog open={!!assigningRisk} onOpenChange={(open) => !open && setAssigningRisk(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Risk to Company</DialogTitle>
          </DialogHeader>
          {assigningRisk && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">{assigningRisk.risk_reference_nr}</p>
                <p className="font-medium text-slate-900 text-sm">{assigningRisk.title}</p>
              </div>
              <p className="text-sm text-slate-600">
                Select a company to assign this risk to. It will be created with status <strong>"Auto Assigned"</strong> — you can then review and activate it.
              </p>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {companies.map(company => {
                  const alreadyAssigned = risks.some(r => r.library_risk_id === assigningRisk.id && r.company_id === company.id);
                  return (
                    <button
                      key={company.id}
                      disabled={alreadyAssigned || assignMutation.isPending}
                      onClick={() => assignMutation.mutate({ libraryRisk: assigningRisk, companyId: company.id })}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors
                        ${alreadyAssigned
                          ? 'border-green-200 bg-green-50 text-slate-500 cursor-not-allowed'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer'
                        }`}
                    >
                      <span className="font-medium text-sm">{company.name}</span>
                      {alreadyAssigned && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 gap-1">
                          <Check className="w-2.5 h-2.5" /> Already assigned
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
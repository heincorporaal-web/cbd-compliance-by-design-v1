import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Cog, RefreshCw, CheckCircle, XCircle, Clock, Shield, AlertTriangle, Network, BookOpen, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";

export default function RiskControlEngine() {
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [rejectingProposal, setRejectingProposal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['proposedRiskControls'],
    queryFn: () => base44.entities.ProposedRiskControl.list('-created_date'),
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list(),
  });

  const { data: processes = [] } = useQuery({
    queryKey: ['businessProcesses'],
    queryFn: () => base44.entities.BusinessProcess.list(),
  });

  const { data: allRisks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.Risk.list(),
  });

  // Library risks = explicitly marked OR have no company_id
  const libraryRisks = allRisks.filter(r => r.is_library_risk || !r.company_id);

  const generateMutation = useMutation({
    mutationFn: async () => {
      // For each company, find which frameworks they have (via Assessments)
      // Then find library risks that reference those frameworks
      // Auto-assign if not already assigned
      const risksToCreate = [];

      for (const assessment of assessments) {
        const companyId = assessment.company_id;
        if (!companyId) continue;

        // Support both framework_id (single) and framework_ids (array)
        const frameworkIds = assessment.framework_ids?.length
          ? assessment.framework_ids
          : assessment.framework_id
            ? [assessment.framework_id]
            : [];
        if (frameworkIds.length === 0) continue;

        // Library risks that apply to any of this assessment's frameworks
        const matchingLibraryRisks = libraryRisks.filter(lr =>
          frameworkIds.some(fid => lr.framework_ids?.includes(fid))
        );

        for (const libRisk of matchingLibraryRisks) {
          // Skip if already assigned to this company (from this library risk)
          const alreadyExists = allRisks.some(r =>
            r.library_risk_id === libRisk.id && r.company_id === companyId
          );
          if (alreadyExists) continue;

          risksToCreate.push({
            title: libRisk.title,
            description: libRisk.description,
            company_id: companyId,
            category: libRisk.category || "operational",
            likelihood: libRisk.likelihood || "medium",
            impact: libRisk.impact || "medium",
            status: "auto_assigned",
            framework_ids: libRisk.framework_ids || [],
            framework_reference: libRisk.framework_reference || "",
            risk_reference_nr: libRisk.risk_reference_nr || "",
            risk_type: libRisk.risk_type || "",
            racm_risk_type: libRisk.racm_risk_type || "",
            risk_statement: libRisk.risk_statement || "",
            root_cause: libRisk.root_cause || "",
            root_cause_type: libRisk.root_cause_type || "",
            value_chain: libRisk.value_chain || "",
            sub_process: libRisk.sub_process || "",
            workstream: libRisk.workstream || "",
            racm_l3: libRisk.racm_l3 || "",
            process_activity: libRisk.process_activity || "",
            is_library_risk: false,
            library_risk_id: libRisk.id,
            identified_date: new Date().toISOString().split('T')[0],
          });
        }
      }

      if (risksToCreate.length > 0) {
        await base44.entities.Risk.bulkCreate(risksToCreate);
      }

      return { count: risksToCreate.length, libraryTotal: libraryRisks.length, assessmentTotal: assessments.length };
    },
    onSuccess: ({ count, libraryTotal, assessmentTotal }) => {
      queryClient.invalidateQueries(['risks']);
      queryClient.invalidateQueries(['proposedRiskControls']);
      if (count > 0) {
        toast.success(`Auto-assigned ${count} risks to companies based on their frameworks`);
      } else if (libraryTotal === 0) {
        toast.info('No library risks found. Create risks without a company_id to use them as library risks.');
      } else if (assessmentTotal === 0) {
        toast.info('No assessments found. Create assessments linking companies to frameworks first.');
      } else {
        toast.info('All matching risks are already assigned — nothing new to create.');
      }
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (proposal) => {
      // Create the risk
      const risk = await base44.entities.Risk.create({
        title: proposal.suggested_risk_title,
        description: proposal.suggested_risk_description,
        company_id: proposal.company_id,
        category: proposal.suggested_risk_category,
        control_ids: [proposal.control_id],
        status: 'identified',
        likelihood: 'medium',
        impact: 'medium'
      });

      // Update proposal
      await base44.entities.ProposedRiskControl.update(proposal.id, {
        status: 'accepted',
        created_risk_id: risk.id,
        reviewed_date: new Date().toISOString()
      });

      return risk;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['proposedRiskControls']);
      queryClient.invalidateQueries(['risks']);
      toast.success('Risk and control accepted and created');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ proposalId, reason }) => {
      await base44.entities.ProposedRiskControl.update(proposalId, {
        status: 'rejected',
        rejection_reason: reason,
        reviewed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['proposedRiskControls']);
      setRejectingProposal(null);
      setRejectionReason("");
      toast.success('Proposal rejected');
    },
  });

  const handleReject = () => {
    if (rejectingProposal) {
      rejectMutation.mutate({ proposalId: rejectingProposal, reason: rejectionReason });
    }
  };

  const filteredProposals = proposals.filter(p => 
    selectedCompany === "all" || p.company_id === selectedCompany
  );

  const pendingCount = proposals.filter(p => p.status === 'pending').length;
  const acceptedCount = proposals.filter(p => p.status === 'accepted').length;
  const rejectedCount = proposals.filter(p => p.status === 'rejected').length;

  // Auto-assigned risks
  const autoAssignedRisks = allRisks.filter(r => r.status === 'auto_assigned');
  const filteredAutoRisks = autoAssignedRisks.filter(r =>
    selectedCompany === "all" || r.company_id === selectedCompany
  );

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      accepted: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getSourceIcon = (type) => {
    return type === 'framework' ? Shield : Network;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageHeader
            navItemId="risk_engine"
            icon={Cog}
            title="Risk & Control Engine"
            tagline="Review and approve auto-generated risk assignments"
            gradient="from-indigo-600 to-purple-700"
          />
        </div>
        <Button 
          onClick={() => generateMutation.mutate()} 
          disabled={generateMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
          Generate Assignments
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Auto Assigned</p>
                <p className="text-3xl font-bold text-slate-900">{autoAssignedRisks.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Library Risks</p>
                <p className="text-3xl font-bold text-slate-900">{libraryRisks.length}</p>
              </div>
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Proposals Pending</p>
                <p className="text-3xl font-bold text-slate-900">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Proposals Accepted</p>
                <p className="text-3xl font-bold text-slate-900">{acceptedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-assigned risks awaiting activation */}
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Auto-Assigned Risks
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                These risks were auto-assigned from the master library. Change their status to <strong>Identified</strong> to activate them for the company.
              </p>
            </div>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-52">
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
          {filteredAutoRisks.length === 0 ? (
            <div className="p-10 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-1">No auto-assigned risks</p>
              <p className="text-sm text-slate-400">Run "Generate Assignments" to auto-assign library risks to companies based on their frameworks.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAutoRisks.map(risk => {
                const company = companies.find(c => c.id === risk.company_id);
                return (
                  <div key={risk.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {risk.risk_reference_nr && (
                          <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{risk.risk_reference_nr}</span>
                        )}
                        <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-medium">Auto Assigned</span>
                        {company && <span className="text-sm text-slate-500">{company.name}</span>}
                      </div>
                      <p className="font-medium text-slate-900 text-sm">{risk.title}</p>
                    </div>
                    <Link to={createPageUrl(`RiskDetail?id=${risk.id}`)}>
                      <Button size="sm" variant="outline" className="shrink-0">
                        Review & Activate <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Control Proposals (Legacy)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading proposals...</div>
          ) : filteredProposals.length === 0 ? (
            <div className="p-12 text-center">
              <Cog className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No proposals found</p>
              <Button onClick={() => generateMutation.mutate()}>
                Generate Proposals
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredProposals.map(proposal => {
                const company = companies.find(c => c.id === proposal.company_id);
                const SourceIcon = getSourceIcon(proposal.source_type);
                
                return (
                  <div key={proposal.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={`${getStatusColor(proposal.status)} border`}>
                            {proposal.status}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <SourceIcon className="w-3 h-3 mr-1" />
                            {proposal.source_type}
                          </Badge>
                          <span className="text-sm text-slate-600">{company?.name}</span>
                        </div>
                        
                        <h4 className="font-medium text-slate-900 mb-1">
                          {proposal.suggested_risk_title}
                        </h4>
                        <p className="text-sm text-slate-600 mb-2">
                          {proposal.suggested_risk_description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Source: {proposal.source_name}</span>
                          <span>Control: {proposal.control_name}</span>
                          <span>Category: {proposal.suggested_risk_category?.replace('_', ' ')}</span>
                        </div>

                        {proposal.status === 'rejected' && proposal.rejection_reason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <strong>Rejection reason:</strong> {proposal.rejection_reason}
                          </div>
                        )}
                      </div>

                      {proposal.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => acceptMutation.mutate(proposal)}
                            disabled={acceptMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => setRejectingProposal(proposal.id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Proposal</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Reason for rejection (optional)</Label>
                                  <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                    placeholder="Why is this proposal being rejected?"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setRejectingProposal(null)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={handleReject}
                                    disabled={rejectMutation.isPending}
                                  >
                                    Reject Proposal
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
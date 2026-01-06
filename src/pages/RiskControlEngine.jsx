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
import { Cog, RefreshCw, CheckCircle, XCircle, Clock, Shield, AlertTriangle, Network } from "lucide-react";
import { toast } from "sonner";

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

  const generateMutation = useMutation({
    mutationFn: async () => {
      const proposalsToCreate = [];
      
      // From Frameworks via Assessments
      for (const assessment of assessments) {
        const framework = frameworks.find(f => f.id === assessment.framework_id);
        const frameworkControls = controls.filter(c => c.framework_id === assessment.framework_id);
        
        for (const control of frameworkControls) {
          const existing = proposals.find(p => 
            p.company_id === assessment.company_id && 
            p.control_id === control.id && 
            p.source_type === 'framework' &&
            p.status === 'pending'
          );
          
          if (!existing) {
            proposalsToCreate.push({
              company_id: assessment.company_id,
              source_type: 'framework',
              source_id: assessment.framework_id,
              source_name: framework?.name || 'Framework',
              control_id: control.id,
              control_name: control.title,
              suggested_risk_title: `Non-compliance with ${control.control_id}: ${control.title}`,
              suggested_risk_description: control.description || `Risk of not implementing control ${control.control_id}`,
              suggested_risk_category: 'compliance',
              status: 'pending'
            });
          }
        }
      }

      // From Processes
      for (const process of processes) {
        if (process.linked_control_ids && process.linked_control_ids.length > 0) {
          for (const controlId of process.linked_control_ids) {
            const control = controls.find(c => c.id === controlId);
            if (!control) continue;
            
            const existing = proposals.find(p => 
              p.company_id === process.company_id && 
              p.control_id === controlId && 
              p.source_type === 'process' &&
              p.status === 'pending'
            );
            
            if (!existing) {
              proposalsToCreate.push({
                company_id: process.company_id,
                source_type: 'process',
                source_id: process.id,
                source_name: process.name,
                control_id: controlId,
                control_name: control.title,
                suggested_risk_title: `Process risk: ${process.name} - ${control.title}`,
                suggested_risk_description: `Risk related to ${control.control_id} in process ${process.process_code}`,
                suggested_risk_category: 'operational',
                status: 'pending'
              });
            }
          }
        }
      }

      if (proposalsToCreate.length > 0) {
        await base44.entities.ProposedRiskControl.bulkCreate(proposalsToCreate);
      }
      
      return proposalsToCreate.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries(['proposedRiskControls']);
      toast.success(`Generated ${count} new proposals`);
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <Cog className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Risk & Control Engine</h1>
              <p className="text-slate-600">Review and approve auto-generated risk assignments</p>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => generateMutation.mutate()} 
          disabled={generateMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
          Generate Proposals
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Pending</p>
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
                <p className="text-sm text-slate-600 mb-1">Accepted</p>
                <p className="text-3xl font-bold text-slate-900">{acceptedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-slate-900">{rejectedCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle>Proposals</CardTitle>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-64">
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
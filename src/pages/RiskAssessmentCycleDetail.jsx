import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Save, Send, CheckCircle, Clock, AlertTriangle, Trash2, Pencil, History } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import RiskSelectionPanel from "@/components/risk/RiskSelectionPanel";

const urlParams = new URLSearchParams(window.location.search);
const cycleId = urlParams.get("id");

const STATUS_COLORS = {
  planning: "bg-blue-100 text-blue-700 border-blue-200",
  in_review: "bg-orange-100 text-orange-700 border-orange-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
};
const STATUS_LABELS = { planning: "Planning", in_review: "In Review", approved: "Approved", closed: "Closed" };

export default function RiskAssessmentCycleDetail() {
  const queryClient = useQueryClient();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [iamComment, setIamComment] = useState("");
  const [isAmending, setIsAmending] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState("");
  const [amendOriginalEndDate, setAmendOriginalEndDate] = useState("");
  const [amendOriginalRiskIds, setAmendOriginalRiskIds] = useState([]);
  const [formData, setFormData] = useState({
    name: "", description: "", cycle_year: new Date().getFullYear(), start_date: "", end_date: "",
  });
  const [selectedRiskIds, setSelectedRiskIds] = useState([]);

  const { data: cycle, isLoading } = useQuery({
    queryKey: ["risk-assessment-cycle", cycleId],
    queryFn: () => base44.entities.RiskAssessmentCycle.get(cycleId),
    enabled: !!cycleId,
  });

  const { data: risks = [] } = useQuery({
    queryKey: ["risks-all"],
    queryFn: () => base44.entities.Risk.list("-created_date"),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders-all"],
    queryFn: () => base44.entities.Stakeholder.list(),
    enabled: showSubmitDialog,
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => base44.entities.Workflow.list(),
    enabled: showSubmitDialog,
  });

  const { data: workflowInstance } = useQuery({
    queryKey: ["workflow-instance", cycle?.workflow_instance_id],
    queryFn: () => base44.entities.WorkflowInstance.get(cycle.workflow_instance_id),
    enabled: !!cycle?.workflow_instance_id,
  });

  useEffect(() => {
    if (cycle) {
      setFormData({
        name: cycle.name || "",
        description: cycle.description || "",
        cycle_year: cycle.cycle_year || new Date().getFullYear(),
        start_date: cycle.start_date || "",
        end_date: cycle.end_date || "",
      });
      setSelectedRiskIds(cycle.risk_ids || []);
    }
  }, [cycle]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.RiskAssessmentCycle.update(cycleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["risk-assessment-cycle", cycleId]);
      toast.success("Cycle saved");
    },
  });

  const submitForReviewMutation = useMutation({
    mutationFn: async () => {
      const me = await base44.auth.me();

      const iamStakeholders = stakeholders.filter(s =>
        s.job_title?.toLowerCase().includes("internal audit") ||
        s.job_title?.toLowerCase().includes("audit manager")
      );
      const iamEmails = iamStakeholders.map(s => s.email).filter(Boolean);

      let workflow = workflows.find(w =>
        w.entity_type === "RiskAssessmentCycle" && w.status === "active"
      );

      if (!workflow) {
        workflow = await base44.entities.Workflow.create({
          name: "Risk Assessment Cycle - Review and Approval",
          entity_type: "RiskAssessmentCycle",
          company_id: cycle.company_id,
          trigger_condition: "manual",
          status: "active",
          allow_originator_resubmit: true,
          steps: [
            {
              id: "step_review",
              name: "Internal Audit Review",
              type: "approval",
              order: 1,
              assignee_type: "named_emails",
              approvers: iamEmails.length > 0 ? iamEmails : [],
              comment_required: true,
            },
            {
              id: "step_approve",
              name: "Internal Audit Manager Approval",
              type: "approval",
              order: 2,
              assignee_type: "named_emails",
              approvers: iamEmails.length > 0 ? iamEmails : [],
              comment_required: false,
            },
          ],
        });
      }

      const instance = await base44.entities.WorkflowInstance.create({
        workflow_id: workflow.id,
        entity_type: "RiskAssessmentCycle",
        entity_id: cycleId,
        entity_name: cycle.name,
        status: "in_progress",
        current_step: 0,
        originator_email: me.email,
        step_history: [{
          step_id: "submitted",
          step_name: "Submitted for Review",
          action: "approved",
          actor: me.email,
          timestamp: new Date().toISOString(),
          comments: iamComment || "Submitted for review",
        }],
        pending_approvers: workflow.steps?.[0]?.approvers || iamEmails,
      });

      await base44.entities.RiskAssessmentCycle.update(cycleId, {
        status: "in_review",
        risk_ids: selectedRiskIds,
        workflow_instance_id: instance.id,
        workflow_status_history: [
          ...(cycle.workflow_status_history || []),
          {
            status: "in_review",
            actor: me.email,
            timestamp: new Date().toISOString(),
            comments: iamComment || "Submitted for review",
          }
        ],
      });

      return instance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["risk-assessment-cycle", cycleId]);
      toast.success("Cycle submitted for review. Workflow assigned to Internal Audit Manager.");
      setShowSubmitDialog(false);
      setIamComment("");
    },
    onError: (err) => toast.error(err.message || "Failed to submit"),
  });

  const handleSave = () => {
    updateMutation.mutate({ ...formData, risk_ids: selectedRiskIds });
  };

  const startAmendment = () => {
    setAmendOriginalEndDate(cycle.end_date || "");
    setAmendOriginalRiskIds([...(cycle.risk_ids || [])]);
    setAmendmentReason("");
    setIsAmending(true);
  };

  const cancelAmendment = () => {
    setIsAmending(false);
    setAmendmentReason("");
    setFormData(f => ({ ...f, end_date: cycle.end_date || "" }));
    setSelectedRiskIds(cycle.risk_ids || []);
  };

  const submitAmendmentMutation = useMutation({
    mutationFn: async () => {
      const me = await base44.auth.me();

      // Compute what changed
      const changes = [];
      if (formData.end_date !== amendOriginalEndDate) {
        changes.push(`End date changed from ${amendOriginalEndDate || "(none)"} to ${formData.end_date || "(none)"}`);
      }
      const addedRisks = selectedRiskIds.filter(id => !amendOriginalRiskIds.includes(id));
      const removedRisks = amendOriginalRiskIds.filter(id => !selectedRiskIds.includes(id));
      if (addedRisks.length > 0) changes.push(`${addedRisks.length} risk(s) added`);
      if (removedRisks.length > 0) changes.push(`${removedRisks.length} risk(s) removed`);
      const changeSummary = changes.length > 0 ? changes.join("; ") : "Minor updates";

      const amendmentRecord = {
        amended_by: me.email,
        amended_at: new Date().toISOString(),
        reason: amendmentReason,
        changes: changeSummary,
        previous_end_date: amendOriginalEndDate,
        new_end_date: formData.end_date,
        risks_added: addedRisks,
        risks_removed: removedRisks,
      };

      // Get or create workflow
      const allWorkflows = await base44.entities.Workflow.list();
      const allStakeholders = await base44.entities.Stakeholder.list();
      const iamEmails = allStakeholders
        .filter(s => s.job_title?.toLowerCase().includes("internal audit") || s.job_title?.toLowerCase().includes("audit manager"))
        .map(s => s.email).filter(Boolean);

      let workflow = allWorkflows.find(w => w.entity_type === "RiskAssessmentCycle" && w.status === "active");
      if (!workflow) {
        workflow = await base44.entities.Workflow.create({
          name: "Risk Assessment Cycle - Review and Approval",
          entity_type: "RiskAssessmentCycle",
          company_id: cycle.company_id,
          trigger_condition: "manual",
          status: "active",
          allow_originator_resubmit: true,
          steps: [
            { id: "step_review", name: "Internal Audit Review", type: "approval", order: 1, assignee_type: "named_emails", approvers: iamEmails, comment_required: true },
            { id: "step_approve", name: "Internal Audit Manager Approval", type: "approval", order: 2, assignee_type: "named_emails", approvers: iamEmails, comment_required: false },
          ],
        });
      }

      const submissionNote = `AMENDMENT — ${changeSummary}. Reason: ${amendmentReason}`;

      const instance = await base44.entities.WorkflowInstance.create({
        workflow_id: workflow.id,
        entity_type: "RiskAssessmentCycle",
        entity_id: cycleId,
        entity_name: cycle.name,
        status: "in_progress",
        current_step: 0,
        originator_email: me.email,
        step_history: [{ step_id: "amendment_submitted", step_name: "Amendment Submitted", action: "approved", actor: me.email, timestamp: new Date().toISOString(), comments: submissionNote }],
        pending_approvers: workflow.steps?.[0]?.approvers || iamEmails,
      });

      await base44.entities.RiskAssessmentCycle.update(cycleId, {
        end_date: formData.end_date,
        risk_ids: selectedRiskIds,
        status: "in_review",
        workflow_instance_id: instance.id,
        amendment_history: [...(cycle.amendment_history || []), amendmentRecord],
        workflow_status_history: [...(cycle.workflow_status_history || []), { status: "in_review", actor: me.email, timestamp: new Date().toISOString(), comments: submissionNote }],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["risk-assessment-cycle", cycleId]);
      toast.success("Amendment submitted for re-approval.");
      setIsAmending(false);
      setAmendmentReason("");
    },
    onError: (err) => toast.error(err.message || "Failed to submit amendment"),
  });

  if (!cycleId) return <div className="p-8 text-center text-slate-500">No cycle ID provided.</div>;
  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading...</div>;
  if (!cycle) return <div className="p-8 text-center text-slate-500">Cycle not found.</div>;

  const company = companies.find(c => c.id === cycle.company_id);
  const selectedRisks = risks.filter(r => selectedRiskIds.includes(r.id));
  const isEditable = cycle.status === "planning";
  const canAmend = cycle.status === "approved" && !isAmending;
  const isAmendMode = isAmending && cycle.status === "approved";

  const getRiskScore = (l, i) => {
    const v = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
    return (v[l] || 3) * (v[i] || 3);
  };
  const getRiskColor = (score) => {
    if (score >= 20) return "bg-red-500 text-white";
    if (score >= 12) return "bg-orange-500 text-white";
    if (score >= 6) return "bg-yellow-500 text-white";
    return "bg-green-500 text-white";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to={createPageUrl("RiskAssessmentCycles")}>
            <Button variant="ghost" size="icon" className="mt-1"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{cycle.name}</h1>
              <Badge variant="outline" className={`${STATUS_COLORS[cycle.status]} border`}>
                {STATUS_LABELS[cycle.status]}
              </Badge>
            </div>
            <p className="text-slate-500 text-sm">{company?.name}{cycle.cycle_year ? ` · ${cycle.cycle_year}` : ""}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditable && (
            <>
              <Button variant="outline" onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" /> Save
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => setShowSubmitDialog(true)}
                disabled={selectedRiskIds.length === 0}
              >
                <Send className="w-4 h-4 mr-2" /> Submit for Review
              </Button>
            </>
          )}
          {canAmend && (
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={startAmendment}>
              <Pencil className="w-4 h-4 mr-2" /> Amend Cycle
            </Button>
          )}
          {isAmendMode && (
            <>
              <Button variant="outline" onClick={cancelAmendment}>Cancel</Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => setShowSubmitDialog(true)}
                disabled={!amendmentReason.trim()}
              >
                <Send className="w-4 h-4 mr-2" /> Submit Amendment
              </Button>
            </>
          )}
        </div>
      </div>

      {workflowInstance && (
        <Card className={`border-l-4 ${workflowInstance.status === "approved" ? "border-l-green-500 bg-green-50" : "border-l-orange-500 bg-orange-50"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {workflowInstance.status === "approved"
                ? <CheckCircle className="w-5 h-5 text-green-600" />
                : <Clock className="w-5 h-5 text-orange-600" />
              }
              <div>
                <p className="font-medium text-sm text-slate-900">
                  Workflow: {workflowInstance.status === "approved" ? "Approved" : "Pending Review"}
                </p>
                {workflowInstance.pending_approvers?.length > 0 && (
                  <p className="text-xs text-slate-500">Pending: {workflowInstance.pending_approvers.join(", ")}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isAmendMode && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-amber-800">Amendment Mode — you may change the end date and included risks below.</p>
            <div className="space-y-1">
              <Label className="text-amber-800">Motivation / Reason for Amendment *</Label>
              <Textarea
                value={amendmentReason}
                onChange={e => setAmendmentReason(e.target.value)}
                placeholder="Explain why this approved cycle needs to be changed..."
                rows={3}
                className="border-amber-300 focus:border-amber-500"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {cycle.amendment_history?.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4" /> Amendment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {cycle.amendment_history.slice().reverse().map((a, i) => (
                <div key={i} className="p-4 text-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-slate-800">{a.amended_by}</span>
                    <span className="text-xs text-slate-400">{a.amended_at ? new Date(a.amended_at).toLocaleDateString("en-GB") : ""}</span>
                  </div>
                  <p className="text-slate-600 mb-1"><span className="font-medium">Changes:</span> {a.changes}</p>
                  <p className="text-slate-500 italic">Reason: {a.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Cycle Details</TabsTrigger>
          <TabsTrigger value="risks">Risks ({selectedRiskIds.length})</TabsTrigger>
          {isEditable && <TabsTrigger value="add">Add Risks</TabsTrigger>}
          {isAmendMode && <TabsTrigger value="add">Edit Risks</TabsTrigger>}
        </TabsList>

        <TabsContent value="details">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <Label>Cycle Name *</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} disabled={!isEditable} />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} disabled={!isEditable} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Cycle Year</Label>
                  <Input type="number" value={formData.cycle_year} onChange={e => setFormData(p => ({ ...p, cycle_year: Number(e.target.value) }))} disabled={true} />
                </div>
                <div className="space-y-1">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} disabled={true} />
                </div>
                <div className="space-y-1">
                  <Label>End Date {isAmendMode && <span className="text-amber-600 text-xs ml-1">(editable)</span>}</Label>
                  <Input type="date" value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} disabled={!isEditable && !isAmendMode} />
                </div>
              </div>
              {isEditable && (
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" /> Save Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base">Risks in this Cycle</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {selectedRisks.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No risks added yet.</p>
                  {isEditable && <p className="text-sm text-slate-400 mt-1">Use the "Add Risks" tab to select risks.</p>}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selectedRisks.map(risk => {
                    const score = getRiskScore(risk.likelihood, risk.impact);
                    return (
                      <div key={risk.id} className="p-4 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-slate-900">{risk.title}</span>
                            <Badge className={`${getRiskColor(score)} text-xs`}>{score}</Badge>
                            {risk.risk_reference_nr && <span className="font-mono text-xs text-slate-400">{risk.risk_reference_nr}</span>}
                          </div>
                          <div className="text-xs text-slate-400 flex gap-3 flex-wrap">
                            {risk.workstream && <span>WS: {risk.workstream}</span>}
                            {risk.value_chain && <span>VC: {risk.value_chain}</span>}
                            {risk.process_activity && <span>{risk.process_activity}</span>}
                          </div>
                        </div>
                        {(isEditable || isAmendMode) && (
                         <Button
                           variant="ghost" size="icon" className="h-7 w-7"
                           onClick={() => setSelectedRiskIds(prev => prev.filter(id => id !== risk.id))}
                         >
                           <Trash2 className="w-3.5 h-3.5 text-red-400" />
                         </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {(isEditable || isAmendMode) && (
          <TabsContent value="add">
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <RiskSelectionPanel
                  companyId={cycle.company_id}
                  selectedIds={selectedRiskIds}
                  onSelectionChange={setSelectedRiskIds}
                />
                <div className="flex justify-end mt-4 pt-4 border-t">
                  {isEditable && (
                    <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" /> Save Selection
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showSubmitDialog} onOpenChange={o => { if (!o) setShowSubmitDialog(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isAmendMode ? "Submit Amendment for Approval" : "Submit for Review and Approval"}</DialogTitle>
          </DialogHeader>
          {isAmendMode ? (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800 font-medium mb-2">Amendment summary:</p>
                <ul className="text-xs text-amber-700 space-y-1">
                  {formData.end_date !== amendOriginalEndDate && (
                    <li>• End date: <strong>{amendOriginalEndDate || "(none)"}</strong> → <strong>{formData.end_date || "(none)"}</strong></li>
                  )}
                  {selectedRiskIds.filter(id => !amendOriginalRiskIds.includes(id)).length > 0 && (
                    <li>• <strong>{selectedRiskIds.filter(id => !amendOriginalRiskIds.includes(id)).length}</strong> risk(s) added</li>
                  )}
                  {amendOriginalRiskIds.filter(id => !selectedRiskIds.includes(id)).length > 0 && (
                    <li>• <strong>{amendOriginalRiskIds.filter(id => !selectedRiskIds.includes(id)).length}</strong> risk(s) removed</li>
                  )}
                </ul>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Reason for amendment:</p>
                <p className="text-sm text-slate-800">{amendmentReason}</p>
              </div>
              <p className="text-xs text-slate-500">The cycle will be returned to <strong>In Review</strong> and the Internal Audit Manager will be notified of the changes.</p>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
                <Button
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={() => submitAmendmentMutation.mutate()}
                  disabled={submitAmendmentMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitAmendmentMutation.isPending ? "Submitting..." : "Submit Amendment"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium mb-1">What will happen:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>The cycle status will change to <strong>In Review</strong></li>
                  <li>A workflow will be created with Review and Approval steps</li>
                  <li>Steps will be assigned to <strong>Internal Audit Manager</strong></li>
                  <li>The cycle will be locked for editing until approved</li>
                </ul>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Cycle includes:</p>
                <p className="font-semibold text-slate-900">{selectedRiskIds.length} risk{selectedRiskIds.length !== 1 ? "s" : ""} selected</p>
              </div>
              <div className="space-y-1">
                <Label>Submission Note (optional)</Label>
                <Textarea
                  value={iamComment}
                  onChange={e => setIamComment(e.target.value)}
                  placeholder="Add a note for the reviewers..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => submitForReviewMutation.mutate()}
                  disabled={submitForReviewMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitForReviewMutation.isPending ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
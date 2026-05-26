import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronDown, ChevronRight, UserCheck, Send, CheckCircle2,
  XCircle, MinusCircle, Clock, AlertTriangle, RotateCcw
} from "lucide-react";
import { toast } from "sonner";

const ASSESSMENT_STATUS_CONFIG = {
  unassigned: { label: "Unassigned", color: "bg-slate-100 text-slate-500 border-slate-200" },
  assigned: { label: "Assigned", color: "bg-blue-100 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", color: "bg-orange-100 text-orange-700 border-orange-200" },
  submitted: { label: "Submitted", color: "bg-purple-100 text-purple-700 border-purple-200" },
  reviewed: { label: "Reviewed", color: "bg-green-100 text-green-700 border-green-200" },
};

const RESULT_CONFIG = {
  pending: { label: "Pending", icon: Clock, color: "text-slate-400" },
  pass: { label: "Pass", icon: CheckCircle2, color: "text-green-600" },
  fail: { label: "Fail", icon: XCircle, color: "text-red-500" },
  not_applicable: { label: "N/A", icon: MinusCircle, color: "text-slate-400" },
};

const OVERALL_RESULT_OPTIONS = [
  { value: "not_assessed", label: "Not Assessed" },
  { value: "effective", label: "Effective" },
  { value: "partially_effective", label: "Partially Effective" },
  { value: "ineffective", label: "Ineffective" },
  { value: "not_applicable", label: "Not Applicable" },
];

const REVIEW_RESULT_COLORS = {
  accepted: "bg-green-100 text-green-700",
  returned: "bg-red-100 text-red-700",
  pending: "bg-slate-100 text-slate-500",
};

export default function CycleControlWorkpaper({
  control, assessment, testPlan, cycleId, currentUserEmail,
  isInAssessorGroup, isReviewer, cycleStatus, reviewerEmail, queryKey
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [stepResults, setStepResults] = useState(null); // null = not editing
  const [overallResult, setOverallResult] = useState("");
  const [assessorNotes, setAssessorNotes] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const aStatus = assessment?.assessment_status || "unassigned";
  const statusConfig = ASSESSMENT_STATUS_CONFIG[aStatus] || ASSESSMENT_STATUS_CONFIG.unassigned;

  const canAssign = isInAssessorGroup && (aStatus === "unassigned") && cycleStatus !== "planning";
  const canWork = assessment && assessment.assigned_to_email === currentUserEmail && (aStatus === "assigned" || aStatus === "in_progress");
  const canReview = isReviewer && aStatus === "submitted";

  const startEditing = () => {
    const planSteps = testPlan?.steps || [];
    const existingResults = assessment?.test_plan_steps || [];
    const merged = planSteps.map(s => {
      const existing = existingResults.find(r => r.step_id === s.id);
      return {
        step_id: s.id,
        step_title: s.title,
        step_type: s.step_type,
        result: existing?.result || "pending",
        notes: existing?.notes || "",
        evidence_url: existing?.evidence_url || "",
      };
    });
    setStepResults(merged);
    setOverallResult(assessment?.overall_result || "not_assessed");
    setAssessorNotes(assessment?.assessor_notes || "");
  };

  const assignMutation = useMutation({
    mutationFn: async () => {
      const me = await base44.auth.me();
      if (assessment) {
        return base44.entities.ControlAssessment.update(assessment.id, {
          assessment_status: "assigned",
          assigned_to_email: me.email,
          assigned_to_name: me.full_name,
          assigned_at: new Date().toISOString(),
          reviewer_email: reviewerEmail || "",
        });
      } else {
        // Create with test plan steps seeded from the plan
        const planSteps = (testPlan?.steps || []).map(s => ({
          step_id: s.id, step_title: s.title, step_type: s.step_type,
          result: "pending", notes: "", evidence_url: "",
        }));
        return base44.entities.ControlAssessment.create({
          cycle_id: cycleId,
          control_id: control.id,
          assessment_status: "assigned",
          assigned_to_email: me.email,
          assigned_to_name: me.full_name,
          assigned_at: new Date().toISOString(),
          reviewer_email: reviewerEmail || "",
          test_plan_steps: planSteps,
          overall_result: "not_assessed",
        });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries([queryKey]); toast.success("Assigned to you"); },
    onError: e => toast.error(e.message),
  });

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.ControlAssessment.update(assessment.id, {
      test_plan_steps: stepResults,
      overall_result: overallResult,
      assessor_notes: assessorNotes,
      assessment_status: "in_progress",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries([queryKey]);
      setStepResults(null);
      toast.success("Progress saved");
    },
    onError: e => toast.error(e.message),
  });

  const submitMutation = useMutation({
    mutationFn: () => base44.entities.ControlAssessment.update(assessment.id, {
      test_plan_steps: stepResults,
      overall_result: overallResult,
      assessor_notes: assessorNotes,
      assessment_status: "submitted",
      submitted_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries([queryKey]);
      setStepResults(null);
      toast.success("Workpaper submitted for review");
    },
    onError: e => toast.error(e.message),
  });

  const reviewMutation = useMutation({
    mutationFn: (result) => base44.entities.ControlAssessment.update(assessment.id, {
      assessment_status: result === "accepted" ? "reviewed" : "assigned",
      review_result: result,
      review_notes: reviewNotes,
      reviewed_at: new Date().toISOString(),
    }),
    onSuccess: (_, result) => {
      queryClient.invalidateQueries([queryKey]);
      setReviewNotes("");
      toast.success(result === "accepted" ? "Assessment accepted" : "Returned to assessor");
    },
    onError: e => toast.error(e.message),
  });

  const allStepsDone = stepResults && stepResults.length > 0 && stepResults.every(s => s.result !== "pending");

  return (
    <div className="border-b border-slate-100 last:border-0">
      {/* Control row */}
      <div
        className="flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="shrink-0 text-slate-400">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-900 text-sm">{control.title}</span>
            {control.control_id && <span className="font-mono text-xs text-slate-400">{control.control_id}</span>}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            {testPlan ? (
              <span>{testPlan.steps?.length || 0} test step{(testPlan.steps?.length || 0) !== 1 ? "s" : ""}</span>
            ) : (
              <span className="text-amber-500">No test plan</span>
            )}
            {assessment?.assigned_to_name && (
              <span>Assessor: {assessment.assigned_to_name}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          <Badge variant="outline" className={`text-xs border ${statusConfig.color}`}>{statusConfig.label}</Badge>

          {canAssign && (
            <Button
              size="sm" variant="outline"
              className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
              onClick={() => assignMutation.mutate()}
              disabled={assignMutation.isPending}
            >
              <UserCheck className="w-3 h-3 mr-1" />
              Assign to me
            </Button>
          )}

          {canWork && !stepResults && (
            <Button
              size="sm" variant="outline"
              className="h-7 text-xs"
              onClick={() => { setExpanded(true); startEditing(); }}
            >
              Start / Continue
            </Button>
          )}
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-8 pb-5 space-y-4">
          {/* Test plan steps */}
          {testPlan?.steps?.length > 0 ? (
            <div className="space-y-2">
              {(stepResults || assessment?.test_plan_steps || testPlan.steps.map(s => ({
                step_id: s.id, step_title: s.title, step_type: s.step_type, result: "pending", notes: ""
              }))).map((step, idx) => {
                const planStep = testPlan.steps.find(s => s.id === step.step_id) || {};
                const isEditing = !!stepResults;
                const ResultIcon = RESULT_CONFIG[step.result]?.icon || Clock;

                return (
                  <div key={step.step_id || idx} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-500">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-medium text-slate-800">{step.step_title || planStep.title}</span>
                          {(step.step_type || planStep.step_type) && (
                            <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">{step.step_type || planStep.step_type}</Badge>
                          )}
                        </div>
                        {planStep.description && <p className="text-xs text-slate-500 mb-2">{planStep.description}</p>}
                        {planStep.expected_evidence && (
                          <p className="text-xs text-slate-400 italic mb-2">Expected: {planStep.expected_evidence}</p>
                        )}

                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              {["pass", "fail", "not_applicable"].map(r => {
                                const cfg = RESULT_CONFIG[r];
                                const Icon = cfg.icon;
                                return (
                                  <button
                                    key={r}
                                    onClick={() => setStepResults(prev => prev.map((s, i) => i === idx ? { ...s, result: r } : s))}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs border transition-colors ${
                                      stepResults[idx]?.result === r
                                        ? r === "pass" ? "bg-green-100 border-green-400 text-green-700 font-semibold"
                                          : r === "fail" ? "bg-red-100 border-red-400 text-red-700 font-semibold"
                                          : "bg-slate-200 border-slate-400 text-slate-600 font-semibold"
                                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                    }`}
                                  >
                                    <Icon className="w-3 h-3" /> {cfg.label}
                                  </button>
                                );
                              })}
                            </div>
                            <Textarea
                              placeholder="Step notes / findings..."
                              value={stepResults[idx]?.notes || ""}
                              onChange={e => setStepResults(prev => prev.map((s, i) => i === idx ? { ...s, notes: e.target.value } : s))}
                              rows={2}
                              className="text-xs"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ResultIcon className={`w-4 h-4 ${RESULT_CONFIG[step.result]?.color}`} />
                            <span className={`text-xs font-medium ${RESULT_CONFIG[step.result]?.color}`}>{RESULT_CONFIG[step.result]?.label || "Pending"}</span>
                            {step.notes && <span className="text-xs text-slate-500 ml-2">{step.notes}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-slate-400 italic py-2">
              {testPlan ? "No steps defined in the test plan." : "No test plan linked to this control. Create one in the Control record."}
            </div>
          )}

          {/* Editing footer */}
          {stepResults && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Overall Result</label>
                <Select value={overallResult} onValueChange={setOverallResult}>
                  <SelectTrigger className="h-8 text-xs w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OVERALL_RESULT_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="Overall assessor notes / conclusion..."
                value={assessorNotes}
                onChange={e => setAssessorNotes(e.target.value)}
                rows={2}
                className="text-xs"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setStepResults(null)}>Cancel</Button>
                <Button size="sm" variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => submitMutation.mutate()}
                  disabled={!allStepsDone || overallResult === "not_assessed" || submitMutation.isPending}
                >
                  <Send className="w-3 h-3 mr-1" />
                  Submit for Review
                </Button>
              </div>
              {!allStepsDone && <p className="text-xs text-slate-400 text-right">All steps must have a result before submitting.</p>}
            </div>
          )}

          {/* Reviewer panel */}
          {canReview && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Review Workpaper</p>
              {assessment.assessor_notes && (
                <div className="bg-slate-50 rounded-md p-3 text-xs text-slate-600">
                  <span className="font-medium">Assessor conclusion:</span> {assessment.assessor_notes}
                </div>
              )}
              <Textarea
                placeholder="Review notes (required for return)..."
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                rows={2}
                className="text-xs"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm" variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => reviewMutation.mutate("returned")}
                  disabled={!reviewNotes.trim() || reviewMutation.isPending}
                >
                  <RotateCcw className="w-3 h-3 mr-1" /> Return
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => reviewMutation.mutate("accepted")}
                  disabled={reviewMutation.isPending}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Accept
                </Button>
              </div>
            </div>
          )}

          {/* Reviewed result */}
          {aStatus === "reviewed" && assessment?.review_result && (
            <div className={`flex items-center gap-2 p-2 rounded-md text-xs font-medium ${REVIEW_RESULT_COLORS[assessment.review_result] || ""}`}>
              <CheckCircle2 className="w-4 h-4" />
              Reviewed: {assessment.review_result} {assessment.review_notes ? `— "${assessment.review_notes}"` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
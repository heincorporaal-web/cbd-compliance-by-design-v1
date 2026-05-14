import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GitBranch, Play, Clock, CheckCircle2, XCircle, CornerDownLeft, History, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { resolveAssignees } from "@/lib/workflowAssigneeResolver";

const INSTANCE_STATUS_COLORS = {
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-purple-100 text-purple-700",
  returned: "bg-orange-100 text-orange-700",
};

const STATUS_HISTORY_COLORS = {
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  returned: "bg-orange-100 text-orange-800",
  completed: "bg-purple-100 text-purple-800",
  pending_review: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
};

/**
 * WorkflowPanel
 * Props:
 *   entityType   - e.g. "Risk", "Control", "Framework", "ICTSystem", "Survey", "OrgProcess"
 *   entityId     - record ID
 *   entityName   - display name
 *   companyId    - to filter company-specific workflows
 *   record       - the full entity record (for dynamic role resolution)
 *   onInstanceCreated - optional callback after workflow is started
 */
export default function WorkflowPanel({ entityType, entityId, entityName, companyId, record, onInstanceCreated }) {
  const queryClient = useQueryClient();
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");

  // Fetch available workflows for this entity type + company
  const { data: workflows = [] } = useQuery({
    queryKey: ["workflows", entityType, companyId],
    queryFn: async () => {
      const all = await base44.entities.Workflow.filter({ entity_type: entityType, status: "active" });
      // Filter by company_id: include workflows with no company (global) or matching company
      return all.filter(w => !w.company_id || w.company_id === companyId);
    },
    enabled: !!entityType,
  });

  // Fetch active workflow instance for this entity
  const { data: activeInstance } = useQuery({
    queryKey: ["workflowInstance", entityType, entityId],
    queryFn: async () => {
      const instances = await base44.entities.WorkflowInstance.filter({ entity_id: entityId });
      // Return the most recent non-completed instance, or the most recent one
      const active = instances.find(i => i.status === "in_progress" || i.status === "pending" || i.status === "returned");
      return active || instances.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0] || null;
    },
    enabled: !!entityId,
  });

  // Fetch the workflow definition for the active instance
  const { data: activeWorkflow } = useQuery({
    queryKey: ["workflow", activeInstance?.workflow_id],
    queryFn: () => base44.entities.Workflow.filter({ id: activeInstance.workflow_id }).then(r => r[0]),
    enabled: !!activeInstance?.workflow_id,
  });

  // Fetch workflow_status_history from the record directly
  const statusHistory = record?.workflow_status_history || [];

  const startWorkflowMutation = useMutation({
    mutationFn: async (workflowId) => {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) throw new Error("Workflow not found");

      // Resolve step 0 assignees using entity record
      const step0 = workflow.steps?.[0];
      let initialApprovers = step0?.approvers || [];
      if (step0 && record) {
        try {
          initialApprovers = await resolveAssignees(step0, record, "approver");
        } catch {}
      }

      const user = await base44.auth.me();
      const instance = await base44.entities.WorkflowInstance.create({
        workflow_id: workflowId,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        status: "in_progress",
        current_step: 0,
        pending_approvers: initialApprovers,
        originator_email: user?.email,
      });

      // Track in entity's workflow_status_history
      const newHistory = [
        ...statusHistory,
        {
          status: "workflow_started",
          actor: user?.email || "system",
          timestamp: new Date().toISOString(),
          comments: `Workflow "${workflow.name}" started`,
        },
      ];

      await base44.entities[entityType].update(entityId, {
        workflow_instance_id: instance.id,
        workflow_status_history: newHistory,
      });

      return instance;
    },
    onSuccess: (instance) => {
      queryClient.invalidateQueries(["workflowInstance", entityType, entityId]);
      queryClient.invalidateQueries([entityType.toLowerCase(), entityId]);
      setIsStartDialogOpen(false);
      setSelectedWorkflowId("");
      toast.success("Workflow started successfully");
      onInstanceCreated?.(instance);
    },
  });

  const isActive = activeInstance && (activeInstance.status === "in_progress" || activeInstance.status === "pending" || activeInstance.status === "returned");

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="w-4 h-4 text-purple-600" />
            Workflow
          </CardTitle>
          {!isActive && workflows.length > 0 && (
            <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Start Workflow
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start Workflow</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-slate-600">Select a workflow to start for <strong>{entityName}</strong>.</p>
                  <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select workflow..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workflows.map(w => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                          {w.steps?.length > 0 && <span className="text-slate-400 ml-2">({w.steps.length} steps)</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedWorkflowId && (() => {
                    const wf = workflows.find(w => w.id === selectedWorkflowId);
                    return wf?.description ? (
                      <p className="text-xs text-slate-500 italic">{wf.description}</p>
                    ) : null;
                  })()}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsStartDialogOpen(false)}>Cancel</Button>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={!selectedWorkflowId || startWorkflowMutation.isPending}
                      onClick={() => startWorkflowMutation.mutate(selectedWorkflowId)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Active Instance Banner */}
        {activeInstance && (
          <div className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
            activeInstance.status === "completed" ? "bg-green-50 border-green-200" :
            activeInstance.status === "rejected" ? "bg-red-50 border-red-200" :
            activeInstance.status === "returned" ? "bg-orange-50 border-orange-200" :
            "bg-blue-50 border-blue-200"
          }`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-sm font-semibold text-slate-900">{activeWorkflow?.name || "Workflow"}</p>
                <Badge className={INSTANCE_STATUS_COLORS[activeInstance.status] || "bg-slate-100 text-slate-700"}>
                  {activeInstance.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-xs text-slate-600">
                Step {activeInstance.current_step + 1} of {activeWorkflow?.steps?.length || "?"}
                {activeInstance.pending_approvers?.length > 0 && (
                  <> • Pending: {activeInstance.pending_approvers.join(", ")}</>
                )}
              </p>
              {activeInstance.return_reason && (
                <p className="text-xs text-orange-700 mt-1 flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" />
                  {activeInstance.return_reason}
                </p>
              )}
            </div>
            <Link to={createPageUrl(`WorkflowApproval?id=${activeInstance.id}`)}>
              <Button size="sm" variant="outline" className="shrink-0">
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                View
              </Button>
            </Link>
          </div>
        )}

        {!activeInstance && workflows.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-2">
            No workflows available for this entity type
            {companyId ? " in this company" : ""}.
          </p>
        )}

        {!activeInstance && workflows.length > 0 && !isActive && (
          <p className="text-sm text-slate-500 text-center py-2">No active workflow. Start one above.</p>
        )}

        {/* Status History */}
        {statusHistory.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              Workflow History
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...statusHistory].reverse().map((entry, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <div className={`px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_HISTORY_COLORS[entry.status] || "bg-slate-100 text-slate-700"}`}>
                    {entry.status?.replace(/_/g, " ")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-600 truncate">{entry.actor}</p>
                    {entry.comments && <p className="text-slate-500 italic truncate">{entry.comments}</p>}
                    <p className="text-slate-400">{entry.timestamp ? format(new Date(entry.timestamp), "MMM d, yyyy HH:mm") : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
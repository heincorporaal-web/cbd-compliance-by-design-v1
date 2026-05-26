import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CornerDownLeft, SkipForward, XOctagon, RefreshCw, Clock, User } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { toast } from "sonner";

const STATUS_COLORS = {
  in_progress: "bg-blue-100 text-blue-700",
  pending: "bg-slate-100 text-slate-700",
  returned: "bg-orange-100 text-orange-700",
};

const STUCK_THRESHOLD_HOURS = 24;

export default function StuckWorkflowPanel() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null); // 'revert' | 'advance' | 'terminate'
  const [reason, setReason] = useState("");
  const [advanceEmail, setAdvanceEmail] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'stuck'

  const { data: instances = [], isLoading } = useQuery({
    queryKey: ["workflowInstances_admin"],
    queryFn: () => base44.entities.WorkflowInstance.filter({ status: "in_progress" }),
  });

  const { data: pendingInstances = [] } = useQuery({
    queryKey: ["workflowInstances_admin_pending"],
    queryFn: () => base44.entities.WorkflowInstance.filter({ status: "pending" }),
  });

  const allActive = [...instances, ...pendingInstances];

  const stuckInstances = allActive.filter(i => {
    const updated = new Date(i.updated_date || i.created_date);
    return differenceInHours(new Date(), updated) >= STUCK_THRESHOLD_HOURS;
  });

  const displayList = filter === "stuck" ? stuckInstances : allActive;

  const actionMutation = useMutation({
    mutationFn: async ({ instance, actionType, reason, overrideEmail }) => {
      const now = new Date().toISOString();
      const adminEntry = {
        step_id: `admin_intervention_${Date.now()}`,
        step_name: `Admin Intervention`,
        action: actionType,
        actor: "admin",
        timestamp: now,
        comments: reason,
      };

      if (actionType === "revert") {
        await base44.entities.WorkflowInstance.update(instance.id, {
          status: "returned",
          return_reason: reason,
          returned_date: now,
          step_history: [...(instance.step_history || []), adminEntry],
        });
        // Notify originator
        if (instance.originator_email) {
          await base44.integrations.Core.SendEmail({
            to: instance.originator_email,
            subject: `[Admin Action] Item Returned: ${instance.entity_name}`,
            body: `An administrator has returned your submission "${instance.entity_name}" for revision.\n\nReason: ${reason}\n\nPlease review and resubmit.`,
          });
        }
      } else if (actionType === "advance") {
        const newApprovers = overrideEmail ? [overrideEmail] : [];
        await base44.entities.WorkflowInstance.update(instance.id, {
          status: "in_progress",
          pending_approvers: newApprovers,
          step_history: [...(instance.step_history || []), adminEntry],
        });
        if (overrideEmail) {
          await base44.integrations.Core.SendEmail({
            to: overrideEmail,
            subject: `Approval Required: ${instance.entity_name}`,
            body: `You have been assigned as the approver for "${instance.entity_name}" by an administrator.\n\nReason: ${reason}`,
          });
        }
      } else if (actionType === "terminate") {
        await base44.entities.WorkflowInstance.update(instance.id, {
          status: "rejected",
          completed_date: now,
          step_history: [...(instance.step_history || []), adminEntry],
        });
        const notify = [
          instance.originator_email,
          ...(instance.pending_approvers || []),
        ].filter(Boolean);
        for (const email of [...new Set(notify)]) {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: `[Admin Action] Workflow Terminated: ${instance.entity_name}`,
            body: `An administrator has terminated the workflow for "${instance.entity_name}".\n\nReason: ${reason}`,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["workflowInstances_admin"]);
      queryClient.invalidateQueries(["workflowInstances_admin_pending"]);
      setSelected(null);
      setAction(null);
      setReason("");
      setAdvanceEmail("");
      toast.success("Workflow intervention applied successfully.");
    },
  });

  const openDialog = (instance, actionType) => {
    setSelected(instance);
    setAction(actionType);
    setReason("");
    setAdvanceEmail("");
  };

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.error("A reason is required for all admin interventions.");
      return;
    }
    actionMutation.mutate({
      instance: selected,
      actionType: action,
      reason,
      overrideEmail: advanceEmail,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-slate-500">
            Manage workflow instances that are stuck, stalled, or require admin intervention.
            Instances inactive for &gt;{STUCK_THRESHOLD_HOURS}h are flagged as stuck.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All Active ({allActive.length})
          </Button>
          <Button
            variant={filter === "stuck" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("stuck")}
            className={stuckInstances.length > 0 ? "border-amber-400 text-amber-700" : ""}
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Stuck ({stuckInstances.length})
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-8 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
          Loading workflow instances…
        </div>
      )}

      {!isLoading && displayList.length === 0 && (
        <Card className="border-2 border-dashed border-slate-200">
          <CardContent className="p-10 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
            No {filter === "stuck" ? "stuck" : "active"} workflow instances found.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {displayList.map(inst => {
          const updated = new Date(inst.updated_date || inst.created_date);
          const hoursStale = differenceInHours(new Date(), updated);
          const isStuck = hoursStale >= STUCK_THRESHOLD_HOURS;

          return (
            <Card key={inst.id} className={`border ${isStuck ? "border-amber-200 bg-amber-50/40" : "border-slate-200"}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-900 text-sm">{inst.entity_name || inst.id}</h3>
                      <Badge className={STATUS_COLORS[inst.status] || "bg-slate-100 text-slate-600"}>
                        {inst.status.replace("_", " ")}
                      </Badge>
                      {isStuck && (
                        <Badge className="bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Stuck {hoursStale}h
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{inst.entity_type} · Step {(inst.current_step || 0) + 1}</p>
                    {inst.pending_approvers?.length > 0 && (
                      <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Awaiting: {inst.pending_approvers.join(", ")}
                      </p>
                    )}
                    {inst.originator_email && (
                      <p className="text-xs text-slate-400 mt-0.5">Submitted by: {inst.originator_email}</p>
                    )}
                    <p className="text-xs text-slate-400">Last updated: {format(updated, "MMM d, yyyy HH:mm")}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50 text-xs h-8"
                      onClick={() => openDialog(inst, "revert")}
                    >
                      <CornerDownLeft className="w-3 h-3 mr-1" />
                      Revert to Sender
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs h-8"
                      onClick={() => openDialog(inst, "advance")}
                    >
                      <SkipForward className="w-3 h-3 mr-1" />
                      Advance / Override
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 text-xs h-8"
                      onClick={() => openDialog(inst, "terminate")}
                    >
                      <XOctagon className="w-3 h-3 mr-1" />
                      Terminate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Intervention Dialog */}
      <Dialog open={!!selected && !!action} onOpenChange={() => { setSelected(null); setAction(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {action === "revert" && <><CornerDownLeft className="w-4 h-4 text-orange-600" /> Revert to Sender</>}
              {action === "advance" && <><SkipForward className="w-4 h-4 text-blue-600" /> Advance / Override Approver</>}
              {action === "terminate" && <><XOctagon className="w-4 h-4 text-red-600" /> Terminate Workflow</>}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                <p className="font-medium text-slate-800">{selected.entity_name}</p>
                <p className="text-xs text-slate-500">{selected.entity_type} · Step {(selected.current_step || 0) + 1} · {selected.status}</p>
              </div>

              {action === "revert" && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                  The item will be returned to <strong>{selected.originator_email || "the originator"}</strong> with your reason. They can review and resubmit.
                </div>
              )}

              {action === "advance" && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    The current step will be overridden. Optionally assign a new approver email. Leave blank to keep the current pending approvers.
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Override Approver Email <span className="text-slate-400">(optional)</span></Label>
                    <Input
                      type="email"
                      placeholder="approver@company.com"
                      value={advanceEmail}
                      onChange={e => setAdvanceEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {action === "terminate" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  The workflow will be <strong>permanently terminated</strong>. All pending approvers and the originator will be notified by email.
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">
                  Reason / Admin Notes <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  rows={3}
                  placeholder="Explain the reason for this admin intervention…"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setAction(null); }}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={actionMutation.isPending || !reason.trim()}
              className={
                action === "terminate" ? "bg-red-600 hover:bg-red-700" :
                action === "revert" ? "bg-orange-600 hover:bg-orange-700" :
                "bg-blue-600 hover:bg-blue-700"
              }
            >
              {actionMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm {action === "revert" ? "Revert" : action === "advance" ? "Override" : "Terminate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
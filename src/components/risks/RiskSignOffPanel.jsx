import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, AlertCircle, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_CONFIG = {
  draft:          { label: "Draft",          color: "bg-slate-100 text-slate-700" },
  identified:     { label: "Identified",     color: "bg-blue-100 text-blue-700" },
  pending_review: { label: "Pending Review", color: "bg-amber-100 text-amber-700" },
  returned:       { label: "Returned",       color: "bg-red-100 text-red-700" },
  approved:       { label: "Approved",       color: "bg-green-100 text-green-700" },
  assessed:       { label: "Assessed",       color: "bg-indigo-100 text-indigo-700" },
  mitigated:      { label: "Mitigated",      color: "bg-teal-100 text-teal-700" },
  accepted:       { label: "Accepted",       color: "bg-purple-100 text-purple-700" },
  closed:         { label: "Closed",         color: "bg-slate-200 text-slate-600" },
};

export default function RiskSignOffPanel({ risk, companyId }) {
  const [selectedSigner, setSelectedSigner] = useState("");
  const queryClient = useQueryClient();

  // Load Leadership group members for this company
  const { data: leadershipGroups = [] } = useQuery({
    queryKey: ["stakeholder-groups-leadership", companyId],
    queryFn: () => base44.entities.StakeholderGroup.filter({ company_id: companyId, name: "Leadership" }),
    enabled: !!companyId,
  });

  const leadershipGroupId = leadershipGroups[0]?.id;

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders-active", companyId],
    queryFn: () => base44.entities.Stakeholder.filter({ company_id: companyId, status: "active" }),
    enabled: !!companyId,
  });

  const leadershipMembers = stakeholders.filter(s => s.group_ids?.includes(leadershipGroupId));

  const signOffMutation = useMutation({
    mutationFn: () => base44.functions.invoke("riskWorkflowEngine", {
      action: "signoff",
      risk_id: risk.id,
      signer_stakeholder_id: selectedSigner,
    }),
    onSuccess: (res) => {
      if (res.data?.error) {
        toast.error(res.data.error);
      } else {
        toast.success("Risk approved successfully!");
        queryClient.invalidateQueries(["risk", risk.id]);
        queryClient.invalidateQueries(["risks"]);
        setSelectedSigner("");
      }
    },
    onError: () => toast.error("Failed to process sign-off"),
  });

  const statusCfg = STATUS_CONFIG[risk.status] || STATUS_CONFIG.identified;
  const canSignOff = risk.status === "pending_review";
  const history = risk.workflow_status_history || [];

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-600" />
          Workflow & Sign-off
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-5">

        {/* Current Status */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Current Status:</span>
          <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
        </div>

        {/* How the engine works */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm text-slate-600">
          <p className="font-medium text-slate-700">Automated Workflow Rules</p>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <span>Assigning a Risk Owner automatically moves status to <strong>Pending Review</strong> and notifies Leadership.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>A Leadership member sign-off moves status to <strong>Approved</strong> and notifies the Risk Owner.</span>
          </div>
        </div>

        {/* Leadership Sign-off */}
        {canSignOff && leadershipMembers.length > 0 && (
          <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Awaiting Leadership Sign-off
            </p>
            <div className="flex gap-2">
              <Select value={selectedSigner} onValueChange={setSelectedSigner}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select signing leader…" />
                </SelectTrigger>
                <SelectContent>
                  {leadershipMembers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} — {s.job_title || "Leadership"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => signOffMutation.mutate()}
                disabled={!selectedSigner || signOffMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve
              </Button>
            </div>
          </div>
        )}

        {canSignOff && leadershipMembers.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            No Leadership members found for this company. Add stakeholders to the Leadership group to enable sign-off.
          </div>
        )}

        {risk.status === "approved" && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <CheckCircle className="w-4 h-4 shrink-0" />
            This risk has been approved by Leadership.
          </div>
        )}

        {/* Status History */}
        {history.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Status History</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...history].reverse().map((entry, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={`${STATUS_CONFIG[entry.status]?.color || "bg-slate-100 text-slate-700"} text-xs`}>
                        {STATUS_CONFIG[entry.status]?.label || entry.status}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {entry.timestamp ? format(new Date(entry.timestamp), "dd MMM yyyy HH:mm") : ""}
                      </span>
                    </div>
                    {entry.comments && <p className="text-xs text-slate-500 mt-1">{entry.comments}</p>}
                    {entry.actor && entry.actor !== "system" && (
                      <p className="text-xs text-slate-400">by {entry.actor}</p>
                    )}
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
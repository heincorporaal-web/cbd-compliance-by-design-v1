import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Target, Shield, Crosshair } from "lucide-react";

// Map an item's status to an on-track flag for performance scoring.
const ON_TRACK = {
  // OrgObjective statuses
  Approved: true, Active: true,
  Draft: false, "Under Review": false, Retired: false,
  // GRCGoal statuses
  on_track: true, achieved: true,
  not_started: false, in_progress: false, at_risk: false,
  // Control statuses
  approved: true, active: true,
  draft: false, pending_review: false, returned: false, archived: false,
};

const isOnTrack = (status) => !!ON_TRACK[status];

export default function ScorecardPerspectiveCard({
  perspective,
  index,
  objectives,
  goals,
  controls,
  onFieldChange,
  onLinkItem,
  onUnlinkItem,
  onOpenLinker,
}) {
  const linkedObjectives = objectives.filter(o => perspective.linked_objective_ids?.includes(o.id));
  const linkedGoals = goals.filter(g => perspective.linked_grc_goal_ids?.includes(g.id));
  const linkedControls = controls.filter(c => perspective.linked_control_ids?.includes(c.id));

  const allLinked = useMemo(() => [
    ...linkedObjectives.map(o => ({ kind: "objective", id: o.id, label: o.title, status: o.status })),
    ...linkedGoals.map(g => ({ kind: "goal", id: g.id, label: g.title, status: g.status })),
    ...linkedControls.map(c => ({ kind: "control", id: c.id, label: `${c.control_id} — ${c.title}`, status: c.status })),
  ], [linkedObjectives, linkedGoals, linkedControls]);

  const total = allLinked.length;
  const onTrackCount = allLinked.filter(i => isOnTrack(i.status)).length;
  const score = total > 0 ? Math.round((onTrackCount / total) * 100) : 0;

  const kindMeta = {
    objective: { icon: Target, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
    goal: { icon: Crosshair, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
    control: { icon: Shield, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  };

  return (
    <Card className="border-none shadow-lg" style={{ borderTop: `3px solid ${perspective.color_hex || "#6366f1"}` }}>
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: perspective.color_hex || "#6366f1" }} />
            {perspective.name || `Perspective ${index + 1}`}
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-slate-500 mb-0">Weight %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={perspective.weight_pct ?? 0}
                onChange={(e) => onFieldChange("weight_pct", Number(e.target.value))}
                className="w-20 h-8"
              />
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Performance</p>
              <p className={`text-lg font-bold ${score >= 75 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600"}`}>
                {score}%
              </p>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">{onTrackCount} of {total} linked items on track</p>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label className="text-xs">Perspective Name</Label>
          <Input
            value={perspective.name || ""}
            onChange={(e) => onFieldChange("name", e.target.value)}
            placeholder="e.g. Financial"
          />
        </div>

        {/* Linked items */}
        {total === 0 ? (
          <p className="text-sm text-slate-500 text-center py-3">No items linked to this perspective yet</p>
        ) : (
          <div className="space-y-2">
            {allLinked.map((item) => {
              const meta = kindMeta[item.kind];
              const Icon = meta.icon;
              const track = isOnTrack(item.status);
              return (
                <div key={`${item.kind}-${item.id}`} className={`flex items-center justify-between p-2.5 rounded-lg border ${meta.bg} ${meta.border}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${meta.color}`} />
                    <span className="text-sm font-medium text-slate-800 truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={track ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"}>
                      {track ? "On Track" : (item.status || "Off Track")}
                    </Badge>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUnlinkItem(item.kind, item.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenLinker("objective")}>
            <Plus className="w-4 h-4 mr-1" /> Link Objective
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenLinker("goal")}>
            <Plus className="w-4 h-4 mr-1" /> Link GRC Goal
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenLinker("control")}>
            <Plus className="w-4 h-4 mr-1" /> Link Control
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Notes</Label>
          <Textarea
            value={perspective.notes || ""}
            onChange={(e) => onFieldChange("notes", e.target.value)}
            rows={2}
            placeholder="Perspective notes / strategy focus..."
          />
        </div>
      </CardContent>
    </Card>
  );
}
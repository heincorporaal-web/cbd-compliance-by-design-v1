import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Plus, Trash2, Gauge, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import CompanyField from "@/components/CompanyField";
import ScorecardPerspectiveCard from "@/components/scorecard/ScorecardPerspectiveCard";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

const DEFAULT_PERSPECTIVES = [
  { name: "Financial", weight_pct: 25, color_hex: "#22c55e" },
  { name: "Customer", weight_pct: 25, color_hex: "#3b82f6" },
  { name: "Internal Process", weight_pct: 25, color_hex: "#f59e0b" },
  { name: "Learning & Growth", weight_pct: 25, color_hex: "#a855f7" },
];

const genId = () => `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const ON_TRACK = {
  Approved: true, Active: true, on_track: true, achieved: true, approved: true, active: true,
  Draft: false, "Under Review": false, Retired: false, not_started: false, in_progress: false, at_risk: false,
  draft: false, pending_review: false, returned: false, archived: false,
};
const isOnTrack = (status) => !!ON_TRACK[status];

const perspectiveScore = (p, objectives, goals, controls) => {
  const items = [
    ...objectives.filter(o => p.linked_objective_ids?.includes(o.id)).map(o => o.status),
    ...goals.filter(g => p.linked_grc_goal_ids?.includes(g.id)).map(g => g.status),
    ...controls.filter(c => p.linked_control_ids?.includes(c.id)).map(c => c.status),
  ];
  if (!items.length) return 0;
  return Math.round((items.filter(isOnTrack).length / items.length) * 100);
};

export default function BalancedScorecardDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const scorecardId = urlParams.get("id");
  const [globalCompany, , { locked }] = useCompanyFilter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    company_id: globalCompany && globalCompany !== "all" ? globalCompany : "",
    period: "",
    start_date: "",
    end_date: "",
    owner: "",
    status: "draft",
    perspectives: DEFAULT_PERSPECTIVES.map((p) => ({ id: genId(), ...p, linked_objective_ids: [], linked_grc_goal_ids: [], linked_control_ids: [], notes: "" })),
    notes: "",
  });

  const [linkerState, setLinkerState] = useState({ open: false, kind: null, perspectiveId: null });

  const { data: existing } = useQuery({
    queryKey: ["balancedScorecard", scorecardId],
    queryFn: () => base44.entities.BalancedScorecard.filter({ id: scorecardId }),
    enabled: !!scorecardId,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: objectives = [] } = useQuery({
    queryKey: ["orgObjectives"],
    queryFn: () => base44.entities.OrgObjective.list("-created_date"),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["grcGoals"],
    queryFn: () => base44.entities.GRCGoal.list("-created_date"),
  });

  const { data: controls = [] } = useQuery({
    queryKey: ["controls"],
    queryFn: () => base44.entities.Control.list(),
  });

  useEffect(() => {
    if (existing?.[0]) {
      setFormData((prev) => ({ ...prev, ...existing[0], perspectives: existing[0].perspectives?.length ? existing[0].perspectives : prev.perspectives }));
    }
  }, [existing]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BalancedScorecard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["balancedScorecards"]);
      navigate(createPageUrl("BalancedScorecards"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.BalancedScorecard.update(scorecardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["balancedScorecards"]);
      queryClient.invalidateQueries(["balancedScorecard", scorecardId]);
    },
  });

  const setField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const updatePerspective = (perspectiveId, patch) => {
    setFormData((prev) => ({
      ...prev,
      perspectives: prev.perspectives.map((p) => (p.id === perspectiveId ? { ...p, ...patch } : p)),
    }));
  };

  const addPerspective = () => {
    setFormData((prev) => ({
      ...prev,
      perspectives: [...prev.perspectives, { id: genId(), name: "", weight_pct: 0, color_hex: "#6366f1", linked_objective_ids: [], linked_grc_goal_ids: [], linked_control_ids: [], notes: "" }],
    }));
  };

  const removePerspective = (perspectiveId) => {
    setFormData((prev) => ({ ...prev, perspectives: prev.perspectives.filter((p) => p.id !== perspectiveId) }));
  };

  const linkItem = (kind, itemId) => {
    const { perspectiveId } = linkerState;
    setFormData((prev) => ({
      ...prev,
      perspectives: prev.perspectives.map((p) => {
        if (p.id !== perspectiveId) return p;
        const key = kind === "objective" ? "linked_objective_ids" : kind === "goal" ? "linked_grc_goal_ids" : "linked_control_ids";
        return { ...p, [key]: [...(p[key] || []), itemId] };
      }),
    }));
    setLinkerState({ open: false, kind: null, perspectiveId: null });
  };

  const unlinkItem = (perspectiveId, kind, itemId) => {
    setFormData((prev) => ({
      ...prev,
      perspectives: prev.perspectives.map((p) => {
        if (p.id !== perspectiveId) return p;
        const key = kind === "objective" ? "linked_objective_ids" : kind === "goal" ? "linked_grc_goal_ids" : "linked_control_ids";
        return { ...p, [key]: (p[key] || []).filter((id) => id !== itemId) };
      }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_id) {
      alert("Please select a company before saving.");
      return;
    }
    if (scorecardId) await updateMutation.mutateAsync(formData);
    else await createMutation.mutateAsync(formData);
  };

  // Performance data
  const chartData = useMemo(
    () => formData.perspectives.map((p) => ({ perspective: p.name || "—", score: perspectiveScore(p, objectives, goals, controls) })),
    [formData.perspectives, objectives, goals, controls]
  );

  const totalWeight = formData.perspectives.reduce((s, p) => s + (p.weight_pct || 0), 0);
  const overallScore = useMemo(() => {
    const used = formData.perspectives.filter((p) => (p.linked_objective_ids?.length || 0) + (p.linked_grc_goal_ids?.length || 0) + (p.linked_control_ids?.length || 0) > 0);
    const w = used.reduce((s, p) => s + (p.weight_pct || 0), 0);
    if (!w) return 0;
    return Math.round(used.reduce((s, p) => s + perspectiveScore(p, objectives, goals, controls) * (p.weight_pct || 0), 0) / w);
  }, [formData.perspectives, objectives, goals, controls]);

  // Linker candidate lists (scoped to selected company)
  const companyObjectives = locked ? objectives : objectives.filter((o) => !formData.company_id || o.company_id === formData.company_id);
  const companyGoals = locked ? goals : goals.filter((g) => !formData.company_id || g.company_id === formData.company_id);

  const linkerCandidates = useMemo(() => {
    if (!linkerState.open) return [];
    const { kind, perspectiveId } = linkerState;
    const perspective = formData.perspectives.find((p) => p.id === perspectiveId);
    if (kind === "objective") return companyObjectives.filter((o) => !perspective?.linked_objective_ids?.includes(o.id));
    if (kind === "goal") return companyGoals.filter((g) => !perspective?.linked_grc_goal_ids?.includes(g.id));
    if (kind === "control") return controls.filter((c) => !perspective?.linked_control_ids?.includes(c.id));
    return [];
  }, [linkerState, formData.perspectives, companyObjectives, companyGoals, controls]);

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl("BalancedScorecards"))}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{scorecardId ? "Edit Scorecard" : "New Scorecard"}</h1>
            <p className="text-slate-600">Define perspectives and link goals, objectives & controls</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(createPageUrl("BalancedScorecards"))}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" /> {scorecardId ? "Save Changes" : "Create Scorecard"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Summary header */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100"><CardTitle>Scorecard Details</CardTitle></CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5 lg:col-span-2">
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setField("name", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Period</Label>
                <Input value={formData.period} onChange={(e) => setField("period", e.target.value)} placeholder="e.g. FY2026" />
              </div>
              <CompanyField value={formData.company_id} onChange={(v) => setField("company_id", v)} companies={companies} />
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Owner</Label>
                <Input value={formData.owner} onChange={(e) => setField("owner", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => setField("start_date", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={formData.end_date} onChange={(e) => setField("end_date", e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setField("description", e.target.value)} rows={2} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-600" /> Overall Performance</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-6xl font-bold text-indigo-600">{overallScore}%</p>
                <p className="text-sm text-slate-500 mt-2">Weighted on-track score across active perspectives</p>
              </div>
              <div className="mt-4 h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${overallScore >= 75 ? "bg-green-500" : overallScore >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${overallScore}%` }} />
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                <span>Total weight: {totalWeight}%</span>
                <Badge variant="outline" className={totalWeight === 100 ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
                  {totalWeight === 100 ? "Balanced" : "Unbalanced"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg lg:col-span-2">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2"><Gauge className="w-5 h-5 text-indigo-600" /> Perspective Radar</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {chartData.length >= 3 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={chartData} outerRadius="75%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="perspective" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} angle={90} />
                    <Radar name="Performance" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500 text-center py-10">Add at least 3 perspectives to view the radar chart</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Perspectives */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Perspectives</h2>
          <Button type="button" variant="outline" onClick={addPerspective}>
            <Plus className="w-4 h-4 mr-1" /> Add Perspective
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {formData.perspectives.map((p, i) => (
            <div key={p.id} className="relative">
              <ScorecardPerspectiveCard
                perspective={p}
                index={i}
                objectives={objectives}
                goals={goals}
                controls={controls}
                onFieldChange={(field, value) => updatePerspective(p.id, { [field]: value })}
                onLinkItem={() => {}}
                onUnlinkItem={(kind, itemId) => unlinkItem(p.id, kind, itemId)}
                onOpenLinker={(kind) => setLinkerState({ open: true, kind, perspectiveId: p.id })}
              />
              {formData.perspectives.length > 1 && (
                <Button type="button" variant="ghost" size="sm" className="absolute top-3 right-3 z-10" onClick={() => removePerspective(p.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100"><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent className="pt-6">
            <Textarea value={formData.notes} onChange={(e) => setField("notes", e.target.value)} rows={3} />
          </CardContent>
        </Card>
      </form>

      {/* Linker dialog */}
      <Dialog open={linkerState.open} onOpenChange={(o) => setLinkerState((s) => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Link {linkerState.kind === "objective" ? "Objective" : linkerState.kind === "goal" ? "GRC Goal" : "Control"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {linkerCandidates.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No items available to link</p>
            ) : (
              linkerCandidates.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                  onClick={() => linkItem(linkerState.kind, item.id)}
                >
                  <p className="font-medium text-slate-900">
                    {linkerState.kind === "control" ? `${item.control_id} — ${item.title}` : item.title}
                  </p>
                  {item.description && <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>}
                  {item.status && <Badge variant="outline" className="mt-1 bg-slate-50">{item.status}</Badge>}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
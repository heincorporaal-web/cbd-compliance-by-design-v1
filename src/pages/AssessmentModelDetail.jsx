import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plus, Trash2, Info } from "lucide-react";
import { toast } from "sonner";



const MATURITY_DEFAULTS = [
  { id: "m1", level_number: 1, qualitative_label: "Initial", quantitative_label: "Ad-hoc", score_low: 0, score_high: 20, description: "Processes are unpredictable, poorly controlled and reactive", color_hex: "#ef4444" },
  { id: "m2", level_number: 2, qualitative_label: "Developing", quantitative_label: "Repeatable", score_low: 21, score_high: 40, description: "Processes are characterised for the project and are often reactive", color_hex: "#f97316" },
  { id: "m3", level_number: 3, qualitative_label: "Defined", quantitative_label: "Defined", score_low: 41, score_high: 60, description: "Processes are characterised for the organisation and are proactive", color_hex: "#f59e0b" },
  { id: "m4", level_number: 4, qualitative_label: "Managed", quantitative_label: "Quantitatively Managed", score_low: 61, score_high: 80, description: "Processes are measured and controlled using quantitative data", color_hex: "#22c55e" },
  { id: "m5", level_number: 5, qualitative_label: "Optimizing", quantitative_label: "Optimizing", score_low: 81, score_high: 100, description: "Focus on continuous process improvement and innovation", color_hex: "#16a34a" },
];

const SUPPLIER_DEFAULTS = [
  { id: "s1", value: "meets_none", label: "Meets No Requirements", description: "Supplier fails to meet contract requirements", color_hex: "#ef4444", sort_order: 1 },
  { id: "s2", value: "meets_some", label: "Meets Some Requirements", description: "Supplier partially meets requirements", color_hex: "#f97316", sort_order: 2 },
  { id: "s3", value: "meets_sla", label: "Meets Requirements per SLA", description: "Supplier meets all agreed SLA requirements", color_hex: "#22c55e", sort_order: 3 },
  { id: "s4", value: "exceeds", label: "Exceeds Requirements", description: "Supplier performance exceeds all requirements", color_hex: "#16a34a", sort_order: 4 },
];

const CRITICALITY_DEFAULTS = [
  { id: "c1", value: "low", label: "Low", description: "Minimal business impact", color_hex: "#22c55e", sort_order: 1 },
  { id: "c2", value: "medium", label: "Medium", description: "Moderate business impact", color_hex: "#f59e0b", sort_order: 2 },
  { id: "c3", value: "high", label: "High", description: "Significant business impact", color_hex: "#ef4444", sort_order: 3 },
  { id: "c4", value: "critical", label: "Critical", description: "Severe / catastrophic business impact", color_hex: "#7f1d1d", sort_order: 4 },
];

const EMPTY_IMPACT = () => ({ id: crypto.randomUUID(), low_value: 0, high_value: 0, weight_pct: null, color_hex: "", label: "" });
const EMPTY_LIKELIHOOD = () => ({ id: crypto.randomUUID(), low_value: 0, high_value: 0, label: "" });
const EMPTY_RATING = () => ({ id: crypto.randomUUID(), value: "", label: "", description: "", color_hex: "#94a3b8", sort_order: 0 });

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "in_edit", label: "In Edit" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const TYPE_OPTIONS = ["Qualitative", "Quantitative", "Semi-Quantitative", "Maturity Assessment", "Supplier Services", "Criticality"];

export default function AssessmentModelDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const modelId = urlParams.get("id");
  const isNew = urlParams.get("mode") === "new";

  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "", description: "", analysis_type: "Qualitative", status: "draft",
    revision: 1, revision_date: "", start_date: "", end_date: "",
    ratings_formula: "product", is_global: false, notes: "",
    impact_levels: [], likelihood_levels: [], rating_options: [], maturity_levels: [],
  });
  const [dirty, setDirty] = useState(false);

  const { data: model, isLoading } = useQuery({
    queryKey: ["assessment-model", modelId],
    queryFn: () => base44.entities.AssessmentModel.get(modelId),
    enabled: !!modelId && !isNew,
  });

  useEffect(() => {
    if (model) {
      setForm({
        name: model.name || "",
        description: model.description || "",
        analysis_type: model.analysis_type || "Qualitative",
        status: model.status || "draft",
        revision: model.revision || 1,
        revision_date: model.revision_date || "",
        start_date: model.start_date || "",
        end_date: model.end_date || "",
        ratings_formula: model.ratings_formula || model.risk_formula || "product",
        is_global: model.is_global || false,
        notes: model.notes || "",
        impact_levels: model.impact_levels || [],
        likelihood_levels: model.likelihood_levels || [],
        rating_options: model.rating_options || [],
        maturity_levels: model.maturity_levels || [],
      });
    }
  }, [model]);

  const set = (field, value) => { setForm(p => ({ ...p, [field]: value })); setDirty(true); };

  // Auto-seed defaults when switching type
  const handleTypeChange = (type) => {
    if (type === "Supplier Services") {
      setForm(p => ({ ...p, analysis_type: type, rating_options: p.rating_options.length === 0 ? SUPPLIER_DEFAULTS : p.rating_options }));
    } else if (type === "Criticality") {
      setForm(p => ({ ...p, analysis_type: type, rating_options: p.rating_options.length === 0 ? CRITICALITY_DEFAULTS : p.rating_options }));
    } else if (type === "Maturity Assessment") {
      setForm(p => ({ ...p, analysis_type: type, ratings_formula: "hybrid_maturity", maturity_levels: p.maturity_levels.length === 0 ? MATURITY_DEFAULTS : p.maturity_levels }));
    } else {
      setForm(p => ({ ...p, analysis_type: type, ratings_formula: p.ratings_formula === "hybrid_maturity" ? "product" : p.ratings_formula }));
    }
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => modelId && !isNew
      ? base44.entities.AssessmentModel.update(modelId, form)
      : base44.entities.AssessmentModel.create(form),
    onSuccess: (result) => {
      queryClient.invalidateQueries(["assessment-models"]);
      queryClient.invalidateQueries(["assessment-model", modelId]);
      setDirty(false);
      toast.success("Model saved");
      if (isNew && result?.id) {
        window.history.replaceState(null, "", `${createPageUrl("AssessmentModelDetail")}?id=${result.id}`);
      }
    },
    onError: e => toast.error(e.message),
  });

  const isRiskModel = ["Qualitative", "Quantitative", "Semi-Quantitative"].includes(form.analysis_type);
  const isMaturityModel = form.analysis_type === "Maturity Assessment";
  const isRatingModel = ["Supplier Services", "Criticality"].includes(form.analysis_type);

  const updateMaturity = (idx, field, value) => {
    const levels = [...form.maturity_levels];
    levels[idx] = { ...levels[idx], [field]: ["level_number","score_low","score_high"].includes(field) ? Number(value) : value };
    set("maturity_levels", levels);
  };

  // Impact table helpers
  const updateImpact = (idx, field, value) => {
    const levels = [...form.impact_levels];
    levels[idx] = { ...levels[idx], [field]: field.includes("value") || field === "weight_pct" ? Number(value) : value };
    set("impact_levels", levels);
  };
  const updateLikelihood = (idx, field, value) => {
    const levels = [...form.likelihood_levels];
    levels[idx] = { ...levels[idx], [field]: field.includes("value") ? Number(value) : value };
    set("likelihood_levels", levels);
  };
  const updateRating = (idx, field, value) => {
    const opts = [...form.rating_options];
    opts[idx] = { ...opts[idx], [field]: field === "sort_order" ? Number(value) : value };
    set("rating_options", opts);
  };

  if (!isNew && isLoading) return <div className="p-8 text-center text-slate-400">Loading…</div>;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("AssessmentModels")}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{isNew ? "New Assessment Model" : form.name || "Assessment Model"}</h1>
            <p className="text-xs text-slate-400 mt-0.5">Assessment Model</p>
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" /> {saveMutation.isPending ? "Saving…" : "Save Model"}
        </Button>
      </div>

      {dirty && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <Info className="w-4 h-4 shrink-0" /> You have unsaved changes.
        </div>
      )}

      {/* Core details */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base">Model Details</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. IT Governance (ISO27001)" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Analysis Type</Label>
              <Select value={form.analysis_type} onValueChange={handleTypeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Revision #</Label>
              <Input type="number" value={form.revision} onChange={e => set("revision", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Revision Date</Label>
              <Input type="date" value={form.revision_date} onChange={e => set("revision_date", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_global"
              checked={form.is_global}
              onChange={e => set("is_global", e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="is_global" className="cursor-pointer">Global model (available to all companies)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Ratings Formula */}
      {(isRiskModel || isMaturityModel) && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Ratings Formula</CardTitle></CardHeader>
          <CardContent className="p-5 space-y-3">
            <div className="flex flex-col gap-3">
              {(isMaturityModel
                ? [
                    { value: "hybrid_maturity", label: "Hybrid Maturity", formula: "Combines qualitative labels (e.g. Initial → Optimizing) with a quantitative score range per level — enabling both descriptive and numeric reporting" },
                  ]
                : [
                    { value: "product", label: "Product", formula: "Risk Level = Likelihood × Impact" },
                    { value: "weighted_product", label: "Weighted Product", formula: "Risk Level = Exp((Impact × Weighting Factor), X) × Exp(Likelihood, Y)" },
                  ]
              ).map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.ratings_formula === opt.value ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"}`}>
                  <input
                    type="radio"
                    name="ratings_formula"
                    value={opt.value}
                    checked={form.ratings_formula === opt.value}
                    onChange={() => set("ratings_formula", opt.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-medium text-sm text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.formula}</p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maturity Levels (Hybrid Maturity) */}
      {isMaturityModel && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Maturity Levels</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Each level combines a qualitative label with a quantitative score range.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => set("maturity_levels", [...form.maturity_levels, { id: crypto.randomUUID(), level_number: form.maturity_levels.length + 1, qualitative_label: "", quantitative_label: "", score_low: 0, score_high: 0, description: "", color_hex: "#94a3b8" }])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Level
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 w-12">#</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Qualitative Label</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Quantitative Label</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Score Low</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Score High</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Description</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Colour</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {form.maturity_levels.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-6 text-center text-xs text-slate-400 italic">No levels defined.</td></tr>
                  ) : form.maturity_levels.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2"><Input type="number" value={row.level_number} onChange={e => updateMaturity(idx, "level_number", e.target.value)} className="h-8 text-sm w-14" /></td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {row.color_hex && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: row.color_hex }} />}
                          <Input value={row.qualitative_label} onChange={e => updateMaturity(idx, "qualitative_label", e.target.value)} className="h-8 text-sm" placeholder="e.g. Managed" />
                        </div>
                      </td>
                      <td className="px-3 py-2"><Input value={row.quantitative_label} onChange={e => updateMaturity(idx, "quantitative_label", e.target.value)} className="h-8 text-sm" placeholder="e.g. Quantitatively Managed" /></td>
                      <td className="px-3 py-2"><Input type="number" value={row.score_low} onChange={e => updateMaturity(idx, "score_low", e.target.value)} className="h-8 text-sm w-20" /></td>
                      <td className="px-3 py-2"><Input type="number" value={row.score_high} onChange={e => updateMaturity(idx, "score_high", e.target.value)} className="h-8 text-sm w-20" /></td>
                      <td className="px-3 py-2"><Input value={row.description} onChange={e => updateMaturity(idx, "description", e.target.value)} className="h-8 text-sm" placeholder="Brief description" /></td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <input type="color" value={row.color_hex || "#94a3b8"} onChange={e => updateMaturity(idx, "color_hex", e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-slate-200" />
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => set("maturity_levels", form.maturity_levels.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Preview */}
            {form.maturity_levels.length > 0 && (
              <div className="p-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Preview</p>
                <div className="flex gap-2 flex-wrap">
                  {[...form.maturity_levels].sort((a,b) => a.level_number - b.level_number).map(lvl => (
                    <div key={lvl.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs" style={{ borderColor: lvl.color_hex || "#94a3b8", backgroundColor: (lvl.color_hex || "#94a3b8") + "18" }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: lvl.color_hex || "#94a3b8" }}>{lvl.level_number}</span>
                      <div>
                        <div className="font-semibold text-slate-800">{lvl.qualitative_label || "—"}</div>
                        {lvl.quantitative_label && <div className="text-slate-500">{lvl.quantitative_label}</div>}
                        <div className="text-slate-400">{lvl.score_low}–{lvl.score_high}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Impact Model */}
      {isRiskModel && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Impact Model</CardTitle>
            <Button size="sm" variant="outline" onClick={() => set("impact_levels", [...form.impact_levels, EMPTY_IMPACT()])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Band
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Low Value</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">High Value</th>
                    {form.risk_formula === "weighted_product" && (
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Weight %</th>
                    )}
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Colour</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Label</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {form.impact_levels.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-400 italic">No bands defined. Click "Add Band" to start.</td></tr>
                  ) : form.impact_levels.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2"><Input type="number" value={row.low_value} onChange={e => updateImpact(idx, "low_value", e.target.value)} className="h-8 text-sm w-20" /></td>
                      <td className="px-3 py-2"><Input type="number" value={row.high_value} onChange={e => updateImpact(idx, "high_value", e.target.value)} className="h-8 text-sm w-20" /></td>
                      {form.risk_formula === "weighted_product" && (
                        <td className="px-3 py-2"><Input type="number" value={row.weight_pct ?? ""} onChange={e => updateImpact(idx, "weight_pct", e.target.value)} className="h-8 text-sm w-20" placeholder="%" /></td>
                      )}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <input type="color" value={row.color_hex || "#94a3b8"} onChange={e => updateImpact(idx, "color_hex", e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-slate-200" />
                          <Input value={row.color_hex} onChange={e => updateImpact(idx, "color_hex", e.target.value)} className="h-8 text-sm w-24 font-mono text-xs" placeholder="#000000" />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {row.color_hex && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: row.color_hex }} />}
                          <Input value={row.label} onChange={e => updateImpact(idx, "label", e.target.value)} className="h-8 text-sm" placeholder="e.g. High" />
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => set("impact_levels", form.impact_levels.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Likelihood Model */}
      {isRiskModel && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Likelihood Model</CardTitle>
            <Button size="sm" variant="outline" onClick={() => set("likelihood_levels", [...form.likelihood_levels, EMPTY_LIKELIHOOD()])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Band
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Low Value</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">High Value</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Label</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {form.likelihood_levels.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-slate-400 italic">No bands defined. Click "Add Band" to start.</td></tr>
                  ) : form.likelihood_levels.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2"><Input type="number" value={row.low_value} onChange={e => updateLikelihood(idx, "low_value", e.target.value)} className="h-8 text-sm w-20" /></td>
                      <td className="px-3 py-2"><Input type="number" value={row.high_value} onChange={e => updateLikelihood(idx, "high_value", e.target.value)} className="h-8 text-sm w-20" /></td>
                      <td className="px-3 py-2"><Input value={row.label} onChange={e => updateLikelihood(idx, "label", e.target.value)} className="h-8 text-sm" placeholder="e.g. Medium Low" /></td>
                      <td className="px-2 py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => set("likelihood_levels", form.likelihood_levels.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating Options (Supplier Services / Criticality) */}
      {isRatingModel && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {form.analysis_type === "Supplier Services" ? "Supplier Service Ratings" : "Criticality Levels"}
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => set("rating_options", [...form.rating_options, EMPTY_RATING()])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Option
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">#</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Value</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Label</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Description</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Colour</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {form.rating_options.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-400 italic">No rating options defined.</td></tr>
                  ) : form.rating_options.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2"><Input type="number" value={row.sort_order} onChange={e => updateRating(idx, "sort_order", e.target.value)} className="h-8 text-sm w-14" /></td>
                      <td className="px-3 py-2"><Input value={row.value} onChange={e => updateRating(idx, "value", e.target.value)} className="h-8 text-sm w-32 font-mono text-xs" placeholder="meets_sla" /></td>
                      <td className="px-3 py-2"><Input value={row.label} onChange={e => updateRating(idx, "label", e.target.value)} className="h-8 text-sm w-44" placeholder="Meets Requirements per SLA" /></td>
                      <td className="px-3 py-2"><Input value={row.description} onChange={e => updateRating(idx, "description", e.target.value)} className="h-8 text-sm" placeholder="Optional description" /></td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <input type="color" value={row.color_hex || "#94a3b8"} onChange={e => updateRating(idx, "color_hex", e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-slate-200" />
                          {row.color_hex && <span className="w-3 h-3 rounded-full shrink-0 border" style={{ backgroundColor: row.color_hex }} />}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => set("rating_options", form.rating_options.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Preview */}
            {form.rating_options.length > 0 && (
              <div className="p-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Preview</p>
                <div className="flex flex-wrap gap-2">
                  {[...form.rating_options].sort((a, b) => a.sort_order - b.sort_order).map(opt => (
                    <span key={opt.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: opt.color_hex || "#94a3b8" }}>
                      {opt.label || opt.value || "—"}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base">Notes</CardTitle></CardHeader>
        <CardContent className="p-5">
          <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Additional notes about this model…" />
        </CardContent>
      </Card>

      <div className="flex justify-end pb-6">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" /> {saveMutation.isPending ? "Saving…" : "Save Model"}
        </Button>
      </div>
    </div>
  );
}
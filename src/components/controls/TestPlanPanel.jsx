import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Trash2, Pencil, GripVertical, ChevronUp, ChevronDown,
  ClipboardList, FileText, Database, BarChart2, MessageSquare,
  Eye, Search, Play, GitBranch, CheckSquare, Package, FlaskConical
} from "lucide-react";
import { toast } from "sonner";

// ─── Step type config ─────────────────────────────────────────────────────────
const STEP_TYPES = [
  { value: "Activity",       label: "Activity",       icon: Play,         color: "bg-blue-100 text-blue-700",    desc: "A general testing activity to perform" },
  { value: "Artefact",       label: "Artefact",       icon: Package,      color: "bg-purple-100 text-purple-700", desc: "A document or evidence item to collect" },
  { value: "IUC",            label: "IUC",            icon: Database,     color: "bg-cyan-100 text-cyan-700",    desc: "Information Used in Control — data/system input to the control" },
  { value: "Process Step",   label: "Process Step",   icon: GitBranch,    color: "bg-teal-100 text-teal-700",   desc: "A specific step in the business process being tested" },
  { value: "Data Extract",   label: "Data Extract",   icon: BarChart2,    color: "bg-indigo-100 text-indigo-700", desc: "Extraction of data for analysis or sampling" },
  { value: "Report",         label: "Report",         icon: FileText,     color: "bg-slate-100 text-slate-700",  desc: "A report to be reviewed as part of testing" },
  { value: "Interview",      label: "Interview",      icon: MessageSquare,color: "bg-amber-100 text-amber-700",  desc: "Interview with process owner or control performer" },
  { value: "Observation",    label: "Observation",    icon: Eye,          color: "bg-orange-100 text-orange-700", desc: "Observing a process or control in action" },
  { value: "Inquiry",        label: "Inquiry",        icon: Search,       color: "bg-yellow-100 text-yellow-700", desc: "Formal inquiry or questionnaire" },
  { value: "Inspection",     label: "Inspection",     icon: CheckSquare,  color: "bg-green-100 text-green-700",  desc: "Inspection of physical documents or system records" },
  { value: "Re-performance", label: "Re-performance", icon: FlaskConical, color: "bg-rose-100 text-rose-700",    desc: "Independently re-performing the control to verify outcome" },
  { value: "Walkthrough",    label: "Walkthrough",    icon: ClipboardList,color: "bg-violet-100 text-violet-700", desc: "End-to-end walkthrough of the control process" },
];

const stepTypeCfg = (type) => STEP_TYPES.find(t => t.value === type) || STEP_TYPES[0];

const EMPTY_STEP = {
  step_type: "Activity", title: "", description: "",
  expected_evidence: "", population: "", sample_size: "",
  mandatory: true, notes: ""
};

// ─── Step type badge ──────────────────────────────────────────────────────────
function StepTypeBadge({ type }) {
  const cfg = stepTypeCfg(type);
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Individual step row ──────────────────────────────────────────────────────
function StepRow({ step, index, total, onEdit, onDelete, onMove }) {
  return (
    <div className="flex gap-3 p-4 border border-slate-200 rounded-lg bg-white hover:border-slate-300 transition-colors">
      {/* Order + move */}
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <span className="text-xs font-bold text-slate-400 w-6 text-center">{index + 1}</span>
        <button onClick={() => onMove(index, -1)} disabled={index === 0} className="text-slate-300 hover:text-slate-500 disabled:opacity-20">
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onMove(index, 1)} disabled={index === total - 1} className="text-slate-300 hover:text-slate-500 disabled:opacity-20">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <StepTypeBadge type={step.step_type} />
            {!step.mandatory && <Badge variant="outline" className="text-xs text-slate-400">Optional</Badge>}
            <span className="font-semibold text-slate-900 text-sm">{step.title || <em className="text-slate-400">Untitled step</em>}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(index)}>
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(index)}>
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </Button>
          </div>
        </div>
        {step.description && <p className="text-sm text-slate-600 mb-1">{step.description}</p>}
        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
          {step.expected_evidence && (
            <span><span className="font-medium text-slate-600">Evidence:</span> {step.expected_evidence}</span>
          )}
          {step.population && (
            <span><span className="font-medium text-slate-600">Population:</span> {step.population}</span>
          )}
          {step.sample_size && (
            <span><span className="font-medium text-slate-600">Sample:</span> {step.sample_size}</span>
          )}
        </div>
        {step.notes && <p className="mt-1 text-xs text-slate-400 italic">{step.notes}</p>}
      </div>
    </div>
  );
}

// ─── Step edit dialog ─────────────────────────────────────────────────────────
function StepEditDialog({ step, open, onClose, onSave }) {
  const [form, setForm] = useState(step || EMPTY_STEP);
  const cfg = stepTypeCfg(form.step_type);
  const showPopulation = ["Data Extract", "Report", "IUC"].includes(form.step_type);

  React.useEffect(() => { setForm(step || EMPTY_STEP); }, [step, open]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{step?.title ? "Edit Step" : "Add Step"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Type selector */}
          <div className="space-y-1.5">
            <Label>Step Type *</Label>
            <div className="grid grid-cols-3 gap-2">
              {STEP_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, step_type: t.value }))}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
                      form.step_type === t.value
                        ? `${t.color} border-current ring-2 ring-current/30`
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    title={t.desc}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {t.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 italic">{cfg.desc}</p>
          </div>

          <div className="space-y-1.5">
            <Label>Step Title *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Obtain and review approval log" />
          </div>

          <div className="space-y-1.5">
            <Label>Description / Testing Procedure</Label>
            <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what the assessor must do or verify…" />
          </div>

          <div className="space-y-1.5">
            <Label>Expected Evidence / Artefact</Label>
            <Input value={form.expected_evidence} onChange={e => setForm(f => ({ ...f, expected_evidence: e.target.value }))} placeholder="e.g. Signed approval email, system screenshot, report" />
          </div>

          {showPopulation && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Population Description</Label>
                <Input value={form.population} onChange={e => setForm(f => ({ ...f, population: e.target.value }))} placeholder="e.g. All transactions > $10,000 in Q1" />
              </div>
              <div className="space-y-1.5">
                <Label>Sample Size / Method</Label>
                <Input value={form.sample_size} onChange={e => setForm(f => ({ ...f, sample_size: e.target.value }))} placeholder="e.g. 25 items, random" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional guidance for the assessor…" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="mandatory" checked={form.mandatory} onChange={e => setForm(f => ({ ...f, mandatory: e.target.checked }))} className="rounded border-slate-300" />
            <Label htmlFor="mandatory">Mandatory step (must be completed in every test)</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!form.title.trim()}
              onClick={() => { onSave(form); onClose(); }}
            >
              Save Step
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function TestPlanPanel({ controlId }) {
  const queryClient = useQueryClient();
  const [editingStep, setEditingStep] = useState(null); // { index } | null
  const [addingStep, setAddingStep] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["testPlans", controlId],
    queryFn: () => base44.entities.ControlTestPlan.filter({ control_id: controlId }),
    enabled: !!controlId,
  });

  const plan = plans[0] || null;
  const steps = plan?.steps || [];

  const savePlan = useMutation({
    mutationFn: (data) =>
      plan
        ? base44.entities.ControlTestPlan.update(plan.id, data)
        : base44.entities.ControlTestPlan.create({ control_id: controlId, name: "Test Plan", status: "draft", ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries(["testPlans", controlId]);
      toast.success("Test plan saved");
    },
  });

  const updateSteps = (newSteps) => {
    savePlan.mutate({ steps: newSteps.map((s, i) => ({ ...s, id: s.id || `step_${Date.now()}_${i}`, order: i + 1 })) });
  };

  const handleAddStep = (step) => {
    updateSteps([...steps, { ...step, id: `step_${Date.now()}`, order: steps.length + 1 }]);
  };

  const handleEditStep = (index, step) => {
    const next = steps.map((s, i) => i === index ? { ...s, ...step } : s);
    updateSteps(next);
  };

  const handleDeleteStep = (index) => {
    updateSteps(steps.filter((_, i) => i !== index));
  };

  const handleMove = (index, dir) => {
    const next = [...steps];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateSteps(next);
  };

  const STATUS_COLORS = { draft: "bg-slate-100 text-slate-600", active: "bg-green-100 text-green-700", retired: "bg-rose-100 text-rose-700" };

  if (isLoading) return <div className="py-8 text-center text-slate-400 text-sm">Loading test plan…</div>;

  return (
    <div className="space-y-4">
      {/* Plan header / meta */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="font-semibold text-slate-900">{plan?.name || "Test Plan"}</h3>
            <p className="text-xs text-slate-400">{plan?.version || "v1.0"} · {steps.length} step{steps.length !== 1 ? "s" : ""}</p>
          </div>
          {plan?.status && (
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${STATUS_COLORS[plan.status]}`}>
              {plan.status}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {plan && (
            <Select value={plan.status} onValueChange={v => savePlan.mutate({ status: v })}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setAddingStep(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Step
          </Button>
        </div>
      </div>

      {/* Objective */}
      {plan?.objective && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-800">
          <span className="font-semibold">Objective:</span> {plan.objective}
        </div>
      )}

      {/* Objective edit (if no plan yet) */}
      {!plan && (
        <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-sm text-slate-500">
          No test plan yet. Click <strong>Add Step</strong> to create one.
        </div>
      )}

      {/* Step type legend */}
      {steps.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[...new Set(steps.map(s => s.step_type))].map(type => (
            <StepTypeBadge key={type} type={type} />
          ))}
        </div>
      )}

      {/* Steps list */}
      {steps.length > 0 && (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <StepRow
              key={step.id || index}
              step={step}
              index={index}
              total={steps.length}
              onEdit={(i) => setEditingStep(i)}
              onDelete={handleDeleteStep}
              onMove={handleMove}
            />
          ))}
        </div>
      )}

      {/* Add step dialog */}
      <StepEditDialog
        step={null}
        open={addingStep}
        onClose={() => setAddingStep(false)}
        onSave={handleAddStep}
      />

      {/* Edit step dialog */}
      <StepEditDialog
        step={editingStep !== null ? steps[editingStep] : null}
        open={editingStep !== null}
        onClose={() => setEditingStep(null)}
        onSave={(updated) => { handleEditStep(editingStep, updated); setEditingStep(null); }}
      />
    </div>
  );
}
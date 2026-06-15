import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = {
  reference_number: "", title: "", description: "", company_id: "", category: "Operational",
  strategic_theme: "", objective_type: "Strategic",
  priority_rating_numeric: "", priority_rating_label: "Medium",
  criticality: "Must Have", time_horizon: "Annual",
  valid_from: "", valid_to: "", status: "Draft",
  approval_status: "Pending", rejection_reason: "", approved_by: "",
  next_review_date: "", objective_owner: "", performance_owner: "",
  compliance_owner: "", it_owner: "", notes: "",
  parent_objective_id: "",
  linked_value_chain_ids: [], linked_business_unit_ids: [], linked_framework_ids: [],
  linked_risk_ids: [], linked_control_ids: [], linked_process_ids: [], linked_ihpom_ids: [],
  linked_capability_ids: [],
  kpis: [], progress_pct: 0, key_results: [],
};

const EMPTY_KPI = () => ({
  id: crypto.randomUUID(),
  measurement_name: "", measurement_type: "Numeric",
  measurement_description: "", calculation_method: "", data_source_link: ""
});

export default function ObjectiveFormDialog({ open, onClose, editObj, companies, objectives, defaultCompanyId }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: frameworks = [] } = useQuery({ queryKey: ["frameworks"], queryFn: () => base44.entities.Framework.list() });
  const { data: risks = [] } = useQuery({ queryKey: ["risks"], queryFn: () => base44.entities.Risk.list() });
  const { data: controls = [] } = useQuery({ queryKey: ["controls"], queryFn: () => base44.entities.Control.list() });
  const { data: valueChains = [] } = useQuery({ queryKey: ["valueChains"], queryFn: () => base44.entities.ValueChain.list() });
  const { data: businessUnits = [] } = useQuery({ queryKey: ["businessUnits"], queryFn: () => base44.entities.BusinessUnit.list() });
  const { data: capabilities = [] } = useQuery({ queryKey: ["itCapabilities"], queryFn: () => base44.entities.ITCapability.list() });

  useEffect(() => {
    if (editObj) setForm({ ...EMPTY_FORM, ...editObj });
    else setForm({ ...EMPTY_FORM, company_id: defaultCompanyId || "" });
  }, [editObj, defaultCompanyId]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const result = editObj
        ? await base44.entities.OrgObjective.update(editObj.id, form)
        : await base44.entities.OrgObjective.create(form);
      // If next_review_date is set, push a calendar event
      if (form.next_review_date && form.company_id) {
        const prevDate = editObj?.next_review_date;
        if (form.next_review_date !== prevDate) {
          await base44.functions.invoke("pushCalendarEvent", {
            title: `Objective Review: ${form.title}`,
            description: `Review of organisational objective: ${form.reference_number ? `[${form.reference_number}] ` : ""}${form.title}`,
            date: form.next_review_date,
            company_id: form.company_id,
            entity_type: "OrgObjective",
            entity_id: result?.id || editObj?.id,
          });
        }
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["orgObjectives"]);
      toast.success(editObj ? "Objective updated" : "Objective created");
      onClose();
    },
    onError: e => toast.error(e.message),
  });

  const handleSave = () => {
    if (!form.title || !form.company_id) { toast.error("Title and company are required"); return; }
    saveMutation.mutate();
  };

  const addKpi = () => set("kpis", [...(form.kpis || []), EMPTY_KPI()]);
  const updateKpi = (idx, field, val) => {
    const kpis = [...(form.kpis || [])];
    kpis[idx] = { ...kpis[idx], [field]: val };
    set("kpis", kpis);
  };
  const removeKpi = (idx) => set("kpis", form.kpis.filter((_, i) => i !== idx));

  const toggleLink = (field, id) => {
    const arr = form[field] || [];
    set(field, arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  };

  const MultiPicker = ({ label, items, field, labelKey = "name" }) => (
    <div>
      <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}</Label>
      <div className="max-h-36 overflow-y-auto border rounded-lg mt-1 divide-y divide-slate-100">
        {items.length === 0 ? (
          <p className="p-3 text-xs text-slate-400 italic">No items available</p>
        ) : items.map(item => {
          const linked = (form[field] || []).includes(item.id);
          return (
            <label key={item.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 text-sm ${linked ? "bg-indigo-50" : ""}`}>
              <input type="checkbox" checked={linked} onChange={() => toggleLink(field, item.id)} className="rounded" />
              <span className={linked ? "text-indigo-700 font-medium" : "text-slate-700"}>{item[labelKey] || item.title || item.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editObj ? "Edit Objective" : "New Organisational Objective"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="linkages">Linkages</TabsTrigger>
            <TabsTrigger value="kpis">KPIs</TabsTrigger>
          </TabsList>

          {/* ── DETAILS TAB ── */}
          <TabsContent value="details" className="space-y-4 pt-4">
            {/* Core */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Reference Number</Label>
                <Input value={form.reference_number} onChange={e => set("reference_number", e.target.value)} placeholder="e.g. OBJ-001" />
              </div>
              <div>
                <Label>Company *</Label>
                <Select value={form.company_id} onValueChange={v => set("company_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Objective title" />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Compliance","IT Compliance","Operational","Financial","Client Relations","Resilience","Data","Fundamentals"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Objective Type</Label>
                <Select value={form.objective_type} onValueChange={v => set("objective_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Strategic","Tactical","Regulatory","Operational"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Strategic Theme (Free Text)</Label>
              <Input value={form.strategic_theme} onChange={e => set("strategic_theme", e.target.value)} placeholder="e.g. Digital Transformation" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Priority Rating (1–5)</Label>
                <Select value={String(form.priority_rating_numeric || "")} onValueChange={v => set("priority_rating_numeric", v ? Number(v) : "")}>
                  <SelectTrigger><SelectValue placeholder="1–5" /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority Label</Label>
                <Select value={form.priority_rating_label} onValueChange={v => set("priority_rating_label", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Low","Medium","High","Critical","Imperative"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Criticality (MoSCoW)</Label>
                <Select value={form.criticality} onValueChange={v => set("criticality", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Must Have","Should Have","Could Have","Won't Have"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Time Horizon</Label>
                <Select value={form.time_horizon} onValueChange={v => set("time_horizon", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Annual","3 Year","5 Year","Continuous"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valid From</Label>
                <Input type="date" value={form.valid_from} onChange={e => set("valid_from", e.target.value)} />
              </div>
              <div>
                <Label>Valid To</Label>
                <Input type="date" value={form.valid_to} onChange={e => set("valid_to", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Draft","Approved","Active","Under Review","Retired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Approval Status</Label>
                <Select value={form.approval_status} onValueChange={v => set("approval_status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Pending","Approved","Rejected"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Approved By</Label>
                <Input value={form.approved_by} onChange={e => set("approved_by", e.target.value)} placeholder="Approver name" />
              </div>
            </div>

            {form.approval_status === "Rejected" && (
              <div>
                <Label>Rejection Reason</Label>
                <Textarea value={form.rejection_reason} onChange={e => set("rejection_reason", e.target.value)} rows={2} placeholder="Reason for rejection…" />
              </div>
            )}

            <div>
              <Label>Next Review Date</Label>
              <Input type="date" value={form.next_review_date} onChange={e => set("next_review_date", e.target.value)} />
            </div>

            {/* Owners */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">Ownership</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Objective Owner</Label>
                  <Input value={form.objective_owner} onChange={e => set("objective_owner", e.target.value)} />
                </div>
                <div>
                  <Label>Performance Owner</Label>
                  <Input value={form.performance_owner} onChange={e => set("performance_owner", e.target.value)} />
                </div>
                <div>
                  <Label>Compliance Owner (Optional)</Label>
                  <Input value={form.compliance_owner} onChange={e => set("compliance_owner", e.target.value)} />
                </div>
                <div>
                  <Label>IT Owner (Optional)</Label>
                  <Input value={form.it_owner} onChange={e => set("it_owner", e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <Label>Parent Objective</Label>
              <Select value={form.parent_objective_id || "none"} onValueChange={v => set("parent_objective_id", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {objectives.filter(o => o.id !== editObj?.id).map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.reference_number ? `[${o.reference_number}] ` : ""}{o.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} />
            </div>
          </TabsContent>

          {/* ── LINKAGES TAB ── */}
          <TabsContent value="linkages" className="space-y-5 pt-4">
            <MultiPicker label="Frameworks" items={frameworks} field="linked_framework_ids" />
            <MultiPicker label="Risks" items={risks} field="linked_risk_ids" labelKey="title" />
            <MultiPicker label="Controls" items={controls} field="linked_control_ids" labelKey="title" />
            <MultiPicker label="Value Chains" items={valueChains} field="linked_value_chain_ids" />
            <MultiPicker label="Business Units" items={businessUnits} field="linked_business_unit_ids" />
            <MultiPicker label="IT Capabilities" items={capabilities} field="linked_capability_ids" />
          </TabsContent>

          {/* ── KPIs TAB ── */}
          <TabsContent value="kpis" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">KPI Measurements</p>
              <Button size="sm" variant="outline" onClick={addKpi}><Plus className="w-3.5 h-3.5 mr-1" /> Add KPI</Button>
            </div>
            {(form.kpis || []).length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400 italic">No KPIs defined. Click "Add KPI" to start.</p>
            ) : (
              <div className="space-y-4">
                {form.kpis.map((kpi, idx) => (
                  <div key={kpi.id} className="border rounded-lg p-4 space-y-3 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">KPI {idx + 1}</p>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeKpi(idx)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Measurement Name</Label>
                        <Input value={kpi.measurement_name} onChange={e => updateKpi(idx, "measurement_name", e.target.value)} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-xs">Measurement Type</Label>
                        <Select value={kpi.measurement_type} onValueChange={v => updateKpi(idx, "measurement_type", v)}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["Numeric","Judgemental","Logic"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Measurement Description</Label>
                        <Input value={kpi.measurement_description} onChange={e => updateKpi(idx, "measurement_description", e.target.value)} className="h-8" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Calculation Method</Label>
                        <Input value={kpi.calculation_method} onChange={e => updateKpi(idx, "calculation_method", e.target.value)} className="h-8" placeholder="How is this measured?" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Data Source Link (leave blank if manual)</Label>
                        <Input value={kpi.data_source_link} onChange={e => updateKpi(idx, "data_source_link", e.target.value)} className="h-8" placeholder="https://…" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2 border-t mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving…" : editObj ? "Save Changes" : "Create Objective"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
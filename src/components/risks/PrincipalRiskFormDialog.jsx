import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableStakeholderSelect from "@/components/risks/SearchableStakeholderSelect";
import { toast } from "sonner";

const EMPTY_FORM = {
  risk_reference: "", risk_title: "", risk_statement: "", risk_description: "",
  company_id: "", risk_category: "Operational", risk_sub_category: "",
  risk_owner_id: "", risk_owner_name: "",
  risk_manager_id: "", risk_manager_name: "",
  risk_function_owner_id: "", risk_function_owner_name: "",
  business_area_id: "", business_area_name: "",
  status: "Draft", priority: "Medium", criticality: "Medium",
  valid_from: "", valid_to: "", review_frequency: "Quarterly",
  last_review_date: "", next_review_date: "", notes: "",
};

export default function PrincipalRiskFormDialog({ open, onClose, editRisk, companies, stakeholders, businessUnits, defaultCompanyId }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    if (editRisk) setForm({ ...EMPTY_FORM, ...editRisk });
    else setForm({ ...EMPTY_FORM, company_id: defaultCompanyId || "" });
  }, [open, editRisk, defaultCompanyId]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const setStakeholder = (field, id, nameField) => {
    const s = stakeholders.find(s => s.id === id);
    setForm(f => ({ ...f, [field]: id, [nameField]: s?.full_name || "" }));
  };

  const setBusinessArea = (id) => {
    const bu = businessUnits.find(b => b.id === id);
    setForm(f => ({ ...f, business_area_id: id, business_area_name: bu?.name || "" }));
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const now = new Date().toISOString();
      const user = {}; // Audit fields set server-side via created_by_id
      return editRisk
        ? base44.entities.PrincipalRisk.update(editRisk.id, form)
        : base44.entities.PrincipalRisk.create(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["principalRisks"]);
      toast.success(editRisk ? "Principal risk updated" : "Principal risk created");
      onClose();
    },
    onError: e => toast.error(e.message),
  });

  const handleSave = () => {
    if (!form.risk_title || !form.company_id) { toast.error("Title and company are required"); return; }
    saveMutation.mutate();
  };

  const companyStakeholders = form.company_id
    ? stakeholders.filter(s => s.company_id === form.company_id)
    : stakeholders;

  const companyBUs = form.company_id
    ? businessUnits.filter(b => b.company_id === form.company_id)
    : businessUnits;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editRisk ? "Edit Principal Risk" : "New Principal Risk"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Reference & Company */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Risk Reference</Label>
              <Input value={form.risk_reference} onChange={e => set("risk_reference", e.target.value)} placeholder="e.g. PR-001" />
            </div>
            <div>
              <Label>Company *</Label>
              <Select value={form.company_id} onValueChange={v => set("company_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Risk Title */}
          <div>
            <Label>Risk Title *</Label>
            <Input value={form.risk_title} onChange={e => set("risk_title", e.target.value)} placeholder='e.g. "IT Compliance & Control Risk"' />
          </div>

          {/* Risk Statement */}
          <div>
            <Label>Risk Statement</Label>
            <Textarea value={form.risk_statement} onChange={e => set("risk_statement", e.target.value)} rows={2} placeholder="Full cause-event-impact statement…" />
          </div>

          {/* Risk Description */}
          <div>
            <Label>Risk Description</Label>
            <Textarea value={form.risk_description} onChange={e => set("risk_description", e.target.value)} rows={3} placeholder="Longer explanation of the risk…" />
          </div>

          {/* Category & Sub-Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Risk Category</Label>
              <Select value={form.risk_category} onValueChange={v => set("risk_category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Strategic","Compliance","IT","Operational","Cyber","Data","Third Party","Financial Crime","Reputational Risk","Financial Risk","Compliance / Conduct Risk","Third-Party / Supplier Risk","Technology / Information Security Risk"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Risk Sub-Category</Label>
              <Input value={form.risk_sub_category} onChange={e => set("risk_sub_category", e.target.value)} placeholder="More granular classification" />
            </div>
          </div>

          {/* Owners */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Ownership</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Risk Owner (Executive)</Label>
                <SearchableStakeholderSelect
                  value={form.risk_owner_id}
                  onValueChange={v => v ? setStakeholder("risk_owner_id", v, "risk_owner_name") : setForm(f => ({ ...f, risk_owner_id: "", risk_owner_name: "" }))}
                  stakeholders={companyStakeholders}
                  placeholder="Select stakeholder"
                />
              </div>
              <div>
                <Label>Risk Manager (Day-to-Day)</Label>
                <SearchableStakeholderSelect
                  value={form.risk_manager_id}
                  onValueChange={v => v ? setStakeholder("risk_manager_id", v, "risk_manager_name") : setForm(f => ({ ...f, risk_manager_id: "", risk_manager_name: "" }))}
                  stakeholders={companyStakeholders}
                  placeholder="Select stakeholder"
                />
              </div>
              <div>
                <Label>Risk Function Owner (2LoD)</Label>
                <SearchableStakeholderSelect
                  value={form.risk_function_owner_id}
                  onValueChange={v => v ? setStakeholder("risk_function_owner_id", v, "risk_function_owner_name") : setForm(f => ({ ...f, risk_function_owner_id: "", risk_function_owner_name: "" }))}
                  stakeholders={companyStakeholders}
                  placeholder="Select stakeholder"
                />
              </div>
              <div>
                <Label>Business Area Most Exposed</Label>
                <Select value={form.business_area_id || "none"} onValueChange={v => v === "none" ? setForm(f => ({ ...f, business_area_id: "", business_area_name: "" })) : setBusinessArea(v)}>
                  <SelectTrigger><SelectValue placeholder="Select business unit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {companyBUs.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Status, Priority, Criticality */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Draft","Active","Under Review","Retired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["High","Medium","Low"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Criticality</Label>
              <Select value={form.criticality} onValueChange={v => set("criticality", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Critical","High","Medium","Low"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valid From</Label>
              <Input type="date" value={form.valid_from} onChange={e => set("valid_from", e.target.value)} />
            </div>
            <div>
              <Label>Valid To (if retired)</Label>
              <Input type="date" value={form.valid_to} onChange={e => set("valid_to", e.target.value)} />
            </div>
          </div>

          {/* Review */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Review Frequency</Label>
              <Select value={form.review_frequency} onValueChange={v => set("review_frequency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Monthly","Quarterly","Annually"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Last Review Date</Label>
              <Input type="date" value={form.last_review_date} onChange={e => set("last_review_date", e.target.value)} />
            </div>
            <div>
              <Label>Next Review Date</Label>
              <Input type="date" value={form.next_review_date} onChange={e => set("next_review_date", e.target.value)} />
            </div>
          </div>

          {/* Audit trail info (read-only display for existing records) */}
          {editRisk && (editRisk.created_date || editRisk.updated_date) && (
            <div className="border rounded-lg p-3 bg-slate-50 text-xs text-slate-500 space-y-1">
              <p className="font-medium text-slate-600 uppercase tracking-wide text-xs mb-1">Audit Trail</p>
              {editRisk.created_date && <p>Created: {new Date(editRisk.created_date).toLocaleString()}</p>}
              {editRisk.updated_date && <p>Last Modified: {new Date(editRisk.updated_date).toLocaleString()}</p>}
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-red-600 hover:bg-red-700">
            {saveMutation.isPending ? "Saving…" : editRisk ? "Save Changes" : "Create Principal Risk"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
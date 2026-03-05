import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Check, AlertCircle } from "lucide-react";

const empty = {
  employee_number: "", full_name: "", email: "", job_title: "", department: "",
  phone: "", company_id: "", user_id: "", group_ids: [], status: "active", notes: ""
};

export default function StakeholderDialog({ open, onOpenChange, stakeholder, groups, companies, users, allStakeholders = [], onSave }) {
  const [form, setForm] = useState(empty);
  const [empNumError, setEmpNumError] = useState("");

  useEffect(() => {
    setForm(stakeholder ? { ...empty, ...stakeholder } : empty);
    setEmpNumError("");
  }, [stakeholder, open]);

  const toggleGroup = (id) => {
    const current = form.group_ids || [];
    setForm({ ...form, group_ids: current.includes(id) ? current.filter(g => g !== id) : [...current, id] });
  };

  const validateEmpNumber = (val) => {
    if (!val) { setEmpNumError(""); return; }
    const duplicate = allStakeholders.find(
      s => s.employee_number && s.employee_number === val && s.id !== stakeholder?.id
    );
    setEmpNumError(duplicate ? `Employee number already used by ${duplicate.full_name}` : "");
  };

  const handleEmpNumChange = (val) => {
    setForm({ ...form, employee_number: val });
    validateEmpNumber(val);
  };

  const activeGroups = groups.filter(g => g.status !== "inactive");
  const canSave = form.full_name && form.email && form.company_id && !empNumError;

  // Filter groups to company if company is selected
  const relevantGroups = form.company_id
    ? activeGroups.filter(g => !g.company_id || g.company_id === form.company_id)
    : activeGroups;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stakeholder ? "Edit Stakeholder" : "Add Stakeholder"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Company - required, shown first */}
          <div className="space-y-1.5">
            <Label>Company *</Label>
            <Select value={form.company_id || ""} onValueChange={v => setForm({ ...form, company_id: v, group_ids: [] })}>
              <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
              <SelectContent>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Employee Number</Label>
              <Input
                value={form.employee_number}
                onChange={e => handleEmpNumChange(e.target.value)}
                placeholder="e.g. EMP-00123"
              />
              {empNumError && (
                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="w-3 h-3" /> {empNumError}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Job Title</Label>
              <Input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>

          {users.length > 0 && (
            <div className="space-y-1.5">
              <Label>Link to System User (optional)</Label>
              <Select value={form.user_id || ""} onValueChange={v => setForm({ ...form, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Not linked</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Group assignment - scoped to company */}
          <div className="space-y-2">
            <Label>Group Membership</Label>
            {!form.company_id ? (
              <p className="text-xs text-slate-500">Select a company first to assign groups.</p>
            ) : relevantGroups.length === 0 ? (
              <p className="text-xs text-slate-500">No groups available for this company.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {relevantGroups.map(g => {
                  const selected = form.group_ids?.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGroup(g.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                        selected
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color || "#3B82F6" }} />
                      {g.name}
                      {selected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={() => onSave(form)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!canSave}
            >
              {stakeholder ? "Save Changes" : "Add Stakeholder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
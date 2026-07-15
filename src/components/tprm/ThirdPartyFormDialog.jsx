import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const EMPTY = {
  name: "",
  service_type: "other",
  criticality: "supporting",
  risk_rating: "medium",
  status: "active",
  contract_start_date: "",
  contract_end_date: "",
  contact_name: "",
  contact_email: "",
  last_audit_date: "",
  next_audit_date: "",
  notes: "",
  tprm_enabled: true,
};

export default function ThirdPartyFormDialog({ open, onOpenChange, companyId, editingProvider }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(EMPTY);

  useEffect(() => {
    if (open) {
      setFormData(editingProvider ? { ...editingProvider } : { ...EMPTY });
    }
  }, [open, editingProvider]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ThirdPartyProvider.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tprmProviders"]);
      toast.success("Third party added");
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ThirdPartyProvider.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tprmProviders"]);
      toast.success("Third party updated");
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    const payload = { ...formData, company_id: companyId };
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const set = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProvider ? "Edit Third Party" : "Add Third Party"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tp_name">Provider Name *</Label>
              <Input id="tp_name" value={formData.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tp_service_type">Service Type *</Label>
              <Select value={formData.service_type} onValueChange={v => set("service_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cloud_hosting">Cloud Hosting</SelectItem>
                  <SelectItem value="software_as_service">Software as Service</SelectItem>
                  <SelectItem value="managed_security">Managed Security</SelectItem>
                  <SelectItem value="data_center">Data Center</SelectItem>
                  <SelectItem value="payment_processing">Payment Processing</SelectItem>
                  <SelectItem value="it_support">IT Support</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tp_criticality">Criticality *</Label>
              <Select value={formData.criticality} onValueChange={v => set("criticality", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="supporting">Supporting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tp_risk_rating">Risk Rating</Label>
              <Select value={formData.risk_rating} onValueChange={v => set("risk_rating", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tp_status">Status</Label>
              <Select value={formData.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tp_contract_start">Contract Start</Label>
              <Input id="tp_contract_start" type="date" value={formData.contract_start_date || ""} onChange={e => set("contract_start_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tp_contract_end">Contract End</Label>
              <Input id="tp_contract_end" type="date" value={formData.contract_end_date || ""} onChange={e => set("contract_end_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tp_contact_name">Contact Name</Label>
              <Input id="tp_contact_name" value={formData.contact_name || ""} onChange={e => set("contact_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tp_contact_email">Contact Email</Label>
              <Input id="tp_contact_email" type="email" value={formData.contact_email || ""} onChange={e => set("contact_email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tp_next_audit">Next Audit</Label>
              <Input id="tp_next_audit" type="date" value={formData.next_audit_date || ""} onChange={e => set("next_audit_date", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tp_notes">Notes</Label>
            <Textarea id="tp_notes" value={formData.notes || ""} onChange={e => set("notes", e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingProvider ? "Update" : "Add Third Party"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
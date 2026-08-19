import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Section, Field } from "./CmdbShared";
import { toast } from "sonner";

export default function CBDApplicationFormDialog({ open, onOpenChange, app, companyId }) {
  const queryClient = useQueryClient();
  const isEdit = !!app;
  const [form, setForm] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        cbd_application_id: app?.cbd_application_id || "",
        application_name: app?.application_name || "",
        application_description: app?.application_description || "",
        application_type: app?.application_type || "",
        application_owner: app?.application_owner || "",
        technical_owner: app?.technical_owner || "",
        business_owner: app?.business_owner || "",
        business_criticality: app?.business_criticality || "",
        information_classification: app?.information_classification || "",
        lifecycle_status: app?.lifecycle_status || "",
        hosting_type: app?.hosting_type || "",
        production_status: app?.production_status || "",
        is_active: app?.is_active ?? true,
      });
    }
  }, [open, app]);

  const mut = useMutation({
    mutationFn: (data) => isEdit
      ? base44.entities.CBDApplicationReference.update(app.id, { ...data, last_refreshed: new Date().toISOString() })
      : base44.entities.CBDApplicationReference.create({ ...data, company_id: companyId, last_refreshed: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries(["cbdAppRefs"]);
      queryClient.invalidateQueries(["cbdAppRef"]);
      toast.success(isEdit ? "Application updated" : "Application added");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message || "Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit CBD Application" : "Add CBD Application"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Section title="Identity">
            <Field label="CBD Application ID" required>
              <Input value={form.cbd_application_id || ""} onChange={e => setForm(d => ({ ...d, cbd_application_id: e.target.value }))} disabled={isEdit} placeholder="e.g. APP-001" />
            </Field>
            <Field label="Application Name" required>
              <Input value={form.application_name || ""} onChange={e => setForm(d => ({ ...d, application_name: e.target.value }))} />
            </Field>
            <Field label="Description" full>
              <Textarea rows={2} value={form.application_description || ""} onChange={e => setForm(d => ({ ...d, application_description: e.target.value }))} />
            </Field>
          </Section>
          <Section title="Classification">
            <Field label="Application Type">
              <Input value={form.application_type || ""} onChange={e => setForm(d => ({ ...d, application_type: e.target.value }))} placeholder="e.g. Web App, Database, API" />
            </Field>
            <Field label="Business Criticality">
              <Select value={form.business_criticality || ""} onValueChange={v => setForm(d => ({ ...d, business_criticality: v }))}>
                <SelectTrigger><SelectValue placeholder="Select criticality" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Information Classification">
              <Select value={form.information_classification || ""} onValueChange={v => setForm(d => ({ ...d, information_classification: v }))}>
                <SelectTrigger><SelectValue placeholder="Select classification" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Lifecycle Status">
              <Input value={form.lifecycle_status || ""} onChange={e => setForm(d => ({ ...d, lifecycle_status: e.target.value }))} placeholder="e.g. Production, Retired" />
            </Field>
          </Section>
          <Section title="Ownership">
            <Field label="Application Owner">
              <Input value={form.application_owner || ""} onChange={e => setForm(d => ({ ...d, application_owner: e.target.value }))} />
            </Field>
            <Field label="Technical Owner">
              <Input value={form.technical_owner || ""} onChange={e => setForm(d => ({ ...d, technical_owner: e.target.value }))} />
            </Field>
            <Field label="Business Owner">
              <Input value={form.business_owner || ""} onChange={e => setForm(d => ({ ...d, business_owner: e.target.value }))} />
            </Field>
          </Section>
          <Section title="Hosting">
            <Field label="Hosting Type">
              <Input value={form.hosting_type || ""} onChange={e => setForm(d => ({ ...d, hosting_type: e.target.value }))} placeholder="e.g. Cloud, On-Prem, Hybrid" />
            </Field>
            <Field label="Production Status">
              <Input value={form.production_status || ""} onChange={e => setForm(d => ({ ...d, production_status: e.target.value }))} placeholder="e.g. Live, DR Only" />
            </Field>
          </Section>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mut.mutate(form)} disabled={mut.isLoading}>{isEdit ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
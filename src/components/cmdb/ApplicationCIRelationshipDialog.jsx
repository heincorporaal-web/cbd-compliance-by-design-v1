import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Section, Field } from "./CmdbShared";
import { toast } from "sonner";

const REL_TYPES = [
  { value: "hosted_on", label: "Hosted On" },
  { value: "runs_on", label: "Runs On" },
  { value: "depends_on", label: "Depends On" },
  { value: "uses", label: "Uses" },
  { value: "connects_to", label: "Connects To" },
  { value: "database_for", label: "Database For" },
  { value: "storage_for", label: "Storage For" },
  { value: "network_dependency", label: "Network Dependency" },
  { value: "security_dependency", label: "Security Dependency" },
  { value: "authentication_dependency", label: "Authentication Dependency" },
  { value: "integration_dependency", label: "Integration Dependency" },
  { value: "backup_dependency", label: "Backup Dependency" },
  { value: "disaster_recovery_dependency", label: "DR Dependency" },
  { value: "supporting_infrastructure", label: "Supporting Infrastructure" },
  { value: "other", label: "Other" },
];

export default function ApplicationCIRelationshipDialog({ open, onOpenChange, ci, app, companyId }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});

  const { data: cbdApps = [] } = useQuery({
    queryKey: ["cbdAppRefs", companyId],
    queryFn: () => base44.entities.CBDApplicationReference.filter({ company_id: companyId }),
    enabled: !!companyId && open,
  });
  const { data: allCIs = [] } = useQuery({
    queryKey: ["configurationItems", companyId],
    queryFn: () => base44.entities.ConfigurationItem.filter({ company_id: companyId }),
    enabled: !!companyId && open,
  });

  useEffect(() => {
    if (open) {
      setForm({
        cbd_application_reference_id: app?.id || "",
        configuration_item_id: ci?.id || "",
        relationship_type: "hosted_on",
        environment: "",
        critical_dependency: false,
        primary_secondary: "primary",
        notes: "",
      });
    }
  }, [open, ci, app]);

  const mut = useMutation({
    mutationFn: (data) => {
      const appRef = cbdApps.find(a => a.id === data.cbd_application_reference_id);
      const ciRef = allCIs.find(c => c.id === data.configuration_item_id);
      return base44.entities.ApplicationCIRelationship.create({
        ...data,
        cbd_application_id: appRef?.cbd_application_id || "",
        cbd_application_name: appRef?.application_name || "",
        ci_name: ciRef?.ci_name || "",
        company_id: companyId,
        relationship_source: "manual",
        status: "active",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["appCIRelationships"]);
      queryClient.invalidateQueries(["allAppCIRels"]);
      queryClient.invalidateQueries(["appCIRels"]);
      toast.success("Application linked to CI");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message || "Failed to create relationship"),
  });

  const handleSubmit = () => {
    if (!form.cbd_application_reference_id || !form.configuration_item_id || !form.relationship_type) {
      toast.error("Application, CI and relationship type are required");
      return;
    }
    mut.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Link Application to CI</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Section title="Relationship">
            <Field label="CBD Application" required full>
              <Select value={form.cbd_application_reference_id || ""} onValueChange={v => setForm(d => ({ ...d, cbd_application_reference_id: v }))} disabled={!!app}>
                <SelectTrigger><SelectValue placeholder="Select application" /></SelectTrigger>
                <SelectContent>
                  {cbdApps.map(a => <SelectItem key={a.id} value={a.id}>{a.application_name} ({a.cbd_application_id})</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Configuration Item" required full>
              <Select value={form.configuration_item_id || ""} onValueChange={v => setForm(d => ({ ...d, configuration_item_id: v }))} disabled={!!ci}>
                <SelectTrigger><SelectValue placeholder="Select CI" /></SelectTrigger>
                <SelectContent>
                  {allCIs.map(c => <SelectItem key={c.id} value={c.id}>{c.ci_name} ({c.ci_id})</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Relationship Type" required>
              <Select value={form.relationship_type} onValueChange={v => setForm(d => ({ ...d, relationship_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Environment">
              <Input value={form.environment || ""} onChange={e => setForm(d => ({ ...d, environment: e.target.value }))} placeholder="e.g. Production" />
            </Field>
            <Field label="Primary / Secondary">
              <Select value={form.primary_secondary} onValueChange={v => setForm(d => ({ ...d, primary_secondary: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Critical Dependency">
              <div className="flex items-center h-9"><Switch checked={form.critical_dependency} onCheckedChange={v => setForm(d => ({ ...d, critical_dependency: v }))} /></div>
            </Field>
            <Field label="Notes" full>
              <Textarea rows={2} value={form.notes || ""} onChange={e => setForm(d => ({ ...d, notes: e.target.value }))} />
            </Field>
          </Section>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={mut.isLoading}>Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
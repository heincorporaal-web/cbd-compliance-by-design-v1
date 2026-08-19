import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Section, Field } from "./CmdbShared";

const EMPTY = {
  ci_name: "", asset_name: "", hostname: "", fqdn: "", description: "",
  ci_class_id: "", ci_class_name: "", ci_subclass_id: "", ci_subclass_name: "",
  manufacturer: "", model: "", serial_number: "", hardware_version: "",
  ip_address: "", mac_address: "", dns_name: "", domain: "", network_subnet: "", vlan: "",
  os_platform: "", os_version: "", os_build: "", architecture: "",
  cloud_provider: "", cloud_tenant: "", cloud_subscription: "", resource_group: "", cloud_region: "", resource_type: "", azure_resource_id: "",
  managed_unmanaged: "unknown", management_platform: "", defender_onboarding_status: "", intune_management_status: "", entra_registration_status: "",
  defender_risk_score: "", exposure_level: "", security_status: "", vulnerability_info: "",
  lifecycle_status: "Discovered", environment: "Production",
  technical_owner: "", support_team: "", business_owner: "", location: "",
  intrinsic_criticality: "medium", notes: "",
};

export default function CIFormDialog({ open, onOpenChange, editItem, companyId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const { data: classes = [] } = useQuery({ queryKey: ["ciClasses"], queryFn: () => base44.entities.CIClass.list("sort_order", 500) });
  const { data: subclasses = [] } = useQuery({ queryKey: ["ciSubclasses"], queryFn: () => base44.entities.CISubclass.list("sort_order", 500) });
  const { data: environments = [] } = useQuery({ queryKey: ["cmdbEnvironments"], queryFn: () => base44.entities.Environment.list("sort_order", 100) });
  const { data: lifecycles = [] } = useQuery({ queryKey: ["cmdbLifecycles"], queryFn: () => base44.entities.LifecycleStatus.list("sort_order", 100) });

  useEffect(() => {
    if (editItem) setForm({ ...EMPTY, ...editItem });
    else setForm({ ...EMPTY, company_id: companyId || "" });
  }, [editItem, open, companyId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cls = classes.find(c => c.id === form.ci_class_id);
    const sub = subclasses.find(s => s.id === form.ci_subclass_id);
    const payload = {
      ...form,
      ci_class_name: cls?.name || "",
      ci_subclass_name: sub?.name || "",
      company_id: form.company_id || companyId,
    };
    try {
      if (editItem) {
        await base44.entities.ConfigurationItem.update(editItem.id, payload);
        await base44.entities.CIAuditHistory.create({
          configuration_item_id: editItem.id, action: "ci_updated", object_type: "ConfigurationItem",
          object_id: editItem.id, source: "manual", user: user?.full_name || user?.email || "unknown",
          timestamp: new Date().toISOString(), company_id: payload.company_id,
        });
        toast.success("Configuration item updated");
      } else {
        const all = await base44.entities.ConfigurationItem.list("-created_date", 10000);
        const maxNum = all.reduce((max, ci) => {
          const m = (ci.ci_id || "").match(/CI-(\d+)/);
          return m ? Math.max(max, parseInt(m[1], 10)) : max;
        }, 0);
        const ci_id = `CI-${String(maxNum + 1).padStart(6, "0")}`;
        const created = await base44.entities.ConfigurationItem.create({ ...payload, ci_id });
        await base44.entities.CIAuditHistory.create({
          configuration_item_id: created.id, action: "ci_created", object_type: "ConfigurationItem",
          object_id: created.id, source: "manual", user: user?.full_name || user?.email || "unknown",
          timestamp: new Date().toISOString(), company_id: payload.company_id,
        });
        toast.success(`Configuration item ${ci_id} created`);
      }
      queryClient.invalidateQueries(["configurationItems"]);
      queryClient.invalidateQueries(["ciAuditHistory"]);
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message || "Failed to save configuration item");
    }
  };

  const filteredSubclasses = form.ci_class_id ? subclasses.filter(s => s.parent_class_id === form.ci_class_id) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? `Edit ${editItem.ci_id || "Configuration Item"}` : "Add Configuration Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Section title="Identity">
            <Field label="CI Name" required full><Input value={form.ci_name} onChange={e => set("ci_name", e.target.value)} required /></Field>
            <Field label="Asset Name"><Input value={form.asset_name} onChange={e => set("asset_name", e.target.value)} /></Field>
            <Field label="Hostname"><Input value={form.hostname} onChange={e => set("hostname", e.target.value)} /></Field>
            <Field label="FQDN"><Input value={form.fqdn} onChange={e => set("fqdn", e.target.value)} /></Field>
            <Field label="Description" full><Textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)} /></Field>
          </Section>

          <Section title="Classification">
            <Field label="CI Class">
              <Select value={form.ci_class_id} onValueChange={v => set("ci_class_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select class…" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="CI Subclass">
              <Select value={form.ci_subclass_id} onValueChange={v => set("ci_subclass_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select subclass…" /></SelectTrigger>
                <SelectContent>{filteredSubclasses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Environment">
              <Select value={form.environment} onValueChange={v => set("environment", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{environments.map(en => <SelectItem key={en.id} value={en.name}>{en.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Lifecycle Status">
              <Select value={form.lifecycle_status} onValueChange={v => set("lifecycle_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{lifecycles.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Intrinsic Criticality">
              <Select value={form.intrinsic_criticality} onValueChange={v => set("intrinsic_criticality", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["critical","high","medium","low","na"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </Section>

          <Section title="Hardware">
            <Field label="Manufacturer"><Input value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)} /></Field>
            <Field label="Model"><Input value={form.model} onChange={e => set("model", e.target.value)} /></Field>
            <Field label="Serial Number"><Input value={form.serial_number} onChange={e => set("serial_number", e.target.value)} /></Field>
            <Field label="Hardware Version"><Input value={form.hardware_version} onChange={e => set("hardware_version", e.target.value)} /></Field>
          </Section>

          <Section title="Network">
            <Field label="IP Address"><Input value={form.ip_address} onChange={e => set("ip_address", e.target.value)} placeholder="Not a permanent identifier" /></Field>
            <Field label="MAC Address"><Input value={form.mac_address} onChange={e => set("mac_address", e.target.value)} /></Field>
            <Field label="DNS Name"><Input value={form.dns_name} onChange={e => set("dns_name", e.target.value)} /></Field>
            <Field label="Domain"><Input value={form.domain} onChange={e => set("domain", e.target.value)} /></Field>
            <Field label="Network / Subnet"><Input value={form.network_subnet} onChange={e => set("network_subnet", e.target.value)} /></Field>
            <Field label="VLAN"><Input value={form.vlan} onChange={e => set("vlan", e.target.value)} /></Field>
          </Section>

          <Section title="Operating System">
            <Field label="OS Platform"><Input value={form.os_platform} onChange={e => set("os_platform", e.target.value)} /></Field>
            <Field label="OS Version"><Input value={form.os_version} onChange={e => set("os_version", e.target.value)} /></Field>
            <Field label="OS Build"><Input value={form.os_build} onChange={e => set("os_build", e.target.value)} /></Field>
            <Field label="Architecture"><Input value={form.architecture} onChange={e => set("architecture", e.target.value)} /></Field>
          </Section>

          <Section title="Cloud">
            <Field label="Cloud Provider"><Input value={form.cloud_provider} onChange={e => set("cloud_provider", e.target.value)} /></Field>
            <Field label="Tenant"><Input value={form.cloud_tenant} onChange={e => set("cloud_tenant", e.target.value)} /></Field>
            <Field label="Subscription"><Input value={form.cloud_subscription} onChange={e => set("cloud_subscription", e.target.value)} /></Field>
            <Field label="Resource Group"><Input value={form.resource_group} onChange={e => set("resource_group", e.target.value)} /></Field>
            <Field label="Region"><Input value={form.cloud_region} onChange={e => set("cloud_region", e.target.value)} /></Field>
            <Field label="Resource Type"><Input value={form.resource_type} onChange={e => set("resource_type", e.target.value)} /></Field>
            <Field label="Azure Resource ID" full><Input value={form.azure_resource_id} onChange={e => set("azure_resource_id", e.target.value)} placeholder="/subscriptions/…" /></Field>
          </Section>

          <Section title="Management & Security">
            <Field label="Managed / Unmanaged">
              <Select value={form.managed_unmanaged} onValueChange={v => set("managed_unmanaged", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["managed","unmanaged","unknown"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Management Platform"><Input value={form.management_platform} onChange={e => set("management_platform", e.target.value)} /></Field>
            <Field label="Defender Onboarding"><Input value={form.defender_onboarding_status} onChange={e => set("defender_onboarding_status", e.target.value)} /></Field>
            <Field label="Intune Management"><Input value={form.intune_management_status} onChange={e => set("intune_management_status", e.target.value)} /></Field>
            <Field label="Entra Registration"><Input value={form.entra_registration_status} onChange={e => set("entra_registration_status", e.target.value)} /></Field>
            <Field label="Defender Risk Score"><Input value={form.defender_risk_score} onChange={e => set("defender_risk_score", e.target.value)} /></Field>
            <Field label="Exposure Level"><Input value={form.exposure_level} onChange={e => set("exposure_level", e.target.value)} /></Field>
            <Field label="Security Status"><Input value={form.security_status} onChange={e => set("security_status", e.target.value)} /></Field>
            <Field label="Vulnerability Info" full><Textarea rows={2} value={form.vulnerability_info} onChange={e => set("vulnerability_info", e.target.value)} /></Field>
          </Section>

          <Section title="Ownership & Location">
            <Field label="Technical Owner"><Input value={form.technical_owner} onChange={e => set("technical_owner", e.target.value)} /></Field>
            <Field label="Support Team"><Input value={form.support_team} onChange={e => set("support_team", e.target.value)} /></Field>
            <Field label="Business Owner"><Input value={form.business_owner} onChange={e => set("business_owner", e.target.value)} /></Field>
            <Field label="Location"><Input value={form.location} onChange={e => set("location", e.target.value)} /></Field>
            <Field label="Notes" full><Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} /></Field>
          </Section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{editItem ? "Save Changes" : "Create CI"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
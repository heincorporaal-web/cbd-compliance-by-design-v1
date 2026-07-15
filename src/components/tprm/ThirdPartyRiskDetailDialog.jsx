import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, ShieldAlert, Users, Boxes, Cpu, AlertCircle, TriangleAlert, Network, ScrollText, FileCheck, Building2 } from "lucide-react";
import EntityLinkPicker from "./EntityLinkPicker";
import CountrySelect from "./CountrySelect";

const RATING = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const TP_TYPE = [
  { value: "supplier", label: "Supplier" },
  { value: "outsourcing_provider", label: "Outsourcing provider" },
  { value: "cloud_service_provider", label: "Cloud service provider" },
  { value: "consultant", label: "Consultant" },
  { value: "distributor", label: "Distributor" },
  { value: "agent", label: "Agent" },
  { value: "data_processor", label: "Data processor" },
  { value: "managed_service_provider", label: "Managed service provider" },
  { value: "subcontractor", label: "Subcontractor" },
  { value: "strategic_partner", label: "Strategic partner" },
  { value: "fourth_party_provider", label: "Fourth-party provider" },
];

function Section({ icon: Icon, title, children }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Icon className="w-4 h-4 text-indigo-600" />
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export default function ThirdPartyRiskDetailDialog({ provider, companyId, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!provider) return;
    setForm({
      tprm_enabled: provider.tprm_enabled ?? false,
      inherent_risk_rating: provider.inherent_risk_rating || "",
      residual_risk_rating: provider.residual_risk_rating || "",
      linked_risk_ids: provider.linked_risk_ids || [],
      linked_control_ids: provider.linked_control_ids || [],
      linked_framework_ids: provider.linked_framework_ids || [],
      linked_value_chain_ids: provider.linked_value_chain_ids || [],
      linked_workstream_ids: provider.linked_workstream_ids || [],
      linked_process_ids: provider.linked_process_ids || [],
      linked_ict_system_ids: provider.linked_ict_system_ids || [],
      linked_issue_ids: provider.linked_issue_ids || [],
      linked_incident_ids: provider.linked_incident_ids || [],
      service_owner_id: provider.service_owner_id || "",
      relationship_owner_id: provider.relationship_owner_id || "",
      risk_owner_id: provider.risk_owner_id || "",
      approver_id: provider.approver_id || "",
      procurement_owner_id: provider.procurement_owner_id || "",
      business_continuity_critical: provider.business_continuity_critical ?? false,
      third_party_reference: provider.third_party_reference || "",
      legal_name: provider.legal_name || "",
      trading_name: provider.trading_name || "",
      registration_number: provider.registration_number || "",
      tax_number: provider.tax_number || "",
      country_of_registration: provider.country_of_registration || "",
      headquarters_country: provider.headquarters_country || "",
      third_party_type: provider.third_party_type || "",
      parent_company_id: provider.parent_company_id || "",
      website: provider.website || "",
      primary_contact_name: provider.primary_contact_name || "",
      primary_contact_email: provider.primary_contact_email || "",
      primary_contact_telephone: provider.primary_contact_telephone || "",
      date_created: provider.date_created || "",
      date_approved: provider.date_approved || "",
      is_active: provider.is_active ?? true,
      bcp_recovery_notes: provider.bcp_recovery_notes || "",
      tprm_notes: provider.tprm_notes || "",
    });
  }, [provider]);

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["entityLink", "Stakeholder"],
    queryFn: () => base44.entities.Stakeholder.list("-created_date", 500),
  });
  const { data: allProviders = [] } = useQuery({
    queryKey: ["tpParentProviders", companyId],
    queryFn: () => companyId && companyId !== "all"
      ? base44.entities.ThirdPartyProvider.filter({ company_id: companyId })
      : base44.entities.ThirdPartyProvider.list("-created_date", 500),
  });
  const parentOptions = allProviders.filter(p => p.id !== provider?.id);
  const stakeholderItems = companyId && companyId !== "all"
    ? stakeholders.filter(s => s.company_id === companyId)
    : stakeholders;
  const stakeholderName = (id) => stakeholderItems.find(s => s.id === id)?.name || "";

  const toggle = (field) => (id) => setForm(f => {
    const arr = f[field] || [];
    return { ...f, [field]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] };
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setOwner = (idField, nameField) => (id) => setForm(f => ({ ...f, [idField]: id, [nameField]: stakeholderName(id) }));

  const saveMutation = useMutation({
    mutationFn: (payload) => base44.entities.ThirdPartyProvider.update(provider.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["tprmProviders"]);
      queryClient.invalidateQueries(["thirdParties"]);
      onClose();
    },
  });

  if (!form) return null;

  return (
    <Dialog open={!!provider} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            Third Party Risk Management — {provider?.name}
          </DialogTitle>
          <DialogDescription>
            Map this third party to risks, controls, frameworks, processes, assets and owners.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Third Party Master Data */}
          <Section icon={Building2} title="Third Party Master Data">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Third Party Reference</Label>
                <Input value={form.third_party_reference || ""} onChange={e => set("third_party_reference", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Third Party Type</Label>
                <Select value={form.third_party_type || "__none"} onValueChange={v => set("third_party_type", v === "__none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">—</SelectItem>
                    {TP_TYPE.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Website</Label>
                <Input value={form.website || ""} onChange={e => set("website", e.target.value)} placeholder="https://" />
              </div>
              <div>
                <Label className="text-xs">Legal Name</Label>
                <Input value={form.legal_name || ""} onChange={e => set("legal_name", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Trading Name</Label>
                <Input value={form.trading_name || ""} onChange={e => set("trading_name", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Parent Company</Label>
                <Select value={form.parent_company_id || "__none"} onValueChange={v => set("parent_company_id", v === "__none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {parentOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Registration Number</Label>
                <Input value={form.registration_number || ""} onChange={e => set("registration_number", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Tax Number</Label>
                <Input value={form.tax_number || ""} onChange={e => set("tax_number", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Country of Registration</Label>
                <CountrySelect value={form.country_of_registration || ""} onChange={v => set("country_of_registration", v)} />
              </div>
              <div>
                <Label className="text-xs">Headquarters Country</Label>
                <CountrySelect value={form.headquarters_country || ""} onChange={v => set("headquarters_country", v)} />
              </div>
              <div>
                <Label className="text-xs">Primary Contact Name</Label>
                <Input value={form.primary_contact_name || ""} onChange={e => set("primary_contact_name", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Primary Contact Email</Label>
                <Input type="email" value={form.primary_contact_email || ""} onChange={e => set("primary_contact_email", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Primary Contact Telephone</Label>
                <Input value={form.primary_contact_telephone || ""} onChange={e => set("primary_contact_telephone", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Date Created</Label>
                <Input type="date" value={form.date_created || ""} onChange={e => set("date_created", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Date Approved</Label>
                <Input type="date" value={form.date_approved || ""} onChange={e => set("date_approved", e.target.value)} />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <Switch checked={form.is_active} onCheckedChange={v => set("is_active", v)} />
                <Label className="text-xs">Active</Label>
              </div>
            </div>
          </Section>

          {/* Risk ratings & BCP */}
          <Section icon={ShieldAlert} title="Risk Ratings & Business Continuity">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Inherent Risk Rating</Label>
                <Select value={form.inherent_risk_rating} onValueChange={v => set("inherent_risk_rating", v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{RATING.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Residual Risk Rating</Label>
                <Select value={form.residual_risk_rating} onValueChange={v => set("residual_risk_rating", v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{RATING.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3 pt-5">
                <Switch checked={form.business_continuity_critical} onCheckedChange={v => set("business_continuity_critical", v)} />
                <Label className="text-xs">BCP-critical dependency</Label>
              </div>
            </div>
            <div>
              <Label className="text-xs">Business Continuity / Recovery Notes</Label>
              <Textarea rows={2} value={form.bcp_recovery_notes} onChange={e => set("bcp_recovery_notes", e.target.value)}
                placeholder="Critical services supported, RTO/RPO expectations, fallback arrangements…" />
            </div>
          </Section>

          {/* Owners */}
          <Section icon={Users} title="Accountable Owners">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["service_owner_id", "service_owner_name", "Service Owner"],
                ["relationship_owner_id", "relationship_owner_name", "Relationship Owner"],
                ["procurement_owner_id", "procurement_owner_name", "Procurement Owner"],
                ["risk_owner_id", "risk_owner_name", "Risk Owner"],
                ["approver_id", "approver_name", "Approver"],
              ].map(([idField, nameField, lbl]) => (
                <div key={idField}>
                  <Label className="text-xs">{lbl}</Label>
                  <Select value={form[idField]} onValueChange={setOwner(idField, nameField)}>
                    <SelectTrigger><SelectValue placeholder="Select stakeholder" /></SelectTrigger>
                    <SelectContent>
                      {stakeholderItems.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </Section>

          {/* Risk & Control library */}
          <Section icon={ShieldAlert} title="Risk & Control Library">
            <EntityLinkPicker label="Inherent / Residual Risks" entityName="Risk" companyId={companyId}
              selectedIds={form.linked_risk_ids} onToggle={toggle("linked_risk_ids")}
              getLabel={r => `${r.risk_reference_nr || r.title || "Risk"}${r.title ? " — " + r.title : ""}`} />
            <EntityLinkPicker label="Controls (expected from 3rd party / your org)" entityName="Control" companyId={companyId}
              selectedIds={form.linked_control_ids} onToggle={toggle("linked_control_ids")}
              getLabel={c => `${c.control_id || ""} ${c.title || ""}`.trim()} />
          </Section>

          {/* Frameworks */}
          <Section icon={FileCheck} title="Frameworks">
            <EntityLinkPicker label="Frameworks (ISO 27001, NIST, DORA, GDPR, COBIT…)" entityName="Framework"
              noCompanyFilter selectedIds={form.linked_framework_ids} onToggle={toggle("linked_framework_ids")}
              getLabel={f => `${f.name}${f.framework_code ? " (" + f.framework_code + ")" : ""}`} />
          </Section>

          {/* Processes & value chains */}
          <Section icon={Network} title="Processes, Value Chains & Workstreams">
            <EntityLinkPicker label="Affected Processes" entityName="OrgProcess" companyId={companyId}
              selectedIds={form.linked_process_ids} onToggle={toggle("linked_process_ids")}
              getLabel={p => `${p.process_code || ""} ${p.name || ""}`.trim()} />
            <EntityLinkPicker label="Value Chains (business activities depending on 3rd party)" entityName="ValueChain" companyId={companyId}
              selectedIds={form.linked_value_chain_ids} onToggle={toggle("linked_value_chain_ids")}
              getLabel={v => v.name || ""} />
            <EntityLinkPicker label="Workstreams" entityName="Workstream" companyId={companyId}
              selectedIds={form.linked_workstream_ids} onToggle={toggle("linked_workstream_ids")}
              getLabel={w => w.name || ""} />
          </Section>

          {/* Assets */}
          <Section icon={Cpu} title="Asset Management">
            <EntityLinkPicker label="Systems / Applications / Data / Infrastructure" entityName="ICTSystem" companyId={companyId}
              selectedIds={form.linked_ict_system_ids} onToggle={toggle("linked_ict_system_ids")}
              getLabel={s => s.name || ""} />
          </Section>

          {/* Issues & Incidents */}
          <Section icon={AlertCircle} title="Issues, Actions & Incidents">
            <EntityLinkPicker label="Issues & Remediation Actions" entityName="Issue" companyId={companyId}
              selectedIds={form.linked_issue_ids} onToggle={toggle("linked_issue_ids")}
              getLabel={i => `${i.reference_number || ""} ${i.title || ""}`.trim()} />
            <EntityLinkPicker label="Incidents (caused by / affecting 3rd party)" entityName="Incident" companyId={companyId}
              selectedIds={form.linked_incident_ids} onToggle={toggle("linked_incident_ids")}
              getLabel={n => `${n.reference_number || ""} ${n.title || ""}`.trim()} />
          </Section>

          {/* Notes */}
          <Section icon={ScrollText} title="TPRM Notes">
            <Textarea rows={3} value={form.tprm_notes} onChange={e => set("tprm_notes", e.target.value)} />
          </Section>
        </div>

        <DialogFooter className="gap-2">
          <Badge variant="outline" className="mr-auto gap-1">
            <Boxes className="w-3 h-3" /> TPRM tracking {form.tprm_enabled ? "on" : "off"}
          </Badge>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-2">
            <Save className="w-4 h-4" /> {saveMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
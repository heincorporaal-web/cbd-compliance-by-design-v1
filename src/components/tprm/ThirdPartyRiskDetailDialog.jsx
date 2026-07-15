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
import { Save, ShieldAlert, Users, Boxes, Cpu, AlertCircle, TriangleAlert, Network, ScrollText, FileCheck } from "lucide-react";
import EntityLinkPicker from "./EntityLinkPicker";

const RATING = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
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
      business_continuity_critical: provider.business_continuity_critical ?? false,
      bcp_recovery_notes: provider.bcp_recovery_notes || "",
      tprm_notes: provider.tprm_notes || "",
    });
  }, [provider]);

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["entityLink", "Stakeholder"],
    queryFn: () => base44.entities.Stakeholder.list("-created_date", 500),
  });
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
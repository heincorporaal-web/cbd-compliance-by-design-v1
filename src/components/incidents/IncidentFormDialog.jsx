import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import CompanyField from "@/components/CompanyField";
import { useCompanyPreferences } from "@/hooks/useCompanyPreferences";
import { Server, Package, Users, Clock, Search, FileSearch, ShieldAlert, Award, PackageCheck } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "detected", label: "Detected" },
  { value: "logged", label: "Logged" },
  { value: "classified", label: "Classified" },
  { value: "assessed", label: "Assessed" },
  { value: "assigned", label: "Assigned" },
  { value: "investigating", label: "Investigating" },
  { value: "mitigating", label: "Mitigating" },
  { value: "service_restored", label: "Service Restored" },
  { value: "resolved", label: "Resolved" },
  { value: "pir_rca", label: "PIR / RCA" },
  { value: "closed", label: "Closed" },
];

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1 border-b border-slate-100 mb-3">
      <Icon className="w-4 h-4 text-slate-500" />
      <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
    </div>
  );
}

export default function IncidentFormDialog({
  open,
  onOpenChange,
  editingIncident,
  formData,
  setFormData,
  onSubmit,
  companies,
  globalCompany,
}) {
  const companyId = formData.company_id;
  const { enableAssetsByDesign, enableThirdPartyRiskManagement } = useCompanyPreferences(companyId);

  const { data: ictSystems = [] } = useQuery({
    queryKey: ["ict-systems", companyId],
    queryFn: () => base44.entities.ICTSystem.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: configItems = [] } = useQuery({
    queryKey: ["ci-for-incidents", companyId],
    queryFn: () => base44.entities.ConfigurationItem.filter({ company_id: companyId, status: "active" }, "-created_date", 100),
    enabled: !!companyId && enableAssetsByDesign,
  });

  const { data: thirdParties = [] } = useQuery({
    queryKey: ["third-parties-for-incidents", companyId],
    queryFn: () => base44.entities.ThirdPartyProvider.filter({ company_id: companyId, is_active: true }, "-created_date", 100),
    enabled: !!companyId && enableThirdPartyRiskManagement,
  });

  const set = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingIncident ? "Update Incident" : "Report New Incident"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-1">
          {/* Identity */}
          <SectionHeader icon={FileSearch} title="Identity & Description" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Incident Title *</Label>
              <Input value={formData.title || ""} onChange={(e) => set("title", e.target.value)} required />
            </div>
            <CompanyField
              value={formData.company_id}
              onChange={(v) => set("company_id", v)}
              companies={companies}
            />
            <div className="space-y-1.5">
              <Label>Detection Source</Label>
              <Select value={formData.detection_source || "manual"} onValueChange={(v) => set("detection_source", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monitoring_alert">Monitoring Alert</SelectItem>
                  <SelectItem value="service_desk">Service Desk</SelectItem>
                  <SelectItem value="user_report">User Report</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="api_ingestion">API Ingestion</SelectItem>
                  <SelectItem value="third_party_notification">Third Party Notification</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Detected Date *</Label>
              <Input
                type="datetime-local"
                value={formData.detected_date?.slice(0, 16) || ""}
                onChange={(e) => set("detected_date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reported Date</Label>
              <Input
                type="datetime-local"
                value={formData.reported_date?.slice(0, 16) || ""}
                onChange={(e) => set("reported_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reporter</Label>
              <Input value={formData.reporter || ""} onChange={(e) => set("reporter", e.target.value)} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea value={formData.description || ""} onChange={(e) => set("description", e.target.value)} rows={2} />
            </div>
          </div>

          {/* Classification */}
          <SectionHeader icon={ShieldAlert} title="Classification & Priority" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label>Incident Type *</Label>
              <Select value={formData.incident_type || "operational_disruption"} onValueChange={(v) => set("incident_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cyber_attack">Cyber Attack</SelectItem>
                  <SelectItem value="system_outage">System Outage</SelectItem>
                  <SelectItem value="data_breach">Data Breach</SelectItem>
                  <SelectItem value="operational_disruption">Operational Disruption</SelectItem>
                  <SelectItem value="third_party_failure">Third Party Failure</SelectItem>
                  <SelectItem value="natural_disaster">Natural Disaster</SelectItem>
                  <SelectItem value="human_error">Human Error</SelectItem>
                  <SelectItem value="security_incident">Security Incident</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={formData.category || ""} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Network, Database, Application" />
            </div>
            <div className="space-y-1.5">
              <Label>Subcategory</Label>
              <Input value={formData.subcategory || ""} onChange={(e) => set("subcategory", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Severity *</Label>
              <Select value={formData.severity || "moderate"} onValueChange={(v) => set("severity", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={formData.priority || "P3"} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1">P1 — Critical</SelectItem>
                  <SelectItem value="P2">P2 — High</SelectItem>
                  <SelectItem value="P3">P3 — Medium</SelectItem>
                  <SelectItem value="P4">P4 — Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={formData.status || "detected"} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={formData.major_incident || false} onCheckedChange={(c) => set("major_incident", c)} />
                Major Incident
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={formData.security_incident || false} onCheckedChange={(c) => set("security_incident", c)} />
                Security
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={formData.data_breach || false} onCheckedChange={(c) => set("data_breach", c)} />
                Data Breach
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={formData.recurring || false} onCheckedChange={(c) => set("recurring", c)} />
                Recurring
              </label>
            </div>
          </div>

          {/* Impact */}
          <SectionHeader icon={Users} title="Impact Assessment" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label>Affected Service</Label>
              <Input value={formData.affected_service || ""} onChange={(e) => set("affected_service", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Users / Customers Affected</Label>
              <Input value={formData.users_affected || ""} onChange={(e) => set("users_affected", e.target.value)} placeholder="e.g. 500 users, All customers" />
            </div>
            <div className="space-y-1.5">
              <Label>Estimated Financial Impact</Label>
              <Input value={formData.estimated_financial_impact || ""} onChange={(e) => set("estimated_financial_impact", e.target.value)} placeholder="e.g. €50,000" />
            </div>
            <div className="space-y-1.5">
              <Label>Regulatory Impact</Label>
              <Input value={formData.regulatory_impact || ""} onChange={(e) => set("regulatory_impact", e.target.value)} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Business Impact</Label>
              <Textarea value={formData.impact || ""} onChange={(e) => set("impact", e.target.value)} rows={2} />
            </div>
          </div>

          {/* Ownership */}
          <SectionHeader icon={Users} title="Ownership & Assignment" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label>Incident Owner</Label>
              <Input value={formData.incident_owner || ""} onChange={(e) => set("incident_owner", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Assignment Group</Label>
              <Input value={formData.assignment_group || ""} onChange={(e) => set("assignment_group", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Technical Lead</Label>
              <Input value={formData.technical_lead || ""} onChange={(e) => set("technical_lead", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Business Owner</Label>
              <Input value={formData.business_owner || ""} onChange={(e) => set("business_owner", e.target.value)} />
            </div>
            {formData.major_incident && (
              <div className="md:col-span-2 space-y-1.5">
                <Label>Incident Commander</Label>
                <Input value={formData.incident_commander || ""} onChange={(e) => set("incident_commander", e.target.value)} placeholder="Assigned for major incidents" />
              </div>
            )}
          </div>

          {/* Affected Assets */}
          <SectionHeader icon={Server} title="Affected Assets & Dependencies" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label>ICT System</Label>
              <Select value={formData.ict_system_id || ""} onValueChange={(v) => set("ict_system_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select system" /></SelectTrigger>
                <SelectContent>
                  {ictSystems.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {enableAssetsByDesign && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-indigo-500" />
                  Configuration Item (Assets by Design)
                </Label>
                <Select value={formData.configuration_item_id || ""} onValueChange={(v) => set("configuration_item_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select CI" /></SelectTrigger>
                  <SelectContent>
                    {configItems.map((ci) => (
                      <SelectItem key={ci.id} value={ci.id}>{ci.ci_name || ci.hostname || ci.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {enableThirdPartyRiskManagement && (
              <>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1">
                    <PackageCheck className="w-3.5 h-3.5 text-cyan-500" />
                    Third Party (TPRM)
                  </Label>
                  <Select value={formData.third_party_id || ""} onValueChange={(v) => set("third_party_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select third party" /></SelectTrigger>
                    <SelectContent>
                      {thirdParties.map((tp) => <SelectItem key={tp.id} value={tp.id}>{tp.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Third Party Ticket Ref</Label>
                  <Input value={formData.third_party_ticket_ref || ""} onChange={(e) => set("third_party_ticket_ref", e.target.value)} />
                </div>
              </>
            )}
            {!enableAssetsByDesign && !enableThirdPartyRiskManagement && (
              <p className="md:col-span-2 text-xs text-slate-400 italic">
                Assets by Design and Third Party Risk Management modules are not enabled for this company.
                Enable them in Company Preferences to link CMDB CIs and third-party providers.
              </p>
            )}
          </div>

          {/* SLA */}
          <SectionHeader icon={Clock} title="SLA Targets" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label>Response Target</Label>
              <Input value={formData.sla_response_target || ""} onChange={(e) => set("sla_response_target", e.target.value)} placeholder="e.g. 15m" />
            </div>
            <div className="space-y-1.5">
              <Label>Restoration Target</Label>
              <Input value={formData.sla_restoration_target || ""} onChange={(e) => set("sla_restoration_target", e.target.value)} placeholder="e.g. 4h" />
            </div>
            <div className="space-y-1.5">
              <Label>Resolution Target</Label>
              <Input value={formData.sla_resolution_target || ""} onChange={(e) => set("sla_resolution_target", e.target.value)} placeholder="e.g. 24h" />
            </div>
          </div>

          {/* Investigation */}
          <SectionHeader icon={Search} title="Investigation & Resolution" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label>Symptoms</Label>
              <Textarea value={formData.symptoms || ""} onChange={(e) => set("symptoms", e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Suspected Cause</Label>
              <Textarea value={formData.suspected_cause || ""} onChange={(e) => set("suspected_cause", e.target.value)} rows={2} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Investigation Notes</Label>
              <Textarea value={formData.investigation_notes || ""} onChange={(e) => set("investigation_notes", e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Workaround</Label>
              <Textarea value={formData.workaround || ""} onChange={(e) => set("workaround", e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Resolution</Label>
              <Textarea value={formData.resolution || ""} onChange={(e) => set("resolution", e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Root Cause</Label>
              <Textarea value={formData.root_cause || ""} onChange={(e) => set("root_cause", e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Root Cause Category</Label>
              <Input value={formData.root_cause_category || ""} onChange={(e) => set("root_cause_category", e.target.value)} placeholder="e.g. Software Defect, Config Error" />
            </div>
            <div className="space-y-1.5">
              <Label>RCA Methodology</Label>
              <Input value={formData.rca_methodology || ""} onChange={(e) => set("rca_methodology", e.target.value)} placeholder="e.g. 5 Whys, Fishbone" />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={formData.known_error || false} onCheckedChange={(c) => set("known_error", c)} />
              Known Error
            </label>
          </div>

          {/* PIR & Regulatory */}
          <SectionHeader icon={Award} title="PIR & Regulatory" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={formData.pir_required || false} onCheckedChange={(c) => set("pir_required", c)} />
              PIR Required
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={formData.reported_to_regulator || false} onCheckedChange={(c) => set("reported_to_regulator", c)} />
              Reported to Regulator
            </label>
            {formData.pir_required && (
              <div className="md:col-span-2 space-y-1.5">
                <Label>PIR Findings / Lessons Learned</Label>
                <Textarea value={formData.pir_findings || formData.lessons_learned || ""} onChange={(e) => set("pir_findings", e.target.value)} rows={2} />
              </div>
            )}
            {formData.reported_to_regulator && (
              <div className="md:col-span-2 space-y-1.5">
                <Label>Regulator Reference</Label>
                <Input value={formData.regulator_reference || ""} onChange={(e) => set("regulator_reference", e.target.value)} />
              </div>
            )}
          </div>

          {/* Lifecycle timestamps */}
          {(formData.status === "service_restored" || formData.status === "resolved" || formData.status === "pir_rca" || formData.status === "closed") && (
            <>
              <SectionHeader icon={Clock} title="Lifecycle Milestones" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <Label>Service Restored Date</Label>
                  <Input type="datetime-local" value={formData.service_restored_date?.slice(0, 16) || ""} onChange={(e) => set("service_restored_date", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Resolved Date</Label>
                  <Input type="datetime-local" value={formData.resolved_date?.slice(0, 16) || ""} onChange={(e) => set("resolved_date", e.target.value)} />
                </div>
                {formData.status === "closed" && (
                  <div className="space-y-1.5">
                    <Label>Closure Date</Label>
                    <Input type="datetime-local" value={formData.closure_date?.slice(0, 16) || ""} onChange={(e) => set("closure_date", e.target.value)} />
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editingIncident ? "Update" : "Report"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
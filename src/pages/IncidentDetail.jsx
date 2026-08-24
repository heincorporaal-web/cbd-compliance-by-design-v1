import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertTriangle, Zap, Clock, ShieldAlert, CheckCircle2, Server, Package, PackageCheck, Users, FileSearch, Search, Award } from "lucide-react";
import { format } from "date-fns";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { useCompanyPreferences } from "@/hooks/useCompanyPreferences";
import IncidentActionPanel from "@/components/incidents/IncidentActionPanel";
import IncidentTimelinePanel from "@/components/incidents/IncidentTimelinePanel";
import IncidentLinksPanel from "@/components/incidents/IncidentLinksPanel";

const SEVERITY_STYLES = {
  critical: "bg-red-500 text-white", major: "bg-orange-500 text-white",
  moderate: "bg-yellow-500 text-white", minor: "bg-blue-500 text-white",
};
const PRIORITY_STYLES = {
  P1: "bg-red-600 text-white", P2: "bg-orange-500 text-white",
  P3: "bg-yellow-400 text-yellow-900", P4: "bg-blue-400 text-white",
};
const STATUS_STYLES = {
  detected: "bg-slate-100 text-slate-600", investigating: "bg-amber-100 text-amber-700",
  mitigating: "bg-amber-100 text-amber-700", service_restored: "bg-green-100 text-green-700",
  resolved: "bg-green-100 text-green-700", closed: "bg-slate-100 text-slate-400",
};

function Field({ label, value, icon: Icon }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </p>
      <p className="text-sm text-slate-700">{value || <span className="text-slate-300 italic">Not set</span>}</p>
    </div>
  );
}

export default function IncidentDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [globalCompany] = useCompanyFilter();
  const incidentId = new URLSearchParams(window.location.search).get("id");

  const { data: incident, isLoading } = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: () => base44.entities.Incident.get(incidentId),
    enabled: !!incidentId,
  });

  const companyId = incident?.company_id;
  const { enableAssetsByDesign, enableThirdPartyRiskManagement } = useCompanyPreferences(companyId);

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"], queryFn: () => base44.entities.Company.list(),
  });
  const { data: ictSystem } = useQuery({
    queryKey: ["ict-system", incident?.ict_system_id],
    queryFn: () => base44.entities.ICTSystem.get(incident.ict_system_id),
    enabled: !!incident?.ict_system_id,
  });
  const { data: configItem } = useQuery({
    queryKey: ["ci-detail", incident?.configuration_item_id],
    queryFn: () => base44.entities.ConfigurationItem.get(incident.configuration_item_id),
    enabled: !!incident?.configuration_item_id && enableAssetsByDesign,
  });
  const { data: thirdParty } = useQuery({
    queryKey: ["third-party-detail", incident?.third_party_id],
    queryFn: () => base44.entities.ThirdPartyProvider.get(incident.third_party_id),
    enabled: !!incident?.third_party_id && enableThirdPartyRiskManagement,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading incident…</div>;
  }
  if (!incident) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Incident not found</p>
        <Button className="mt-4" onClick={() => navigate("/Incidents")}>Back to Incidents</Button>
      </div>
    );
  }

  const company = companies.find((c) => c.id === incident.company_id);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/Incidents")} className="gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Back to Incidents
      </Button>

      {/* Header */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {incident.incident_reference && (
                  <span className="text-xs font-mono text-slate-400">{incident.incident_reference}</span>
                )}
                {incident.priority && (
                  <Badge className={`text-[10px] ${PRIORITY_STYLES[incident.priority]}`}>{incident.priority}</Badge>
                )}
                <Badge className={`text-[10px] ${SEVERITY_STYLES[incident.severity]}`}>{incident.severity}</Badge>
                <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[incident.status] || "bg-slate-100 text-slate-600"}`}>
                  {incident.status.replace(/_/g, " ")}
                </Badge>
                {incident.major_incident && (
                  <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200">
                    <ShieldAlert className="w-3 h-3 mr-0.5" /> Major Incident
                  </Badge>
                )}
                {incident.security_incident && (
                  <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">Security</Badge>
                )}
                {incident.data_breach && (
                  <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">Data Breach</Badge>
                )}
                {incident.recurring && (
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Recurring</Badge>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900">{incident.title}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {company?.name} • {incident.incident_type?.replace(/_/g, " ")}
                {incident.category && ` • ${incident.category}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="investigation">Investigation</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card className="border-none shadow-lg">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileSearch className="w-4 h-4 text-slate-500" /> Incident Details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* Identity */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Identity</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Detected" value={incident.detected_date ? format(new Date(incident.detected_date), "d MMM yyyy HH:mm") : ""} icon={Clock} />
                  <Field label="Reported" value={incident.reported_date ? format(new Date(incident.reported_date), "d MMM yyyy HH:mm") : ""} icon={Clock} />
                  <Field label="Detection Source" value={incident.detection_source?.replace(/_/g, " ")} />
                  <Field label="Reporter" value={incident.reporter} />
                </div>
                {incident.description && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-50">
                    <p className="text-sm text-slate-600">{incident.description}</p>
                  </div>
                )}
              </div>

              {/* Impact */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Impact Assessment</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Affected Service" value={incident.affected_service} icon={Server} />
                  <Field label="Users Affected" value={incident.users_affected} icon={Users} />
                  <Field label="Financial Impact" value={incident.estimated_financial_impact} />
                  <Field label="Regulatory Impact" value={incident.regulatory_impact} />
                </div>
                {incident.impact && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <p className="text-sm text-amber-800">{incident.impact}</p>
                  </div>
                )}
              </div>

              {/* Ownership */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Ownership & Assignment</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Incident Owner" value={incident.incident_owner} icon={Users} />
                  <Field label="Assignment Group" value={incident.assignment_group} />
                  <Field label="Technical Lead" value={incident.technical_lead} />
                  <Field label="Business Owner" value={incident.business_owner} />
                  {incident.major_incident && (
                    <Field label="Incident Commander" value={incident.incident_commander} icon={ShieldAlert} />
                  )}
                </div>
              </div>

              {/* Affected Assets */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Affected Assets & Dependencies</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="ICT System" value={ictSystem?.name} icon={Server} />
                  {enableAssetsByDesign && (
                    <Field label="Configuration Item" value={configItem ? (configItem.ci_name || configItem.hostname) : ""} icon={Package} />
                  )}
                  {enableThirdPartyRiskManagement && (
                    <>
                      <Field label="Third Party" value={thirdParty?.name} icon={PackageCheck} />
                      <Field label="Third Party Ticket" value={incident.third_party_ticket_ref} />
                    </>
                  )}
                </div>
                {!enableAssetsByDesign && !enableThirdPartyRiskManagement && (
                  <p className="text-xs text-slate-400 italic mt-2">
                    Assets by Design and Third Party Risk Management modules are not enabled for this company.
                  </p>
                )}
              </div>

              {/* SLA */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">SLA & Timeline</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Response Target" value={incident.sla_response_target} icon={Clock} />
                  <Field label="Restoration Target" value={incident.sla_restoration_target} icon={Clock} />
                  <Field label="Resolution Target" value={incident.sla_resolution_target} icon={Clock} />
                  <Field label="Escalation Level" value={incident.escalation_level ? `L${incident.escalation_level}` : "None"} icon={Zap} />
                </div>
                {incident.sla_breached && (
                  <Badge variant="outline" className="mt-2 bg-red-50 text-red-600 border-red-200">
                    <Clock className="w-3 h-3 mr-1" /> SLA Breached
                  </Badge>
                )}
              </div>

              {/* Lifecycle Milestones */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Lifecycle Milestones</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Service Restored" value={incident.service_restored_date ? format(new Date(incident.service_restored_date), "d MMM yyyy HH:mm") : ""} icon={CheckCircle2} />
                  <Field label="Resolved" value={incident.resolved_date ? format(new Date(incident.resolved_date), "d MMM yyyy HH:mm") : ""} icon={CheckCircle2} />
                  <Field label="Closure Date" value={incident.closure_date ? format(new Date(incident.closure_date), "d MMM yyyy HH:mm") : ""} icon={CheckCircle2} />
                  <Field label="Closure Approved By" value={incident.closure_approved_by} />
                </div>
              </div>

              {/* PIR & Regulatory */}
              {(incident.pir_required || incident.reported_to_regulator) && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-500" /> PIR & Regulatory
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="PIR Required" value={incident.pir_required ? "Yes" : "No"} />
                    <Field label="PIR Completed" value={incident.pir_completed ? "Yes" : "No"} />
                    <Field label="PIR Date" value={incident.pir_date} />
                    <Field label="Reported to Regulator" value={incident.reported_to_regulator ? "Yes" : "No"} />
                    <Field label="Regulator Reference" value={incident.regulator_reference} />
                  </div>
                  {incident.pir_findings && (
                    <div className="mt-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
                      <p className="text-xs font-medium text-purple-700 mb-1">PIR Findings / Lessons Learned</p>
                      <p className="text-sm text-purple-800">{incident.pir_findings}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investigation Tab */}
        <TabsContent value="investigation">
          <Card className="border-none shadow-lg">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Search className="w-4 h-4 text-slate-500" /> Investigation & Resolution</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Symptoms" value={incident.symptoms} />
              <Field label="Suspected Cause" value={incident.suspected_cause} />
              <Field label="Investigation Notes" value={incident.investigation_notes} />
              <Field label="Workaround" value={incident.workaround} />
              <Field label="Resolution" value={incident.resolution} />
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <Field label="Root Cause" value={incident.root_cause} />
                <Field label="Root Cause Category" value={incident.root_cause_category} />
                <Field label="RCA Methodology" value={incident.rca_methodology} />
                <Field label="Known Error" value={incident.known_error ? "Yes" : "No"} />
                {incident.problem_record_id && <Field label="Problem Record" value={incident.problem_record_id} />}
              </div>
              {incident.remediation_actions && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs font-medium text-blue-700 mb-1">Remediation Actions</p>
                  <p className="text-sm text-blue-800">{incident.remediation_actions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="border-none shadow-lg">
            <CardContent className="p-5">
              <IncidentTimelinePanel incidentId={incident.id} companyId={incident.company_id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions">
          <Card className="border-none shadow-lg">
            <CardContent className="p-5">
              <IncidentActionPanel incidentId={incident.id} companyId={incident.company_id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links">
          <Card className="border-none shadow-lg">
            <CardContent className="p-5">
              <IncidentLinksPanel incident={incident} companyId={incident.company_id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
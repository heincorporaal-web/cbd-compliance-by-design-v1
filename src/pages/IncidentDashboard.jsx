import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LayoutDashboard, ChevronRight, Plus } from "lucide-react";
import { format } from "date-fns";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import PageHeader from "@/components/layout/PageHeader";
import IncidentKpiCards from "@/components/incidents/IncidentKpiCards";
import IncidentGauges from "@/components/incidents/IncidentGauges";
import IncidentCharts from "@/components/incidents/IncidentCharts";
import IncidentFormDialog from "@/components/incidents/IncidentFormDialog";

const SEVERITY_STYLES = {
  critical: "bg-red-500 text-white",
  major: "bg-orange-500 text-white",
  moderate: "bg-yellow-500 text-white",
  minor: "bg-blue-500 text-white",
};
const PRIORITY_STYLES = {
  P1: "bg-red-600 text-white", P2: "bg-orange-500 text-white",
  P3: "bg-yellow-400 text-yellow-900", P4: "bg-blue-400 text-white",
};

const EMPTY_FORM = {
  title: "", company_id: "", ict_system_id: "", incident_type: "operational_disruption",
  severity: "moderate", priority: "P3", status: "detected", detected_date: new Date().toISOString(),
  description: "", impact: "", root_cause: "", remediation_actions: "", lessons_learned: "",
  reported_to_regulator: false, regulator_reference: "",
};

export default function IncidentDashboard() {
  const navigate = useNavigate();
  const [globalCompany] = useCompanyFilter();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => base44.entities.Incident.list("-detected_date"),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Incident.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["incidents"]); closeDialog(); },
  });

  const closeDialog = () => { setIsDialogOpen(false); setFormData(EMPTY_FORM); };

  const handleSubmit = (e) => { e.preventDefault(); createMutation.mutate(formData); };

  const openCreate = () => {
    setFormData({ ...EMPTY_FORM, company_id: globalCompany && globalCompany !== "all" ? globalCompany : "" });
    setIsDialogOpen(true);
  };

  const filtered = globalCompany === "all" ? incidents : incidents.filter(i => i.company_id === globalCompany);

  const recentIncidents = filtered.slice(0, 6);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <PageHeader
          navItemId="incidents"
          icon={LayoutDashboard}
          title="Incident Dashboard"
          tagline="Real-time insights into incident trends, SLA performance, and operational resilience"
          gradient="from-red-600 to-rose-700"
        />
        <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Report Incident
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No incidents yet — report your first incident to see dashboard insights.</p>
            <Button className="bg-red-600 hover:bg-red-700" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Report Incident
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <IncidentKpiCards incidents={filtered} />
          <IncidentGauges incidents={filtered} />
          <IncidentCharts incidents={filtered} />

          {/* Recent Incidents */}
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-slate-500" /> Recent Incidents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {recentIncidents.map((incident) => {
                  const company = companies.find(c => c.id === incident.company_id);
                  return (
                    <div
                      key={incident.id}
                      onClick={() => navigate(`/IncidentDetail?id=${incident.id}`)}
                      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {incident.incident_reference && (
                            <span className="text-[11px] font-mono text-slate-400">{incident.incident_reference}</span>
                          )}
                          <h3 className="font-semibold text-slate-900 truncate text-sm">{incident.title}</h3>
                          {incident.priority && (
                            <Badge className={`text-[10px] ${PRIORITY_STYLES[incident.priority]}`}>{incident.priority}</Badge>
                          )}
                          <Badge className={`text-[10px] ${SEVERITY_STYLES[incident.severity]}`}>{incident.severity}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {company?.name || "—"} • {format(new Date(incident.detected_date), "d MMM yyyy")}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <IncidentFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
        editingIncident={null}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        companies={companies}
        globalCompany={globalCompany}
      />
    </div>
  );
}
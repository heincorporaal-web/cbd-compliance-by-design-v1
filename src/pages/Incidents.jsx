import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, Search, ChevronRight, Zap, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import PageHeader from "@/components/layout/PageHeader";
import IncidentFormDialog from "@/components/incidents/IncidentFormDialog";

const SEVERITY_STYLES = {
  critical: "bg-red-500 text-white",
  major: "bg-orange-500 text-white",
  moderate: "bg-yellow-500 text-white",
  minor: "bg-blue-500 text-white",
};

const STATUS_STYLES = {
  detected: "bg-slate-100 text-slate-600 border-slate-200",
  logged: "bg-slate-100 text-slate-600 border-slate-200",
  classified: "bg-blue-100 text-blue-700 border-blue-200",
  assessed: "bg-blue-100 text-blue-700 border-blue-200",
  assigned: "bg-cyan-100 text-cyan-700 border-cyan-200",
  investigating: "bg-amber-100 text-amber-700 border-amber-200",
  mitigating: "bg-amber-100 text-amber-700 border-amber-200",
  service_restored: "bg-green-100 text-green-700 border-green-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
  pir_rca: "bg-purple-100 text-purple-700 border-purple-200",
  closed: "bg-slate-100 text-slate-400 border-slate-200",
};

const PRIORITY_STYLES = {
  P1: "bg-red-600 text-white",
  P2: "bg-orange-500 text-white",
  P3: "bg-yellow-400 text-yellow-900",
  P4: "bg-blue-400 text-white",
};

const EMPTY_FORM = {
  title: "", company_id: "", ict_system_id: "", incident_type: "operational_disruption",
  severity: "moderate", priority: "P3", status: "detected", detected_date: new Date().toISOString(),
  description: "", impact: "", root_cause: "", remediation_actions: "", lessons_learned: "",
  reported_to_regulator: false, regulator_reference: "",
};

export default function Incidents() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [globalCompany] = useCompanyFilter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [severityFilter, setSeverityFilter] = useState(searchParams.get("severity") || "all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["incidents"]); closeDialog(); },
  });

  const closeDialog = () => { setIsDialogOpen(false); setEditingIncident(null); setFormData(EMPTY_FORM); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingIncident) {
      updateMutation.mutate({ id: editingIncident.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openCreate = () => {
    setEditingIncident(null);
    setFormData({ ...EMPTY_FORM, company_id: globalCompany && globalCompany !== "all" ? globalCompany : "" });
    setIsDialogOpen(true);
  };

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch = !searchTerm ||
      inc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.incident_reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = globalCompany === "all" || inc.company_id === globalCompany;
    const matchesStatus = statusFilter === "all" || inc.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || inc.severity === severityFilter;
    const matchesPriority = priorityFilter === "all" || inc.priority === priorityFilter;
    return matchesSearch && matchesCompany && matchesStatus && matchesSeverity && matchesPriority;
  });

  // Stats
  const openCount = filteredIncidents.filter((i) => !["closed", "resolved"].includes(i.status)).length;
  const p1p2Count = filteredIncidents.filter((i) => i.priority === "P1" || i.priority === "P2").length;
  const majorCount = filteredIncidents.filter((i) => i.major_incident).length;
  const slaBreachedCount = filteredIncidents.filter((i) => i.sla_breached).length;

  const stats = [
    { label: "Open", value: openCount, icon: AlertTriangle, color: "text-blue-600 bg-blue-50" },
    { label: "P1 / P2", value: p1p2Count, icon: Zap, color: "text-red-600 bg-red-50" },
    { label: "Major", value: majorCount, icon: ShieldAlert, color: "text-orange-600 bg-orange-50" },
    { label: "SLA Breached", value: slaBreachedCount, icon: Clock, color: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <PageHeader
          navItemId="incidents"
          icon={AlertTriangle}
          title="Incident Management"
          tagline="End-to-end incident lifecycle from detection to closure and improvement"
          gradient="from-red-600 to-rose-700"
        />
        <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Report Incident
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search incidents…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="detected">Detected</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="mitigating">Mitigating</SelectItem>
                <SelectItem value="service_restored">Service Restored</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="pir_rca">PIR / RCA</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full md:w-[130px]"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[120px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="P1">P1</SelectItem>
                <SelectItem value="P2">P2</SelectItem>
                <SelectItem value="P3">P3</SelectItem>
                <SelectItem value="P4">P4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading incidents…</div>
          ) : filteredIncidents.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredIncidents.map((incident) => {
                const company = companies.find((c) => c.id === incident.company_id);
                return (
                  <div
                    key={incident.id}
                    onClick={() => navigate(`/IncidentDetail?id=${incident.id}`)}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          {incident.incident_reference && (
                            <span className="text-[11px] font-mono text-slate-400">{incident.incident_reference}</span>
                          )}
                          <h3 className="font-semibold text-slate-900 truncate">{incident.title}</h3>
                          {incident.priority && (
                            <Badge className={`text-[10px] ${PRIORITY_STYLES[incident.priority]}`}>{incident.priority}</Badge>
                          )}
                          <Badge className={`text-[10px] ${SEVERITY_STYLES[incident.severity]}`}>{incident.severity}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[incident.status] || STATUS_STYLES.detected}`}>
                            {incident.status.replace(/_/g, " ")}
                          </Badge>
                          {incident.major_incident && (
                            <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200">
                              <ShieldAlert className="w-3 h-3 mr-0.5" /> Major
                            </Badge>
                          )}
                          {incident.sla_breached && (
                            <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                              <Clock className="w-3 h-3 mr-0.5" /> SLA Breached
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
                          <span>{company?.name || "Unknown"}</span>
                          <span>•</span>
                          <span className="capitalize">{incident.incident_type?.replace(/_/g, " ")}</span>
                          <span>•</span>
                          <span>Detected: {format(new Date(incident.detected_date), "d MMM yyyy HH:mm")}</span>
                          {incident.service_restored_date && (
                            <span className="text-green-600 flex items-center gap-0.5">
                              • <CheckCircle2 className="w-3 h-3" /> Restored: {format(new Date(incident.service_restored_date), "d MMM HH:mm")}
                            </span>
                          )}
                        </div>
                        {incident.description && (
                          <p className="text-sm text-slate-600 mt-1.5 line-clamp-1">{incident.description}</p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No incidents found</p>
              <Button className="mt-4" onClick={openCreate}>Report Your First Incident</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <IncidentFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
        editingIncident={editingIncident}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        companies={companies}
        globalCompany={globalCompany}
      />
    </div>
  );
}
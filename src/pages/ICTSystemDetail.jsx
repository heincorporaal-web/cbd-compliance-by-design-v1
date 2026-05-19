import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Server, Puzzle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WorkflowPanel from "@/components/workflows/WorkflowPanel";
import SystemModulesTab from "@/components/ict/SystemModulesTab";
import { getICTSystemErrors, ErrorIcon } from "@/utils/validationErrors.jsx";

const SYSTEM_TYPES = [
  { value: "core_banking", label: "Core Banking" },
  { value: "payment_processing", label: "Payment Processing" },
  { value: "trading_platform", label: "Trading Platform" },
  { value: "risk_management", label: "Risk Management" },
  { value: "customer_relationship", label: "Customer Relationship" },
  { value: "data_analytics", label: "Data Analytics" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
  { value: "custom", label: "Custom…" },
];

export default function ICTSystemDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const systemId = urlParams.get("id");
  const isNew = urlParams.get("new") === "true";

  const [formData, setFormData] = useState({
    name: "",
    company_id: "",
    system_type: "other",
    system_type_custom: "",
    criticality: "supporting",
    description: "",
    owner: "",
    vendor: "",
    hosting_type: "on_premise",
    recovery_time_objective: "",
    recovery_point_objective: "",
    data_classification: "internal",
    status: "active",
    last_assessment_date: "",
    next_assessment_date: "",
  });

  const { data: existingSystem } = useQuery({
    queryKey: ["ictSystem", systemId],
    queryFn: () => base44.entities.ICTSystem.filter({ id: systemId }).then(r => r[0]),
    enabled: !!systemId && !isNew,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  useEffect(() => {
    if (existingSystem) setFormData(existingSystem);
  }, [existingSystem]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ICTSystem.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["ictSystems"]);
      navigate(createPageUrl(`ICTSystemDetail?id=${data.id}`));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ICTSystem.update(systemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["ictSystems"]);
      queryClient.invalidateQueries(["ictSystem", systemId]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isNew || !systemId) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const getCriticalityColor = (c) => ({
    critical: "bg-red-100 text-red-700 border-red-200",
    important: "bg-orange-100 text-orange-700 border-orange-200",
    supporting: "bg-blue-100 text-blue-700 border-blue-200",
  }[c] || "bg-slate-100 text-slate-700");

  const displayType = formData.system_type === "custom" && formData.system_type_custom
    ? formData.system_type_custom
    : SYSTEM_TYPES.find(t => t.value === formData.system_type)?.label || formData.system_type;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("ICTSystems")}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {isNew ? "New ICT System" : formData.name || "ICT System"}
              </h1>
              {!isNew && (
                <>
                  <ErrorIcon errors={getICTSystemErrors(formData)} />
                  {formData.criticality && (
                    <Badge variant="outline" className={`${getCriticalityColor(formData.criticality)} border`}>
                      {formData.criticality}
                    </Badge>
                  )}
                </>
              )}
            </div>
            <p className="text-slate-600 text-sm mt-0.5">ICT Systems Inventory</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("ICTSystems")}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {isNew ? "Create System" : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="system_info">
        <TabsList>
          <TabsTrigger value="system_info" className="gap-2">
            <Server className="w-4 h-4" /> System Information
          </TabsTrigger>
          {!isNew && systemId && (
            <TabsTrigger value="modules" className="gap-2">
              <Puzzle className="w-4 h-4" /> Modules
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="system_info">
          <form onSubmit={handleSubmit}>
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-600" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>System Name *</Label>
                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Company *</Label>
                    <Select value={formData.company_id} onValueChange={v => setFormData({ ...formData, company_id: v })} required>
                      <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                      <SelectContent>
                        {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* System Type with custom option */}
                  <div className="space-y-2">
                    <Label>System Type</Label>
                    <Select value={formData.system_type} onValueChange={v => setFormData({ ...formData, system_type: v, system_type_custom: v !== "custom" ? "" : formData.system_type_custom })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SYSTEM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {formData.system_type === "custom" && (
                      <Input
                        placeholder="Enter custom type name…"
                        value={formData.system_type_custom}
                        onChange={e => setFormData({ ...formData, system_type_custom: e.target.value })}
                        className="mt-2"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Criticality *</Label>
                    <Select value={formData.criticality} onValueChange={v => setFormData({ ...formData, criticality: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="important">Important</SelectItem>
                        <SelectItem value="supporting">Supporting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Owner</Label>
                    <Input value={formData.owner} onChange={e => setFormData({ ...formData, owner: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Vendor</Label>
                    <Input value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hosting Type</Label>
                    <Select value={formData.hosting_type} onValueChange={v => setFormData({ ...formData, hosting_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_premise">On Premise</SelectItem>
                        <SelectItem value="cloud">Cloud</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="managed_service">Managed Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Classification</Label>
                    <Select value={formData.data_classification} onValueChange={v => setFormData({ ...formData, data_classification: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="confidential">Confidential</SelectItem>
                        <SelectItem value="highly_confidential">Highly Confidential</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>RTO (Recovery Time Objective)</Label>
                    <Input value={formData.recovery_time_objective} onChange={e => setFormData({ ...formData, recovery_time_objective: e.target.value })} placeholder="e.g., 1 hour" />
                  </div>
                  <div className="space-y-2">
                    <Label>RPO (Recovery Point Objective)</Label>
                    <Input value={formData.recovery_point_objective} onChange={e => setFormData({ ...formData, recovery_point_objective: e.target.value })} placeholder="e.g., 15 minutes" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Assessment Date</Label>
                    <Input type="date" value={formData.last_assessment_date} onChange={e => setFormData({ ...formData, last_assessment_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Next Assessment Date</Label>
                    <Input type="date" value={formData.next_assessment_date} onChange={e => setFormData({ ...formData, next_assessment_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="decommissioned">Decommissioned</SelectItem>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {!isNew && systemId && (
          <TabsContent value="modules">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <Puzzle className="w-5 h-5 text-indigo-600" />
                  System Modules
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <SystemModulesTab systemId={systemId} companyId={formData.company_id} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {systemId && !isNew && (
        <WorkflowPanel
          entityType="ICTSystem"
          entityId={systemId}
          entityName={formData.name || "ICT System"}
          companyId={formData.company_id}
          record={existingSystem}
          onInstanceCreated={() => queryClient.invalidateQueries(["ictSystem", systemId])}
        />
      )}
    </div>
  );
}
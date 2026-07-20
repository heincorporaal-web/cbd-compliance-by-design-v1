import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Workflow, Globe, Search, Lock, Power, GitBranch, ArrowLeft, Cpu,
} from "lucide-react";
import { toast } from "sonner";
import BpmnDesigner from "@/components/processmodelling/BpmnDesigner";
import ProcessDocumentTemplates from "@/components/processmodelling/ProcessDocumentTemplates";
import ModulePageHeader from "@/components/branding/ModulePageHeader";
import { BRANDS } from "@/lib/moduleBrands";

export default function AdvancedProcessModelling() {
  const [companyId] = useCompanyFilter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [activeTab, setActiveTab] = useState("diagrams");

  const effectiveCompanyId = companyId === "all" ? null : companyId;

  // Product owner = platform admin or a role flagged is_product_owner
  const { data: roles = [] } = useQuery({
    queryKey: ["userRoles"],
    queryFn: () => base44.entities.UserRole.list("-created_date", 2000),
    enabled: !!user?.custom_role_id,
  });
  const myRole = roles.find((r) => r.id === user?.custom_role_id);
  const isProductOwner = user?.role === "admin" || !!myRole?.is_product_owner;

  // Company preferences (module on/off flag)
  const { data: prefs = [] } = useQuery({
    queryKey: ["companyPrefs", effectiveCompanyId],
    queryFn: () => base44.entities.CompanyPreference.filter({ company_id: effectiveCompanyId }),
    enabled: !!effectiveCompanyId,
  });
  const pref = prefs[0];
  const moduleEnabled = !!pref?.enable_advanced_process_modelling;

  const enableModuleMutation = useMutation({
    mutationFn: async (enable) => {
      if (pref) {
        return base44.entities.CompanyPreference.update(pref.id, { enable_advanced_process_modelling: enable });
      }
      return base44.entities.CompanyPreference.create({
        company_id: effectiveCompanyId,
        enable_advanced_process_modelling: enable,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["companyPrefs", effectiveCompanyId]);
      toast.success(`Advanced Process Modelling ${moduleEnabled ? "disabled" : "enabled"}`);
    },
  });

  const { data: processes = [], isLoading } = useQuery({
    queryKey: ["orgProcesses", effectiveCompanyId],
    queryFn: () =>
      effectiveCompanyId
        ? base44.entities.OrgProcess.filter({ company_id: effectiveCompanyId })
        : base44.entities.OrgProcess.list("process_code", 500),
    enabled: !!effectiveCompanyId,
  });

  // Saved diagram for the selected process
  const { data: diagrams = [] } = useQuery({
    queryKey: ["processDiagram", selectedProcess?.id],
    queryFn: () => base44.entities.ProcessDiagram.filter({ process_id: selectedProcess.id }),
    enabled: !!selectedProcess,
  });
  const diagram = diagrams[0];

  const saveMutation = useMutation({
    mutationFn: async ({ xml, svg, canvasMeta, elementMeta }) => {
      const overriddenName = canvasMeta?.process_name;
      const payload = {
        process_id: selectedProcess.id,
        process_code: selectedProcess.process_code,
        process_name: overriddenName || selectedProcess.name,
        company_id: selectedProcess.company_id,
        bpmn_xml: xml,
        svg_snapshot: svg,
        canvas_meta: canvasMeta || {},
        element_meta: elementMeta || {},
      };
      if (diagram) return base44.entities.ProcessDiagram.update(diagram.id, payload);
      return base44.entities.ProcessDiagram.create({ ...payload, status: "draft" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["processDiagram", selectedProcess.id]);
      toast.success("Process diagram saved");
    },
    onError: (e) => toast.error("Save failed: " + (e?.message || e)),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return processes;
    return processes.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.process_code || "").toLowerCase().includes(q)
    );
  }, [processes, search]);

  const modelledCount = processes.length; // simple stat; per-process saved detection kept light

  // No company selected (admin "all")
  if (!effectiveCompanyId) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader />
        <Card className="p-10 text-center text-slate-500">
          <Globe className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">Select a specific company to manage Advanced Process Modelling.</p>
          <p className="text-sm text-slate-400 mt-1">The add-on is switched on per company.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader />

      {/* Module toggle banner — product owner only */}
      {isProductOwner && (
        <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${moduleEnabled ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Advanced Process Modelling add-on</h3>
              <p className="text-sm text-slate-500">
                {moduleEnabled
                  ? "Switched on — model processes using BPMN 2.0 diagrams, document them, and assess risk posture."
                  : "Switched off — enable the add-on to access the BPMN 2.0 process diagram designer."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${moduleEnabled ? "text-indigo-600" : "text-slate-400"}`}>
              {moduleEnabled ? "Enabled" : "Disabled"}
            </span>
            <Switch checked={moduleEnabled} onCheckedChange={(v) => enableModuleMutation.mutate(v)} />
          </div>
        </Card>
      )}

      {!moduleEnabled ? (
        <Card className="p-10 text-center text-slate-500">
          {isProductOwner ? (
            <>
              <Workflow className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Advanced Process Modelling is switched off.</p>
              <p className="text-sm text-slate-400 mt-1">Enable the add-on above to access the BPMN 2.0 diagram designer.</p>
              <Link to="/ProcessManagement" className="inline-flex items-center gap-1.5 mt-3 text-sm text-indigo-600 font-medium hover:underline">
                <GitBranch className="w-4 h-4" /> Go to Process Management
              </Link>
            </>
          ) : (
            <>
              <Lock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Advanced Process Modelling is not enabled for your company.</p>
              <p className="text-sm text-slate-400 mt-1">
                Request activation using the Contact form in the{" "}
                <Link to="/about" className="text-indigo-600 font-medium hover:underline">About section</Link>.
              </p>
              <Link to="/ProcessManagement" className="inline-flex items-center gap-1.5 mt-3 text-sm text-indigo-600 font-medium hover:underline">
                <GitBranch className="w-4 h-4" /> Go to Process Management
              </Link>
            </>
          )}
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-1 border-b border-slate-200">
            <TabButton active={activeTab === "diagrams"} onClick={() => setActiveTab("diagrams")}>Process Diagrams</TabButton>
            <TabButton active={activeTab === "templates"} onClick={() => setActiveTab("templates")}>Document Templates</TabButton>
          </div>
          {activeTab === "templates" ? (
            <ProcessDocumentTemplates companyId={effectiveCompanyId} user={user} />
          ) : selectedProcess ? (
            <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-mono">{selectedProcess.process_code}</span>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-700">{selectedProcess.name}</span>
            <Badge variant="outline" className="ml-2">L{selectedProcess.level}</Badge>
          </div>
          <BpmnDesigner
            key={selectedProcess.id}
            initialXml={diagram?.bpmn_xml}
            initialCanvasMeta={diagram?.canvas_meta}
            initialElementMeta={diagram?.element_meta}
            onSave={(xml, svg, canvasMeta, elementMeta) =>
              saveMutation.mutate({ xml, svg, canvasMeta, elementMeta })
            }
            saving={saveMutation.isPending}
            onBack={() => setSelectedProcess(null)}
            processLabel={`${selectedProcess.process_code || ""} ${diagram?.canvas_meta?.process_name || selectedProcess.name || ""}`.trim()}
            companyId={selectedProcess.company_id}
          />
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search processes…" className="pl-9" />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Badge variant="secondary">{modelledCount} processes</Badge>
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="text-center text-slate-400 py-20">Loading…</div>
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center text-slate-500">
              <Cpu className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No processes found for this company.</p>
              <p className="text-sm text-slate-400 mt-1 mb-4">Add processes in Process Management first, then design their BPMN 2.0 diagrams here.</p>
              <Link to="/ProcessManagement">
                <Button variant="outline" className="gap-1.5">
                  <GitBranch className="w-4 h-4" /> Go to Process Management
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((p) => (
                <Card key={p.id} className="p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">{p.name}</h3>
                      <p className="text-xs font-mono text-slate-400">L{p.level} · {p.process_code}</p>
                    </div>
                    {p.criticality && (
                      <Badge variant="outline" className="capitalize">{p.criticality}</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {(p.linked_risk_ids?.length || 0) > 0 && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">{p.linked_risk_ids.length} risks</Badge>
                    )}
                    {(p.linked_control_ids?.length || 0) > 0 && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{p.linked_control_ids.length} controls</Badge>
                    )}
                    {(p.linked_system_ids?.length || 0) > 0 && (
                      <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">{p.linked_system_ids.length} systems</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                    <Button size="sm" onClick={() => setSelectedProcess(p)} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
                      <Workflow className="w-3.5 h-3.5" /> Design BPMN diagram
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
        </>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${active ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
    >
      {children}
    </button>
  );
}

function PageHeader() {
  return (
    <ModulePageHeader
      brand={BRANDS.obd}
      Icon={Workflow}
      title="Operations by Design"
      subtitle="Model processes with BPMN 2.0 diagrams, build documentation, and assess risk posture"
      landingPath="/OperationsByDesign"
    />
  );
}
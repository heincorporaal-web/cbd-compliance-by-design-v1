import React, { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, CheckCircle, AlertCircle, Loader2, BookOpen, Puzzle, FileSpreadsheet, GitMerge, Building2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import StuckWorkflowPanel from "@/components/admin/StuckWorkflowPanel";
import CompanyPreferencesPanel from "@/components/admin/CompanyPreferencesPanel";
import ToxicCombinationsPanel from "@/components/stakeholders/ToxicCombinationsPanel";
import ToxicCombinationsDOASelector from "@/components/doa/ToxicCombinationsDOASelector";

function UploadSection({ title, description, icon: Icon, iconColor, onUpload, accept = ".xlsx,.xls,.csv", isLoading, result }) {
  const fileRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload(file);
    e.target.value = "";
  };

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          {title}
        </CardTitle>
        <p className="text-sm text-slate-500">{description}</p>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          {isLoading ? (
            <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          )}
          <p className="text-sm font-medium text-slate-600">
            {isLoading ? "Uploading…" : "Click to upload or drag & drop"}
          </p>
          <p className="text-xs text-slate-400 mt-1">Supported: {accept}</p>
          <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFileChange} />
        </div>

        {result && (
          <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 text-sm ${
            result.success ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {result.success
              ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            }
            <span>{result.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Configuration() {
  const { data: groups = [] } = useQuery({ queryKey: ["stakeholderGroups"], queryFn: () => base44.entities.StakeholderGroup.list() });
  const { data: stakeholders = [] } = useQuery({ queryKey: ["stakeholders"], queryFn: () => base44.entities.Stakeholder.list() });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });

  const [riskLibraryLoading, setRiskLibraryLoading] = useState(false);
  const [riskLibraryResult, setRiskLibraryResult] = useState(null);

  const [ictModulesLoading, setIctModulesLoading] = useState(false);
  const [ictModulesResult, setIctModulesResult] = useState(null);

  const [stakeholdersLoading, setStakeholdersLoading] = useState(false);
  const [stakeholdersResult, setStakeholdersResult] = useState(null);

  const uploadFile = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  };

  const handleRiskLibraryUpload = async (file) => {
    setRiskLibraryLoading(true);
    setRiskLibraryResult(null);
    try {
      const file_url = await uploadFile(file);
      const res = await base44.functions.invoke("importRiskLibrary", { file_url });
      setRiskLibraryResult({
        success: true,
        message: `Successfully imported ${res.data.imported} risks (${res.data.total} rows processed).`,
      });
      toast.success(`Risk Library: ${res.data.imported} risks imported`);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Import failed";
      setRiskLibraryResult({ success: false, message: msg });
      toast.error("Risk Library import failed: " + msg);
    } finally {
      setRiskLibraryLoading(false);
    }
  };

  const handleIctModulesUpload = async (file) => {
    setIctModulesLoading(true);
    setIctModulesResult(null);
    try {
      const file_url = await uploadFile(file);
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            records: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ict_system_id: { type: "string" },
                  module_name: { type: "string" },
                  description: { type: "string" },
                  is_active: { type: "boolean" },
                  module_owner_name: { type: "string" },
                  active_from: { type: "string" },
                  active_to: { type: "string" },
                  domain: { type: "string" },
                  ict_scope: { type: "string" },
                  workstream_name: { type: "string" },
                  company_id: { type: "string" },
                }
              }
            }
          }
        }
      });
      const records = extracted?.output?.records || extracted?.output || [];
      if (!Array.isArray(records) || records.length === 0) {
        setIctModulesResult({ success: false, message: "No records found in file. Please check the file format." });
        return;
      }
      await base44.entities.ICTModule.bulkCreate(records);
      setIctModulesResult({ success: true, message: `Successfully imported ${records.length} ICT modules.` });
      toast.success(`ICT Modules: ${records.length} records imported`);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Import failed";
      setIctModulesResult({ success: false, message: msg });
      toast.error("ICT Modules import failed: " + msg);
    } finally {
      setIctModulesLoading(false);
    }
  };

  const handleStakeholdersUpload = async (file) => {
    setStakeholdersLoading(true);
    setStakeholdersResult(null);
    try {
      const file_url = await uploadFile(file);
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            records: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  full_name: { type: "string" },
                  email: { type: "string" },
                  job_title: { type: "string" },
                  department: { type: "string" },
                  phone: { type: "string" },
                  employee_number: { type: "string" },
                  company_id: { type: "string" },
                }
              }
            }
          }
        }
      });
      const records = extracted?.output?.records || extracted?.output || [];
      if (!Array.isArray(records) || records.length === 0) {
        setStakeholdersResult({ success: false, message: "No records found in file." });
        return;
      }
      await base44.entities.Stakeholder.bulkCreate(records);
      setStakeholdersResult({ success: true, message: `Successfully imported ${records.length} stakeholders.` });
      toast.success(`Stakeholders: ${records.length} records imported`);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Import failed";
      setStakeholdersResult({ success: false, message: msg });
      toast.error("Stakeholders import failed: " + msg);
    } finally {
      setStakeholdersLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuration</h1>
        <p className="text-slate-500 text-sm mt-1">Bulk imports, reference data management and system configuration.</p>
      </div>

      <Tabs defaultValue="company_prefs">
        <TabsList>
          <TabsTrigger value="company_prefs" className="gap-2">
            <Building2 className="w-4 h-4" /> Company Preferences
          </TabsTrigger>
          <TabsTrigger value="workflow_admin" className="gap-2">
            <GitMerge className="w-4 h-4" /> Workflow Admin
          </TabsTrigger>
          <TabsTrigger value="imports" className="gap-2">
            <Upload className="w-4 h-4" /> Bulk Imports
          </TabsTrigger>
          <TabsTrigger value="sod" className="gap-2">
            <ShieldAlert className="w-4 h-4" /> SOD Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company_prefs" className="mt-4">
          <CompanyPreferencesPanel />
        </TabsContent>

        <TabsContent value="workflow_admin" className="mt-4">
          <StuckWorkflowPanel />
        </TabsContent>

        <TabsContent value="imports" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UploadSection
              title="Risk Library"
              description="Import master risk library from an Excel file. Rows are mapped to the Risk entity with is_library_risk = true."
              icon={BookOpen}
              iconColor="text-indigo-600"
              onUpload={handleRiskLibraryUpload}
              isLoading={riskLibraryLoading}
              result={riskLibraryResult}
            />
            <UploadSection
              title="ICT Modules"
              description="Bulk-import ICT system modules. Required columns: ict_system_id, module_name. Optional: description, domain, ict_scope, module_owner_name, active_from, active_to, workstream_name, company_id."
              icon={Puzzle}
              iconColor="text-blue-600"
              onUpload={handleIctModulesUpload}
              isLoading={ictModulesLoading}
              result={ictModulesResult}
            />
            <UploadSection
              title="Stakeholders"
              description="Bulk-import stakeholders from CSV or Excel. Required columns: full_name, email, company_id. Optional: job_title, department, phone, employee_number."
              icon={FileSpreadsheet}
              iconColor="text-green-600"
              onUpload={handleStakeholdersUpload}
              isLoading={stakeholdersLoading}
              result={stakeholdersResult}
            />
          </div>

          <Card className="border border-slate-200 mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Import Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-500">
              <p>• <strong>Risk Library:</strong> Uses the dedicated <code>importRiskLibrary</code> backend function. Columns must match the Risk Excel template (RiskStatement, RiskReferenceNr, ValueChain, etc.).</p>
              <p>• <strong>ICT Modules:</strong> <code>ict_system_id</code> must be the exact ID of an existing ICTSystem record.</p>
              <p>• <strong>Stakeholders:</strong> <code>company_id</code> must be the exact ID of an existing Company record.</p>
              <p>• All dates should be in <strong>YYYY-MM-DD</strong> format.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sod" className="mt-4 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Segregation of Duties — Group & Process Rules</h2>
            <p className="text-xs text-slate-500 mt-0.5">Define incompatible stakeholder group pairs and incompatible L4/L5 process step pairs.</p>
          </div>
          <ToxicCombinationsPanel groups={groups} stakeholders={stakeholders} companies={companies} />

          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-base font-semibold text-slate-800">Segregation of Duties — Delegation of Authority Rules</h2>
            <p className="text-xs text-slate-500 mt-0.5">Define activity pairs within a DOA where the same person must not both execute and approve.</p>
          </div>
          <ToxicCombinationsDOASelector />
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Boxes, ArrowLeft, Edit2, AppWindow, User, Calendar, Shield, Trash2, Plus, Link2, AlertCircle } from "lucide-react";
import ModulePageHeader from "@/components/branding/ModulePageHeader";
import { BRANDS } from "@/lib/moduleBrands";
import { InfoRow, Badge2 } from "@/components/cmdb/CmdbShared";
import CBDApplicationFormDialog from "@/components/cmdb/CBDApplicationFormDialog";
import ApplicationCIRelationshipDialog from "@/components/cmdb/ApplicationCIRelationshipDialog";
import { toast } from "sonner";

export default function CBDApplicationDetail() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const { data: app, isLoading } = useQuery({
    queryKey: ["cbdAppRef", id],
    queryFn: () => base44.entities.CBDApplicationReference.get(id),
    enabled: !!id,
  });

  const { data: appRels = [] } = useQuery({
    queryKey: ["appCIRels", id],
    queryFn: () => base44.entities.ApplicationCIRelationship.filter({ cbd_application_reference_id: id }),
    enabled: !!id,
  });

  const { data: allCIs = [] } = useQuery({
    queryKey: ["configurationItems", app?.company_id],
    queryFn: () => base44.entities.ConfigurationItem.filter({ company_id: app.company_id }),
    enabled: !!app?.company_id,
  });

  const ciMap = Object.fromEntries(allCIs.map(c => [c.id, c]));

  const delMut = useMutation({
    mutationFn: (relId) => base44.entities.ApplicationCIRelationship.delete(relId),
    onSuccess: () => {
      queryClient.invalidateQueries(["appCIRels"]);
      queryClient.invalidateQueries(["appCIRelationships"]);
      toast.success("CI unlinked from application");
    },
  });

  if (!id) return <div className="p-6"><p className="text-slate-500">No application selected.</p></div>;
  if (isLoading) return <div className="p-6"><p className="text-slate-500">Loading...</p></div>;
  if (!app) return <div className="p-6"><p className="text-slate-500">Application not found.</p></div>;

  return (
    <div>
      <ModulePageHeader brand={BRANDS.abd} Icon={Boxes} title={app.application_name} subtitle={`CBD Application ID: ${app.cbd_application_id}`} />

      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/CMDBApplications"><Button variant="outline" size="sm" className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Back to Applications</Button></Link>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}><Edit2 className="w-3.5 h-3.5" /> Edit</Button>
        </div>

        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-700">This application data is a read-only reference from CBD. Edits here are for CMDB metadata only — the authoritative source remains the CBD ICT Application register.</p>
        </div>

        {app.business_criticality && appRels.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700">This application's <strong>{app.business_criticality}</strong> criticality is inherited by {appRels.length} linked CI(s). Inherited criticality is computed — never written back to CBD.</p>
          </div>
        )}

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5"><AppWindow className="w-4 h-4" /> Application Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
            <InfoRow label="Application Name" value={app.application_name} />
            <InfoRow label="CBD Application ID" value={app.cbd_application_id} />
            <InfoRow label="Application Type" value={app.application_type} />
            <InfoRow label="Description" value={app.application_description} />
            <InfoRow label="Business Criticality" value={app.business_criticality} />
            <InfoRow label="Information Classification" value={app.information_classification} />
            <InfoRow label="Lifecycle Status" value={app.lifecycle_status} />
            <InfoRow label="Hosting Type" value={app.hosting_type} />
            <InfoRow label="Production Status" value={app.production_status} />
            <InfoRow label="Application Owner" value={app.application_owner} icon={User} />
            <InfoRow label="Technical Owner" value={app.technical_owner} icon={User} />
            <InfoRow label="Business Owner" value={app.business_owner} icon={User} />
            <InfoRow label="Last Refreshed from CBD" value={app.last_refreshed ? new Date(app.last_refreshed).toLocaleString("en-GB") : "Never"} icon={Calendar} />
            <InfoRow label="Active in CBD" value={app.is_active ? "Yes" : "No"} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Link2 className="w-4 h-4" /> Linked Configuration Items ({appRels.length})</h3>
            <Button size="sm" className="gap-1.5" onClick={() => setLinkOpen(true)}><Plus className="w-3.5 h-3.5" /> Link CI</Button>
          </div>
          {appRels.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4 text-center">No CIs linked to this application yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">CI</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Relationship</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Environment</th>
                    <th className="text-center px-3 py-2 font-medium text-slate-600">Critical</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Source</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {appRels.map(r => {
                    const ci = ciMap[r.configuration_item_id];
                    return (
                      <tr key={r.id} className="border-b hover:bg-slate-50">
                        <td className="px-3 py-2">
                          {ci ? (
                            <Link to={`/CIDetail?id=${ci.id}`} className="text-slate-800 hover:text-blue-600">
                              <span className="font-mono text-xs text-slate-400">{ci.ci_id}</span> {ci.ci_name}
                            </Link>
                          ) : <span className="text-slate-400">{r.ci_name || "Unknown CI"}</span>}
                        </td>
                        <td className="px-3 py-2"><Badge2 className="bg-indigo-50 text-indigo-700 border-indigo-200">{r.relationship_type}</Badge2></td>
                        <td className="px-3 py-2 text-slate-600">{r.environment || "—"}</td>
                        <td className="px-3 py-2 text-center">{r.critical_dependency && <Badge2 className="bg-red-50 text-red-600 border-red-200">yes</Badge2>}</td>
                        <td className="px-3 py-2"><Badge2 className={`border-slate-200 ${r.relationship_source === "manual" ? "bg-slate-50 text-slate-600" : r.relationship_source === "discovered" ? "bg-purple-50 text-purple-600 border-purple-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>{r.relationship_source}</Badge2></td>
                        <td className="px-3 py-2 text-right"><Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => delMut.mutate(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {editOpen && <CBDApplicationFormDialog open={editOpen} onOpenChange={setEditOpen} app={app} companyId={app.company_id} />}
      {linkOpen && <ApplicationCIRelationshipDialog open={linkOpen} onOpenChange={setLinkOpen} app={app} companyId={app.company_id} />}
    </div>
  );
}
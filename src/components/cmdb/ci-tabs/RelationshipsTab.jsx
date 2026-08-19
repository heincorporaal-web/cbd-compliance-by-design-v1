import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge2 } from "../CmdbShared";
import { Plus, Trash2, Link2, GitBranch, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import CIRelationshipDialog from "../CIRelationshipDialog";
import { toast } from "sonner";

export default function RelationshipsTab({ ci }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: allCIs = [] } = useQuery({ queryKey: ["configurationItems", ci.company_id], queryFn: () => base44.entities.ConfigurationItem.filter({ company_id: ci.company_id }) });
  const { data: rels = [] } = useQuery({ queryKey: ["ciRelationships", ci.id], queryFn: () => base44.entities.CIRelationship.filter({ company_id: ci.company_id }) });
  const { data: appRels = [] } = useQuery({ queryKey: ["appCIRelationships", ci.id], queryFn: () => base44.entities.ApplicationCIRelationship.filter({ configuration_item_id: ci.id }) });
  const { data: cbdApps = [] } = useQuery({ queryKey: ["cbdAppRefs", ci.company_id], queryFn: () => base44.entities.CBDApplicationReference.filter({ company_id: ci.company_id }) });

  const ciMap = Object.fromEntries(allCIs.map(c => [c.id, c]));
  const appMap = Object.fromEntries(cbdApps.map(a => [a.id, a]));

  const upstream = rels.filter(r => r.child_ci_id === ci.id);
  const downstream = rels.filter(r => r.parent_ci_id === ci.id);

  const delRelMut = useMutation({
    mutationFn: (id) => base44.entities.CIRelationship.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["ciRelationships"]); toast.success("Relationship removed"); },
  });

  const delAppRelMut = useMutation({
    mutationFn: (id) => base44.entities.ApplicationCIRelationship.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["appCIRelationships"]); toast.success("Application relationship removed"); },
  });

  const renderRelRow = (r, isUpstream) => {
    const otherCi = ciMap[isUpstream ? r.parent_ci_id : r.child_ci_id];
    if (!otherCi) return null;
    return (
      <div key={r.id} className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2 hover:bg-slate-50">
        <div className="flex items-center gap-2 min-w-0">
          <Badge2 className="bg-blue-50 text-blue-700 border-blue-200 shrink-0">{r.relationship_type}</Badge2>
          <Link to={`/CIDetail?id=${otherCi.id}`} className="text-sm text-slate-800 hover:text-blue-600 truncate">
            <span className="font-mono text-xs text-slate-400">{otherCi.ci_id}</span> {otherCi.ci_name}
          </Link>
          <span className="text-xs text-slate-400">{isUpstream ? "→ this CI" : "this CI →"}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {r.automatically_discovered && <Badge2 className="bg-purple-50 text-purple-600 border-purple-200">discovered</Badge2>}
          {r.manually_confirmed && <Badge2 className="bg-emerald-50 text-emerald-700 border-emerald-200">confirmed</Badge2>}
          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => delRelMut.mutate(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" /> CI Relationships</h4>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Relationship</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Upstream (parents)</p>
            {upstream.length === 0 ? <p className="text-sm text-slate-400 italic">No upstream relationships.</p> : <div className="space-y-2">{upstream.map(r => renderRelRow(r, true))}</div>}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">Downstream (children) <ArrowRight className="w-3 h-3" /></p>
            {downstream.length === 0 ? <p className="text-sm text-slate-400 italic">No downstream relationships.</p> : <div className="space-y-2">{downstream.map(r => renderRelRow(r, false))}</div>}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> CBD Application Relationships</h4>
        {appRels.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No CBD application relationships. These are managed in the Application view (Phase 2).</p>
        ) : (
          <div className="space-y-2">
            {appRels.map(r => {
              const app = appMap[r.cbd_application_reference_id];
              return (
                <div key={r.id} className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2 hover:bg-slate-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge2 className="bg-indigo-50 text-indigo-700 border-indigo-200 shrink-0">{r.relationship_type}</Badge2>
                    <span className="text-sm font-medium text-slate-800">{app?.application_name || r.cbd_application_name || "Unknown app"}</span>
                    {r.environment && <Badge2 className="bg-slate-50 text-slate-600 border-slate-200">{r.environment}</Badge2>}
                    {r.critical_dependency && <Badge2 className="bg-red-50 text-red-600 border-red-200">critical</Badge2>}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 shrink-0" onClick={() => delAppRelMut.mutate(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && <CIRelationshipDialog open={showAdd} onOpenChange={setShowAdd} ci={ci} companyId={ci.company_id} />}
    </div>
  );
}
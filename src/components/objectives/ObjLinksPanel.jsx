import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Network, Layers, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

function LinkList({ items, linkedIds, onAdd, onRemove, labelKey = "name", codeKey }) {
  const linked = items.filter(i => linkedIds.includes(i.id));
  const available = items.filter(i => !linkedIds.includes(i.id));

  return (
    <div className="space-y-4">
      {linked.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Linked</p>
          <div className="space-y-1">
            {linked.map(i => (
              <div key={i.id} className="flex items-center justify-between p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                <span className="text-sm text-slate-800">
                  {codeKey && <span className="font-mono text-xs text-slate-500 mr-2">{i[codeKey]}</span>}
                  {i[labelKey]}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => onRemove(i.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      {available.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Available to link</p>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {available.map(i => (
              <div key={i.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                <span className="text-sm text-slate-700">
                  {codeKey && <span className="font-mono text-xs text-slate-400 mr-2">{i[codeKey]}</span>}
                  {i[labelKey]}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-500 hover:text-indigo-700" onClick={() => onAdd(i.id)}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      {linked.length === 0 && available.length === 0 && (
        <p className="text-sm text-slate-400 italic text-center py-6">No items available.</p>
      )}
    </div>
  );
}

export default function ObjLinksPanel({ objectiveId, onClose }) {
  const queryClient = useQueryClient();

  const { data: objective } = useQuery({
    queryKey: ["orgObjective", objectiveId],
    queryFn: () => base44.entities.OrgObjective.filter({ id: objectiveId }).then(r => r[0]),
    enabled: !!objectiveId,
  });

  const { data: orgProcesses = [] } = useQuery({
    queryKey: ["orgProcesses"],
    queryFn: () => base44.entities.OrgProcess.list("process_code"),
  });

  const { data: ihpomProcesses = [] } = useQuery({
    queryKey: ["businessProcesses"],
    queryFn: () => base44.entities.BusinessProcess.list("process_code"),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.OrgObjective.update(objectiveId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["orgObjective", objectiveId]);
      queryClient.invalidateQueries(["orgObjectives"]);
      toast.success("Links updated");
    },
  });

  const toggleLink = (field, id, add) => {
    if (!objective) return;
    const current = objective[field] || [];
    const next = add ? [...current, id] : current.filter(x => x !== id);
    updateMutation.mutate({ [field]: next });
  };

  if (!objective) return null;

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Linkages —</span>
            <span className="text-indigo-600 font-semibold">{objective.title}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="process">
          <TabsList className="w-full">
            <TabsTrigger value="process" className="flex-1 gap-2">
              <Network className="w-4 h-4" /> Process Mgmt
              {(objective.linked_process_ids?.length || 0) > 0 && (
                <Badge className="ml-1 bg-indigo-100 text-indigo-700">{objective.linked_process_ids.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ihpom" className="flex-1 gap-2">
              <Layers className="w-4 h-4" /> iHPOM
              {(objective.linked_ihpom_ids?.length || 0) > 0 && (
                <Badge className="ml-1 bg-purple-100 text-purple-700">{objective.linked_ihpom_ids.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="process" className="pt-4">
            <LinkList
              items={orgProcesses}
              linkedIds={objective.linked_process_ids || []}
              onAdd={id => toggleLink("linked_process_ids", id, true)}
              onRemove={id => toggleLink("linked_process_ids", id, false)}
              labelKey="name"
              codeKey="process_code"
            />
          </TabsContent>

          <TabsContent value="ihpom" className="pt-4">
            <LinkList
              items={ihpomProcesses}
              linkedIds={objective.linked_ihpom_ids || []}
              onAdd={id => toggleLink("linked_ihpom_ids", id, true)}
              onRemove={id => toggleLink("linked_ihpom_ids", id, false)}
              labelKey="name"
              codeKey="process_code"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
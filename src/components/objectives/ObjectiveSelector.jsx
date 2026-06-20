import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Plus, X } from "lucide-react";

export default function ObjectiveSelector({ 
  company, 
  linkedObjectiveIds = [], 
  onAdd, 
  onRemove,
  isOpen,
  onClose
}) {
  const { data: orgObjectives = [] } = useQuery({
    queryKey: ['orgObjectives', company?.id],
    queryFn: () => base44.entities.OrgObjective.filter({ company_id: company.id }),
    enabled: !!company?.id && isOpen,
  });

  const linkedObjectives = orgObjectives.filter(obj => linkedObjectiveIds.includes(obj.id));
  const availableObjectives = orgObjectives.filter(obj => !linkedObjectiveIds.includes(obj.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Link Strategic Objectives</DialogTitle>
        </DialogHeader>

        {orgObjectives.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-2">No objectives defined for this company</p>
            <p className="text-sm text-slate-500">Add objectives in the Org Objectives section first</p>
          </div>
        ) : (
          <div className="space-y-4">
            {linkedObjectives.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Linked Objectives</h3>
                <div className="space-y-2">
                  {linkedObjectives.map(obj => (
                    <Card key={obj.id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-sm">{obj.title}</span>
                          </div>
                          {obj.description && (
                            <p className="text-xs text-slate-600">{obj.description}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemove(obj.id)}>
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {availableObjectives.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Available Objectives</h3>
                <div className="space-y-2">
                  {availableObjectives.map(obj => (
                    <Card key={obj.id} className="p-3 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-sm">{obj.title}</span>
                          </div>
                          {obj.description && (
                            <p className="text-xs text-slate-600">{obj.description}</p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => onAdd(obj.id)}>
                          <Plus className="w-3 h-3 mr-1" />
                          Link
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {linkedObjectives.length === 0 && availableObjectives.length === 0 && (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">All objectives are already linked</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
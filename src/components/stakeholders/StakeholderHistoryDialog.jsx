import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Clock, ArrowRight } from "lucide-react";

const CHANGE_COLORS = {
  new_hire: "bg-green-100 text-green-800",
  job_change: "bg-blue-100 text-blue-800",
  group_change: "bg-purple-100 text-purple-800",
  termination: "bg-red-100 text-red-800",
  reactivation: "bg-teal-100 text-teal-800",
  other: "bg-slate-100 text-slate-700",
};

const CHANGE_LABELS = {
  new_hire: "New Hire",
  job_change: "Job Change",
  group_change: "Group Change",
  termination: "Termination",
  reactivation: "Reactivation",
  other: "Other",
};

export default function StakeholderHistoryDialog({ open, onOpenChange, stakeholder }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["stakeholderHistory", stakeholder?.id],
    queryFn: () => base44.entities.StakeholderHistory.filter({ stakeholder_id: stakeholder.id }, "-created_date", 100),
    enabled: !!stakeholder?.id && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" />
            Movement History — {stakeholder?.full_name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-10 text-slate-400">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-slate-400">No history recorded yet.</div>
        ) : (
          <div className="space-y-3 pt-2">
            {history.map(h => (
              <div key={h.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={CHANGE_COLORS[h.change_type] || CHANGE_COLORS.other}>
                      {CHANGE_LABELS[h.change_type] || h.change_type}
                    </Badge>
                    {h.field_changed && (
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {h.field_changed.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {h.created_date ? format(new Date(h.created_date), "dd MMM yyyy, HH:mm") : ""}
                  </span>
                </div>

                {(h.from_value || h.to_value) && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    {h.from_value && <span className="line-through text-slate-400">{h.from_value}</span>}
                    {h.from_value && h.to_value && <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />}
                    {h.to_value && <span className="font-medium text-slate-800">{h.to_value}</span>}
                  </div>
                )}

                {(h.from_date || h.to_date) && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>Effective:</span>
                    {h.from_date && <span>{format(new Date(h.from_date), "dd MMM yyyy")}</span>}
                    {h.from_date && h.to_date && <span>→</span>}
                    {h.to_date && <span>{format(new Date(h.to_date), "dd MMM yyyy")}</span>}
                  </div>
                )}

                {h.notes && <p className="mt-2 text-xs text-slate-500 italic">{h.notes}</p>}
                {h.changed_by && <p className="mt-1 text-xs text-slate-400">Changed by: {h.changed_by}</p>}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
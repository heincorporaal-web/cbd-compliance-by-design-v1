import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, ClipboardList, Pencil, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-500",
  in_edit: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  archived: "bg-slate-100 text-slate-400",
};

const STATUS_LABELS = { draft: "Draft", in_edit: "In Edit", active: "Active", archived: "Archived" };

const TYPE_COLORS = {
  Qualitative: "bg-violet-100 text-violet-700",
  Quantitative: "bg-cyan-100 text-cyan-700",
  "Semi-Quantitative": "bg-teal-100 text-teal-700",
  "Supplier Services": "bg-orange-100 text-orange-700",
  Criticality: "bg-rose-100 text-rose-700",
};

export default function AssessmentModels() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["assessment-models"],
    queryFn: () => base44.entities.AssessmentModel.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AssessmentModel.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["assessment-models"]); toast.success("Model deleted"); },
  });

  const cloneMutation = useMutation({
    mutationFn: async (model) => {
      const { id, created_date, updated_date, created_by_id, ...rest } = model;
      return base44.entities.AssessmentModel.create({ ...rest, name: `${rest.name} (Copy)`, status: "draft" });
    },
    onSuccess: () => { queryClient.invalidateQueries(["assessment-models"]); toast.success("Model cloned"); },
  });

  const filtered = models.filter(m =>
    !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assessment Models</h1>
          <p className="text-sm text-slate-500 mt-0.5">Define reusable scoring and rating models for assessments, risk, and supplier evaluations.</p>
        </div>
        <Link to={`${createPageUrl("AssessmentModelDetail")}?mode=new`}>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> New Model
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search models…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="text-center text-slate-400 py-12">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No assessment models yet</p>
            <p className="text-sm text-slate-400 mt-1">Create your first model to start defining scoring scales.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(model => (
            <Card key={model.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{model.name}</h3>
                    {model.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{model.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <Badge className={`text-xs border-0 ${TYPE_COLORS[model.analysis_type] || "bg-slate-100 text-slate-600"}`}>
                    {model.analysis_type}
                  </Badge>
                  <Badge className={`text-xs border-0 ${STATUS_COLORS[model.status] || ""}`}>
                    {STATUS_LABELS[model.status] || model.status}
                  </Badge>
                  {model.is_global && <Badge className="text-xs border-0 bg-blue-50 text-blue-600">Global</Badge>}
                </div>
                <div className="text-xs text-slate-400 flex gap-3 mb-4">
                  {model.revision && <span>Rev {model.revision}</span>}
                  {model.revision_date && <span>{model.revision_date}</span>}
                  {model.impact_levels?.length > 0 && <span>{model.impact_levels.length} impact bands</span>}
                  {model.rating_options?.length > 0 && <span>{model.rating_options.length} rating options</span>}
                </div>
                <div className="flex items-center gap-1 pt-3 border-t border-slate-100">
                  <Link to={`${createPageUrl("AssessmentModelDetail")}?id=${model.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => cloneMutation.mutate(model)}>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => { if (confirm("Delete this model?")) deleteMutation.mutate(model.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
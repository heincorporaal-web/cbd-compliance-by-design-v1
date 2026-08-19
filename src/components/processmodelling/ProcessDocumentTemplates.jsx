import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import ProcessDocumentTemplateDesigner from "@/components/processmodelling/ProcessDocumentTemplateDesigner";

const STATUS_STYLES = {
  collaborate: "bg-blue-100 text-blue-700 border-blue-200",
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  review: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function ProcessDocumentTemplates({ companyId, user }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["processDocTemplates", companyId],
    queryFn: () => base44.entities.ProcessDocumentTemplate.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      if (id) {
        return base44.entities.ProcessDocumentTemplate.update(id, {
          ...payload,
          updated_by: user?.full_name || user?.email || "—",
        });
      }
      return base44.entities.ProcessDocumentTemplate.create({
        ...payload,
        company_id: companyId,
        created_by: user?.full_name || user?.email || "—",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["processDocTemplates", companyId]);
      toast.success("Document template saved");
      setEditing(null);
    },
    onError: (e) => toast.error("Save failed: " + (e?.message || e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProcessDocumentTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["processDocTemplates", companyId]);
      toast.success("Template deleted");
    },
  });

  if (editing) {
    const isNew = editing === "new";
    const tpl = isNew ? null : editing;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back to templates
          </Button>
          <h2 className="text-lg font-semibold text-slate-800">{isNew ? "New document template" : "Edit template"}</h2>
        </div>
        <ProcessDocumentTemplateDesigner
          template={tpl}
          saving={saveMutation.isPending}
          onCancel={() => setEditing(null)}
          onSave={(payload) => saveMutation.mutate({ id: tpl?.id, payload })}
        />
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? templates.filter(
        (t) => (t.name || "").toLowerCase().includes(q) || (t.category || "").toLowerCase().includes(q)
      )
    : templates;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…" className="pl-9" />
        </div>
        <Button onClick={() => setEditing("new")} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> New template
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-400 py-20">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">
          <p className="font-medium">No document templates yet.</p>
          <p className="text-sm text-slate-400 mt-1">Create a template that merges data fields from your process flows.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <Card key={t.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{t.name}</h3>
                  {t.category && <p className="text-xs text-slate-400">{t.category}</p>}
                </div>
                <Badge variant="outline" className={`capitalize ${STATUS_STYLES[t.status] || ""}`}>{t.status}</Badge>
              </div>
              {t.description && <p className="text-sm text-slate-500 line-clamp-2">{t.description}</p>}
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {(t.fields_used?.length || 0) > 0 && <Badge variant="outline">{t.fields_used.length} fields</Badge>}
                {t.version_label && <Badge variant="outline">{t.version_label}</Badge>}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  By {t.created_by || "—"} · {t.created_date ? new Date(t.created_date).toLocaleDateString("en-GB") : ""}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(t)}><Pencil className="w-4 h-4" /></Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { if (confirm("Delete this template?")) deleteMutation.mutate(t.id); }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
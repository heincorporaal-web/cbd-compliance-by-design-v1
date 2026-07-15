import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Info, Pencil, Save, ShieldCheck, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function About() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const isAdmin = user?.role === "admin";

  const { data: metas = [], isLoading } = useQuery({
    queryKey: ["appMeta"],
    queryFn: () => base44.entities.AppMeta.list("-updated_date", 1),
  });
  const meta = metas[0];

  useEffect(() => {
    if (meta) {
      setForm({
        app_name: meta.app_name || "",
        version: meta.version || "",
        release_date: meta.release_date || "",
        tagline: meta.tagline || "",
        description: meta.description || "",
        release_notes: meta.release_notes || "",
      });
    }
  }, [meta]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const data = { ...payload, last_updated_by: user?.full_name || user?.email || "admin" };
      if (meta) return base44.entities.AppMeta.update(meta.id, data);
      return base44.entities.AppMeta.create({ app_name: data.app_name || "GRC Platform", ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["appMeta"]);
      setEditing(false);
      toast.success("About information saved");
    },
    onError: (e) => toast.error("Failed to save: " + e.message),
  });

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
            <Info className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">About</h1>
            <p className="text-slate-500 text-sm">Application information & version</p>
          </div>
        </div>
        {isAdmin && meta && (
          <Button onClick={() => setEditing(true)} variant="outline" className="gap-2">
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        )}
        {isAdmin && !meta && (
          <Button onClick={() => setEditing(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Pencil className="w-4 h-4" /> Set Version Info
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center text-slate-400 py-20">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Banner */}
          <div className="bg-gradient-to-r from-slate-800 to-indigo-700 px-6 py-8 text-white">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold">{form.app_name || meta?.app_name || "GRC Platform"}</h2>
                {meta?.tagline && <p className="text-slate-200 text-sm mt-1">{meta.tagline}</p>}
              </div>
              {meta?.version && (
                <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
                  Version {meta.version}
                </Badge>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Version</p>
                  <p className="font-semibold text-slate-800">{meta?.version || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Release Date</p>
                  <p className="font-semibold text-slate-800">{meta?.release_date || "—"}</p>
                </div>
              </div>
            </div>

            {meta?.description && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Description</p>
                <p className="text-slate-700 text-sm whitespace-pre-wrap">{meta.description}</p>
              </div>
            )}

            {meta?.release_notes && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Release Notes</p>
                <p className="text-slate-700 text-sm whitespace-pre-wrap">{meta.release_notes}</p>
              </div>
            )}

            {meta?.last_updated_by && (
              <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                Last updated by {meta.last_updated_by}
                {meta.updated_date && ` · ${new Date(meta.updated_date).toLocaleString()}`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit About / Version Information</DialogTitle>
            <DialogDescription>Set the version number and application details shown on the About page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>App Name</Label>
                <Input value={form.app_name || ""} onChange={e => setField("app_name", e.target.value)} />
              </div>
              <div>
                <Label>Version</Label>
                <Input placeholder="v1.2" value={form.version || ""} onChange={e => setField("version", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Release Date</Label>
              <Input type="date" value={form.release_date || ""} onChange={e => setField("release_date", e.target.value)} />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input placeholder="One-line tagline" value={form.tagline || ""} onChange={e => setField("tagline", e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={3} value={form.description || ""} onChange={e => setField("description", e.target.value)} />
            </div>
            <div>
              <Label>Release Notes</Label>
              <Textarea rows={4} placeholder="What changed in this build" value={form.release_notes || ""} onChange={e => setField("release_notes", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-2">
              <Save className="w-4 h-4" /> {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
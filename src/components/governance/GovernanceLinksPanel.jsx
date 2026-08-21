import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Search, Link2, Unlink, Plus, X, Check, Network, GitBranch, Server,
} from "lucide-react";
import { toast } from "sonner";

// ── Multi-select picker dialog ─────────────────────────────────────────────

function PickerDialog({ open, onOpenChange, title, items, selectedIds, onConfirm }) {
  const [search, setSearch] = useState("");
  const [local, setLocal] = useState(selectedIds);

  React.useEffect(() => {
    if (open) setLocal(selectedIds);
  }, [open, selectedIds]);

  const filtered = items.filter((it) =>
    it.label.toLowerCase().includes(search.trim().toLowerCase())
  );

  const toggle = (id) =>
    setLocal((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative flex-1 overflow-hidden flex flex-col">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-9"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">No items found.</p>
            ) : (
              filtered.map((it) => {
                const checked = local.includes(it.id);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => toggle(it.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors ${
                      checked
                        ? "border-[#800020] bg-rose-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                        checked ? "bg-[#800020] border-[#800020]" : "border-slate-300"
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{it.label}</p>
                      {it.sub && <p className="text-xs text-slate-400 truncate">{it.sub}</p>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
        <DialogFooter>
          <span className="text-xs text-slate-400 mr-auto">{local.length} selected</span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => { onConfirm(local); onOpenChange(false); }}
            className="bg-[#800020] hover:bg-[#65081F] text-white"
          >
            Save links
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Link section ───────────────────────────────────────────────────────────

function LinkSection({ title, icon: Icon, items, onAdd, onRemove, accent }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accent}`} />
          {title}
          <Badge variant="secondary" className="text-xs">{items.length}</Badge>
        </h4>
        <Button size="sm" variant="outline" onClick={onAdd} className="gap-1.5 text-xs h-7">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 italic pl-6">No links yet.</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700 truncate">{it.label}</p>
                {it.sub && <p className="text-xs text-slate-400 truncate">{it.sub}</p>}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600"
                onClick={() => onRemove(it.id)}
              >
                <Unlink className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main links panel ────────────────────────────────────────────────────────

export default function GovernanceLinksPanel({ doc, companyId }) {
  const queryClient = useQueryClient();
  const [picker, setPicker] = useState(null); // "process" | "ict" | null

  // Fetch OrgProcess list (Operations by Design)
  const { data: processes = [] } = useQuery({
    queryKey: ["orgProcesses", companyId],
    queryFn: () => base44.entities.OrgProcess.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  // Fetch ICTSystem list (Assets by Design)
  const { data: ictSystems = [] } = useQuery({
    queryKey: ["ictSystems", companyId],
    queryFn: () => base44.entities.ICTSystem.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const processItems = processes.map((p) => ({
    id: p.id,
    label: p.process_name || p.name || "Unnamed process",
    sub: p.process_id || p.process_code || "",
  }));

  const ictItems = ictSystems.map((s) => ({
    id: s.id,
    label: s.name || "Unnamed system",
    sub: [s.criticality, s.system_type].filter(Boolean).join(" · "),
  }));

  const linkedProcessIds = doc.linked_process_ids || [];
  const linkedIctIds = doc.linked_ict_system_ids || [];

  const linkedProcesses = processItems.filter((p) => linkedProcessIds.includes(p.id));
  const linkedIct = ictItems.filter((s) => linkedIctIds.includes(s.id));

  const updateMutation = useMutation({
    mutationFn: async (data) => base44.entities.GovernanceDocument.update(doc.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["governanceDocs"]);
      queryClient.invalidateQueries(["governanceDoc", doc.id]);
      toast.success("Links updated");
    },
  });

  const handleConfirm = (ids) => {
    if (picker === "process") {
      updateMutation.mutate({ linked_process_ids: ids });
    } else if (picker === "ict") {
      updateMutation.mutate({ linked_ict_system_ids: ids });
    }
  };

  const handleRemove = (field, id) => {
    const current = doc[field] || [];
    updateMutation.mutate({ [field]: current.filter((x) => x !== id) });
  };

  return (
    <Card className="p-4 space-y-4 border-l-2 border-l-[#800020]">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Link2 className="w-4 h-4 text-[#800020]" />
        <h3 className="text-sm font-semibold text-slate-800">Traceability Links</h3>
        <span className="text-xs text-slate-400">— connect to OBD processes and ABD assets</span>
      </div>

      <LinkSection
        title="Operations by Design — Processes"
        icon={GitBranch}
        accent="text-teal-600"
        items={linkedProcesses}
        onAdd={() => setPicker("process")}
        onRemove={(id) => handleRemove("linked_process_ids", id)}
      />

      <LinkSection
        title="Assets by Design — ICT Systems"
        icon={Server}
        accent="text-blue-600"
        items={linkedIct}
        onAdd={() => setPicker("ict")}
        onRemove={(id) => handleRemove("linked_ict_system_ids", id)}
      />

      {picker && (
        <PickerDialog
          open={!!picker}
          onOpenChange={(v) => !v && setPicker(null)}
          title={picker === "process" ? "Link Processes" : "Link ICT Systems"}
          items={picker === "process" ? processItems : ictItems}
          selectedIds={picker === "process" ? linkedProcessIds : linkedIctIds}
          onConfirm={handleConfirm}
        />
      )}
    </Card>
  );
}
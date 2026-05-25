import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, ShieldCheck, AlertCircle } from "lucide-react";

const STATUS_COLORS = {
  active:   "bg-green-100 text-green-700",
  approved: "bg-emerald-100 text-emerald-700",
  draft:    "bg-slate-100 text-slate-600",
};

export default function CompensatingControlPicker({
  keyControlId,       // ID of the current control (excluded from picker)
  isKeyControl,       // boolean — only key controls can have compensating controls
  assignedIds = [],   // currently linked compensating control IDs
  allControls = [],   // all Control records
  frameworks = [],    // for framework name lookup
  onAdd,              // (id) => void
  onRemove,           // (id) => void
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const assignedControls = allControls.filter(c => assignedIds.includes(c.id));

  // Only active controls, not self, not already assigned
  const eligibleControls = allControls.filter(c =>
    c.id !== keyControlId &&
    c.status === "active" &&
    !assignedIds.includes(c.id)
  );

  const filtered = search.trim()
    ? eligibleControls.filter(c => {
        const q = search.toLowerCase();
        return (
          c.control_id?.toLowerCase().includes(q) ||
          c.title?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
        );
      })
    : eligibleControls;

  const handleAdd = (id) => {
    onAdd(id);
    // keep dialog open so user can add multiple
  };

  if (!isKeyControl) {
    return (
      <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Only <strong>Key Controls</strong> can have compensating controls assigned. Enable the Key Control flag on the Details tab to manage compensating controls.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Assigned list */}
      {assignedControls.length > 0 ? (
        <div className="space-y-2">
          {assignedControls.map(ctrl => {
            const fw = frameworks.find(f => f.id === ctrl.framework_id);
            const statusCls = STATUS_COLORS[ctrl.status] || "bg-slate-100 text-slate-500";
            return (
              <div key={ctrl.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="font-medium text-slate-900 text-sm">{ctrl.control_id}</span>
                    <Badge className={`text-xs ${statusCls}`}>{ctrl.status}</Badge>
                    {fw && <Badge variant="outline" className="text-xs">{fw.framework_code || fw.name}</Badge>}
                  </div>
                  <p className="text-sm text-slate-600 truncate">{ctrl.title}</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 ml-2" onClick={() => onRemove(ctrl.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-3">No compensating controls linked yet.</p>
      )}

      {/* Add button + dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Compensating Control
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Compensating Control(s)</DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              autoFocus
              placeholder="Search by control ID, title, category…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <p className="text-xs text-slate-400">
            Only <span className="font-semibold text-green-600">Active</span> controls are shown. Click a row to assign.
          </p>

          {/* Results */}
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>{search ? "No active controls match your search." : "No active controls available to assign."}</p>
              </div>
            ) : filtered.map(ctrl => {
              const fw = frameworks.find(f => f.id === ctrl.framework_id);
              return (
                <div
                  key={ctrl.id}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => handleAdd(ctrl.id)}
                >
                  <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-slate-900 text-sm">{ctrl.control_id}</span>
                      <Badge className="text-xs bg-green-100 text-green-700">active</Badge>
                      {fw && <Badge variant="outline" className="text-xs">{fw.framework_code || fw.name}</Badge>}
                      {ctrl.key_control && <Badge className="text-xs bg-amber-100 text-amber-700">Key</Badge>}
                    </div>
                    <p className="text-sm text-slate-600 truncate">{ctrl.title}</p>
                    {ctrl.category && <p className="text-xs text-slate-400 mt-0.5">{ctrl.category}</p>}
                  </div>
                  <Plus className="w-4 h-4 text-blue-400 shrink-0" />
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
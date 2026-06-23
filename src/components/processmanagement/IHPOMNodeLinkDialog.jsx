import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Network } from "lucide-react";

const levelLabels = {
  1: "Process Group", 2: "Process", 3: "Sub-Process",
  4: "Procedure", 5: "Task", 6: "Activity/Keystroke",
};

export default function IHPOMNodeLinkDialog({ open, onOpenChange, nodes, linkedIds, onAdd }) {
  const [search, setSearch] = useState("");

  const available = useMemo(
    () => nodes.filter(n => !linkedIds.includes(n.id)),
    [nodes, linkedIds]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter(n =>
      n.node_code?.toLowerCase().includes(q) ||
      n.name?.toLowerCase().includes(q) ||
      n.symbol?.toLowerCase().includes(q) ||
      n.alias?.toLowerCase().includes(q) ||
      n.description?.toLowerCase().includes(q)
    );
  }, [available, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-purple-600" />
            Link iHPOM Node
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            autoFocus
            placeholder="Search by code, name, symbol, or keyword…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 -mr-2 pr-2">
          {filtered.length > 0 ? filtered.map(n => (
            <div
              key={n.id}
              className="flex items-center gap-3 p-2.5 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => { onAdd(n.id); onOpenChange(false); }}
            >
              <Badge className="bg-purple-100 text-purple-700 shrink-0">L{n.level}</Badge>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {n.symbol && (
                    <span className="text-xs font-bold text-slate-700 uppercase">{n.symbol}</span>
                  )}
                  <span className="font-mono text-xs text-slate-500">{n.node_code}</span>
                </div>
                <p className="text-sm text-slate-800 truncate">{n.name}</p>
              </div>
              <span className="text-xs text-slate-400 shrink-0">{levelLabels[n.level]}</span>
            </div>
          )) : (
            <div className="text-center py-8 text-slate-500">
              <Network className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm">
                {search ? "No nodes match your search." : "No nodes available to link."}
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400">
          {filtered.length} node{filtered.length !== 1 ? "s" : ""} available
          {search && ` (filtered from ${available.length})`}
        </p>
      </DialogContent>
    </Dialog>
  );
}
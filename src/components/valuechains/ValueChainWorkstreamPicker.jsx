import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Network, Layers } from "lucide-react";
import { useCustomOptions } from "@/hooks/useCustomOptions";
import { isExpired } from "@/components/ui/EndDateBadge";

const MANAGEMENT_CHAINS = [
  "Customer Relationship Management",
  "Enterprise Asset Management",
  "Enterprise Governance and Shareholder",
  "Enterprise IT Management",
  "Enterprise Perfomance Management",
  "Financial Management",
  "Governance, Risk & Compliance",
  "Human Capital Management",
  "Inventory Management",
  "Product Management",
  "Strategic Planning & Direction",
];

/**
 * Reusable picker that lets users select a Management Chain, Value Chain and
 * Workstream. Designed for use across OBD, ABD and GBD module forms.
 *
 * Props:
 *  - companyId: string (required — filters value chains to the selected company)
 *  - valueChainId: string (currently selected value chain)
 *  - workstreamId: string (currently selected workstream)
 *  - onValueChainChange: (id, vc) => void
 *  - onWorkstreamChange: (id, ws) => void
 *  - showManagementChain: boolean (default true) — show the management chain filter
 *  - compact: boolean (default false) — use a 2-col grid instead of 3-col
 */
export default function ValueChainWorkstreamPicker({
  companyId,
  valueChainId,
  workstreamId,
  onValueChainChange,
  onWorkstreamChange,
  showManagementChain = true,
  compact = false,
}) {
  const [mgmtChainFilter, setMgmtChainFilter] = useState("");
  const { isDisabledSeeded } = useCustomOptions("value_chain_management_chains");

  // Fetch value chains for the company
  const { data: valueChains = [] } = useQuery({
    queryKey: ["vc-picker-value-chains", companyId],
    queryFn: () =>
      companyId
        ? base44.entities.ValueChain.filter({ company_id: companyId }, "sort_order")
        : base44.entities.ValueChain.list("sort_order"),
  });

  // Fetch workstreams for the selected value chain
  const { data: workstreams = [] } = useQuery({
    queryKey: ["vc-picker-workstreams", valueChainId],
    queryFn: () =>
      valueChainId
        ? base44.entities.Workstream.filter({ value_chain_id: valueChainId }, "sort_order")
        : [],
    enabled: !!valueChainId,
  });

  // Active (non-end-dated) value chains, optionally filtered by management chain
  const activeValueChains = useMemo(() => {
    return valueChains.filter(vc => {
      if (isExpired(vc.end_date) || vc.status === "inactive" || vc.status === "archived") return false;
      if (isDisabledSeeded(vc.management_chain)) return false;
      if (mgmtChainFilter && vc.management_chain !== mgmtChainFilter) return false;
      return true;
    });
  }, [valueChains, mgmtChainFilter, isDisabledSeeded]);

  const selectedVC = valueChains.find(vc => vc.id === valueChainId);
  const selectedChain = selectedVC?.management_chain || "";

  const handleVCChange = (id) => {
    const vc = valueChains.find(v => v.id === id);
    onValueChainChange(id, vc);
    // Reset workstream when value chain changes
    if (onWorkstreamChange) onWorkstreamChange("", null);
  };

  const gridCls = compact ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "grid grid-cols-1 md:grid-cols-3 gap-3";

  return (
    <div className={gridCls}>
      {showManagementChain && (
        <div className="space-y-1">
          <Label className="flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-slate-400" />
            Management Chain
          </Label>
          <Select
            value={mgmtChainFilter || selectedChain || ""}
            onValueChange={(v) => {
              setMgmtChainFilter(v === "__all__" ? "" : v);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All chains…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All chains…</SelectItem>
              {MANAGEMENT_CHAINS.filter(mc => !isDisabledSeeded(mc)).map(mc => (
                <SelectItem key={mc} value={mc}>{mc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedChain && !mgmtChainFilter && (
            <p className="text-xs text-slate-400">Inherited from selected value chain</p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <Label className="flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5 text-slate-400" />
          Value Chain
        </Label>
        <Select value={valueChainId || ""} onValueChange={handleVCChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select value chain…" />
          </SelectTrigger>
          <SelectContent>
            {activeValueChains.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-400">No active value chains</div>
            )}
            {activeValueChains.map(vc => (
              <SelectItem key={vc.id} value={vc.id}>
                <span className="flex items-center gap-2">
                  {vc.name}
                  {vc.management_chain && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {vc.management_chain}
                    </Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          Workstream
        </Label>
        <Select
          value={workstreamId || ""}
          onValueChange={(id) => {
            const ws = workstreams.find(w => w.id === id);
            onWorkstreamChange(id, ws);
          }}
          disabled={!valueChainId}
        >
          <SelectTrigger>
            <SelectValue placeholder={valueChainId ? "Select workstream…" : "Select value chain first…"} />
          </SelectTrigger>
          <SelectContent>
            {workstreams.length === 0 && valueChainId && (
              <div className="px-3 py-2 text-xs text-slate-400">No workstreams</div>
            )}
            {workstreams.map(ws => (
              <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
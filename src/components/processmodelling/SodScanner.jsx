import React, { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Loader2, Search, Plus, Check, AlertTriangle, X } from "lucide-react";
import { getElementCategory } from "@/components/processmodelling/bpmnDataConfig";

const SEVERITY_STYLES = {
  Critical: { badge: "bg-red-100 text-red-700 border-red-200", marker: "sod-critical" },
  High: { badge: "bg-orange-100 text-orange-700 border-orange-200", marker: "sod-high" },
  Medium: { badge: "bg-yellow-100 text-yellow-700 border-yellow-200", marker: "sod-medium" },
  Low: { badge: "bg-blue-100 text-blue-700 border-blue-200", marker: "sod-low" },
};

// Collect task/activity/subprocess elements from the BPMN modeler with their metadata
function collectSteps(modelerRef, elementMeta) {
  const modeler = modelerRef?.current;
  if (!modeler) return [];
  const all = modeler.get("elementRegistry").getAll();
  const RELEVANT = new Set(["task", "subprocess", "gateway", "start_event", "end_event"]);
  const steps = [];
  for (const el of all) {
    if (el.type === "label") continue;
    const cat = getElementCategory(el);
    if (!RELEVANT.has(cat)) continue;
    const meta = elementMeta[el.id] || {};
    const bo = el.businessObject || {};
    steps.push({
      id: el.id,
      name: meta.name || bo.name || el.id,
      activity_type: meta.activity_type || (cat === "gateway" ? "Decision" : "Task"),
      performer_role: meta.performer_role || meta.activity_owner_performer || meta.process_owner || "",
      activity_description: meta.activity_description || meta.purpose || "",
      linked_process: meta.linked_process || null,
      process_reference: meta.process_reference || "",
      _category: cat,
    });
  }
  return steps;
}

export default function SodScanner({
  modelerRef,
  elementMeta,
  canvasMeta,
  companyId,
  onClose,
}) {
  const qc = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [violations, setViolations] = useState(null);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());

  // Existing ToxicCombination rules (process_step_conflict) to check for duplicates
  const existingRules = useMemo(() => {
    // We don't fetch here — the caller can pass existing rules if needed
    return [];
  }, []);

  const clearMarkers = useCallback(() => {
    const modeler = modelerRef?.current;
    if (!modeler) return;
    const canvas = modeler.get("canvas");
    const all = modeler.get("elementRegistry").getAll();
    for (const el of all) {
      Object.values(SEVERITY_STYLES).forEach(s => canvas.removeMarker(el.id, s.marker));
    }
  }, [modelerRef]);

  const applyMarkers = useCallback((viols) => {
    const modeler = modelerRef?.current;
    if (!modeler) return;
    clearMarkers();
    const canvas = modeler.get("canvas");
    for (const v of viols) {
      const style = SEVERITY_STYLES[v.severity] || SEVERITY_STYLES.Medium;
      if (v.element_a_id) canvas.addMarker(v.element_a_id, style.marker);
      if (v.element_b_id) canvas.addMarker(v.element_b_id, style.marker);
    }
  }, [modelerRef, clearMarkers]);

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    setAddedIds(new Set());
    try {
      const steps = collectSteps(modelerRef, elementMeta);
      if (steps.length < 2) {
        setError("Not enough process steps on the canvas. Add at least two tasks or activities to scan for SOD violations.");
        setScanning(false);
        return;
      }
      const res = await base44.functions.invoke("analyzeSodViolations", {
        elements: steps,
        company_id: companyId,
      });
      const viols = res?.data?.violations || [];
      setViolations(viols);
      applyMarkers(viols);
    } catch (e) {
      setError(e?.message || "SOD scan failed");
      setViolations([]);
    } finally {
      setScanning(false);
    }
  };

  const handleClose = () => {
    clearMarkers();
    onClose?.();
  };

  // Check if both elements in a violation are linked to OrgProcess records
  const getProcessInfo = (v) => {
    const aMeta = elementMeta[v.element_a_id] || {};
    const bMeta = elementMeta[v.element_b_id] || {};
    return {
      aLinked: !!aMeta.linked_process,
      bLinked: !!bMeta.linked_process,
      aProcessId: aMeta.linked_process || "",
      bProcessId: bMeta.linked_process || "",
      aCode: aMeta.process_reference || "",
      bCode: bMeta.process_reference || "",
    };
  };

  const handleAddToConflicts = async (v, idx) => {
    setAddingId(idx);
    try {
      const info = getProcessInfo(v);
      const aMeta = elementMeta[v.element_a_id] || {};
      const bMeta = elementMeta[v.element_b_id] || {};

      // Fetch OrgProcess records if linked
      let procA = null, procB = null;
      if (info.aProcessId) {
        try { procA = await base44.entities.OrgProcess.get(info.aProcessId); } catch {}
      }
      if (info.bProcessId) {
        try { procB = await base44.entities.OrgProcess.get(info.bProcessId); } catch {}
      }

      await base44.entities.ToxicCombination.create({
        name: `SOD: ${v.element_a_name} ⟷ ${v.element_b_name}`,
        description: `${v.sod_pattern} — ${v.reason}`,
        company_id: companyId,
        combination_type: "process_step_conflict",
        status: "active",
        severity: v.severity,
        process_a_id: info.aProcessId || v.element_a_id,
        process_a_code: procA?.process_code || info.aCode || v.element_a_id,
        process_a_name: procA?.name || v.element_a_name,
        process_b_id: info.bProcessId || v.element_b_id,
        process_b_code: procB?.process_code || info.bCode || v.element_b_id,
        process_b_name: procB?.name || v.element_b_name,
        notes: `Identified by SOD Violation Scanner. SOD pattern: ${v.sod_pattern}.`,
      });

      setAddedIds(prev => new Set([...prev, idx]));
      qc.invalidateQueries(["toxicCombinations"]);
    } catch (e) {
      setError(e?.message || "Failed to add to Process Step Conflicts");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <aside className="w-[400px] shrink-0 border-l border-slate-200 bg-white flex flex-col h-full">
      <style>{`
        .sod-critical .djs-outline { stroke: #dc2626 !important; stroke-width: 3px !important; fill: rgba(220,38,38,0.08) !important; display: block !important; }
        .sod-high .djs-outline { stroke: #ea580c !important; stroke-width: 3px !important; fill: rgba(234,88,12,0.08) !important; display: block !important; }
        .sod-medium .djs-outline { stroke: #ca8a04 !important; stroke-width: 2px !important; fill: rgba(202,138,4,0.06) !important; display: block !important; }
        .sod-low .djs-outline { stroke: #2563eb !important; stroke-width: 2px !important; fill: rgba(37,99,235,0.06) !important; display: block !important; }
      `}</style>

      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">SOD Scanner</p>
          <p className="text-sm font-semibold text-slate-800">Segregation of Duties</p>
        </div>
        <button onClick={handleClose} className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500" title="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 border-b border-slate-200">
        <Button
          onClick={handleScan}
          disabled={scanning}
          className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {scanning ? "Scanning…" : "Scan for SOD Violations"}
        </Button>
        <p className="text-xs text-slate-500 mt-2">
          Analyses all process steps on the canvas for potential Segregation of Duties conflicts using AI.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!violations && !error && (
          <div className="text-center py-8 text-slate-400">
            <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Click "Scan" to analyse your process steps for potential SOD violations.</p>
          </div>
        )}

        {violations && violations.length === 0 && !error && (
          <div className="text-center py-8">
            <Check className="w-10 h-10 mx-auto mb-2 text-green-500" />
            <p className="text-sm font-medium text-green-700">No SOD violations detected</p>
            <p className="text-xs text-slate-500 mt-1">All process steps appear to have appropriate duty separation.</p>
          </div>
        )}

        {violations && violations.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Badge variant="secondary" className="text-xs">{violations.length} finding{violations.length !== 1 ? "s" : ""}</Badge>
              <span>Flagged steps are highlighted on the canvas.</span>
            </div>
            {violations.map((v, idx) => {
              const info = getProcessInfo(v);
              const isAdded = addedIds.has(idx);
              const sevStyle = SEVERITY_STYLES[v.severity] || SEVERITY_STYLES.Medium;
              const canAdd = info.aLinked && info.bLinked;
              return (
                <div key={idx} className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className={`text-xs border ${sevStyle.badge}`}>{v.severity}</Badge>
                    <span className="text-xs font-medium text-slate-500">{v.sod_pattern}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium text-slate-800 truncate">{v.element_a_name}</span>
                      <span className="text-slate-400">⟷</span>
                      <span className="font-medium text-slate-800 truncate">{v.element_b_name}</span>
                    </div>
                    <p className="text-xs text-slate-600">{v.reason}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {isAdded ? (
                      <Badge className="text-xs bg-green-100 text-green-700 border-green-200 gap-1">
                        <Check className="w-3 h-3" /> Added to Conflicts
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddToConflicts(v, idx)}
                        disabled={addingId === idx}
                        className="text-xs gap-1 h-7"
                      >
                        {addingId === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        Add to Process Step Conflicts
                      </Button>
                    )}
                    {!canAdd && !isAdded && (
                      <span className="text-xs text-amber-600" title="One or both steps are not linked to an OrgProcess record">
                        ⚠ Link steps to processes first
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </aside>
  );
}
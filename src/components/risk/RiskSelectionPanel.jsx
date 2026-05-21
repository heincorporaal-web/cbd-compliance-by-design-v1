import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, CheckSquare } from "lucide-react";

function getRiskScore(likelihood, impact) {
  const v = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
  return (v[likelihood] || 3) * (v[impact] || 3);
}

function getRiskColor(score) {
  if (score >= 20) return "bg-red-500 text-white";
  if (score >= 12) return "bg-orange-500 text-white";
  if (score >= 6) return "bg-yellow-500 text-white";
  return "bg-green-500 text-white";
}

function RiskRow({ risk, selected, onToggle }) {
  const score = getRiskScore(risk.likelihood, risk.impact);
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
      onClick={() => onToggle(risk.id)}
    >
      <Checkbox checked={selected} onCheckedChange={() => onToggle(risk.id)} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-medium text-sm text-slate-900 truncate">{risk.title}</span>
          <Badge className={`${getRiskColor(score)} text-xs px-1.5 py-0`}>{score}</Badge>
          {risk.risk_reference_nr && <span className="font-mono text-xs text-slate-400">{risk.risk_reference_nr}</span>}
        </div>
        <div className="flex gap-3 text-xs text-slate-400 flex-wrap">
          {risk.workstream && <span>{risk.workstream}</span>}
          {risk.value_chain && <span>{risk.value_chain}</span>}
          {risk.process_activity && <span>{risk.process_activity}</span>}
        </div>
      </div>
    </div>
  );
}

export default function RiskSelectionPanel({ companyId, selectedIds, onSelectionChange }) {
  const [manualSearch, setManualSearch] = useState("");
  const [selectedWorkstream, setSelectedWorkstream] = useState("__all__");
  const [selectedCapability, setSelectedCapability] = useState("__all__");
  const [selectedProcess, setSelectedProcess] = useState("__all__");

  const { data: risks = [] } = useQuery({
    queryKey: ["risks-company", companyId],
    queryFn: () => base44.entities.Risk.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: workstreams = [] } = useQuery({
    queryKey: ["workstreams", companyId],
    queryFn: () => base44.entities.Workstream.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: capabilities = [] } = useQuery({
    queryKey: ["it-capabilities", companyId],
    queryFn: () => base44.entities.ITCapability.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: processes = [] } = useQuery({
    queryKey: ["org-processes-l4", companyId],
    queryFn: () => base44.entities.OrgProcess.filter({ company_id: companyId, level: 4 }),
    enabled: !!companyId,
  });

  const companyRisks = risks.filter(r => !r.is_library_risk);

  const toggleRisk = (id) => {
    const next = selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id];
    onSelectionChange(next);
  };

  const toggleAll = (list) => {
    const ids = list.map(r => r.id);
    const allSelected = ids.every(id => selectedIds.includes(id));
    if (allSelected) {
      onSelectionChange(selectedIds.filter(id => !ids.includes(id)));
    } else {
      const next = [...new Set([...selectedIds, ...ids])];
      onSelectionChange(next);
    }
  };

  // By Workstream: match risks whose workstream field matches selected workstream name
  const workstreamRisks = useMemo(() => {
    if (selectedWorkstream === "__all__") return companyRisks;
    const ws = workstreams.find(w => w.id === selectedWorkstream);
    if (!ws) return [];
    return companyRisks.filter(r =>
      r.workstream?.toLowerCase().includes(ws.name?.toLowerCase()) ||
      r.workstream?.toLowerCase().includes(ws.full_label?.toLowerCase())
    );
  }, [companyRisks, selectedWorkstream, workstreams]);

  // By Capability: match risks whose description or category loosely matches
  const capabilityRisks = useMemo(() => {
    if (selectedCapability === "__all__") return companyRisks;
    const cap = capabilities.find(c => c.id === selectedCapability);
    if (!cap) return [];
    return companyRisks.filter(r =>
      r.title?.toLowerCase().includes(cap.name?.toLowerCase()) ||
      r.description?.toLowerCase().includes(cap.name?.toLowerCase()) ||
      r.category === "technology"
    );
  }, [companyRisks, selectedCapability, capabilities]);

  // By Level-4 Process
  const processRisks = useMemo(() => {
    if (selectedProcess === "__all__") return companyRisks;
    const proc = processes.find(p => p.id === selectedProcess);
    if (!proc) return [];
    return companyRisks.filter(r =>
      r.process_activity?.toLowerCase().includes(proc.name?.toLowerCase()) ||
      r.sub_process?.toLowerCase().includes(proc.name?.toLowerCase()) ||
      r.linked_objective_ids?.some(id => id === proc.id)
    );
  }, [companyRisks, selectedProcess, processes]);

  // Manual search
  const manualRisks = useMemo(() => {
    if (!manualSearch.trim()) return companyRisks;
    const q = manualSearch.toLowerCase();
    return companyRisks.filter(r =>
      r.title?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.risk_reference_nr?.toLowerCase().includes(q) ||
      r.workstream?.toLowerCase().includes(q) ||
      r.value_chain?.toLowerCase().includes(q)
    );
  }, [companyRisks, manualSearch]);

  const RiskList = ({ list }) => (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {list.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No risks found.</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">{list.length} risk{list.length !== 1 ? "s" : ""} found</span>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleAll(list)}>
              <CheckSquare className="w-3 h-3 mr-1" />
              {list.every(r => selectedIds.includes(r.id)) ? "Deselect All" : "Select All"}
            </Button>
          </div>
          {list.map(risk => (
            <RiskRow key={risk.id} risk={risk} selected={selectedIds.includes(risk.id)} onToggle={toggleRisk} />
          ))}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Add Risks to Cycle</p>
        {selectedIds.length > 0 && (
          <Badge className="bg-blue-600 text-white">{selectedIds.length} selected</Badge>
        )}
      </div>

      <Tabs defaultValue="workstream">
        <TabsList className="w-full grid grid-cols-4 text-xs">
          <TabsTrigger value="workstream">Workstream</TabsTrigger>
          <TabsTrigger value="capability">Capability</TabsTrigger>
          <TabsTrigger value="process">L4 Process</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="workstream" className="mt-3 space-y-3">
          <Select value={selectedWorkstream} onValueChange={setSelectedWorkstream}>
            <SelectTrigger><SelectValue placeholder="Filter by workstream…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">— All Workstreams —</SelectItem>
              {workstreams.map(ws => <SelectItem key={ws.id} value={ws.id}>{ws.full_label || ws.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <RiskList list={workstreamRisks} />
        </TabsContent>

        <TabsContent value="capability" className="mt-3 space-y-3">
          <Select value={selectedCapability} onValueChange={setSelectedCapability}>
            <SelectTrigger><SelectValue placeholder="Filter by IT capability…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">— All Capabilities —</SelectItem>
              {capabilities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <RiskList list={capabilityRisks} />
        </TabsContent>

        <TabsContent value="process" className="mt-3 space-y-3">
          <Select value={selectedProcess} onValueChange={setSelectedProcess}>
            <SelectTrigger><SelectValue placeholder="Filter by level-4 process…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">— All Level-4 Processes —</SelectItem>
              {processes.map(p => <SelectItem key={p.id} value={p.id}>{p.process_code ? `${p.process_code} – ${p.name}` : p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <RiskList list={processRisks} />
        </TabsContent>

        <TabsContent value="manual" className="mt-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search by title, reference, workstream…" value={manualSearch} onChange={e => setManualSearch(e.target.value)} className="pl-10" />
          </div>
          <RiskList list={manualRisks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
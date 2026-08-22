import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, CheckSquare } from "lucide-react";
import { useFrameworks } from "@/hooks/useFrameworks";

const PRIORITY_COLORS = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-green-500 text-white",
};

function ControlRow({ control, framework, selected, onToggle }) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
      onClick={() => onToggle(control.id)}
    >
      <Checkbox checked={selected} onCheckedChange={() => onToggle(control.id)} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-medium text-sm text-slate-900 truncate">{control.title}</span>
          {control.priority && (
            <Badge className={`${PRIORITY_COLORS[control.priority] || "bg-slate-200 text-slate-700"} text-xs px-1.5 py-0`}>
              {control.priority}
            </Badge>
          )}
          {control.control_id && <span className="font-mono text-xs text-slate-400">{control.control_id}</span>}
        </div>
        <div className="flex gap-3 text-xs text-slate-400 flex-wrap">
          {framework && <span>{framework.framework_code || framework.name}</span>}
          {control.control_type && <span>{control.control_type}</span>}
          {control.control_frequency && <span>{control.control_frequency}</span>}
          {control.category && <span>{control.category}</span>}
        </div>
      </div>
    </div>
  );
}

export default function ControlSelectionPanel({ companyId, selectedIds, onSelectionChange }) {
  const [manualSearch, setManualSearch] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("__all__");
  const [selectedType, setSelectedType] = useState("__all__");

  const { data: controls = [] } = useQuery({
    queryKey: ["controls-all"],
    queryFn: () => base44.entities.Control.list(),
  });

  const { frameworks } = useFrameworks();

  // Company controls: those whose framework belongs to this company, or no framework
  const companyFrameworkIds = frameworks
    .filter(f => f.company_id === companyId || !f.company_id)
    .map(f => f.id);

  const companyControls = controls.filter(c =>
    !c.is_library_control &&
    (companyFrameworkIds.includes(c.framework_id) || !c.framework_id)
  );

  const toggle = (id) => {
    const next = selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id];
    onSelectionChange(next);
  };

  const toggleAll = (list) => {
    const ids = list.map(c => c.id);
    const allSelected = ids.every(id => selectedIds.includes(id));
    if (allSelected) {
      onSelectionChange(selectedIds.filter(id => !ids.includes(id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...ids])]);
    }
  };

  const byFramework = useMemo(() => {
    if (selectedFramework === "__all__") return companyControls;
    return companyControls.filter(c => c.framework_id === selectedFramework);
  }, [companyControls, selectedFramework]);

  const byType = useMemo(() => {
    if (selectedType === "__all__") return companyControls;
    return companyControls.filter(c => c.control_type === selectedType);
  }, [companyControls, selectedType]);

  const bySearch = useMemo(() => {
    if (!manualSearch.trim()) return companyControls;
    const q = manualSearch.toLowerCase();
    return companyControls.filter(c =>
      c.title?.toLowerCase().includes(q) ||
      c.control_id?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  }, [companyControls, manualSearch]);

  const ControlList = ({ list }) => (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {list.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No controls found.</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">{list.length} control{list.length !== 1 ? "s" : ""} found</span>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleAll(list)}>
              <CheckSquare className="w-3 h-3 mr-1" />
              {list.every(c => selectedIds.includes(c.id)) ? "Deselect All" : "Select All"}
            </Button>
          </div>
          {list.map(control => (
            <ControlRow
              key={control.id}
              control={control}
              framework={frameworks.find(f => f.id === control.framework_id)}
              selected={selectedIds.includes(control.id)}
              onToggle={toggle}
            />
          ))}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Add Controls to Cycle</p>
        {selectedIds.length > 0 && (
          <Badge className="bg-blue-600 text-white">{selectedIds.length} selected</Badge>
        )}
      </div>

      <Tabs defaultValue="framework">
        <TabsList className="w-full grid grid-cols-3 text-xs">
          <TabsTrigger value="framework">Framework</TabsTrigger>
          <TabsTrigger value="type">Control Type</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="framework" className="mt-3 space-y-3">
          <Select value={selectedFramework} onValueChange={setSelectedFramework}>
            <SelectTrigger><SelectValue placeholder="Filter by framework…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">— All Frameworks —</SelectItem>
              {frameworks.map(f => <SelectItem key={f.id} value={f.id}>{f.framework_code || f.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <ControlList list={byFramework} />
        </TabsContent>

        <TabsContent value="type" className="mt-3 space-y-3">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger><SelectValue placeholder="Filter by control type…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">— All Types —</SelectItem>
              <SelectItem value="Preventive">Preventive</SelectItem>
              <SelectItem value="Detective">Detective</SelectItem>
              <SelectItem value="Corrective">Corrective</SelectItem>
            </SelectContent>
          </Select>
          <ControlList list={byType} />
        </TabsContent>

        <TabsContent value="manual" className="mt-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search by title, ID, category…" value={manualSearch} onChange={e => setManualSearch(e.target.value)} className="pl-10" />
          </div>
          <ControlList list={bySearch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
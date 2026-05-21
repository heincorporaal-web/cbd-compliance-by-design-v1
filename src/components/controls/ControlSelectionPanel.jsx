import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, CheckSquare } from "lucide-react";

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
          <span className="font-mono text-xs text-slate-400">{control.control_id}</span>
          <span className="font-medium text-sm text-slate-900 truncate">{control.title}</span>
          {control.priority && (
            <Badge className={`${PRIORITY_COLORS[control.priority] || "bg-slate-200 text-slate-700"} text-xs px-1.5 py-0`}>
              {control.priority}
            </Badge>
          )}
        </div>
        <div className="flex gap-3 text-xs text-slate-400 flex-wrap">
          {framework && <span>{framework.name}</span>}
          {control.category && <span>{control.category}</span>}
          {control.control_type && <span>{control.control_type}</span>}
          {control.control_frequency && <span>{control.control_frequency}</span>}
        </div>
      </div>
    </div>
  );
}

export default function ControlSelectionPanel({ companyId, selectedIds, onSelectionChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("__all__");
  const [selectedCategory, setSelectedCategory] = useState("__all__");

  const { data: controls = [] } = useQuery({
    queryKey: ["controls-all"],
    queryFn: () => base44.entities.Control.list(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ["frameworks"],
    queryFn: () => base44.entities.Framework.list(),
  });

  // Filter to company-relevant controls (framework belongs to company or global/library controls)
  const companyFrameworkIds = frameworks
    .filter(f => f.company_id === companyId || !f.company_id)
    .map(f => f.id);

  const companyControls = controls.filter(c => companyFrameworkIds.includes(c.framework_id));

  const categories = useMemo(() => {
    const cats = [...new Set(companyControls.map(c => c.category).filter(Boolean))];
    return cats.sort();
  }, [companyControls]);

  const toggleControl = (id) => {
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

  const filteredControls = useMemo(() => {
    let list = companyControls;
    if (selectedFramework !== "__all__") list = list.filter(c => c.framework_id === selectedFramework);
    if (selectedCategory !== "__all__") list = list.filter(c => c.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.control_id?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [companyControls, selectedFramework, selectedCategory, searchQuery]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Add Controls to Cycle</p>
        {selectedIds.length > 0 && (
          <Badge className="bg-blue-600 text-white">{selectedIds.length} selected</Badge>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={selectedFramework} onValueChange={setSelectedFramework}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by framework…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">— All Frameworks —</SelectItem>
            {frameworks.filter(f => companyFrameworkIds.includes(f.id)).map(f => (
              <SelectItem key={f.id} value={f.id}>{f.framework_code || f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">— All Categories —</SelectItem>
            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by title, ID, category…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {filteredControls.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No controls found.</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">{filteredControls.length} control{filteredControls.length !== 1 ? "s" : ""} found</span>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleAll(filteredControls)}>
                <CheckSquare className="w-3 h-3 mr-1" />
                {filteredControls.every(c => selectedIds.includes(c.id)) ? "Deselect All" : "Select All"}
              </Button>
            </div>
            {filteredControls.map(control => (
              <ControlRow
                key={control.id}
                control={control}
                framework={frameworks.find(f => f.id === control.framework_id)}
                selected={selectedIds.includes(control.id)}
                onToggle={toggleControl}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
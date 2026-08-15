import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { Plus, Search as SearchIcon, GitBranch } from "lucide-react";
import { toast } from "sonner";

const LEVELS = [1, 2, 3, 4, 5, 6];

/**
 * Top-of-diagram process picker. Lets the user either create a new child
 * process (core data + linkage to the parent) or search an existing process
 * already linked to the selected parent (i.e. children of the parent).
 *
 * Stores the chosen process id in canvas meta as `diagram_process_id` plus
 * denormalized `process_name` / `process_reference`.
 */
export default function DiagramProcessPicker({
  companyId,
  parentProcessId,
  value, // chosen diagram_process_id
  currentProcess, // { id, process_code, name, level } — diagram's current process
  processes, // full OrgProcess records for the company
  onChange,
}) {
  const [mode, setMode] = useState("search");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", process_code: "", level: "3" });

  const list = processes || [];
  const chosenRecord = value ? list.find((p) => p.id === value) : null;
  const display = chosenRecord || currentProcess;

  const childOptions = list
    .filter((p) => parentProcessId && p.parent_id === parentProcessId)
    .map((p) => ({ id: p.id, label: `${p.process_code || ""} ${p.name || ""}`.trim() }));

  const handleSelectExisting = (id) => {
    if (!id) {
      onChange("diagram_process_id", "");
      return;
    }
    onChange("diagram_process_id", id);
    const p = list.find((x) => x.id === id);
    if (p) {
      onChange("process_name", p.name);
      onChange("process_reference", p.process_code);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.process_code.trim() || !form.level) {
      toast.error("Name, process code and level are required");
      return;
    }
    if (!parentProcessId) {
      toast.error("Select a parent process first");
      return;
    }
    setCreating(true);
    try {
      const created = await base44.entities.OrgProcess.create({
        name: form.name.trim(),
        process_code: form.process_code.trim(),
        level: Number(form.level),
        parent_id: parentProcessId,
        company_id: companyId,
        status: "active",
      });
      onChange("diagram_process_id", created.id);
      onChange("process_name", created.name);
      onChange("process_reference", created.process_code);
      setForm({ name: "", process_code: "", level: "3" });
      toast.success("Process created and linked to this diagram");
    } catch (e) {
      toast.error("Could not create process: " + (e?.message || e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2.5 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
      <div className="flex items-center gap-2">
        <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
        <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">
          Process for this diagram
        </p>
      </div>

      {display && (
        <div className="flex items-center gap-2 rounded-md bg-white border border-slate-200 px-2.5 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 truncate">{display.name}</p>
            <p className="text-xs text-slate-500 font-mono truncate">{display.process_code}</p>
          </div>
          {display.level != null && (
            <Badge variant="outline" className="text-[10px]">L{display.level}</Badge>
          )}
        </div>
      )}

      <div className="flex gap-1 bg-white border border-slate-200 rounded-md p-0.5">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded ${
            mode === "search" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <SearchIcon className="w-3.5 h-3.5" /> Search existing
        </button>
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded ${
            mode === "create" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> Create new
        </button>
      </div>

      {mode === "search" ? (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">
            Link to an existing process
          </Label>
          {!parentProcessId ? (
            <p className="text-xs text-slate-500 italic">
              Select a parent process in “Parent Process Reference” below to list its child
              processes.
            </p>
          ) : (
            <SearchableSelect
              value={value || ""}
              onValueChange={handleSelectExisting}
              options={childOptions}
              placeholder={
                childOptions.length ? "Search child processes…" : "No child processes for this parent"
              }
              noneLabel="— Clear"
            />
          )}
          {parentProcessId && childOptions.length === 0 && (
            <p className="text-[11px] text-slate-400 italic">
              No existing child processes linked to the selected parent. Use “Create new” to add one.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-xs text-slate-600">
            Create a new child process of the selected parent and link it to this diagram.
          </p>
          {!parentProcessId && (
            <p className="text-xs text-amber-600 italic">
              Select a parent process in “Parent Process Reference” below first.
            </p>
          )}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-600">Process name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Reconcile Custody Positions"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600">Process code *</Label>
              <Input
                value={form.process_code}
                onChange={(e) => setForm({ ...form, process_code: e.target.value })}
                placeholder="e.g. EVITMTO-90.040.070"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600">Level *</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleCreate}
            disabled={creating || !parentProcessId}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {creating ? "Creating…" : "Create & link process"}
          </Button>
        </div>
      )}
    </div>
  );
}
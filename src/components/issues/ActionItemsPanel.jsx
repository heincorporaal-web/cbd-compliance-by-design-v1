import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { buildActionItemRefNumber } from "@/lib/autoNumbering";

const STATUS_OPTIONS = ["open", "in_progress", "completed", "cancelled"];
const STATUS_COLORS = {
  open:        "bg-red-100 text-red-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed:   "bg-green-100 text-green-700",
  cancelled:   "bg-slate-100 text-slate-500",
};

function newItem() {
  return {
    id: crypto.randomUUID(),
    reference_number: "",
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
    status: "open",
  };
}

export function applyActionItemNumbers(items, issueRef) {
  return items.map((item, idx) => ({
    ...item,
    reference_number: issueRef
      ? buildActionItemRefNumber(issueRef, idx + 1)
      : item.reference_number,
  }));
}

export default function ActionItemsPanel({ actionItems = [], onChange, issueRef = "" }) {
  const [expanded, setExpanded] = useState(null);

  const add = () => {
    const item    = newItem();
    const updated = [...actionItems, item];
    onChange(applyActionItemNumbers(updated, issueRef));
    setExpanded(item.id);
  };

  const remove = (id) => {
    const updated = actionItems.filter(i => i.id !== id);
    onChange(applyActionItemNumbers(updated, issueRef));
    if (expanded === id) setExpanded(null);
  };

  const update = (id, field, value) => {
    onChange(actionItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-700">
          Action Items
          <span className="ml-1.5 font-normal text-slate-400">({actionItems.length})</span>
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={add} className="h-7 text-xs gap-1">
          <Plus className="w-3 h-3" /> Add
        </Button>
      </div>

      {actionItems.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-lg">
          No action items. Click Add to create one.
        </p>
      )}

      <div className="space-y-1.5">
        {actionItems.map((item, idx) => {
          const refNum = issueRef
            ? buildActionItemRefNumber(issueRef, idx + 1)
            : (item.reference_number || `AI${String(idx + 1).padStart(2, "0")}`);
          const isOpen = expanded === item.id;
          return (
            <div key={item.id} className="border border-slate-200 rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 cursor-pointer hover:bg-slate-100 select-none"
                onClick={() => setExpanded(isOpen ? null : item.id)}
              >
                {isOpen
                  ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                }
                <span className="font-mono text-xs text-primary shrink-0">{refNum}</span>
                <span className="text-sm text-slate-700 flex-1 truncate">
                  {item.title || <span className="text-slate-400 italic">Untitled</span>}
                </span>
                <Badge className={`text-xs shrink-0 border-0 ${STATUS_COLORS[item.status]}`}>
                  {item.status.replace("_", " ")}
                </Badge>
                {item.due_date && (
                  <span className="text-xs text-slate-400 shrink-0 hidden md:block">{item.due_date}</span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-600 shrink-0 ml-1"
                  onClick={e => { e.stopPropagation(); remove(item.id); }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {isOpen && (
                <div className="p-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Title *</Label>
                    <Input
                      className="h-8 text-sm"
                      value={item.title}
                      onChange={e => update(item.id, "title", e.target.value)}
                      placeholder="What needs to be done?"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Assigned To</Label>
                    <Input
                      className="h-8 text-sm"
                      value={item.assigned_to}
                      onChange={e => update(item.id, "assigned_to", e.target.value)}
                      placeholder="Name or email"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Due Date</Label>
                    <Input
                      type="date"
                      className="h-8 text-sm"
                      value={item.due_date}
                      onChange={e => update(item.id, "due_date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={item.status} onValueChange={v => update(item.id, "status", v)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Description</Label>
                    <Input
                      className="h-8 text-sm"
                      value={item.description}
                      onChange={e => update(item.id, "description", e.target.value)}
                      placeholder="Optional detail"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * Shown at save time when one or more BPMN elements are not linked to existing
 * company process data. The user can add them to the company business process
 * data, or go back to link them to an existing process first.
 */
export default function UnlinkedElementsDialog({ elements, adding, onAddAll, onGoBack }) {
  return (
    <Dialog open={!!elements} onOpenChange={(o) => { if (!o && !adding) onGoBack(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            Unlinked process elements
          </DialogTitle>
          <DialogDescription>
            These elements are not linked to existing company process data. Add them to
            the company business process data, or go back to link them to an existing
            process first.
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-52 overflow-y-auto space-y-1.5 my-2 pr-1">
          {(elements || []).map((el) => (
            <li
              key={el.id}
              className="flex items-center gap-2 text-sm text-slate-700 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="truncate">{el.name}</span>
              <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-400">
                {el.category}
              </span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button variant="ghost" onClick={onGoBack} disabled={adding}>
            Go back to link
          </Button>
          <Button onClick={onAddAll} disabled={adding} className="bg-indigo-600 hover:bg-indigo-700">
            {adding ? "Adding…" : "Add to company process data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
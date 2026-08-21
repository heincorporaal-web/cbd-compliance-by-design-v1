import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock, FileEdit, User, Calendar, PenLine } from "lucide-react";

// Simple 3-step approval tracker: Draft → Under Review → Approved
const STEPS = [
  { key: "draft", label: "Draft", icon: FileEdit, color: "text-slate-600", bg: "bg-slate-100", ring: "ring-slate-300" },
  { key: "under_review", label: "Under Review", icon: Clock, color: "text-blue-600", bg: "bg-blue-100", ring: "ring-blue-300" },
  { key: "approved", label: "Approved", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100", ring: "ring-emerald-300" },
];

// Map full lifecycle statuses to the simplified tracker position
function trackerPosition(status) {
  if (["approved", "published"].includes(status)) return 2;
  if (["under_review", "internal_review", "awaiting_approval"].includes(status)) return 1;
  return 0; // draft and everything else
}

export default function ApprovalTracker({ doc, user, onStatusChange }) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [pendingStatus, setPendingStatus] = useState(null);

  const currentPos = trackerPosition(doc.status);
  const signedOff = !!doc.signed_off_by;

  const handleAdvance = (newStatus) => {
    // If advancing to approved, prompt for sign-off confirmation
    if (trackerPosition(newStatus) === 2 && !signedOff) {
      setPendingStatus(newStatus);
      setShowNotes(true);
      return;
    }
    onStatusChange(newStatus, { notes: notes || undefined });
    setNotes("");
    setShowNotes(false);
    setPendingStatus(null);
  };

  const confirmSignOff = () => {
    onStatusChange(pendingStatus || "approved", {
      notes: notes || undefined,
      signOff: true,
    });
    setNotes("");
    setShowNotes(false);
    setPendingStatus(null);
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
      <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <PenLine className="w-4 h-4 text-[#800020]" /> Approval Status Tracker
      </h4>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-4">
        {STEPS.map((step, i) => {
          const isComplete = i < currentPos;
          const isCurrent = i === currentPos;
          const Icon = step.icon;
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    isComplete
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isCurrent
                      ? `${step.bg} border-transparent ${step.color} ring-2 ${step.ring}`
                      : "bg-white border-slate-200 text-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-medium ${isCurrent ? step.color : isComplete ? "text-emerald-600" : "text-slate-400"}`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 -mt-5 rounded ${i < currentPos ? "bg-emerald-400" : "bg-slate-200"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Sign-off info */}
      {signedOff && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-800">
              Signed off by {doc.signed_off_by}
            </p>
            {doc.signed_off_date && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(parseISO(doc.signed_off_date), "d MMM yyyy 'at' HH:mm")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {currentPos < 2 && !showNotes && (
        <div className="flex gap-2">
          {currentPos === 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAdvance("under_review")}
              className="gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" /> Send for Review
            </Button>
          )}
          {currentPos === 1 && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAdvance("draft")}
                className="gap-1.5"
              >
                <FileEdit className="w-3.5 h-3.5" /> Back to Draft
              </Button>
              <Button
                size="sm"
                onClick={() => handleAdvance("approved")}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Sign Off
              </Button>
            </>
          )}
        </div>
      )}

      {/* Sign-off confirmation */}
      {showNotes && (
        <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-lg">
          <p className="text-sm font-medium text-slate-700">
            You are about to approve and sign off this document as{" "}
            <span className="font-semibold text-[#800020]">{user?.full_name || user?.email || "current user"}</span>.
          </p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional: add sign-off notes…"
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => { setShowNotes(false); setNotes(""); setPendingStatus(null); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirmSignOff} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Sign-off
            </Button>
          </div>
        </div>
      )}

      {/* Approval history */}
      {doc.approval_history && doc.approval_history.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Approval History</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {doc.approval_history
              .slice()
              .reverse()
              .map((entry, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 capitalize">
                    {entry.status?.replace(/_/g, " ") || "—"}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-600 font-medium">{entry.actor || "—"}</span>
                    {entry.timestamp && (
                      <span className="text-slate-400 ml-1.5">
                        · {format(parseISO(entry.timestamp), "d MMM yyyy 'at' HH:mm")}
                      </span>
                    )}
                    {entry.notes && (
                      <p className="text-slate-400 italic mt-0.5">{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
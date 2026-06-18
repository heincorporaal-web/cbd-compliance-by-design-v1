import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarDays, CalendarCheck, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

/**
 * CalendarPromptDialog
 *
 * Shown after saving a Principal Risk with a next_review_date set.
 * Asks the user to add a review event to the company calendar.
 * If they decline, requires a reason.
 *
 * Props:
 *  open         – boolean
 *  onClose      – () => void
 *  risk         – the saved PrincipalRisk object (needs risk_title, next_review_date, company_id)
 */
export default function CalendarPromptDialog({ open, onClose, risk }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState("prompt"); // "prompt" | "decline_reason"
  const [declineReason, setDeclineReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setStep("prompt");
    setDeclineReason("");
    onClose();
  };

  const handleAdd = async () => {
    setSaving(true);
    const reviewDate = new Date(risk.next_review_date);
    // Set to 09:00 on review day
    reviewDate.setHours(9, 0, 0, 0);
    const endDate = new Date(reviewDate.getTime() + 60 * 60 * 1000); // +1 hour

    await base44.entities.CompanyCalendarEvent.create({
      company_id: risk.company_id,
      title: `Principal Risk Review — ${risk.risk_title}`,
      description: `Scheduled review for principal risk: ${risk.risk_reference ? `[${risk.risk_reference}] ` : ""}${risk.risk_title}.`,
      event_type: "review",
      start_date: reviewDate.toISOString(),
      end_date: endDate.toISOString(),
      all_day: false,
      status: "upcoming",
      recurrence: "none",
    });

    queryClient.invalidateQueries(["company-calendar", risk.company_id]);
    toast.success("Review event added to company calendar");
    setSaving(false);
    handleClose();
  };

  const handleDeclineSubmit = () => {
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for not adding to calendar");
      return;
    }
    toast.info(`Calendar event skipped — Reason: ${declineReason.trim()}`);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        {step === "prompt" ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                </div>
                <DialogTitle className="text-base">Add to Company Calendar?</DialogTitle>
              </div>
              <DialogDescription className="text-sm text-slate-600 mt-1">
                The Next Review Date is set to{" "}
                <span className="font-semibold text-slate-800">
                  {risk?.next_review_date ? new Date(risk.next_review_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                </span>.
                Would you like to add a review event to the company calendar?
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800 mt-2">
              <p className="font-medium mb-0.5">Event to be created:</p>
              <p className="text-blue-700 text-xs">📌 Principal Risk Review — {risk?.risk_title}</p>
              <p className="text-blue-600 text-xs mt-0.5">Type: Review · Time: 09:00–10:00</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                onClick={handleAdd}
                disabled={saving}
              >
                <CalendarCheck className="w-4 h-4" />
                {saving ? "Adding…" : "Yes, add to calendar"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => setStep("decline_reason")}
                disabled={saving}
              >
                <X className="w-4 h-4" />
                No thanks
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5 text-amber-600" />
                </div>
                <DialogTitle className="text-base">Reason for Declining</DialogTitle>
              </div>
              <DialogDescription className="text-sm text-slate-600">
                Please provide a reason for not adding this review to the company calendar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 mt-1">
              <Label htmlFor="decline-reason">Reason <span className="text-red-500">*</span></Label>
              <Textarea
                id="decline-reason"
                rows={3}
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                placeholder="e.g. Review already tracked in a separate system, date is provisional…"
                className="resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("prompt")}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                onClick={handleDeclineSubmit}
                disabled={!declineReason.trim()}
              >
                Confirm &amp; Continue
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
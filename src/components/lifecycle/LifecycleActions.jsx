import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, RotateCcw, CheckCheck } from "lucide-react";

export default function LifecycleActions({ 
  entity, 
  onSubmitForReview, 
  onReturn, 
  onApprove 
}) {
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [returnComments, setReturnComments] = useState("");

  const canSubmitForReview = 
    entity?.status === "draft" || 
    entity?.status === "identified" || 
    entity?.status === "returned";
  
  const canReturn = entity?.status === "pending_review";
  const canApprove = entity?.status === "pending_review";

  const handleReturn = () => {
    onReturn(returnComments);
    setIsReturnDialogOpen(false);
    setReturnComments("");
  };

  return (
    <div className="flex gap-2">
      {canSubmitForReview && onSubmitForReview && (
        <Button onClick={onSubmitForReview} variant="outline">
          <Send className="w-4 h-4 mr-2" />
          Submit for Review
        </Button>
      )}
      {canReturn && onReturn && (
        <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Return
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Return for Revision</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Comments</Label>
                <Textarea
                  value={returnComments}
                  onChange={(e) => setReturnComments(e.target.value)}
                  placeholder="Explain why this is being returned..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleReturn} disabled={!returnComments}>
                  Return
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {canApprove && onApprove && (
        <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700">
          <CheckCheck className="w-4 h-4 mr-2" />
          Approve
        </Button>
      )}
    </div>
  );
}
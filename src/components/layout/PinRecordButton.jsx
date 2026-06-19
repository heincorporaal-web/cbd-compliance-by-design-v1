import React from "react";
import { Pin } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Drop-in button for any record detail page.
 * 
 * Usage:
 *   <PinRecordButton
 *     id={risk.id}
 *     label={risk.risk_title}
 *     entityType="Risk"
 *     url={`/RiskDetail?id=${risk.id}`}
 *   />
 */
export default function PinRecordButton({ variant = "ghost", size = "sm", className = "" }) {
  return (
    <Button
      variant={variant}
      size={size}
      disabled
      title="Pinning coming soon"
      className={`gap-1.5 text-slate-300 cursor-not-allowed opacity-50 ${className}`}
    >
      <Pin className="w-3.5 h-3.5" />
      <span className="text-xs">Pin</span>
    </Button>
  );
}
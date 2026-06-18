import React from "react";
import { Pin, PinOff } from "lucide-react";
import { useQuickActions } from "@/hooks/useQuickActions";
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
export default function PinRecordButton({ id, label, entityType, url, variant = "ghost", size = "sm", className = "" }) {
  const { isPinned, pinRecord, unpinRecord } = useQuickActions();
  const pinned = isPinned(id, entityType);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (pinned) {
      unpinRecord(id, entityType);
    } else {
      pinRecord({ id, label, entityType, url });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      title={pinned ? "Remove from Quick Actions" : "Pin to Quick Actions"}
      className={`gap-1.5 ${pinned ? "text-primary" : "text-slate-400 hover:text-primary"} ${className}`}
    >
      {pinned
        ? <PinOff className="w-3.5 h-3.5" />
        : <Pin className="w-3.5 h-3.5" />
      }
      <span className="text-xs">{pinned ? "Unpin" : "Pin"}</span>
    </Button>
  );
}
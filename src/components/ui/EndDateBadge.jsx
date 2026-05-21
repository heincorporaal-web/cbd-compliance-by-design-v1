import { Badge } from "@/components/ui/badge";
import { CalendarX, CalendarClock } from "lucide-react";

/**
 * Displays an "Expired" or "Expires soon" badge based on end_date.
 * Renders nothing if no end_date or if far in the future.
 */
export default function EndDateBadge({ endDate, className = "" }) {
  if (!endDate) return null;

  const now = new Date();
  const end = new Date(endDate);
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return (
      <Badge variant="outline" className={`bg-red-50 text-red-700 border-red-200 gap-1 ${className}`}>
        <CalendarX className="w-3 h-3" />
        Expired {Math.abs(daysLeft)}d ago
      </Badge>
    );
  }
  if (daysLeft <= 30) {
    return (
      <Badge variant="outline" className={`bg-orange-50 text-orange-700 border-orange-200 gap-1 ${className}`}>
        <CalendarClock className="w-3 h-3" />
        Expires in {daysLeft}d
      </Badge>
    );
  }
  return null;
}

export function isExpired(endDate) {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}
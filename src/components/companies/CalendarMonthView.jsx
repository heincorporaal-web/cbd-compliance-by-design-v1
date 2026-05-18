import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const EVENT_TYPE_COLORS = {
  review: "bg-blue-500",
  assessment: "bg-purple-500",
  audit: "bg-orange-500",
  monitoring: "bg-teal-500",
  board_meeting: "bg-slate-500",
  regulatory: "bg-red-500",
  training: "bg-green-500",
  other: "bg-gray-400",
};

export default function CalendarMonthView({ events, selectedIds, onToggleSelect, onEditEvent }) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Build grid of weeks
  const weeks = [];
  let day = calStart;
  while (day <= calEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const getEventsForDay = (d) =>
    events.filter(ev => ev.start_date && isSameDay(new Date(ev.start_date), d));

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Button type="button" variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold text-slate-800 text-base">{format(currentMonth, "MMMM yyyy")}</span>
        <Button type="button" variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {weeks.map((week, wi) => (
          <div key={wi} className={`grid grid-cols-7 ${wi < weeks.length - 1 ? "border-b border-slate-100" : ""}`}>
            {week.map((d, di) => {
              const dayEvents = getEventsForDay(d);
              const isCurrentMonth = isSameMonth(d, currentMonth);
              const isToday = isSameDay(d, new Date());

              return (
                <div
                  key={di}
                  className={`min-h-[72px] p-1 ${di < 6 ? "border-r border-slate-100" : ""} ${isCurrentMonth ? "bg-white" : "bg-slate-50"}`}
                >
                  <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 
                    ${isToday ? "bg-blue-600 text-white" : isCurrentMonth ? "text-slate-700" : "text-slate-300"}`}>
                    {format(d, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => {
                      const isSelected = selectedIds.has(ev.id);
                      const dotColor = EVENT_TYPE_COLORS[ev.event_type] || "bg-gray-400";
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => onToggleSelect(ev.id)}
                          onDoubleClick={() => onEditEvent(ev)}
                          title={`${ev.title} — click to select, double-click to edit`}
                          className={`w-full text-left text-xs px-1 py-0.5 rounded flex items-center gap-1 truncate transition-all
                            ${isSelected
                              ? "bg-blue-100 text-blue-800 ring-1 ring-blue-400"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                          <span className="truncate">{ev.title}</span>
                        </button>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-400 pl-1">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1 text-xs text-slate-500">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="capitalize">{type.replace("_", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
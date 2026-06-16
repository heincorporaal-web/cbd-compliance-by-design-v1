import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function StakeholderMatrixPanel({ stakeholders, groups }) {
  const activeGroups = groups.filter(g => g.status !== "inactive");
  const activeStakeholders = stakeholders.filter(s => s.status !== "inactive");

  if (!activeGroups.length || !activeStakeholders.length) {
    return (
      <div className="text-center py-16 text-slate-500 bg-white rounded-xl border border-slate-200">
        <p className="font-medium">No data to display</p>
        <p className="text-sm mt-1">Add stakeholders and groups first.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-auto">
      <table className="text-sm border-collapse" style={{ width: "max-content", minWidth: "100%" }}>
        <thead>
          <tr>
            {/* Spacer for stakeholder column */}
            <th className="sticky left-0 bg-white z-20 border-b border-r border-slate-200 p-0" style={{ minWidth: 220 }} />
            {activeGroups.map(g => (
              <th key={g.id} className="border-b border-l border-slate-100 p-0 align-bottom" style={{ width: 52 }}>
                <div className="flex justify-center pb-2 pt-1" style={{ height: 140 }}>
                  <div
                    className="text-xs font-semibold text-slate-700 whitespace-nowrap"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      lineHeight: 1.2,
                      maxHeight: 132,
                      overflow: "hidden",
                    }}
                    title={g.name}
                  >
                    {g.name}
                  </div>
                </div>
                {g.color && (
                  <div className="w-full h-1 rounded-t" style={{ backgroundColor: g.color }} />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activeStakeholders.map((s, idx) => {
            const memberCount = activeGroups.filter(g => s.group_ids?.includes(g.id)).length;
            return (
              <tr key={s.id} className={idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/60 hover:bg-slate-100/60"}>
                <td className={`px-3 py-2.5 border-r border-slate-200 sticky left-0 z-10 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                      style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)" }}
                    >
                      {s.full_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 leading-tight truncate" style={{ maxWidth: 160 }}>{s.full_name}</p>
                      {s.job_title && <p className="text-xs text-slate-400 truncate" style={{ maxWidth: 160 }}>{s.job_title}</p>}
                    </div>
                    {memberCount > 0 && (
                      <span className="ml-auto shrink-0 text-xs font-medium bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 leading-none">
                        {memberCount}
                      </span>
                    )}
                  </div>
                </td>
                {activeGroups.map(g => {
                  const isMember = s.group_ids?.includes(g.id);
                  return (
                    <td key={g.id} className="text-center border-l border-slate-100 p-0" style={{ width: 52 }}>
                      {isMember ? (
                        <div className="flex items-center justify-center h-full py-2.5">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: g.color ? `${g.color}22` : "#E0F2FE" }}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: g.color || "#3B82F6" }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full py-2.5">
                          <div className="w-3 h-3 rounded-full border border-slate-200 bg-transparent" />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Member</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border border-slate-300" />
          <span>Not assigned</span>
        </div>
        <span className="ml-auto">{activeStakeholders.length} stakeholders · {activeGroups.length} groups</span>
      </div>
    </div>
  );
}
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
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 font-semibold text-slate-700 min-w-48 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
              Stakeholder
            </th>
            {activeGroups.map(g => (
              <th key={g.id} className="px-4 py-3 font-semibold text-slate-700 text-center min-w-36 border-l border-slate-100">
                <div className="text-xs leading-tight">{g.name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activeStakeholders.map((s, idx) => (
            <tr key={s.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
              <td className={`px-4 py-3 border-r border-slate-200 sticky left-0 z-10 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {s.full_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{s.full_name}</p>
                    {s.job_title && <p className="text-xs text-slate-500 truncate">{s.job_title}</p>}
                  </div>
                </div>
              </td>
              {activeGroups.map(g => {
                const isMember = s.group_ids?.includes(g.id);
                return (
                  <td key={g.id} className="px-4 py-3 text-center border-l border-slate-100">
                    {isMember ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <span className="w-5 h-5 block mx-auto rounded-full border-2 border-slate-200" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
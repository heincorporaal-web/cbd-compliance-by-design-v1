import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Gauge, ShieldCheck, Percent, AlertOctagon } from "lucide-react";

function GaugeDial({ value, label, color, icon: Icon, sublabel }) {
  const data = [
    { name: "value", value: value },
    { name: "rest", value: 100 - value },
  ];
  const COLORS = [color, "#e2e8f0"];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full" style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius="70%"
              outerRadius="100%"
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: 8 }}>
          <Icon className="w-4 h-4 mb-0.5" style={{ color }} />
          <span className="text-2xl font-bold text-slate-800">{value}%</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-700 mt-1">{label}</p>
      {sublabel && <p className="text-[11px] text-slate-400">{sublabel}</p>}
    </div>
  );
}

export default function IncidentGauges({ incidents }) {
  const total = incidents.length;
  const slaBreached = incidents.filter(i => i.sla_breached).length;
  const resolved = incidents.filter(i => ["resolved", "closed"].includes(i.status)).length;
  const open = total - resolved;
  const securityIncidents = incidents.filter(i => i.security_incident).length;

  const slaCompliance = total > 0 ? Math.round(((total - slaBreached) / total) * 100) : 100;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const openRatio = total > 0 ? Math.round((open / total) * 100) : 0;
  const securityPct = total > 0 ? Math.round((securityIncidents / total) * 100) : 0;

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-slate-500" /> Key Performance Dials
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GaugeDial value={slaCompliance} label="SLA Compliance" color="#10b981" icon={ShieldCheck} sublabel={`${total - slaBreached} of ${total} on track`} />
          <GaugeDial value={resolutionRate} label="Resolution Rate" color="#3b82f6" icon={Percent} sublabel={`${resolved} resolved`} />
          <GaugeDial value={openRatio} label="Open Ratio" color="#f59e0b" icon={AlertOctagon} sublabel={`${open} still active`} />
          <GaugeDial value={securityPct} label="Security Incidents" color="#ef4444" icon={ShieldCheck} sublabel={`${securityIncidents} flagged`} />
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { UserX, ArrowRight, ShieldAlert } from "lucide-react";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { createPageUrl } from "@/utils";

// Each record type: how to detect "unassigned", how to filter out inactive/library
// records, and where to link the record so users can open it from the dashboard.
const TYPES = [
  {
    key: "risk",
    label: "Risks",
    color: "#ef4444",
    listKey: ["risks"],
    listFn: () => base44.entities.Risk.list(),
    companyField: "company_id",
    isUnassigned: (r) => !r.owner_stakeholder_id && !r.owner,
    exclude: (r) => r.is_library_risk,
    name: (r) => r.title,
    ref: (r) => r.risk_reference_nr,
    route: (r) => `/RiskDetail?id=${r.id}`,
    listRoute: "RiskRegister",
  },
  {
    key: "control",
    label: "Controls",
    color: "#f59e0b",
    listKey: ["controlsDashboard"],
    listFn: () => base44.entities.Control.list(),
    companyField: null,
    isUnassigned: (c) => !c.owner_stakeholder_id && !c.control_owner,
    exclude: (c) => c.status === "archived" || c.is_library_control,
    name: (c) => c.title,
    ref: (c) => c.control_id,
    route: (c) => `/ControlDetail?id=${c.id}`,
    listRoute: "Controls",
  },
  {
    key: "process",
    label: "Processes",
    color: "#8b5cf6",
    listKey: ["businessProcesses"],
    listFn: () => base44.entities.BusinessProcess.list(),
    companyField: "company_id",
    isUnassigned: (p) => !p.process_owner,
    exclude: (p) => p.status === "archived",
    name: (p) => p.name,
    ref: (p) => p.process_code,
    route: (p) => `/ProcessDetail?id=${p.id}`,
    listRoute: "ProcessManagement",
  },
  {
    key: "issue",
    label: "Issues",
    color: "#f97316",
    listKey: ["issues"],
    listFn: () => base44.entities.Issue.list("-created_date"),
    companyField: "company_id",
    isUnassigned: (i) => !i.assigned_to,
    exclude: (i) => i.status === "resolved" || i.status === "closed",
    name: (i) => i.title,
    ref: (i) => i.reference_number,
    route: (i) => `/Issues`,
    listRoute: "Issues",
  },
  {
    key: "assessment",
    label: "Assessments",
    color: "#3b82f6",
    listKey: ["assessments"],
    listFn: () => base44.entities.Assessment.list("-created_date"),
    companyField: "company_id",
    isUnassigned: (a) => !a.assessor,
    exclude: (a) => a.status === "archived" || a.status === "completed",
    name: (a) => a.name,
    ref: () => null,
    route: (a) => `/AssessmentDetail?id=${a.id}`,
    listRoute: "Assessments",
  },
  {
    key: "ict",
    label: "ICT Systems",
    color: "#06b6d4",
    listKey: ["ictSystems"],
    listFn: () => base44.entities.ICTSystem.list(),
    companyField: "company_id",
    isUnassigned: (s) => !s.owner_stakeholder_id,
    exclude: (s) => s.status === "decommissioned",
    name: (s) => s.name,
    ref: () => null,
    route: (s) => `/ICTSystemDetail?id=${s.id}`,
    listRoute: "ICTSystems",
  },
  {
    key: "vendor",
    label: "Vendors (TPRM)",
    color: "#10b981",
    listKey: ["thirdParties"],
    listFn: () => base44.entities.ThirdPartyProvider.list(),
    companyField: "company_id",
    isUnassigned: (v) =>
      !v.relationship_owner_id &&
      !v.procurement_owner_id &&
      !v.service_owner_id &&
      !v.risk_owner_id &&
      !v.approver_id,
    exclude: (v) => !v.tprm_enabled || v.status === "terminated",
    name: (v) => v.name,
    ref: (v) => v.third_party_reference,
    route: (v) => `/ThirdPartyDetail?id=${v.id}`,
    listRoute: "AdvancedThirdPartyRiskManagement",
  },
];

export default function UnassignedRecordsChart() {
  const [gc] = useCompanyFilter();
  const [openType, setOpenType] = useState(null);

  // Fetch every record type at the top level (react-query dedupes with the
  // dashboard's identical keys). Hooks cannot be called inside .map().
  const riskQ = useQuery({ queryKey: ["risks"], queryFn: () => base44.entities.Risk.list() });
  const controlQ = useQuery({ queryKey: ["controlsDashboard"], queryFn: () => base44.entities.Control.list() });
  const processQ = useQuery({ queryKey: ["businessProcesses"], queryFn: () => base44.entities.BusinessProcess.list() });
  const issueQ = useQuery({ queryKey: ["issues"], queryFn: () => base44.entities.Issue.list("-created_date") });
  const assessmentQ = useQuery({ queryKey: ["assessments"], queryFn: () => base44.entities.Assessment.list("-created_date") });
  const ictQ = useQuery({ queryKey: ["ictSystems"], queryFn: () => base44.entities.ICTSystem.list() });
  const vendorQ = useQuery({ queryKey: ["thirdParties"], queryFn: () => base44.entities.ThirdPartyProvider.list() });
  const queryData = [riskQ.data, controlQ.data, processQ.data, issueQ.data, assessmentQ.data, ictQ.data, vendorQ.data];

  const data = useMemo(() => {
    return TYPES.map((t, idx) => {
      const records = queryData[idx] || [];
      const unassigned = records.filter((r) => {
        if (t.exclude(r)) return false;
        if (t.companyField && gc !== "all" && r[t.companyField] !== gc) return false;
        return t.isUnassigned(r);
      });
      return { ...t, count: unassigned.length, records: unassigned };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryData.map((d) => (d || []).length).join("|"), gc]);

  const totalUnassigned = data.reduce((s, d) => s + d.count, 0);
  const activeType = data.find((d) => d.key === openType);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <UserX className="w-5 h-5 text-amber-600" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Unassigned Records
          </h2>
          <Badge className="bg-amber-100 text-amber-700">{totalUnassigned} total</Badge>
        </div>
        <p className="text-xs text-slate-500">Click a bar to open the affected records</p>
      </div>

      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          {totalUnassigned === 0 ? (
            <div className="py-10 text-center">
              <ShieldAlert className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-slate-600 font-medium">All records have an owner assigned</p>
              <p className="text-slate-400 text-sm">No unassigned records across risks, controls, processes, issues, assessments, ICT systems or TPRM vendors.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12, fill: "#334155" }} />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(value, _name, props) => [`${value} unassigned`, props.payload.label]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} cursor="pointer" onClick={(d) => setOpenType(d.key)}>
                  {data.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!activeType} onOpenChange={(o) => !o && setOpenType(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: activeType?.color }} />
              Unassigned {activeType?.label} ({activeType?.count})
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto -mx-6 px-6 pb-2">
            {activeType && activeType.records.length === 0 ? (
              <p className="text-slate-500 py-6 text-center">No unassigned records.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeType?.records.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {activeType.ref(r) && (
                          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                            {activeType.ref(r)}
                          </span>
                        )}
                        <span className="font-medium text-slate-900 text-sm truncate">
                          {activeType.name(r)}
                        </span>
                      </div>
                      {r.status && (
                        <span className="text-xs text-slate-400 capitalize">{r.status.replace(/_/g, " ")}</span>
                      )}
                    </div>
                    <Link to={activeType.route(r)}>
                      <Button variant="outline" size="sm">
                        Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
          {activeType && activeType.records.length > 0 && (
            <div className="pt-3 border-t mt-1">
              <Link to={createPageUrl(activeType.listRoute)}>
                <Button variant="ghost" size="sm">
                  View all {activeType.label.toLowerCase()} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import ProcessMatrix from "@/components/reports/ProcessMatrix";
import { Card, CardContent } from "@/components/ui/card";

export default function Matrices() {
  const [globalCompany, , { locked, assignedCompanyId }] = useCompanyFilter();
  const companyId = locked
    ? assignedCompanyId
    : globalCompany && globalCompany !== "all"
      ? globalCompany
      : null;

  const { data: processes = [], isLoading } = useQuery({
    queryKey: ["orgProcesses", "matrix"],
    queryFn: () => base44.entities.OrgProcess.list("process_code"),
  });
  const { data: assessments = [] } = useQuery({
    queryKey: ["processAssessments", "matrix"],
    queryFn: () => base44.entities.ProcessAssessment.list("-assessment_date"),
  });

  const companyProcesses = companyId
    ? processes.filter(p => p.company_id === companyId)
    : processes;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Process Matrix</h1>
        <p className="text-slate-600 mt-1">
          Periodic-table view of company processes with maturity &amp; risk scores fed from assessments.
        </p>
      </div>

      {!companyId && (
        <Card className="border-dashed border-slate-300">
          <CardContent className="p-6 text-sm text-slate-500">
            Select a specific company (not "All Companies") in the top bar to view its process matrix.
          </CardContent>
        </Card>
      )}

      {isLoading && <div className="text-slate-500">Loading processes…</div>}

      {companyId && (
        <ProcessMatrix processes={companyProcesses} assessments={assessments} />
      )}
    </div>
  );
}
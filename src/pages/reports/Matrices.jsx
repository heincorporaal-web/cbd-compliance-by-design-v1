import React from "react";
import ReportCategoryPage from "@/components/reports/ReportCategoryPage";
import { Card, CardContent } from "@/components/ui/card";
import { Layers } from "lucide-react";

export default function Matrices() {
  return (
    <ReportCategoryPage
      title="Matrices"
      description="Build matrix-style reports — combine entities, stakeholders and controls into cross-tab views."
    >
      <Card className="border-dashed border-slate-300">
        <CardContent className="p-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
            <Layers className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Matrix report builder</h3>
          <p className="text-sm text-slate-500 max-w-md">
            This is a placeholder for the upcoming matrix report builder. You will be able to define
            rows, columns and aggregation to generate cross-tabular reports such as RACI,
            control-to-risk coverage and stakeholder-to-process.
          </p>
        </CardContent>
      </Card>
    </ReportCategoryPage>
  );
}
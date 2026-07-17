import React from "react";
import ReportCategoryPage from "@/components/reports/ReportCategoryPage";
import { PERFORMANCE_REPORTS } from "@/lib/reportsCatalog";

export default function PerformanceManagement() {
  return (
    <ReportCategoryPage
      title="Performance Management"
      description="Performance and process reports — exportable to Word, PowerPoint and Print."
      reports={PERFORMANCE_REPORTS}
    />
  );
}
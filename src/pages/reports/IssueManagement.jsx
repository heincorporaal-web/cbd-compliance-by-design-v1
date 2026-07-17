import React from "react";
import ReportCategoryPage from "@/components/reports/ReportCategoryPage";
import { ISSUE_REPORTS } from "@/lib/reportsCatalog";

export default function IssueManagement() {
  return (
    <ReportCategoryPage
      title="Issue Management"
      description="Issues and incident reports — filter and export to CSV or PDF."
      reports={ISSUE_REPORTS}
    />
  );
}
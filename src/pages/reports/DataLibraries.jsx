import React from "react";
import { FileSpreadsheet } from "lucide-react";
import ReportCategoryPage from "@/components/reports/ReportCategoryPage";
import { DATA_LIBRARY_REPORTS } from "@/lib/reportsCatalog";

export default function DataLibraries() {
  return (
    <ReportCategoryPage
      title="Data Libraries"
      description="Configurable data & list reports — filter records, choose fields and export to CSV or PDF."
      reports={DATA_LIBRARY_REPORTS}
      icon={FileSpreadsheet}
      gradient="from-teal-600 to-emerald-700"
    />
  );
}
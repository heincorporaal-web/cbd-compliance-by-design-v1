import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertTriangle } from "lucide-react";

export default function ArchivedFrameworkBanner({ frameworkId }) {
  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
    enabled: !!frameworkId,
  });

  if (!frameworkId) return null;

  const framework = frameworks.find(f => f.id === frameworkId);
  if (!framework) return null;

  const isArchived = framework.status === "archived" || (framework.end_date && new Date(framework.end_date) < new Date());
  if (!isArchived) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-lg">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-800">
          Framework Expired / Archived
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          This record is linked to <strong>{framework.name}</strong>
          {framework.end_date ? ` which expired on ${new Date(framework.end_date).toLocaleDateString("en-GB")}` : " which has been archived"}.
          Consider updating this record to use an active framework.
        </p>
      </div>
    </div>
  );
}
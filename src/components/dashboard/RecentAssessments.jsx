import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Shield, Calendar, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const riskColors = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200"
};

const statusColors = {
  draft: "bg-slate-100 text-slate-800 border-slate-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  reviewed: "bg-purple-100 text-purple-800 border-purple-200"
};

export default function RecentAssessments({ assessments }) {
  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Recent Assessments
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {assessments.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No assessments yet</p>
            <Link to={createPageUrl("Assessments")}>
              <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                Create your first assessment
              </button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <h4 className="font-semibold text-slate-900 truncate">
                        {assessment.company_name}
                      </h4>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{assessment.framework_name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(assessment.assessment_date), "d MMM yyyy")}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`${statusColors[assessment.status]} border`}>
                      {assessment.status.replace('_', ' ')}
                    </Badge>
                    {assessment.risk_level && (
                      <Badge className={`${riskColors[assessment.risk_level]} border`}>
                        {assessment.risk_level}
                      </Badge>
                    )}
                    {assessment.overall_score !== undefined && (
                      <span className="text-lg font-bold text-slate-900">
                        {assessment.overall_score}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
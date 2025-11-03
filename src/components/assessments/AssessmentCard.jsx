import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Building2, FileCheck, Calendar, User, Pencil, Trash2, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  draft: "bg-slate-100 text-slate-800 border-slate-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  reviewed: "bg-purple-100 text-purple-800 border-purple-200"
};

const riskColors = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-green-500 text-white"
};

export default function AssessmentCard({ assessment, onEdit, onDelete }) {
  return (
    <Card className="shadow-lg border-slate-200 hover:shadow-xl transition-all duration-300 group">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-lg ${riskColors[assessment.risk_level] || 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-slate-900 truncate">{assessment.company_name}</h3>
              <p className="text-sm text-slate-500 truncate">{assessment.framework_name}</p>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(assessment)}
              className="h-8 w-8"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(assessment.id)}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge className={`${statusColors[assessment.status]} border`}>
            {assessment.status.replace('_', ' ')}
          </Badge>
          {assessment.overall_score !== undefined && (
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">{assessment.overall_score}%</div>
              <div className="text-xs text-slate-500">Score</div>
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{format(new Date(assessment.assessment_date), "MMM d, yyyy")}</span>
          </div>
          {assessment.assessor && (
            <div className="flex items-center gap-2 text-slate-600">
              <User className="w-4 h-4 text-slate-400" />
              <span className="truncate">{assessment.assessor}</span>
            </div>
          )}
          {assessment.next_review_date && (
            <div className="flex items-center gap-2 text-slate-600">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <span>Next: {format(new Date(assessment.next_review_date), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>

        {assessment.notes && (
          <p className="text-sm text-slate-500 line-clamp-2 pt-2 border-t border-slate-100">
            {assessment.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
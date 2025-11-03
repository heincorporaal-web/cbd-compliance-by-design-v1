import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp } from "lucide-react";

const riskColors = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200"
};

export default function CompanyRiskMatrix({ companies, assessments }) {
  const companyRisks = companies.map(company => {
    const companyAssessments = assessments.filter(a => a.company_id === company.id && a.status === 'completed');
    const latestAssessment = companyAssessments[0];
    
    return {
      ...company,
      assessmentCount: companyAssessments.length,
      latestRisk: latestAssessment?.risk_level,
      latestScore: latestAssessment?.overall_score
    };
  });

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          Company Risk Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {companyRisks.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No companies yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {companyRisks.map((company) => (
              <div key={company.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">{company.name}</h4>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span>{company.industry || 'N/A'}</span>
                      <span>•</span>
                      <span>{company.assessmentCount} assessment{company.assessmentCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {company.latestScore !== undefined && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">{company.latestScore}%</div>
                        <div className="text-xs text-slate-500">Score</div>
                      </div>
                    )}
                    {company.latestRisk && (
                      <Badge className={`${riskColors[company.latestRisk]} border`}>
                        {company.latestRisk}
                      </Badge>
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
import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Users, Mail, Pencil, Trash2, TrendingUp } from "lucide-react";

const sizeLabels = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  enterprise: "Enterprise"
};

const riskAppetiteColors = {
  low: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200"
};

export default function CompanyCard({ company, onEdit, onDelete }) {
  return (
    <Card className="shadow-lg border-slate-200 hover:shadow-xl transition-all duration-300 group">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-slate-900 truncate">{company.name}</h3>
              {company.industry && (
                <p className="text-sm text-slate-500">{company.industry}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(company)}
              className="h-8 w-8"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(company.id)}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users className="w-4 h-4 text-slate-400" />
          <span>{sizeLabels[company.size] || 'N/A'}</span>
          {company.country && (
            <>
              <span>•</span>
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{company.country}</span>
            </>
          )}
        </div>

        {company.contact_person && (
          <div className="text-sm text-slate-600">
            <span className="font-medium">Contact:</span> {company.contact_person}
          </div>
        )}

        {company.contact_email && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="truncate">{company.contact_email}</span>
          </div>
        )}

        {company.risk_appetite && (
          <div className="flex items-center gap-2 pt-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <Badge className={`${riskAppetiteColors[company.risk_appetite]} border`}>
              {company.risk_appetite} risk appetite
            </Badge>
          </div>
        )}

        {company.description && (
          <p className="text-sm text-slate-500 line-clamp-2 pt-2 border-t border-slate-100">
            {company.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Layers, CheckCircle2, XCircle, Pencil, Trash2 } from "lucide-react";

const categoryColors = {
  operational: "bg-blue-100 text-blue-800 border-blue-200",
  financial: "bg-green-100 text-green-800 border-green-200",
  compliance: "bg-purple-100 text-purple-800 border-purple-200",
  strategic: "bg-orange-100 text-orange-800 border-orange-200",
  cybersecurity: "bg-red-100 text-red-800 border-red-200",
  other: "bg-slate-100 text-slate-800 border-slate-200"
};

export default function FrameworkCard({ framework, onEdit, onDelete }) {
  return (
    <Card className="shadow-lg border-slate-200 hover:shadow-xl transition-all duration-300 group">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-slate-900 truncate">{framework.name}</h3>
              {framework.version && (
                <p className="text-sm text-slate-500">Version {framework.version}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(framework)}
              className="h-8 w-8"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(framework.id)}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge className={`${categoryColors[framework.category]} border`}>
            {framework.category?.replace('_', ' ')}
          </Badge>
          <div className="flex items-center gap-1">
            {framework.is_active ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-sm text-slate-600">
              {framework.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {framework.total_controls > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Layers className="w-4 h-4 text-slate-400" />
            <span>{framework.total_controls} control{framework.total_controls !== 1 ? 's' : ''}</span>
          </div>
        )}

        {framework.description && (
          <p className="text-sm text-slate-500 line-clamp-3 pt-2 border-t border-slate-100">
            {framework.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
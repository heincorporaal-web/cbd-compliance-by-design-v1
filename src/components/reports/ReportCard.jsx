import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export default function ReportCard({ report }) {
  const exportBadgeColor = (label) => {
    if (label === "CSV") return "bg-green-100 text-green-700 border-green-200";
    if (label === "PDF") return "bg-red-100 text-red-700 border-red-200";
    if (label === "Word") return "bg-blue-100 text-blue-700 border-blue-200";
    if (label === "PowerPoint") return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <CardHeader className="pb-3">
        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${report.color} flex items-center justify-center mb-3`}>
          <report.icon className="w-5 h-5 text-white" />
        </div>
        <CardTitle className="text-base">{report.title}</CardTitle>
        <CardDescription className="text-sm mt-1">{report.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {report.exports.map(e => (
            <span key={e} className={`text-xs px-2 py-0.5 rounded border font-medium ${exportBadgeColor(e)}`}>{e}</span>
          ))}
        </div>
        <Link to={report.url}>
          <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <FileText className="w-4 h-4 mr-2" />
            Open Report
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
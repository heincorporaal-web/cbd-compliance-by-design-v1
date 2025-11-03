import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsOverview({ title, value, icon: Icon, bgColor, trend, alert }) {
  return (
    <Card className="relative overflow-hidden shadow-lg border-slate-200 hover:shadow-xl transition-shadow">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bgColor} rounded-full opacity-10 transform translate-x-12 -translate-y-12`} />
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${bgColor} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardHeader>
      {trend && (
        <CardContent className="pt-0">
          <div className={`flex items-center text-sm ${alert ? 'text-red-600' : 'text-slate-500'}`}>
            {alert ? (
              <TrendingDown className="w-4 h-4 mr-1" />
            ) : (
              <TrendingUp className="w-4 h-4 mr-1" />
            )}
            <span>{trend}</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
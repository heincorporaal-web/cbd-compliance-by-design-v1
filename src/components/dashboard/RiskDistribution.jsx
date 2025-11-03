import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { AlertTriangle } from "lucide-react";

const COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e'
};

export default function RiskDistribution({ assessments }) {
  const riskCounts = {
    critical: assessments.filter(a => a.risk_level === 'critical').length,
    high: assessments.filter(a => a.risk_level === 'high').length,
    medium: assessments.filter(a => a.risk_level === 'medium').length,
    low: assessments.filter(a => a.risk_level === 'low').length,
  };

  const data = Object.entries(riskCounts)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Risk Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No risk data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
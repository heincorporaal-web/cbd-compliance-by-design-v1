import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Gauge, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import PageHeader from "@/components/layout/PageHeader";

const statusColors = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  active: "bg-green-100 text-green-700 border-green-200",
  archived: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const computeOverall = (scorecard) => {
  const perspectives = scorecard.perspectives || [];
  const weighted = perspectives.reduce((sum, p) => {
    const linked = (p.linked_objective_ids?.length || 0) + (p.linked_grc_goal_ids?.length || 0) + (p.linked_control_ids?.length || 0);
    return sum + (p.weight_pct || 0) * (linked > 0 ? 1 : 0);
  }, 0);
  return weighted;
};

export default function BalancedScorecards() {
  const [globalCompany] = useCompanyFilter();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: scorecards = [], isLoading } = useQuery({
    queryKey: ["balancedScorecards"],
    queryFn: () => base44.entities.BalancedScorecard.list("-created_date"),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const filtered = scorecards.filter((sc) => {
    const matchesCompany = globalCompany === "all" || sc.company_id === globalCompany;
    const matchesSearch =
      sc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sc.period?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCompany && matchesSearch;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          navItemId="balanced_scorecards"
          icon={Gauge}
          title="Balanced Scorecards"
          tagline="Manage organisational performance across scorecard perspectives"
          gradient="from-violet-600 to-purple-700"
        />
        <Link to={createPageUrl("BalancedScorecardDetail")}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> New Scorecard
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Total Scorecards</p>
            <p className="text-3xl font-bold text-slate-900">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Active</p>
            <p className="text-3xl font-bold text-green-700">{filtered.filter((s) => s.status === "active").length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Draft</p>
            <p className="text-3xl font-bold text-amber-700">{filtered.filter((s) => s.status === "draft").length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search scorecards by name or period..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading…</div>
          ) : filtered.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filtered.map((sc) => {
                const company = companies.find((c) => c.id === sc.company_id);
                const perspectives = sc.perspectives?.length || 0;
                const overall = computeOverall(sc);
                return (
                  <div key={sc.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                          <Gauge className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{sc.name}</h3>
                            <Badge variant="outline" className={statusColors[sc.status] || statusColors.draft}>
                              {sc.status}
                            </Badge>
                            {sc.period && <Badge variant="outline" className="bg-slate-50">{sc.period}</Badge>}
                          </div>
                          {sc.description && <p className="text-sm text-slate-600 mb-1">{sc.description}</p>}
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            {company && <span>{company.name}</span>}
                            {sc.owner && <span>• Owner: {sc.owner}</span>}
                            <span>• {perspectives} perspective{perspectives !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {overall > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Weighted coverage</p>
                            <p className="text-lg font-bold text-indigo-600">{Math.round(overall)}%</p>
                          </div>
                        )}
                        <Link to={createPageUrl(`BalancedScorecardDetail?id=${sc.id}`)}>
                          <Button variant="ghost" size="icon">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Gauge className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No balanced scorecards found</p>
              <Link to={createPageUrl("BalancedScorecardDetail")}>
                <Button className="mt-4">Create First Scorecard</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
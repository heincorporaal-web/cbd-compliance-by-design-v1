import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Target, Plus, Search, Building2, Calendar, User, Trash2
} from "lucide-react";
import ObjectiveFormDialog from "@/components/objectives/ObjectiveFormDialog";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { toast } from "sonner";

const CATEGORIES = ["Compliance", "IT Compliance", "Operational", "Financial", "Client Relations", "Resilience", "Data", "Fundamentals"];
const STATUSES = ["Draft", "Approved", "Active", "Under Review", "Retired"];

const STATUS_COLORS = {
  Draft: "bg-slate-100 text-slate-600",
  Approved: "bg-green-100 text-green-700",
  Active: "bg-blue-100 text-blue-700",
  "Under Review": "bg-yellow-100 text-yellow-700",
  Retired: "bg-red-100 text-red-700",
};

const CAT_COLORS = {
  Compliance: "bg-orange-100 text-orange-700",
  "IT Compliance": "bg-cyan-100 text-cyan-700",
  Operational: "bg-blue-100 text-blue-700",
  Financial: "bg-green-100 text-green-700",
  "Client Relations": "bg-pink-100 text-pink-700",
  Resilience: "bg-purple-100 text-purple-700",
  Data: "bg-indigo-100 text-indigo-700",
  Fundamentals: "bg-slate-100 text-slate-700",
};

export default function OrgObjectives() {
  const queryClient = useQueryClient();
  const { selectedCompany } = useCompanyFilter();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editObj, setEditObj] = useState(null);

  const { data: objectives = [], isLoading } = useQuery({
    queryKey: ["orgObjectives"],
    queryFn: () => base44.entities.OrgObjective.list("-created_date"),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OrgObjective.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["orgObjectives"]); toast.success("Objective deleted"); },
  });

  const closeDialog = () => { setDialogOpen(false); setEditObj(null); };

  const openEdit = (obj) => {
    setEditObj(obj);
    setDialogOpen(true);
  };

  const filtered = objectives.filter(o => {
    const matchCompany = !selectedCompany || o.company_id === selectedCompany;
    const matchSearch = !search || o.title?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || o.category === catFilter;
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchCompany && matchSearch && matchCat && matchStatus;
  });

  const stats = {
    total: filtered.length,
    active: filtered.filter(o => o.status === "Active").length,
    approved: filtered.filter(o => o.status === "Approved").length,
    avgProgress: filtered.length ? Math.round(filtered.reduce((s, o) => s + (o.progress_pct || 0), 0) / filtered.length) : 0,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Organisational Objectives</h1>
            <p className="text-slate-600">Strategic goals linked to risks, controls, frameworks & more</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-slate-900" },
          { label: "Active", value: stats.active, color: "text-blue-600" },
          { label: "Approved", value: stats.approved, color: "text-green-600" },
          { label: "Avg. Progress", value: `${stats.avgProgress}%`, color: "text-indigo-600" },
        ].map(s => (
          <Card key={s.label} className="border-none shadow-lg">
            <CardContent className="pt-5 pb-4">
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search objectives…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No objectives found</p>
          <Button onClick={() => setDialogOpen(true)}>Create First Objective</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(obj => {
            const company = companies.find(c => c.id === obj.company_id);
            return (
              <Card key={obj.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(obj)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {obj.reference_number && <span className="font-mono text-xs text-primary">{obj.reference_number}</span>}
                        <h3 className="font-semibold text-slate-900">{obj.title}</h3>
                        <Badge className={CAT_COLORS[obj.category] || "bg-slate-100 text-slate-600"}>{obj.category}</Badge>
                        <Badge className={STATUS_COLORS[obj.status] || "bg-slate-100 text-slate-600"}>{obj.status}</Badge>
                        {obj.objective_type && <Badge variant="outline" className="text-xs">{obj.objective_type}</Badge>}
                      </div>
                      {obj.description && <p className="text-sm text-slate-500 mb-2 line-clamp-2">{obj.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        {company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{company.name}</span>}
                        {obj.objective_owner && <span className="flex items-center gap-1"><User className="w-3 h-3" />{obj.objective_owner}</span>}
                        {obj.time_horizon && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{obj.time_horizon}</span>}
                        {obj.criticality && <span className="text-purple-600 font-medium">{obj.criticality}</span>}
                      </div>
                      {obj.progress_pct !== undefined && (
                        <div className="mt-3 flex items-center gap-3">
                          <Progress value={obj.progress_pct || 0} className="h-2 flex-1" />
                          <span className="text-xs text-slate-500 w-10 text-right">{obj.progress_pct || 0}%</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => deleteMutation.mutate(obj.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add New button at bottom */}
      <div className="flex justify-center pt-2">
        <Button onClick={() => { setEditObj(null); setDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Plus className="w-4 h-4" /> New Objective
        </Button>
      </div>

      <ObjectiveFormDialog
        open={dialogOpen}
        onClose={closeDialog}
        editObj={editObj}
        companies={companies}
        objectives={objectives}
      />
    </div>
  );
}
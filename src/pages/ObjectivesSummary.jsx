import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Search, Plus, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import ObjectiveFormDialog from "@/components/objectives/ObjectiveFormDialog";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { toast } from "sonner";

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

const CATEGORIES = ["Compliance", "IT Compliance", "Operational", "Financial", "Client Relations", "Resilience", "Data", "Fundamentals"];
const STATUSES = ["Draft", "Approved", "Active", "Under Review", "Retired"];

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 ml-1 inline" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3.5 h-3.5 text-primary ml-1 inline" />
    : <ChevronDown className="w-3.5 h-3.5 text-primary ml-1 inline" />;
}

export default function ObjectivesSummary() {
  const queryClient = useQueryClient();
  const [selectedCompany] = useCompanyFilter();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortCol, setSortCol] = useState("reference_number");
  const [sortDir, setSortDir] = useState("asc");
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

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let rows = objectives.filter(o => {
      const matchCompany = !selectedCompany || selectedCompany === "all" || o.company_id === selectedCompany;
      const matchSearch = !search || o.title?.toLowerCase().includes(search.toLowerCase()) || o.reference_number?.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || o.category === catFilter;
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchCompany && matchSearch && matchCat && matchStatus;
    });
    rows = [...rows].sort((a, b) => {
      const av = (a[sortCol] || "").toString().toLowerCase();
      const bv = (b[sortCol] || "").toString().toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return rows;
  }, [objectives, selectedCompany, search, catFilter, statusFilter, sortCol, sortDir]);

  const Th = ({ col, label }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-800 whitespace-nowrap" onClick={() => handleSort(col)}>
      {label}<SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
    </th>
  );

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
            <p className="text-slate-500 text-sm">{filtered.length} objective{filtered.length !== 1 ? "s" : ""} — click a name to view / edit</p>
          </div>
        </div>
        <Button onClick={() => { setEditObj(null); setDialogOpen(true); }} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> New Objective
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by name or reference…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <Th col="reference_number" label="Ref" />
                <Th col="title" label="Objective Name" />
                <Th col="category" label="Category" />
                <Th col="objective_type" label="Type" />
                <Th col="status" label="Status" />
                <Th col="criticality" label="Criticality" />
                <Th col="time_horizon" label="Horizon" />
                <Th col="objective_owner" label="Owner" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
                <th className="px-2 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">No objectives found</td></tr>
              ) : filtered.map(obj => {
                const company = companies.find(c => c.id === obj.company_id);
                return (
                  <tr key={obj.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{obj.reference_number || "—"}</td>
                    <td className="px-4 py-3 font-medium">
                      <button
                        className="text-left text-indigo-700 hover:text-indigo-900 hover:underline font-semibold"
                        onClick={() => { setEditObj(obj); setDialogOpen(true); }}
                      >
                        {obj.title}
                      </button>
                      {obj.strategic_theme && <p className="text-xs text-slate-400 mt-0.5">{obj.strategic_theme}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={CAT_COLORS[obj.category] || "bg-slate-100 text-slate-600"}>{obj.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{obj.objective_type || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={STATUS_COLORS[obj.status] || "bg-slate-100 text-slate-600"}>{obj.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{obj.criticality || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{obj.time_horizon || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{obj.objective_owner || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{company?.name || "—"}</td>
                    <td className="px-2 py-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500"
                        onClick={() => { if (confirm("Delete this objective?")) deleteMutation.mutate(obj.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ObjectiveFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditObj(null); }}
        editObj={editObj}
        companies={companies}
        objectives={objectives}
        defaultCompanyId={selectedCompany && selectedCompany !== "all" ? selectedCompany : ""}
      />
    </div>
  );
}
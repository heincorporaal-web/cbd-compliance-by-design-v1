import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, Search, Plus, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import PrincipalRiskFormDialog from "@/components/risks/PrincipalRiskFormDialog";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { toast } from "sonner";

const STATUS_COLORS = {
  Draft: "bg-slate-100 text-slate-600",
  Active: "bg-green-100 text-green-700",
  "Under Review": "bg-yellow-100 text-yellow-700",
  Retired: "bg-red-100 text-red-700",
};

const PRIORITY_COLORS = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-green-100 text-green-700",
};

const CRITICALITY_COLORS = {
  Critical: "bg-red-100 text-red-700",
  High: "bg-orange-100 text-orange-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};

const CATEGORIES = ["Strategic", "Compliance", "IT", "Operational", "Cyber", "Data", "Third Party", "Financial Crime", "Reputational Risk", "Financial Risk", "Compliance / Conduct Risk", "Third-Party / Supplier Risk", "Technology / Information Security Risk"];
const STATUSES = ["Draft", "Active", "Under Review", "Retired"];
const PRIORITIES = ["High", "Medium", "Low"];

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 ml-1 inline" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3.5 h-3.5 text-primary ml-1 inline" />
    : <ChevronDown className="w-3.5 h-3.5 text-primary ml-1 inline" />;
}

export default function PrincipalRisksSummary() {
  const queryClient = useQueryClient();
  const { selectedCompany } = useCompanyFilter();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortCol, setSortCol] = useState("risk_reference");
  const [sortDir, setSortDir] = useState("asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRisk, setEditRisk] = useState(null);

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ["principalRisks"],
    queryFn: () => base44.entities.PrincipalRisk.list("-created_date"),
  });
  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });
  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders"],
    queryFn: () => base44.entities.Stakeholder.list(),
  });
  const { data: businessUnits = [] } = useQuery({
    queryKey: ["businessUnits"],
    queryFn: () => base44.entities.BusinessUnit.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PrincipalRisk.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["principalRisks"]); toast.success("Principal risk deleted"); },
  });

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let rows = risks.filter(r => {
      const matchCompany = !selectedCompany || r.company_id === selectedCompany;
      const matchSearch = !search ||
        r.risk_title?.toLowerCase().includes(search.toLowerCase()) ||
        r.risk_reference?.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || r.risk_category === catFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchPriority = priorityFilter === "all" || r.priority === priorityFilter;
      return matchCompany && matchSearch && matchCat && matchStatus && matchPriority;
    });
    rows = [...rows].sort((a, b) => {
      const av = (a[sortCol] || "").toString().toLowerCase();
      const bv = (b[sortCol] || "").toString().toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return rows;
  }, [risks, selectedCompany, search, catFilter, statusFilter, priorityFilter, sortCol, sortDir]);

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
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Principal Risks</h1>
            <p className="text-slate-500 text-sm">{filtered.length} risk{filtered.length !== 1 ? "s" : ""} — click a name to view / edit</p>
          </div>
        </div>
        <Button onClick={() => { setEditRisk(null); setDialogOpen(true); }} className="gap-2 bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4" /> New Principal Risk
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
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <Th col="risk_reference" label="Ref" />
                <Th col="risk_title" label="Risk Name" />
                <Th col="risk_category" label="Category" />
                <Th col="status" label="Status" />
                <Th col="priority" label="Priority" />
                <Th col="criticality" label="Criticality" />
                <Th col="risk_owner_name" label="Risk Owner" />
                <Th col="review_frequency" label="Review" />
                <Th col="next_review_date" label="Next Review" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
                <th className="px-2 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-slate-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-slate-400">No principal risks found</td></tr>
              ) : filtered.map(risk => {
                const company = companies.find(c => c.id === risk.company_id);
                return (
                  <tr key={risk.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{risk.risk_reference || "—"}</td>
                    <td className="px-4 py-3 font-medium min-w-48">
                      <button
                        className="text-left text-red-700 hover:text-red-900 hover:underline font-semibold"
                        onClick={() => { setEditRisk(risk); setDialogOpen(true); }}
                      >
                        {risk.risk_title}
                      </button>
                      {risk.risk_sub_category && <p className="text-xs text-slate-400 mt-0.5">{risk.risk_sub_category}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs">{risk.risk_category}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={STATUS_COLORS[risk.status] || "bg-slate-100 text-slate-600"}>{risk.status}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={PRIORITY_COLORS[risk.priority] || "bg-slate-100 text-slate-600"}>{risk.priority}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={CRITICALITY_COLORS[risk.criticality] || "bg-slate-100 text-slate-600"}>{risk.criticality}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{risk.risk_owner_name || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{risk.review_frequency || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{risk.next_review_date || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{company?.name || "—"}</td>
                    <td className="px-2 py-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500"
                        onClick={() => { if (confirm("Delete this principal risk?")) deleteMutation.mutate(risk.id); }}>
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

      <PrincipalRiskFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRisk(null); }}
        editRisk={editRisk}
        companies={companies}
        stakeholders={stakeholders}
        businessUnits={businessUnits}
      />
    </div>
  );
}
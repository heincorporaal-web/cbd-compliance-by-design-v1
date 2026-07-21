import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ArrowRight, ClipboardList, Calendar, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";

const STATUS_COLORS = {
  planning: "bg-blue-100 text-blue-700 border-blue-200",
  in_review: "bg-orange-100 text-orange-700 border-orange-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_LABELS = {
  planning: "Planning",
  in_review: "In Review",
  approved: "Approved",
  closed: "Closed",
};

export default function RiskAssessmentCycles() {
  const [globalCompany] = useCompanyFilter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", cycle_year: new Date().getFullYear(), start_date: "", end_date: "" });

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["risk-assessment-cycles"],
    queryFn: () => base44.entities.RiskAssessmentCycle.list("-created_date"),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RiskAssessmentCycle.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries(["risk-assessment-cycles"]);
      toast.success("Assessment cycle created");
      setShowCreate(false);
      setForm({ name: "", description: "", cycle_year: new Date().getFullYear(), start_date: "", end_date: "" });
      window.location.href = createPageUrl(`RiskAssessmentCycleDetail?id=${created.id}`);
    },
  });

  const filtered = cycles.filter(c => {
    const matchCompany = globalCompany === "all" || c.company_id === globalCompany;
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase());
    return matchCompany && matchSearch;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const company_id = globalCompany !== "all" ? globalCompany : null;
    if (!company_id) return toast.error("Please select a company first");
    createMutation.mutate({ ...form, company_id, status: "planning", risk_ids: [] });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          navItemId="risk_assessment_cycles"
          icon={ClipboardList}
          title="Risk Assessment Cycles"
          tagline="Plan and manage periodic risk assessment programmes"
          gradient="from-amber-600 to-orange-700"
        />
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Cycle
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search cycles…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium mb-1">No assessment cycles yet</p>
          <p className="text-sm text-slate-400 mb-4">Create a cycle to plan which risks will be assessed.</p>
          <Button variant="outline" onClick={() => setShowCreate(true)}>Create First Cycle</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(cycle => {
            const company = companies.find(c => c.id === cycle.company_id);
            return (
              <Card key={cycle.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-slate-900">{cycle.name}</h3>
                        <Badge variant="outline" className={`${STATUS_COLORS[cycle.status]} border text-xs`}>
                          {STATUS_LABELS[cycle.status] || cycle.status}
                        </Badge>
                        {cycle.cycle_year && <Badge variant="outline" className="text-xs">{cycle.cycle_year}</Badge>}
                      </div>
                      {cycle.description && <p className="text-sm text-slate-500 line-clamp-1 mb-1">{cycle.description}</p>}
                      <div className="flex gap-4 text-xs text-slate-400 flex-wrap">
                        {company && <span>{company.name}</span>}
                        {cycle.risk_ids?.length > 0 && <span>{cycle.risk_ids.length} risks</span>}
                        {cycle.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{cycle.start_date}{cycle.end_date ? ` → ${cycle.end_date}` : ""}</span>}
                      </div>
                    </div>
                    <Link to={createPageUrl(`RiskAssessmentCycleDetail?id=${cycle.id}`)}>
                      <Button variant="ghost" size="icon"><ArrowRight className="w-4 h-4" /></Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={o => { if (!o) setShowCreate(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Risk Assessment Cycle</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label>Cycle Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Annual Risk Assessment 2026" required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Scope and objectives…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Cycle Year</Label>
                <Input type="number" value={form.cycle_year} onChange={e => setForm(p => ({ ...p, cycle_year: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>Create Cycle</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
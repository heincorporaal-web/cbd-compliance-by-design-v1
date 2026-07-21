import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Shield, Calendar, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";

const STATUS_COLORS = {
  planning: "bg-blue-100 text-blue-700 border-blue-200",
  in_review: "bg-orange-100 text-orange-700 border-orange-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
};
const STATUS_LABELS = { planning: "Planning", in_review: "In Review", approved: "Approved", closed: "Closed" };

export default function ControlAssessmentCycles() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("__all__");
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "", description: "", cycle_year: new Date().getFullYear(),
    start_date: "", end_date: "", company_id: "",
  });

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["control-assessment-cycles"],
    queryFn: () => base44.entities.ControlAssessmentCycle.list("-created_date"),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ControlAssessmentCycle.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries(["control-assessment-cycles"]);
      toast.success("Control assessment cycle created");
      setShowCreate(false);
      setNewForm({ name: "", description: "", cycle_year: new Date().getFullYear(), start_date: "", end_date: "", company_id: "" });
      window.location.href = createPageUrl(`ControlAssessmentCycleDetail?id=${created.id}`);
    },
  });

  const filtered = cycles.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase());
    const matchCompany = filterCompany === "__all__" || c.company_id === filterCompany;
    return matchSearch && matchCompany;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          navItemId="control_assessment_cycles"
          icon={Shield}
          title="Control Assessment Cycles"
          tagline="Manage periodic control assessment programs"
          gradient="from-teal-600 to-cyan-700"
        />
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Cycle
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search cycles…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Companies" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Companies</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No assessment cycles found.</p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create First Cycle
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(cycle => {
            const company = companies.find(c => c.id === cycle.company_id);
            return (
              <Link key={cycle.id} to={createPageUrl(`ControlAssessmentCycleDetail?id=${cycle.id}`)}>
                <Card className="border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-slate-900">{cycle.name}</h3>
                          <Badge variant="outline" className={`${STATUS_COLORS[cycle.status]} border text-xs`}>
                            {STATUS_LABELS[cycle.status] || cycle.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                          {company && <span className="font-medium text-slate-700">{company.name}</span>}
                          {cycle.cycle_year && <span>Year: {cycle.cycle_year}</span>}
                          {cycle.start_date && cycle.end_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {cycle.start_date} → {cycle.end_date}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" />
                            {(cycle.control_ids || []).length} control{(cycle.control_ids || []).length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {cycle.description && <p className="text-xs text-slate-400 mt-1 truncate">{cycle.description}</p>}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Control Assessment Cycle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Company *</Label>
              <Select value={newForm.company_id} onValueChange={v => setNewForm(f => ({ ...f, company_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select company…" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Cycle Name *</Label>
              <Input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Annual Control Assessment 2026" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Year</Label>
                <Input type="number" value={newForm.cycle_year} onChange={e => setNewForm(f => ({ ...f, cycle_year: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input type="date" value={newForm.start_date} onChange={e => setNewForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input type="date" value={newForm.end_date} onChange={e => setNewForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => createMutation.mutate(newForm)}
                disabled={!newForm.name || !newForm.company_id || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating…" : "Create & Configure"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
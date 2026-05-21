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
import { Plus, Search, ClipboardList, Calendar, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";

const STATUS_COLORS = {
  planning: "bg-blue-100 text-blue-700 border-blue-200",
  in_review: "bg-orange-100 text-orange-700 border-orange-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
};
const STATUS_LABELS = { planning: "Planning", in_review: "In Review", approved: "Approved", closed: "Closed" };

export default function ControlAssessmentCycles() {
  const queryClient = useQueryClient();
  const [selectedCompanyId] = useCompanyFilter();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newCycle, setNewCycle] = useState({
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
    onSuccess: () => {
      queryClient.invalidateQueries(["control-assessment-cycles"]);
      toast.success("Assessment cycle created");
      setShowCreate(false);
      setNewCycle({ name: "", description: "", cycle_year: new Date().getFullYear(), start_date: "", end_date: "", company_id: "" });
    },
  });

  const filtered = cycles.filter(c => {
    const matchCompany = !selectedCompanyId || c.company_id === selectedCompanyId;
    const matchSearch = !search.trim() || c.name?.toLowerCase().includes(search.toLowerCase());
    return matchCompany && matchSearch;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Control Assessment Cycles</h1>
          <p className="text-slate-500 text-sm mt-1">Plan and manage periodic control assessment programs</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Cycle
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search cycles…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No assessment cycles yet</p>
          <p className="text-slate-400 text-sm mt-1">Create your first control assessment cycle to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(cycle => {
            const company = companies.find(c => c.id === cycle.company_id);
            return (
              <Link key={cycle.id} to={createPageUrl(`ControlAssessmentCycleDetail?id=${cycle.id}`)}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-slate-900 leading-tight">{cycle.name}</h3>
                      <Badge variant="outline" className={`${STATUS_COLORS[cycle.status]} border shrink-0 text-xs`}>
                        {STATUS_LABELS[cycle.status]}
                      </Badge>
                    </div>
                    {cycle.description && (
                      <p className="text-sm text-slate-500 mb-3 line-clamp-2">{cycle.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      {company && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                          {company.name}
                        </span>
                      )}
                      {cycle.cycle_year && <span>{cycle.cycle_year}</span>}
                      {cycle.end_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due {cycle.end_date}
                        </span>
                      )}
                      {cycle.control_ids?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" /> {cycle.control_ids.length} controls
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={o => { if (!o) setShowCreate(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Control Assessment Cycle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Cycle Name *</Label>
              <Input
                placeholder="e.g. Annual Control Assessment 2026"
                value={newCycle.name}
                onChange={e => setNewCycle(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Company *</Label>
              <Select value={newCycle.company_id} onValueChange={v => setNewCycle(p => ({ ...p, company_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select company…" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                placeholder="Scope and objectives of this assessment cycle…"
                value={newCycle.description}
                onChange={e => setNewCycle(p => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Year</Label>
                <Input type="number" value={newCycle.cycle_year} onChange={e => setNewCycle(p => ({ ...p, cycle_year: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input type="date" value={newCycle.start_date} onChange={e => setNewCycle(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input type="date" value={newCycle.end_date} onChange={e => setNewCycle(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => createMutation.mutate(newCycle)}
                disabled={!newCycle.name || !newCycle.company_id || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating…" : "Create Cycle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
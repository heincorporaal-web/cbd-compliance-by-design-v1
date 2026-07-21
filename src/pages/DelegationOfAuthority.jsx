import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, FileText, Calendar, User, Building2, ChevronRight, ShieldCheck, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { format } from "date-fns";
import PageHeader from "@/components/layout/PageHeader";

const statusColor = (s) => ({
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  active: "bg-green-100 text-green-700 border-green-200",
  archived: "bg-red-100 text-red-600 border-red-200",
}[s] || "bg-slate-100 text-slate-600");

export default function DelegationOfAuthority() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCompanyId] = useCompanyFilter();
  const queryClient = useQueryClient();

  const { data: doaList = [], isLoading } = useQuery({
    queryKey: ["doa", selectedCompanyId],
    queryFn: () =>
      selectedCompanyId
        ? base44.entities.DelegationOfAuthority.filter({ company_id: selectedCompanyId }, "-created_date")
        : base44.entities.DelegationOfAuthority.list("-created_date"),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DelegationOfAuthority.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["doa"]),
  });

  const handleDelete = (e, id) => {
    e.preventDefault();
    if (confirm("Delete this draft DOA? This cannot be undone.")) deleteMutation.mutate(id);
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DelegationOfAuthority.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries(["doa"]);
      navigate(`/DelegationOfAuthorityDetail?id=${created.id}`);
    },
  });

  const handleNew = () => {
    createMutation.mutate({
      title: "New Delegation of Authority",
      company_id: selectedCompanyId || companies[0]?.id || "",
      status: "draft",
    });
  };

  const filtered = doaList.filter(d =>
    !search ||
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getCompanyName = (id) => companies.find(c => c.id === id)?.name || "—";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader
          navItemId="doa"
          icon={ShieldCheck}
          title="Delegation of Authority"
          tagline="Manage approval authorities and delegation frameworks per company."
          gradient="from-sky-600 to-blue-700"
        />
        <Button onClick={handleNew} disabled={createMutation.isPending} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New DOA
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-primary">{doaList.length}</span>
          <span className="text-sm text-slate-500">Total</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-green-600">{doaList.filter(d => d.status === "active").length}</span>
          <span className="text-sm text-slate-500">Active</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-slate-500">{doaList.filter(d => d.status === "draft").length}</span>
          <span className="text-sm text-slate-500">Draft</span>
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search DOA…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-3">No delegations of authority found.</p>
          <Button onClick={handleNew} className="gap-2"><Plus className="w-4 h-4" /> Create First DOA</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doa => (
            <Card key={doa.id} className="border border-slate-200 hover:border-primary/40 hover:shadow-md transition-all">
              <CardContent className="p-4">
                <Link to={`/DelegationOfAuthorityDetail?id=${doa.id}`} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-900">{doa.title}</span>
                      <Badge variant="outline" className={`text-xs border ${statusColor(doa.status)}`}>{doa.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      {doa.company_id && (
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{getCompanyName(doa.company_id)}</span>
                      )}
                      {doa.owner_name && (
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{doa.owner_name}</span>
                      )}
                      {doa.valid_from && (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{doa.valid_from} → {doa.valid_to || "—"}</span>
                      )}
                      {doa.review_frequency && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded">{doa.review_frequency}</span>
                      )}
                    </div>
                    {doa.scope_notes && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">{doa.scope_notes}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                  </Link>
                  {doa.status === "draft" && (
                  <button
                    onClick={(e) => handleDelete(e, doa.id)}
                    className="ml-2 p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors shrink-0"
                    title="Delete draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
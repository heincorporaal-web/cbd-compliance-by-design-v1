import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, ChevronRight, ChevronDown, User, Building2 } from "lucide-react";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import PageHeader from "@/components/layout/PageHeader";

function buildTree(stakeholders) {
  const map = {};
  stakeholders.forEach(s => { map[s.id] = { ...s, children: [] }; });
  const roots = [];
  stakeholders.forEach(s => {
    if (s.manager_id && map[s.manager_id]) {
      map[s.manager_id].children.push(map[s.id]);
    } else {
      roots.push(map[s.id]);
    }
  });
  return roots;
}

function StakeholderNode({ node, depth = 0, search }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children.length > 0;

  const matchesSearch = !search ||
    node.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    node.job_title?.toLowerCase().includes(search.toLowerCase()) ||
    node.department?.toLowerCase().includes(search.toLowerCase());

  // If searching, auto-expand all
  const isOpen = search ? true : open;

  const childrenMatchSearch = search
    ? node.children.some(c => subtreeMatches(c, search))
    : true;

  if (search && !matchesSearch && !childrenMatchSearch) return null;

  return (
    <div className={depth > 0 ? "ml-6 border-l border-slate-200 pl-4" : ""}>
      <div
        className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors group ${
          matchesSearch && search ? "bg-amber-50 border border-amber-200" : "hover:bg-slate-50"
        }`}
      >
        {hasChildren ? (
          <button
            onClick={() => setOpen(v => !v)}
            className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary">
            {node.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-900 text-sm">{node.full_name}</span>
            {node.status === "inactive" && (
              <Badge variant="outline" className="text-xs text-slate-400 border-slate-200">Inactive</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            {node.job_title && <span className="font-medium text-primary/70">{node.job_title}</span>}
            {node.department && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />{node.department}
              </span>
            )}
            {node.email && <span className="hidden sm:inline">{node.email}</span>}
          </div>
        </div>

        {hasChildren && (
          <Badge variant="outline" className="text-xs text-slate-500 border-slate-200 shrink-0">
            {node.children.length} direct report{node.children.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {isOpen && hasChildren && (
        <div className="mt-1 space-y-1">
          {node.children.map(child => (
            <StakeholderNode key={child.id} node={child} depth={depth + 1} search={search} />
          ))}
        </div>
      )}
    </div>
  );
}

function subtreeMatches(node, search) {
  if (
    node.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    node.job_title?.toLowerCase().includes(search.toLowerCase()) ||
    node.department?.toLowerCase().includes(search.toLowerCase())
  ) return true;
  return node.children?.some(c => subtreeMatches(c, search));
}

export default function StakeholderHierarchy() {
  const [selectedCompanyId] = useCompanyFilter();
  const [search, setSearch] = useState("");

  const { data: stakeholders = [], isLoading } = useQuery({
    queryKey: ["stakeholders", selectedCompanyId],
    queryFn: () =>
      selectedCompanyId
        ? base44.entities.Stakeholder.filter({ company_id: selectedCompanyId })
        : base44.entities.Stakeholder.list(),
  });

  const active = stakeholders.filter(s => s.status !== "inactive");

  const tree = useMemo(() => buildTree(active), [active]);

  const unassigned = active.filter(
    s => !s.manager_id && !active.find(m => m.id === s.manager_id)
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader
          navItemId="stakeholder_hierarchy"
          icon={Users}
          title="Stakeholder Hierarchy"
          tagline="Reporting structure of all active stakeholders. Set a manager on each stakeholder profile to build the hierarchy."
          gradient="from-indigo-600 to-violet-700"
        />
      </div>

      {/* Stats + Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-primary">{active.length}</span>
          <span className="text-sm text-slate-500">Active</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-slate-600">{tree.length}</span>
          <span className="text-sm text-slate-500">Root nodes</span>
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, title or department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tree */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : active.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No active stakeholders found.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          {tree.map(node => (
            <StakeholderNode key={node.id} node={node} depth={0} search={search} />
          ))}
          {tree.length === 0 && !search && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No hierarchy configured yet. Assign managers to stakeholders to build the tree.
            </div>
          )}
          {search && tree.every(n => !subtreeMatches(n, search)) && (
            <div className="text-center py-8 text-slate-400 text-sm">No results for "{search}".</div>
          )}
        </div>
      )}
    </div>
  );
}
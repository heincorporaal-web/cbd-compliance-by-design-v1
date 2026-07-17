import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Library, Shield, Layers, Lock, BookOpen, ChevronRight, Upload, Pencil } from "lucide-react";
import FrameworkNodeTree from "@/components/frameworklibrary/FrameworkNodeTree";
import FrameworkUploadWizard from "@/components/frameworklibrary/FrameworkUploadWizard";
import FrameworkEditDialog from "@/components/frameworklibrary/FrameworkEditDialog";
import { useAuth } from "@/lib/AuthContext";
import { useIsImplementerRole } from "@/hooks/useIsImplementerRole";

export default function FrameworkLibrary() {
  const [search, setSearch] = useState("");
  const [selectedFwId, setSelectedFwId] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [typeFilter, setTypeFilter] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const refetchLibrary = () => {
    queryClient.invalidateQueries({ queryKey: ["master-frameworks"] });
    queryClient.invalidateQueries({ queryKey: ["fw-pillars"] });
    queryClient.invalidateQueries({ queryKey: ["fw-nodes"] });
  };

  const { data: frameworks = [] } = useQuery({ queryKey: ["master-frameworks"], queryFn: () => base44.entities.Framework.filter({ is_master: true }, "name", 2000) });
  const { data: pillars = [] } = useQuery({ queryKey: ["fw-pillars"], queryFn: () => base44.entities.FrameworkPillar.list("-sort_order", 2000) });
  const { data: nodes = [] } = useQuery({ queryKey: ["fw-nodes"], queryFn: () => base44.entities.FrameworkNode.list("-sort_order", 2000) });
  const { data: nodeTypes = [] } = useQuery({ queryKey: ["fw-node-types"], queryFn: () => base44.entities.FrameworkNodeType.list("-sort_order", 2000) });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: () => base44.entities.UserRole.list("-created_date", 2000),
    enabled: !!user?.custom_role_id,
  });
  const myRole = roles.find(r => r.id === user?.custom_role_id);
  const isMaintainer = user?.role === "admin" || !!myRole?.is_product_owner;
  const { canImport } = useIsImplementerRole();

  const fwWithNodes = useMemo(() => frameworks.filter(f => f.legacy_framework_id != null).sort((a, b) => a.name.localeCompare(b.name)), [frameworks]);
  const selectedFw = selectedFwId ? frameworks.find(f => f.id === selectedFwId) : null;

  const frameworkNodes = useMemo(() => {
    let list = nodes.filter(n => n.framework_id === selectedFw?.id);
    if (typeFilter !== "all") list = list.filter(n => n.node_type_name === typeFilter);
    return list;
  }, [nodes, selectedFw, typeFilter]);

  const frameworkPillars = useMemo(() => pillars.filter(p => p.framework_id === selectedFw?.id), [pillars, selectedFw]);

  const typeOptions = useMemo(
    () => [...new Set(nodes.filter(n => n.framework_id === selectedFw?.id).map(n => n.node_type_name).filter(Boolean))],
    [nodes, selectedFw]
  );

  const searchLower = search.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!searchLower) return null;
    return nodes.filter(n =>
      (n.node_title || "").toLowerCase().includes(searchLower) ||
      (n.node_code || "").toLowerCase().includes(searchLower) ||
      (n.node_text || "").toLowerCase().includes(searchLower) ||
      (n.external_ref || "").toLowerCase().includes(searchLower) ||
      (n.guidance_text || "").toLowerCase().includes(searchLower) ||
      (n.key_aspects || "").toLowerCase().includes(searchLower)
    );
  }, [nodes, searchLower]);

  const toggle = (id) => setExpanded(prev => {
    const s = new Set(prev);
    if (s.has(id)) s.delete(id); else s.add(id);
    return s;
  });

  const nodeById = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes]);
  const fwById = useMemo(() => Object.fromEntries(frameworks.map(f => [f.id, f])), [frameworks]);
  const pathOf = (node) => {
    const parts = [];
    let cur = node;
    let guard = 0;
    while (cur && guard++ < 12) { parts.unshift(cur.node_title || cur.node_code || ""); cur = cur.parent_id ? nodeById[cur.parent_id] : null; }
    const fw = fwById[node.framework_id];
    if (fw) parts.unshift(fw.name);
    return parts.join("  ›  ");
  };

  const expandAll = () => setExpanded(new Set(frameworkNodes.map(n => n.id)));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-50 to-primary/10 rounded-2xl p-6 border border-indigo-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <Library className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Framework Library</h1>
            <p className="text-sm text-slate-600">
              The master library of compliance frameworks, maintained by the Product Owner. Browse the standardised hierarchy by domain, chapter, section, clause, article or pillar.
            </p>
          </div>
          {isMaintainer ? (
            <>
              <Badge className="bg-amber-100 text-amber-800 border-amber-300"><Lock className="w-3 h-3 mr-1" />Maintainer</Badge>
              <Button onClick={() => setUploadOpen(true)} className="ml-2 shrink-0">
                <Upload className="w-4 h-4 mr-1" /> Upload
              </Button>
            </>
          ) : canImport ? (
            <Button onClick={() => setUploadOpen(true)} className="ml-2 shrink-0">
              <Upload className="w-4 h-4 mr-1" /> Upload
            </Button>
          ) : (
            <Badge variant="outline" className="text-slate-500">Read-only</Badge>
          )}
        </div>
      </div>

      {/* Search */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search across all frameworks by keyword, clause, article, control code or guidance…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {search && (
            <p className="text-xs text-slate-500 mt-2">
              {matches.length} match{matches.length !== 1 ? "es" : ""} across {new Set(matches.map(m => m.framework_id)).size} framework{new Set(matches.map(m => m.framework_id)).size !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Search results */}
      {matches && (
        <Card className="border-none shadow-lg">
          <CardContent className="p-4 divide-y divide-slate-100">
            {matches.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4 text-center">No nodes matched "{search}". Try a different keyword, framework name, or clause reference.</p>
            ) : matches.map(n => (
              <div key={n.id} className="py-2.5">
                <p className="text-xs text-slate-400 mb-0.5">{pathOf(n)}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {n.node_code && <span className="font-mono text-xs font-semibold text-slate-700">{n.node_code}</span>}
                  <span className="text-sm font-medium text-slate-800">{n.node_title}</span>
                  {n.external_ref && <span className="text-xs text-slate-400">· {n.external_ref}</span>}
                  {n.node_type_name && <Badge variant="outline" className="text-[10px]">{n.node_type_name}</Badge>}
                </div>
                {n.node_text && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.node_text}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Framework browse */}
      {!matches && (
        <>
          {/* Framework selector */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2"><Layers className="w-4 h-4" /> Frameworks with standardised hierarchy</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {fwWithNodes.map(f => {
                const count = nodes.filter(n => n.framework_id === f.id).length;
                const isActive = selectedFw?.id === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => { setSelectedFwId(f.id); setTypeFilter("all"); setExpanded(new Set()); }}
                    className={`text-left p-3 rounded-xl border transition-all ${isActive ? "bg-primary text-white border-primary shadow-md" : "bg-white border-slate-200 hover:border-primary/40 hover:shadow-sm"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${isActive ? "text-white" : "text-primary"}`} />
                      <span className="font-semibold text-sm">{f.name}</span>
                    </div>
                    <p className={`text-xs mt-1 ${isActive ? "text-white/80" : "text-slate-500"}`}>{count} nodes · {pillars.filter(p => p.framework_id === f.id).length} pillars</p>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedFw && (
            <Card className="border-none shadow-lg">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedFw.name}</h3>
                    <p className="text-sm text-slate-600">{selectedFw.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={expandAll} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Expand all</button>
                    {isMaintainer && (
                      <button onClick={() => setEditOpen(true)} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 inline-flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> Edit framework
                      </button>
                    )}
                  </div>
                </div>

                {frameworkPillars.length === 0 && nodes.filter(n => n.framework_id === selectedFw.id).length === 0 && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                    This framework has no hierarchy yet. {isMaintainer ? "Click “Edit framework” to build its pillars and node hierarchy." : "A Product Owner can build its pillars and node hierarchy."}
                  </div>
                )}

                {/* Pillars */}
                {frameworkPillars.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Pillars</p>
                    <div className="flex flex-wrap gap-2">
                      {frameworkPillars.map(p => (
                        <div key={p.id} className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-indigo-700 font-semibold">{p.pillar_ref}</span>
                            <span className="text-sm font-medium text-slate-800">{p.pillar_name}</span>
                          </div>
                          {p.pillar_desc && <p className="text-xs text-slate-500 mt-0.5">{p.pillar_desc}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Node type filter */}
                {typeOptions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Filter by type:</span>
                    <button onClick={() => setTypeFilter("all")} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${typeFilter === "all" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-300"}`}>All</button>
                    {typeOptions.map(t => (
                      <button key={t} onClick={() => setTypeFilter(t)} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${typeFilter === t ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-300"}`}>{t}</button>
                    ))}
                  </div>
                )}

                {/* Tree */}
                <div className="border-t pt-3 max-h-[60vh] overflow-y-auto">
                  <FrameworkNodeTree nodes={frameworkNodes} expanded={expanded} toggle={toggle} search={searchLower} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* All master frameworks index */}
          {!selectedFw && (
            <Card className="border-none shadow-lg">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" />All master library frameworks ({frameworks.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {frameworks.sort((a, b) => a.name.localeCompare(b.name)).map(f => (
                    <button
                      key={f.id}
                      onClick={() => { setSelectedFwId(f.id); setTypeFilter("all"); setExpanded(new Set()); }}
                      className="flex items-center gap-2 p-2 rounded-lg border border-transparent hover:bg-slate-50 hover:border-primary/30 text-left transition-colors"
                    >
                      <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{f.name}</p>
                        <p className="text-xs text-slate-400">{f.legacy_framework_id != null ? "Full hierarchy" : "Reference framework · click to build hierarchy"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
        <p className="text-xs text-slate-500">
          The master library is maintained by the Product Owner account. Companies create their own version of a framework by adding a Knowledge Article linked to a framework — see Knowledge Management. Product Owner accounts can never be associated with a company.
        </p>
      </div>

      {isMaintainer && (
        <FrameworkUploadWizard
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          frameworks={frameworks}
          onDone={refetchLibrary}
        />
      )}

      {isMaintainer && selectedFw && (
        <FrameworkEditDialog
          open={editOpen}
          framework={selectedFw}
          pillars={frameworkPillars}
          nodes={nodes.filter(n => n.framework_id === selectedFw.id)}
          nodeTypes={nodeTypes}
          onClose={() => setEditOpen(false)}
          onChanged={refetchLibrary}
        />
      )}
    </div>
  );
}
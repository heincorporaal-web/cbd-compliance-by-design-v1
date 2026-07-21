import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useIsImplementerRole } from "@/hooks/useIsImplementerRole";
import { CURATED_PLAYBOOKS, ADMIN_PLAYBOOK_CATEGORIES } from "@/lib/adminPlaybooks";
import AdminPlaybookEditor from "@/components/admin/AdminPlaybookEditor";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import PageHeader from "@/components/layout/PageHeader";
import {
  BookOpen, Search, PlusCircle, Pencil, RotateCcw, Lock, X,
  Palette, GitBranch, Upload, Hash, Library, Workflow, Users, HelpCircle,
} from "lucide-react";

const CATEGORY_ICONS = {
  "Custom Icons": Palette,
  "Workflows": GitBranch,
  "Bulk Imports": Upload,
  "Auto-Numbering": Hash,
  "Framework Library": Library,
  "Process Modelling": Workflow,
  "Stakeholders": Users,
  "General": HelpCircle,
};

// Merge curated baseline with entity overrides + standalone entity records.
function mergePlaybooks(curated, records) {
  const byKey = {};
  for (const r of records) {
    if (r.playbook_key) byKey[r.playbook_key] = r;
  }
  const merged = [];
  // curated, possibly overridden
  for (const c of curated) {
    const ov = byKey[c.key];
    if (ov) {
      if (ov.is_active === false) continue; // override hides curated
      merged.push({
        ...c,
        ...ov,
        title: ov.title || c.title,
        summary: ov.summary ?? c.summary,
        content: ov.content || c.content,
        format_spec: ov.format_spec ?? c.format_spec,
        steps: ov.steps?.length ? ov.steps : c.steps,
        _overridden: true,
        _entityId: ov.id,
      });
    } else {
      merged.push({ ...c, _curated: true });
    }
  }
  // standalone entity records (no matching curated key)
  for (const r of records) {
    if (!r.playbook_key || !CURATED_PLAYBOOKS.some((c) => c.key === r.playbook_key)) {
      if (r.is_active === false) continue;
      merged.push({ ...r, _standalone: true, _entityId: r.id });
    }
  }
  return merged.sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100));
}

export default function AdminPlaybooks() {
  const { user } = useAuth();
  const { canImport } = useIsImplementerRole();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";
  const canView = isAdmin || canImport;

  const [activeCat, setActiveCat] = useState("Custom Icons");
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorInit, setEditorInit] = useState(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["adminPlaybooks"],
    queryFn: () => base44.entities.AdminPlaybook.list("-updated_date", 500),
  });

  const merged = useMemo(() => mergePlaybooks(CURATED_PLAYBOOKS, records), [records]);

  const byCategory = useMemo(() => {
    const map = {};
    for (const p of merged) (map[p.category] ||= []).push(p);
    return map;
  }, [merged]);

  const visibleCats = ADMIN_PLAYBOOK_CATEGORIES.filter((c) => byCategory[c]?.length);

  const filtered = useMemo(() => {
    let list = byCategory[activeCat] || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = merged.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.summary?.toLowerCase().includes(q) ||
          p.content?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [byCategory, activeCat, search, merged]);

  const selected = filtered.find((p) => pKey(p) === selectedKey) || filtered[0];

  const invalidate = () => queryClient.invalidateQueries(["adminPlaybooks"]);

  const openNew = () => {
    setEditorInit({ category: activeCat });
    setEditorOpen(true);
  };
  const openEdit = (p) => {
    setEditorInit({
      id: p._entityId,
      playbook_key: p.playbook_key || p.key,
      title: p.title,
      category: p.category,
      summary: p.summary,
      content: p.content,
      format_spec: p.format_spec,
      steps: p.steps,
      sort_order: p.sort_order ?? 100,
      is_active: p.is_active !== false,
    });
    setEditorOpen(true);
  };

  const save = async (draft) => {
    const payload = {
      ...draft,
      playbook_key: draft.playbook_key || undefined,
      updated_by: user?.full_name || user?.email || "admin",
    };
    if (draft.id) await base44.entities.AdminPlaybook.update(draft.id, payload);
    else await base44.entities.AdminPlaybook.create(payload);
    setEditorOpen(false);
    invalidate();
  };

  const remove = async (p) => {
    if (!p._entityId) return;
    await base44.entities.AdminPlaybook.delete(p._entityId);
    setEditorOpen(false);
    invalidate();
  };

  const resetCurated = async (p) => {
    const ov = records.find((r) => r.playbook_key === (p.playbook_key || p.key));
    if (ov) {
      await base44.entities.AdminPlaybook.delete(ov.id);
      invalidate();
    }
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-slate-500">
        <div className="text-center">
          <Lock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">Admin Playbooks are restricted.</p>
          <p className="text-sm">Visible to Admins, Implementers, and Product Owners.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="px-6 pt-6 pb-3 border-b border-slate-200 bg-white">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            navItemId="admin_playbooks"
            icon={BookOpen}
            title="Admin Playbooks"
            tagline="Step-by-step configuration guidance — custom icons, workflows, bulk imports, and more."
            gradient="from-slate-600 to-slate-800"
          />
          {isAdmin && (
            <Button onClick={openNew} className="bg-primary text-white">
              <PlusCircle className="w-4 h-4 mr-1" /> New playbook
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left: categories + search */}
        <div className="w-64 shrink-0 border-r border-slate-200 bg-slate-50/50 flex flex-col">
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search playbooks…"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {search.trim() ? (
              <div className="px-2">
                <p className="px-2 py-1 text-xs font-semibold uppercase text-slate-400">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </p>
                {filtered.map((p) => (
                  <PlaybookListItem
                    key={pKey(p)}
                    p={p}
                    active={pKey(selected) === pKey(p)}
                    onClick={() => setSelectedKey(pKey(p))}
                  />
                ))}
              </div>
            ) : (
              visibleCats.map((cat) => {
                const Icon = CATEGORY_ICONS[cat] || HelpCircle;
                const items = byCategory[cat] || [];
                return (
                  <div key={cat} className="mb-1">
                    <button
                      onClick={() => setActiveCat(cat)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                        activeCat === cat ? "text-primary" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="flex-1 text-left">{cat}</span>
                      <span className="text-slate-400 font-normal">{items.length}</span>
                    </button>
                    {activeCat === cat && (
                      <div className="ml-2 border-l-2 border-slate-200 pl-1.5 space-y-0.5">
                        {items.map((p) => (
                          <PlaybookListItem
                            key={pKey(p)}
                            p={p}
                            active={pKey(selected) === pKey(p)}
                            onClick={() => setSelectedKey(pKey(p))}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: content viewer */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-slate-400">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
            </div>
          ) : !selected ? (
            <div className="text-center text-slate-400 mt-20">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p>No playbook selected.</p>
            </div>
          ) : (
            <PlaybookView p={selected} isAdmin={isAdmin} onEdit={openEdit} onReset={resetCurated} />
          )}
        </div>
      </div>

      {editorOpen && (
        <AdminPlaybookEditor
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSave={save}
          onDelete={remove}
          initial={editorInit}
          lockCategory={editorInit?.category && !editorInit?.id && !editorInit?.playbook_key ? undefined : undefined}
        />
      )}
    </div>
  );
}

function pKey(p) {
  return p._entityId || p.playbook_key || p.key || p.title;
}

function PlaybookListItem({ p, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active ? "bg-primary/10 text-primary font-medium" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span className="flex items-center gap-1.5">
        <span className="truncate">{p.title}</span>
        {p._overridden && <span className="text-[10px] text-amber-500" title="Curated, with edits">●</span>}
        {p._standalone && <span className="text-[10px] text-secondary" title="Custom">●</span>}
      </span>
    </button>
  );
}

function PlaybookView({ p, isAdmin, onEdit, onReset }) {
  const isOverriddenCurated = p._overridden;
  const isPureCurated = p._curated;
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary/70">{p.category}</span>
            {isOverriddenCurated && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">edited</span>
            )}
            {isPureCurated && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">curated</span>
            )}
            {p._standalone && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary">custom</span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{p.title}</h2>
          {p.summary && <p className="text-slate-500 mt-1">{p.summary}</p>}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            {isOverriddenCurated && (
              <Button variant="outline" size="sm" onClick={() => onReset(p)}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            )}
            <Button size="sm" onClick={() => onEdit(p)}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>
        )}
      </div>

      {p.format_spec && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Format / specification</p>
          <p className="text-sm text-slate-700">{p.format_spec}</p>
        </div>
      )}

      {p.steps?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Steps</h3>
          <ol className="space-y-3">
            {p.steps.map((s, i) => (
              <li key={s.id || i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-slate-800">{s.title}</p>
                  {s.detail && <p className="text-sm text-slate-600 mt-0.5">{s.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {p.content && (
        <div className="prose prose-slate prose-sm max-w-none">
          <ReactMarkdown>{p.content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
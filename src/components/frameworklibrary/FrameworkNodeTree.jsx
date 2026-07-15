import React from "react";
import { ChevronRight, ChevronDown, FileText } from "lucide-react";

const TYPE_COLORS = {
  Domain: "bg-indigo-100 text-indigo-700",
  Chapter: "bg-blue-100 text-blue-700",
  Section: "bg-cyan-100 text-cyan-700",
  Clause: "bg-teal-100 text-teal-700",
  Article: "bg-emerald-100 text-emerald-700",
  Requirement: "bg-violet-100 text-violet-700",
  Control: "bg-rose-100 text-rose-700",
};

export default function FrameworkNodeTree({ nodes, parentId = null, depth = 0, expanded, toggle, search }) {
  const children = nodes
    .filter(n => (n.parent_id || null) === (parentId || null))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || String(a.node_code || "").localeCompare(String(b.node_code || "")));
  if (!children.length) return null;

  return (
    <div className={depth === 0 ? "" : "ml-3 border-l border-slate-200 pl-1"}>
      {children.map(node => {
        const childCount = nodes.filter(n => n.parent_id === node.id).length;
        const isOpen = expanded.has(node.id);
        const isMatch = search && (
          (node.node_title || "").toLowerCase().includes(search) ||
          (node.node_code || "").toLowerCase().includes(search) ||
          (node.node_text || "").toLowerCase().includes(search) ||
          (node.external_ref || "").toLowerCase().includes(search)
        );
        const showBody = isOpen || childCount === 0;
        return (
          <div key={node.id} className="py-0.5">
            <div className={`flex items-start gap-2 rounded-md px-2 py-1.5 ${isMatch ? "bg-amber-50 ring-1 ring-amber-300" : "hover:bg-slate-50"}`}>
              <button onClick={() => toggle(node.id)} className="mt-0.5 shrink-0" aria-label="toggle">
                {childCount > 0 ? (isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />) : <FileText className="w-4 h-4 text-slate-300" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {node.node_code && <span className="font-mono text-xs font-semibold text-slate-700">{node.node_code}</span>}
                  <span className="text-sm font-medium text-slate-800">{node.node_title}</span>
                  {node.external_ref && <span className="text-xs text-slate-400">· {node.external_ref}</span>}
                  {node.node_type_name && <span className={`text-[10px] px-1.5 py-0.5 rounded ${TYPE_COLORS[node.node_type_name] || "bg-slate-100 text-slate-600"}`}>{node.node_type_name}</span>}
                  {node.is_mandatory && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600">Mandatory</span>}
                  {childCount > 0 && <span className="text-xs text-slate-400">{childCount}</span>}
                </div>
                {node.node_text && showBody && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{node.node_text}</p>}
                {node.guidance_text && showBody && <p className="text-xs text-slate-400 mt-0.5 italic">Guidance: {node.guidance_text}</p>}
                {node.key_aspects && showBody && <p className="text-xs text-slate-400 mt-0.5">Key aspects: {node.key_aspects}</p>}
              </div>
            </div>
            {childCount > 0 && isOpen && (
              <FrameworkNodeTree nodes={nodes} parentId={node.id} depth={depth + 1} expanded={expanded} toggle={toggle} search={search} />
            )}
          </div>
        );
      })}
    </div>
  );
}
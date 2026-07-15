import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import FrameworkNodeFormDialog from "./FrameworkNodeFormDialog";

const blank = (frameworkId, parentId, parentLevel) => ({
  framework_id: frameworkId,
  parent_id: parentId || null,
  legacy_node_type_id: null,
  node_type_name: "",
  node_code: "",
  node_title: "",
  node_text: "",
  guidance_text: "",
  key_aspects: "",
  external_ref: "",
  reference_url: "",
  sort_order: 0,
  level_no: parentId ? (parentLevel || 2) + 1 : 2,
  is_leaf: true,
  is_mandatory: false,
});

function NodeRow({ node, allNodes, depth, expanded, toggle, onEdit, onAddChild, onDelete }) {
  const children = allNodes
    .filter((n) => n.parent_id === node.id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || String(a.node_code || "").localeCompare(String(b.node_code || "")));
  const isOpen = expanded.has(node.id);
  return (
    <div className={depth > 0 ? "ml-3 border-l border-slate-200 pl-1" : ""}>
      <div className="flex items-start gap-2 group rounded-md px-2 py-1 hover:bg-slate-50">
        <button onClick={() => toggle(node.id)} className="mt-0.5 shrink-0" aria-label="toggle">
          {children.length > 0 ? (isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />) : <FileText className="w-4 h-4 text-slate-300" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {node.node_code && <span className="font-mono text-xs font-semibold text-slate-700">{node.node_code}</span>}
            <span className="text-sm font-medium text-slate-800 truncate">{node.node_title}</span>
            {node.node_type_name && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{node.node_type_name}</span>}
            {node.is_mandatory && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600">Mandatory</span>}
            {children.length > 0 && <span className="text-xs text-slate-400">{children.length}</span>}
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onAddChild(node)} title="Add child" className="p-1 rounded hover:bg-slate-200"><Plus className="w-3.5 h-3.5 text-slate-600" /></button>
          <button onClick={() => onEdit(node)} title="Edit" className="p-1 rounded hover:bg-slate-200"><Pencil className="w-3.5 h-3.5 text-slate-600" /></button>
          <button onClick={() => onDelete(node)} title="Delete" className="p-1 rounded hover:bg-red-100"><Trash2 className="w-3.5 h-3.5 text-red-600" /></button>
        </div>
      </div>
      {children.length > 0 && isOpen && children.map((c) => (
        <NodeRow key={c.id} node={c} allNodes={allNodes} depth={depth + 1} expanded={expanded} toggle={toggle} onEdit={onEdit} onAddChild={onAddChild} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function FrameworkNodesEditor({ frameworkId, nodes, nodeTypes, onChanged }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(() => new Set());
  const [editing, setEditing] = useState(null); // { open, initial }

  const toggle = (id) => setExpanded((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const roots = nodes
    .filter((n) => !n.parent_id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || String(a.node_code || "").localeCompare(String(b.node_code || "")));

  const openAdd = (parentId = null, parentLevel = null) => setEditing({ open: true, initial: blank(frameworkId, parentId, parentLevel) });
  const openEdit = (node) => setEditing({ open: true, initial: { ...node } });
  const close = () => setEditing(null);

  const remove = async (node) => {
    const childCount = nodes.filter((n) => n.parent_id === node.id).length;
    const msg = childCount > 0
      ? `Delete "${node.node_title}" and its ${childCount} child node(s)? This cannot be undone.`
      : `Delete "${node.node_title}"?`;
    if (!window.confirm(msg)) return;
    try {
      const byParent = {};
      nodes.forEach((n) => { (byParent[n.parent_id] ||= []).push(n); });
      const toDelete = [];
      const stack = [node.id];
      while (stack.length) { const cur = stack.pop(); toDelete.push(cur); (byParent[cur] || []).forEach((c) => stack.push(c.id)); }
      for (const id of toDelete) await base44.entities.FrameworkNode.delete(id);
      toast({ title: "Node deleted" });
      onChanged?.();
    } catch (e) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{nodes.length} node{nodes.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setExpanded(new Set(nodes.map((n) => n.id)))}><ChevronDown className="w-4 h-4 mr-1" />Expand all</Button>
          <Button size="sm" onClick={() => openAdd(null, 2)}><Plus className="w-4 h-4 mr-1" />Add root node</Button>
        </div>
      </div>
      {roots.length === 0 ? (
        <p className="text-sm text-slate-400 italic text-center py-6">No nodes yet. Add a root node to start building the hierarchy.</p>
      ) : (
        <div className="border rounded-lg max-h-[55vh] overflow-y-auto p-2 bg-white">
          {roots.map((r) => (
            <NodeRow key={r.id} node={r} allNodes={nodes} depth={0} expanded={expanded} toggle={toggle}
              onEdit={openEdit} onAddChild={(parent) => openAdd(parent.id, parent.level_no)} onDelete={remove} />
          ))}
        </div>
      )}
      {editing?.open && (
        <FrameworkNodeFormDialog
          initial={editing.initial}
          frameworkId={frameworkId}
          nodes={nodes}
          nodeTypes={nodeTypes}
          onClose={close}
          onSaved={onChanged}
        />
      )}
    </div>
  );
}
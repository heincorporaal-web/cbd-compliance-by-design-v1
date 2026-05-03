import React, { useState, useCallback, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Server, AlertTriangle, ZoomIn, ZoomOut, Maximize2, Info } from "lucide-react";

const LEVEL_COLORS = {
  0: { bg: "#7c3aed", text: "#fff", border: "#6d28d9", light: "#ede9fe" },
  1: { bg: "#1d4ed8", text: "#fff", border: "#1e40af", light: "#dbeafe" },
  2: { bg: "#0369a1", text: "#fff", border: "#075985", light: "#e0f2fe" },
  3: { bg: "#0f766e", text: "#fff", border: "#0d6b62", light: "#ccfbf1" },
  4: { bg: "#15803d", text: "#fff", border: "#14532d", light: "#dcfce7" },
  5: { bg: "#a16207", text: "#fff", border: "#92400e", light: "#fef9c3" },
  6: { bg: "#b45309", text: "#fff", border: "#92400e", light: "#ffedd5" },
};

const CRITICALITY_COLORS = {
  critical: { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
  high:     { bg: "#ffedd5", border: "#fdba74", text: "#9a3412" },
  medium:   { bg: "#fef9c3", border: "#fde047", text: "#854d0e" },
  low:      { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
};

const NODE_W = 200;
const NODE_H = 70;
const H_GAP = 60;
const V_GAP = 40;

function buildTree(rootId, allProcesses) {
  const map = {};
  allProcesses.forEach(p => { map[p.id] = { ...p, children: [] }; });
  allProcesses.forEach(p => {
    if (p.parent_id && map[p.parent_id]) map[p.parent_id].children.push(map[p.id]);
  });

  // Start from rootId and collect subtree
  const root = map[rootId];
  if (!root) return null;
  return root;
}

function layoutTree(node, x = 0, y = 0) {
  // Returns { node with x,y, subtreeWidth }
  node.x = x;
  node.y = y;

  if (!node.children || node.children.length === 0) {
    node.subtreeWidth = NODE_W;
    return node;
  }

  let totalWidth = 0;
  const childY = y + NODE_H + V_GAP;
  node.children.forEach(child => {
    layoutTree(child, x + totalWidth, childY);
    totalWidth += child.subtreeWidth + H_GAP;
  });
  totalWidth -= H_GAP;

  // Center parent over children
  const firstChild = node.children[0];
  const lastChild = node.children[node.children.length - 1];
  node.x = (firstChild.x + lastChild.x + NODE_W) / 2 - NODE_W / 2;
  node.subtreeWidth = Math.max(totalWidth, NODE_W);
  return node;
}

function collectNodes(node, nodes = [], edges = []) {
  nodes.push(node);
  (node.children || []).forEach(child => {
    edges.push({ from: node, to: child });
    collectNodes(child, nodes, edges);
  });
  return { nodes, edges };
}

function ProcessNode({ node, systems, selected, onClick }) {
  const color = LEVEL_COLORS[node.level] || LEVEL_COLORS[2];
  const crit = CRITICALITY_COLORS[node.criticality];
  const linkedSystems = (systems || []).filter(s => node.linked_system_ids?.includes(s.id));
  const isSelected = selected === node.id;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onClick={() => onClick(node)}
      style={{ cursor: "pointer" }}
    >
      {/* Shadow */}
      <rect x={3} y={3} width={NODE_W} height={NODE_H} rx={8} fill="rgba(0,0,0,0.08)" />
      {/* Main box */}
      <rect
        width={NODE_W} height={NODE_H} rx={8}
        fill={isSelected ? color.light : "#fff"}
        stroke={isSelected ? color.bg : (crit?.border || color.border)}
        strokeWidth={isSelected ? 2.5 : 1.5}
      />
      {/* Left color bar */}
      <rect width={6} height={NODE_H} rx={4} fill={color.bg} />
      <rect x={0} y={NODE_H / 2} width={6} height={NODE_H / 2} fill={color.bg} />

      {/* Level badge */}
      <rect x={10} y={8} width={24} height={14} rx={4} fill={color.bg} />
      <text x={22} y={19} textAnchor="middle" fontSize={9} fontWeight="700" fill={color.text}>L{node.level}</text>

      {/* Code */}
      <text x={40} y={19} fontSize={9} fill="#64748b" fontFamily="monospace">{node.process_code}</text>

      {/* Name — wrap if needed */}
      <foreignObject x={10} y={25} width={NODE_W - 18} height={32}>
        <div xmlns="http://www.w3.org/1999/xhtml"
          style={{ fontSize: 11, fontWeight: 600, color: "#0f172a", lineHeight: "1.3", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {node.name}
        </div>
      </foreignObject>

      {/* Icons bottom-right */}
      {linkedSystems.length > 0 && (
        <g transform={`translate(${NODE_W - 30}, ${NODE_H - 16})`}>
          <rect width={26} height={13} rx={3} fill="#ccfbf1" />
          <text x={4} y={10} fontSize={8} fill="#0f766e">⬡ {linkedSystems.length}</text>
        </g>
      )}
      {(node.linked_risk_ids?.length || 0) > 0 && (
        <g transform={`translate(${NODE_W - 60}, ${NODE_H - 16})`}>
          <rect width={26} height={13} rx={3} fill="#ffedd5" />
          <text x={4} y={10} fontSize={8} fill="#9a3412">⚠ {node.linked_risk_ids.length}</text>
        </g>
      )}
    </g>
  );
}

function SystemNode({ sys, x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={130} height={44} rx={6} fill="#f0fdf4" stroke="#86efac" strokeWidth={1.5} strokeDasharray="4 2" />
      <text x={8} y={14} fontSize={9} fill="#15803d" fontWeight="600">⬡ ICT System</text>
      <foreignObject x={8} y={18} width={114} height={22}>
        <div xmlns="http://www.w3.org/1999/xhtml"
          style={{ fontSize: 10, fontWeight: 600, color: "#14532d", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {sys.name}
        </div>
      </foreignObject>
    </g>
  );
}

export default function ProcessFlowChart({ rootProcess, allProcesses, systems }) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 40, y: 40 });
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const svgRef = useRef();

  const tree = rootProcess ? buildTree(rootProcess.id, allProcesses) : null;
  if (tree) layoutTree(tree);

  const { nodes, edges } = tree ? collectNodes(tree) : { nodes: [], edges: [] };

  // Collect system nodes for selected process
  const selectedProcess = nodes.find(n => n.id === selected);
  const selectedSystems = selectedProcess
    ? (systems || []).filter(s => selectedProcess.linked_system_ids?.includes(s.id))
    : [];

  // Canvas dimensions
  const maxX = nodes.length ? Math.max(...nodes.map(n => n.x + NODE_W)) + 60 : 800;
  const maxY = nodes.length ? Math.max(...nodes.map(n => n.y + NODE_H)) + 80 : 400;
  const svgW = Math.max(maxX, 600);
  const svgH = Math.max(maxY, 300);

  const handleMouseDown = (e) => {
    if (e.target.closest("g")) return;
    setDragging(true);
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    setTranslate({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);

  const fitView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 40, y: 40 });
  }, []);

  if (!rootProcess) return (
    <div className="text-center py-16 text-slate-400">
      <p className="text-sm">Save the process first to view the flow chart.</p>
    </div>
  );

  if (nodes.length <= 1 && selectedSystems.length === 0) return (
    <div className="text-center py-16 text-slate-400">
      <Server className="w-10 h-10 mx-auto mb-2 opacity-30" />
      <p className="text-sm">No child processes found. Add sub-processes to visualize the flow.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setScale(s => Math.min(s + 0.15, 2))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setScale(s => Math.max(s - 0.15, 0.3))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={fitView}>
            <Maximize2 className="w-4 h-4" />
          </Button>
          <span className="text-xs text-slate-500">{Math.round(scale * 100)}%</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-blue-600" /> Process</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-green-200 border border-green-400" style={{borderStyle:"dashed"}} /> ICT System</span>
          <span className="flex items-center gap-1">Click a node for details</span>
        </div>
      </div>

      <div className="flex gap-4">
        {/* SVG Canvas */}
        <div
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden"
          style={{ height: 480, cursor: dragging ? "grabbing" : "grab" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ userSelect: "none" }}
          >
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <g transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}>
              {/* Edges */}
              {edges.map((e, i) => {
                const x1 = e.from.x + NODE_W / 2;
                const y1 = e.from.y + NODE_H;
                const x2 = e.to.x + NODE_W / 2;
                const y2 = e.to.y;
                const midY = (y1 + y2) / 2;
                return (
                  <path
                    key={i}
                    d={`M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    markerEnd="url(#arrow)"
                  />
                );
              })}

              {/* Arrow marker */}
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                  <path d="M1,1 L7,4 L1,7 Z" fill="#94a3b8" />
                </marker>
              </defs>

              {/* System connections for selected */}
              {selectedProcess && selectedSystems.map((sys, i) => {
                const sysX = selectedProcess.x + NODE_W + 30;
                const sysY = selectedProcess.y + i * 54;
                return (
                  <g key={sys.id}>
                    <line
                      x1={selectedProcess.x + NODE_W} y1={selectedProcess.y + NODE_H / 2}
                      x2={sysX} y2={sysY + 22}
                      stroke="#86efac" strokeWidth={1.5} strokeDasharray="4 3"
                    />
                    <SystemNode sys={sys} x={sysX} y={sysY} />
                  </g>
                );
              })}

              {/* Process Nodes */}
              {nodes.map(node => (
                <ProcessNode
                  key={node.id}
                  node={node}
                  systems={systems}
                  selected={selected}
                  onClick={n => setSelected(s => s === n.id ? null : n.id)}
                />
              ))}
            </g>
          </svg>
        </div>

        {/* Detail Panel */}
        {selectedProcess && (
          <div className="w-64 shrink-0 bg-white border border-slate-200 rounded-xl p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 480 }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <Badge style={{ backgroundColor: LEVEL_COLORS[selectedProcess.level]?.bg, color: "#fff" }} className="text-xs mb-1">
                  L{selectedProcess.level}
                </Badge>
                <p className="font-mono text-xs text-slate-500">{selectedProcess.process_code}</p>
                <p className="font-semibold text-slate-900 text-sm mt-1">{selectedProcess.name}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>

            {selectedProcess.description && (
              <p className="text-xs text-slate-600 leading-relaxed">{selectedProcess.description}</p>
            )}

            <div className="space-y-1.5 text-xs">
              {selectedProcess.criticality && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Criticality</span>
                  <Badge variant="outline" className="text-xs" style={{
                    backgroundColor: CRITICALITY_COLORS[selectedProcess.criticality]?.bg,
                    borderColor: CRITICALITY_COLORS[selectedProcess.criticality]?.border,
                    color: CRITICALITY_COLORS[selectedProcess.criticality]?.text,
                  }}>{selectedProcess.criticality}</Badge>
                </div>
              )}
              {selectedProcess.status && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-medium capitalize">{selectedProcess.status.replace("_", " ")}</span>
                </div>
              )}
              {selectedProcess.process_owner && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Owner</span>
                  <span className="font-medium truncate max-w-[110px]">{selectedProcess.process_owner}</span>
                </div>
              )}
              {selectedProcess.automation_level && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Automation</span>
                  <span className="font-medium capitalize">{selectedProcess.automation_level.replace("_", " ")}</span>
                </div>
              )}
            </div>

            {selectedSystems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1.5">ICT Systems ({selectedSystems.length})</p>
                <div className="space-y-1.5">
                  {selectedSystems.map(sys => (
                    <div key={sys.id} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-2 py-1.5">
                      <Server className="w-3 h-3 text-green-700 shrink-0" />
                      <span className="text-xs font-medium text-green-900 truncate">{sys.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(selectedProcess.linked_risk_ids?.length || 0) > 0 && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5">
                <AlertTriangle className="w-3 h-3 text-orange-600 shrink-0" />
                <span className="text-xs text-orange-800">{selectedProcess.linked_risk_ids.length} linked risk{selectedProcess.linked_risk_ids.length > 1 ? "s" : ""}</span>
              </div>
            )}

            <Link
              to={createPageUrl(`ProcessManagementDetail?id=${selectedProcess.id}`)}
              className="block w-full text-center text-xs bg-primary text-white rounded-lg py-2 hover:opacity-90 transition-opacity"
            >
              Open Process →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
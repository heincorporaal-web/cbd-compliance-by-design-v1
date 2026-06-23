import React, { useState } from "react";
import { getSymbolColor, getTextColor, SYMBOL_COLORS, SYMBOL_LABELS } from "./ihpomColors";

export default function IHPOMPeriodicTable({ nodes }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const level1 = nodes.filter(n => n.level === 1);
  const level2 = nodes.filter(n => n.level === 2);

  // Build parent_id -> parent symbol map
  const parentIdToSymbol = {};
  for (const n of level1) {
    parentIdToSymbol[n.id] = n.symbol;
  }

  // Group level 2 nodes by parent
  const columns = level1
    .filter(n => n.symbol) // skip root node
    .map(parent => {
      const children = level2
        .filter(c => c.parent_id === parent.id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      return { parent, children };
    })
    .filter(col => col.children.length > 0);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {Object.entries(SYMBOL_COLORS).map(([symbol, color]) => (
          <div key={symbol} className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-slate-600">{SYMBOL_LABELS[symbol]}</span>
          </div>
        ))}
      </div>

      {/* Periodic Table Grid */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-2 min-w-max justify-center px-2">
          {columns.map(({ parent, children }) => {
            const color = getSymbolColor(parent.symbol);
            const headerTextColor = getTextColor(color);

            return (
              <div key={parent.id} className="flex flex-col gap-1.5 w-[130px]">
                {/* Column header (parent) */}
                <div
                  className="rounded-tl-lg rounded-br-lg p-2 text-center shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: color, color: headerTextColor }}
                  onClick={() => setSelectedNode(parent)}
                  title={parent.name}
                >
                  <p className="text-base font-bold leading-none">{parent.symbol}</p>
                  <p className="text-[10px] leading-tight mt-1 opacity-90 line-clamp-2">
                    {SYMBOL_LABELS[parent.symbol?.toUpperCase()] || parent.name}
                  </p>
                </div>

                {/* Children cells */}
                {children.map(child => {
                  const childColor = getSymbolColor(parent.symbol);
                  const childTextColor = getTextColor(childColor);

                  return (
                    <div
                      key={child.id}
                      className="rounded-tl-md rounded-br-md p-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:scale-[1.03] transition-transform"
                      style={{ backgroundColor: childColor, color: childTextColor }}
                      onClick={() => setSelectedNode(child)}
                      title={child.name}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-bold leading-none">
                          {child.symbol || child.node_code}
                        </span>
                        <span className="text-[9px] font-mono opacity-70">{child.node_code}</span>
                      </div>
                      <p className="text-[10px] leading-tight line-clamp-3">
                        {child.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail popover */}
      {selectedNode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedNode(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {selectedNode.symbol || selectedNode.node_code}
                  </span>
                  <span className="text-sm font-mono text-slate-500">{selectedNode.node_code}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">{selectedNode.name}</h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none"
              >
                ×
              </button>
            </div>
            {selectedNode.description && (
              <p className="text-sm text-slate-600 leading-relaxed">{selectedNode.description}</p>
            )}
            {selectedNode.alias && (
              <p className="text-xs text-slate-500">Alias: {selectedNode.alias}</p>
            )}
            <div className="flex gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Level {selectedNode.level}</span>
              {selectedNode.sort_order != null && <span>Sort: {selectedNode.sort_order}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
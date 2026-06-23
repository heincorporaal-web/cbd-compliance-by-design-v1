import React from "react";
import { COLUMN_GROUPS, getSymbolColor, getTextColor, SYMBOL_LABELS } from "./ihpomColors";

export default function IHPOMLevel1View({ nodes }) {
  const level1 = nodes.filter(n => n.level === 1);

  const findNode = (symbol) =>
    level1.find(n => n.symbol && n.symbol.toUpperCase() === symbol);

  let globalSubIndex = 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">
          Integrated High Performance Organisational Model (iHPOM)
        </h2>
        <p className="text-sm font-semibold text-slate-500 tracking-wide mt-1">
          LEVEL 1: ORGANISATIONAL
        </p>
      </div>

      {/* Columnar layout */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-2 justify-center">
        {COLUMN_GROUPS.map((group, gIdx) => (
          <div
            key={group.title}
            className="flex flex-col items-center gap-3"
            style={{ marginTop: gIdx % 2 === 1 ? '1.5rem' : '0' }}
          >
            {/* Column header */}
            <div className="text-center mb-1">
              <p className="text-xs font-bold text-slate-700 tracking-wide uppercase leading-tight max-w-[140px]">
                {group.title}
              </p>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3 items-center">
              {group.symbols.map((symbol) => {
                const node = findNode(symbol);
                if (!node) return null;
                globalSubIndex++;
                const color = getSymbolColor(symbol);
                const textColor = getTextColor(color);
                const subIndex = `${gIdx + 1}.${group.symbols.indexOf(symbol) + 1}`;

                return (
                  <div
                    key={symbol}
                    className="relative w-[160px] rounded-tl-xl rounded-br-xl shadow-md hover:shadow-lg transition-shadow cursor-default overflow-hidden"
                    style={{ backgroundColor: color }}
                  >
                    <div className="p-3" style={{ color: textColor }}>
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-xs font-semibold opacity-80">{subIndex}</span>
                        <span className="text-lg font-bold leading-none">{symbol}</span>
                      </div>
                      <p className="text-xs font-medium leading-tight">
                        {SYMBOL_LABELS[symbol] || node.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
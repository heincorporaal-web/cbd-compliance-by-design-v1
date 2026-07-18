import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// MS Office "Standard Colors" row
const STANDARD_COLORS = [
  "#C00000", "#FF0000", "#FFC000", "#FFFF00", "#92D050",
  "#00B050", "#00B0F0", "#0070C0", "#002060", "#7030A0",
];

function parseHex(value) {
  if (!value) return null;
  const m = /^#?([a-f0-9]{6})$/i.exec(value.trim());
  if (!m) return null;
  const h = m[1];
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Returns a style object for a badge given a hex colour.
 * - Light backgrounds (e.g. yellow) keep a solid fill with dark text for legibility.
 * - Dark backgrounds are rendered as a transparent tint with the colour used as
 *   the text, so they stay readable and not too heavy.
 */
export function badgeStyleFromColor(color) {
  const rgb = parseHex(color);
  if (!rgb) return null;
  const { r, g, b } = rgb;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum < 0.5) {
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
      color: `rgb(${r}, ${g}, ${b})`,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.4)`,
    };
  }
  const hex = color.startsWith("#") ? color : `#${color}`;
  return {
    backgroundColor: hex,
    color: "#111111",
    borderColor: "transparent",
  };
}

const DEFAULT_BADGE_STYLE = { backgroundColor: "#f1f5f9", color: "#64748b", borderColor: "transparent" };

export default function ColorPicker({ value, onChange }) {
  const rgb = parseHex(value);
  const nativeValue = rgb ? `#${value.replace("#", "").padStart(6, "0").slice(0, 6)}` : "#000000";
  const sampleStyle = badgeStyleFromColor(value) || DEFAULT_BADGE_STYLE;
  const isDark = (() => {
    const s = badgeStyleFromColor(value);
    return s && s.backgroundColor.startsWith("rgba");
  })();

  const setFromRgb = (r, g, b) => {
    const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
    onChange(`#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase());
  };

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-3 bg-slate-50/50">
      {/* Standard colours */}
      <div>
        <Label className="text-xs text-slate-500">Standard colours</Label>
        <div className="grid grid-cols-10 gap-1 mt-1">
          {STANDARD_COLORS.map(c => (
            <button
              type="button"
              key={c}
              onClick={() => onChange(c)}
              className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${
                (value || "").toUpperCase() === c ? "ring-2 ring-offset-1 ring-slate-900 border-slate-900" : "border-slate-300"
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Mix your own + hex */}
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Pick a colour</Label>
          <input
            type="color"
            value={nativeValue}
            onChange={e => onChange(e.target.value.toUpperCase())}
            className="w-9 h-9 rounded border border-slate-300 cursor-pointer p-0 bg-white"
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-slate-500">Hex</Label>
          <Input
            value={value || ""}
            onChange={e => onChange(e.target.value.toUpperCase())}
            placeholder="#0070C0"
            className="font-mono"
          />
        </div>
      </div>

      {/* RGB inputs */}
      <div className="grid grid-cols-3 gap-2">
        {["r", "g", "b"].map((ch) => (
          <div key={ch} className="space-y-1">
            <Label className="text-xs text-slate-500 uppercase">{ch}</Label>
            <Input
              type="number"
              min={0}
              max={255}
              value={rgb ? rgb[ch] : ""}
              onChange={e => {
                const n = parseInt(e.target.value) || 0;
                const cur = rgb || { r: 0, g: 0, b: 0 };
                setFromRgb(ch === "r" ? n : cur.r, ch === "g" ? n : cur.g, ch === "b" ? n : cur.b);
              }}
            />
          </div>
        ))}
      </div>

      {/* Sample preview */}
      <div className="flex items-center gap-2 pt-1">
        <Label className="text-xs text-slate-500">Sample</Label>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded border"
          style={sampleStyle}
        >
          {value ? "ABC-Code" : "No colour"}
        </span>
        {isDark && (
          <span className="text-xs text-slate-400 italic">
            Dark colour — shown as a transparent tint
          </span>
        )}
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-xs text-slate-400 hover:text-slate-600 ml-auto">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { X, Paintbrush, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

/**
 * Derives a set of BPMN element colour roles from a brand palette.
 *   primary   → task/activity fill
 *   secondary → gateway fill
 *   accent    → pool/lane header
 *   background → event fill
 */
function deriveTheme(name, colors) {
  const p = colors.primary || "#1e5c7d";
  const s = colors.secondary || "#2b8cac";
  const a = colors.accent || "#0ea5e9";
  const bg = colors.background || "#f0f9ff";
  // Wash out a colour for fills: convert to HSL, clamp saturation low and lightness high
  // so text on top stays readable regardless of how vivid the brand colour is.
  const washOut = (hex, { maxSat = 30, lightness = 93 } = {}) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    s = Math.min(s * 100, maxSat);
    const L = Math.max(l * 100, lightness);
    const c = (v) => {
      const k = (n) => (n + h * 12) % 12;
      const a = s * Math.min(L, 100 - L) / 100;
      return Math.round(255 * (L / 100 - a * Math.max(-1, Math.min(k(0) - 3, Math.min(9 - k(0), 1)))));
    };
    const toHex = (n) => c(n).toString(16).padStart(2, "0");
    return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
  };
  return {
    name,
    task:       { fill: washOut(p, { maxSat: 30, lightness: 92 }), stroke: p },
    gateway:    { fill: washOut(s, { maxSat: 30, lightness: 92 }), stroke: s },
    event:      { fill: washOut(a, { maxSat: 25, lightness: 94 }), stroke: a },
    pool:       { fill: washOut(p, { maxSat: 20, lightness: 95 }), stroke: p },
    lane:       { fill: washOut(p, { maxSat: 15, lightness: 96 }), stroke: p },
    annotation: { fill: bg, stroke: "#94a3b8" },
    data:       { fill: "#ffffff", stroke: "#64748b" },
    default:    { fill: "#ffffff", stroke: "#6b7280" },
  };
}

/** CBD built-in themes (no brand colours needed). */
const BUILTIN_THEMES = [
  {
    name: "CBD Default",
    task:       { fill: "#dbeafe", stroke: "#1e40af" },
    gateway:    { fill: "#d1fae5", stroke: "#065f46" },
    event:      { fill: "#fef3c7", stroke: "#92400e" },
    pool:       { fill: "#eff6ff", stroke: "#1e40af" },
    lane:       { fill: "#f8fafc", stroke: "#94a3b8" },
    annotation: { fill: "#f8fafc", stroke: "#94a3b8" },
    data:       { fill: "#ffffff", stroke: "#64748b" },
    default:    { fill: "#ffffff", stroke: "#6b7280" },
  },
  {
    name: "Monochrome",
    task:       { fill: "#f1f5f9", stroke: "#334155" },
    gateway:    { fill: "#e2e8f0", stroke: "#334155" },
    event:      { fill: "#f8fafc", stroke: "#64748b" },
    pool:       { fill: "#f1f5f9", stroke: "#334155" },
    lane:       { fill: "#f8fafc", stroke: "#94a3b8" },
    annotation: { fill: "#f8fafc", stroke: "#94a3b8" },
    data:       { fill: "#ffffff", stroke: "#64748b" },
    default:    { fill: "#ffffff", stroke: "#6b7280" },
  },
  {
    name: "Reset (No fill)",
    task:       { fill: "#ffffff", stroke: "#000000" },
    gateway:    { fill: "#ffffff", stroke: "#000000" },
    event:      { fill: "#ffffff", stroke: "#000000" },
    pool:       { fill: "#ffffff", stroke: "#000000" },
    lane:       { fill: "#ffffff", stroke: "#000000" },
    annotation: { fill: "#ffffff", stroke: "#000000" },
    data:       { fill: "#ffffff", stroke: "#000000" },
    default:    { fill: "#ffffff", stroke: "#000000" },
  },
];

/** Returns the colour role for a given bpmn-js element. */
function roleForElement(el) {
  const t = el?.type || "";
  if (t === "bpmn:Task" || t.endsWith("Task") || t === "bpmn:CallActivity" || t === "bpmn:AdHocSubProcess" || t === "bpmn:Transaction") return "task";
  if (t === "bpmn:SubProcess") return "task";
  if (t.endsWith("Gateway")) return "gateway";
  if (t === "bpmn:StartEvent" || t === "bpmn:EndEvent" || t.includes("CatchEvent") || t.includes("ThrowEvent") || t === "bpmn:BoundaryEvent") return "event";
  if (t === "bpmn:Participant") return "pool";
  if (t === "bpmn:Lane") return "lane";
  if (t === "bpmn:TextAnnotation" || t === "bpmn:Group") return "annotation";
  if (t === "bpmn:DataObjectReference" || t === "bpmn:DataStoreReference") return "data";
  return null; // flows / labels — skip
}

/** Preview swatch row for a theme. */
function ThemePreview({ theme }) {
  const swatches = [
    { label: "Task", ...theme.task },
    { label: "GW", ...theme.gateway },
    { label: "Event", ...theme.event },
    { label: "Pool", ...theme.pool },
  ];
  return (
    <div className="flex gap-1 mt-1">
      {swatches.map((s) => (
        <div
          key={s.label}
          title={s.label}
          className="w-8 h-5 rounded border text-[9px] flex items-center justify-center font-medium"
          style={{ background: s.fill, borderColor: s.stroke, color: s.stroke }}
        >
          {s.label.slice(0, 2)}
        </div>
      ))}
    </div>
  );
}

export default function BpmnStyleSheet({ modelerRef, companyId, onClose }) {
  const [themes, setThemes] = useState(BUILTIN_THEMES);
  const [selected, setSelected] = useState(null);
  const [applied, setApplied] = useState(false);

  // Load company brand colours and derive a brand theme
  useEffect(() => {
    if (!companyId) return;
    base44.entities.Company.filter({ id: companyId })
      .then((rows) => {
        const co = rows?.[0];
        if (!co?.brand_colors) return;
        const brandTheme = deriveTheme(`${co.name} Brand`, co.brand_colors);
        setThemes([brandTheme, ...BUILTIN_THEMES]);
        setSelected(brandTheme.name); // auto-select brand theme
      })
      .catch(() => {});
  }, [companyId]);

  const applyTheme = (theme) => {
    const modeler = modelerRef.current;
    if (!modeler) return;
    try {
      const modeling = modeler.get("modeling");
      const elementRegistry = modeler.get("elementRegistry");
      const all = elementRegistry.getAll();
      for (const el of all) {
        if (el.type === "label") continue;
        const role = roleForElement(el);
        if (!role) continue;
        const colours = theme[role] || theme.default;
        modeling.setColor(el, {
          fill: colours.fill,
          stroke: colours.stroke,
        });
      }
      setApplied(true);
      setTimeout(() => setApplied(false), 1800);
    } catch (e) {
      console.error("Style apply error", e);
    }
  };

  const activeTheme = themes.find((t) => t.name === selected);

  return (
    <div className="border-b border-slate-200 bg-white px-3 py-3 flex flex-wrap gap-4 items-start">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 shrink-0 mt-1">
        <Paintbrush className="w-4 h-4 text-violet-500" />
        Style Sheet
      </div>

      {/* Theme cards */}
      <div className="flex flex-wrap gap-2 flex-1 min-w-0">
        {themes.map((theme) => (
          <button
            key={theme.name}
            type="button"
            onClick={() => setSelected(theme.name)}
            className={`flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-all text-xs ${
              selected === theme.name
                ? "border-violet-500 bg-violet-50 ring-1 ring-violet-400"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className="font-medium text-slate-700 flex items-center gap-1">
              {selected === theme.name && <Check className="w-3 h-3 text-violet-600" />}
              {theme.name}
            </span>
            <ThemePreview theme={theme} />
          </button>
        ))}
      </div>

      {/* Apply + Close */}
      <div className="flex items-start gap-2 shrink-0">
        <Button
          size="sm"
          disabled={!activeTheme}
          onClick={() => activeTheme && applyTheme(activeTheme)}
          className={`gap-1.5 ${applied ? "bg-green-600 hover:bg-green-700" : "bg-violet-600 hover:bg-violet-700"}`}
        >
          {applied ? <Check className="w-4 h-4" /> : <Paintbrush className="w-4 h-4" />}
          {applied ? "Applied!" : "Apply"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} title="Close style sheet">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
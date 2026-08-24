import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, Eye, EyeOff, X } from "lucide-react";

// Page sizes in pixels at 96 DPI (screen resolution).
// Width is always the narrow dimension, height the tall dimension (portrait).
// Landscape swaps them.
export const PAGE_DIMENSIONS = {
  A4: { w: 794, h: 1123, label: "A4" },
  A3: { w: 1123, h: 1587, label: "A3" },
  A2: { w: 1587, h: 2245, label: "A2" },
  Letter: { w: 816, h: 1056, label: "Letter" },
  Legal: { w: 816, h: 1344, label: "Legal" },
};

export const PAGE_SIZE_OPTIONS = ["Auto", "A4", "A3", "A2", "Letter", "Legal"];

/**
 * Compute the pixel dimensions for the canvas "page" based on canvas meta.
 * Returns null for Auto (flexible layout).
 */
export function getCanvasDimensions(canvasMeta) {
  const pageSize = canvasMeta.pageSize || "Auto";
  if (pageSize === "Auto" || !PAGE_DIMENSIONS[pageSize]) return null;
  const dims = PAGE_DIMENSIONS[pageSize];
  const orientation = canvasMeta.pageOrientation || "landscape";
  return orientation === "portrait"
    ? { width: dims.w, height: dims.h }
    : { width: dims.h, height: dims.w };
}

/**
 * Human-readable label for the page size badge, e.g. "A4 · Landscape".
 */
export function getPageSizeLabel(canvasMeta) {
  const pageSize = canvasMeta.pageSize || "Auto";
  if (pageSize === "Auto") return null;
  const orientation = canvasMeta.pageOrientation || "landscape";
  const cap = orientation.charAt(0).toUpperCase() + orientation.slice(1);
  return `${pageSize} · ${cap}`;
}

export default function CanvasFormatBar({ canvasMeta, onChange, onClose }) {
  const orientation = canvasMeta.pageOrientation || "landscape";
  const pageSize = canvasMeta.pageSize || "Auto";
  const showPageSize = canvasMeta.showPageSize ?? false;
  const snapToGrid = canvasMeta.snapToGrid ?? false;
  const gridSize = canvasMeta.gridSize ?? 20;

  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-200 bg-slate-50/80 flex-wrap text-sm">
      {/* Orientation */}
      <div className="flex items-center gap-1.5">
        <Label className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Orientation</Label>
        <Select value={orientation} onValueChange={(v) => onChange("pageOrientation", v)}>
          <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="landscape">Landscape</SelectItem>
            <SelectItem value="portrait">Portrait</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Page Size */}
      <div className="flex items-center gap-1.5">
        <Label className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Page Size</Label>
        <Select value={pageSize} onValueChange={(v) => onChange("pageSize", v)}>
          <SelectTrigger className="w-[90px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((k) => (
              <SelectItem key={k} value={k}>{k === "Auto" ? "Auto (fit)" : k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Show Page Size toggle */}
      <Button
        size="sm"
        variant={showPageSize ? "default" : "outline"}
        onClick={() => onChange("showPageSize", !showPageSize)}
        className="h-8 gap-1.5 text-xs"
        title={showPageSize ? "Hide page size label on canvas" : "Show page size label on canvas"}
      >
        {showPageSize ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {showPageSize ? "Size Shown" : "Show Size"}
      </Button>

      <div className="w-px h-6 bg-slate-200" />

      {/* Snap to Grid */}
      <Button
        size="sm"
        variant={snapToGrid ? "default" : "outline"}
        onClick={() => onChange("snapToGrid", !snapToGrid)}
        className="h-8 gap-1.5 text-xs"
        title={snapToGrid ? "Disable grid snapping" : "Enable grid snapping"}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        {snapToGrid ? "Snap On" : "Snap Off"}
      </Button>

      {/* Grid Size */}
      <div className="flex items-center gap-1.5">
        <Label className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Grid Size</Label>
        <Input
          type="number"
          min={5}
          max={100}
          value={gridSize}
          onChange={(e) =>
            onChange("gridSize", Math.max(5, Math.min(100, Number(e.target.value) || 20)))
          }
          className="w-[64px] h-8 text-xs"
          disabled={!snapToGrid}
        />
        <span className="text-[11px] text-slate-400">px</span>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="ml-auto p-1.5 rounded-md hover:bg-slate-200 text-slate-500"
          title="Hide formatting options"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
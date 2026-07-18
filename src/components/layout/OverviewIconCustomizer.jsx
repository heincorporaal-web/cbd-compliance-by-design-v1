import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, RotateCcw, Plus, Trash2, Upload, ImagePlus } from "lucide-react";
import {
  NAV_ICON_POOL,
  resolveIcon,
  nameForDefaultIcon,
  CustomSvgIcon,
  CUSTOM_ICON_PREFIX,
} from "@/lib/navIconStore";

export default function OverviewIconCustomizer({
  open,
  onClose,
  groups,
  customIcons,
  customIconRecords = [],
  onSetIcon,
  onResetIcon,
  onAddCustomIcon,
  onDeleteCustomIcon,
}) {
  const [openItemId, setOpenItemId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSvg, setNewSvg] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [removeWhiteBg, setRemoveWhiteBg] = useState(false);
  const fileInputRef = useRef(null);

  // Accept a PNG/JPEG/WebP upload and wrap it as an inline SVG (base64 <image>)
  // so it flows through the existing svg-based custom icon storage. Keep files
  // small — they are stored as markup inside the CustomIcon record.
  // Optionally strip a near-white background to transparent so the icon blends
  // into the sidebar instead of rendering as a white square.
  const handleImageFile = (file) => {
    setError("");
    if (!file) return;
    if (file.size > 200 * 1024) {
      return setError("Image is too large. Use a small icon (under 200 KB).");
    }
    // SVG files: load the markup directly (transparency preserved by author).
    if (file.type === "image/svg+xml" || /\.svg$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewSvg(String(reader.result || ""));
        if (!newName.trim()) setNewName(file.name.replace(/\.svg$/i, ""));
      };
      return reader.readAsText(file);
    }
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      return setError("Choose a PNG, JPEG, WebP or SVG image.");
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || 24;
        const h = img.naturalHeight || 24;
        let href = dataUrl;
        if (removeWhiteBg) {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, w, h);
            const px = data.data;
            // Treat pixels close to white (each channel >= 240) as background
            // and make them fully transparent.
            for (let i = 0; i < px.length; i += 4) {
              if (px[i] >= 240 && px[i + 1] >= 240 && px[i + 2] >= 240) {
                px[i + 3] = 0;
              }
            }
            ctx.putImageData(data, 0, 0);
            href = canvas.toDataURL("image/png");
          } catch {
            // Ignore — fall back to the original image if canvas access fails.
          }
        }
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image href="${href}" width="${w}" height="${h}"/></svg>`;
        setNewSvg(svg);
        if (!newName.trim()) setNewName(file.name.replace(/\.[^.]+$/, ""));
      };
      img.onerror = () => setError("Could not read the image file.");
      img.src = dataUrl;
    };
    reader.onerror = () => setError("Could not read the image file.");
    reader.readAsDataURL(file);
  };

  // Icons reserved for top-level menu groups (Overview, Governance, …) are
  // excluded from the picker so sub-items can't reuse a group's icon. Match by
  // component (not name) so lucide aliases like AlertTriangle/TriangleAlert are
  // both excluded.
  const reservedIcons = new Set(
    (groups || []).map((g) => g.icon).filter(Boolean)
  );

  const handleAdd = async () => {
    setError("");
    const name = newName.trim();
    const svg = newSvg.trim();
    if (!name) return setError("Give the icon a name.");
    if (!svg) return setError("Paste SVG markup.");
    if (!/<svg[\s\S]*<\/svg>/i.test(svg)) return setError("Markup must contain an <svg>…</svg>.");
    setAdding(true);
    try {
      await onAddCustomIcon?.(name, svg);
      setNewName("");
      setNewSvg("");
      setShowAdd(false);
    } catch (e) {
      setError(e?.message || "Could not save the icon.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customise Menu Icons</DialogTitle>
          <DialogDescription>
            Expand a menu item, then pick an icon. Each item gets a unique icon,
            applied app-wide for everyone. You can also load your own SVG icons below.
          </DialogDescription>
        </DialogHeader>

        {/* Load custom SVG */}
        <div className="mt-2 rounded-lg border border-slate-200">
          <button
            onClick={() => setShowAdd(v => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            {showAdd ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Load custom SVG</span>
            {customIconRecords.length > 0 && (
              <span className="ml-1 text-[10px] uppercase tracking-wide text-primary">
                {customIconRecords.length} loaded
              </span>
            )}
          </button>
          {showAdd && (
            <div className="px-3 pb-3 space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Icon name (e.g. Network Dollar)"
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <textarea
                value={newSvg}
                onChange={(e) => setNewSvg(e.target.value)}
                placeholder='<svg ...>...</svg>'
                rows={4}
                className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  handleImageFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <label className="flex items-center gap-2 text-xs text-slate-600 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeWhiteBg}
                  onChange={(e) => setRemoveWhiteBg(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 accent-primary"
                />
                Remove white background (make it transparent)
              </label>
              <p className="text-[11px] text-slate-400">
                Paste SVG markup, or upload a PNG / JPEG / WebP image (it's wrapped as an inline SVG; keep it under 200 KB).
              </p>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {adding ? "Adding…" : "Add icon"}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  Upload image
                </button>
                {newSvg && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-md">
                    Preview:
                    <span className="w-5 h-5 inline-flex items-center justify-center border border-slate-200 rounded">
                      <CustomSvgIcon svg={newSvg} className="w-4 h-4" />
                    </span>
                  </span>
                )}
              </div>
              {customIconRecords.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs text-slate-400 mb-1">Loaded custom icons:</p>
                  <div className="flex flex-wrap gap-2">
                    {customIconRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className="group relative w-9 h-9 rounded-md border border-slate-200 flex items-center justify-center"
                        title={rec.name}
                      >
                        <CustomSvgIcon svg={rec.svg} className="w-5 h-5" />
                        <button
                          onClick={() => onDeleteCustomIcon?.(rec.id)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          title={`Delete ${rec.name}`}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1 mt-2">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="px-2 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = resolveIcon(customIcons, item.id, item.icon, buildMap(customIconRecords));
                const isCustom = !!customIcons?.[item.id];
                const expanded = openItemId === item.id;
                const activeName = customIcons?.[item.id] || nameForDefaultIcon(item.icon);

                return (
                  <div key={item.id} className="rounded-lg">
                    <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg">
                      <button
                        onClick={() => setOpenItemId(expanded ? null : item.id)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-sm text-slate-700"
                      >
                        {expanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="truncate">{item.title}</span>
                        {isCustom && (
                          <span className="ml-1 text-[10px] uppercase tracking-wide text-primary">
                            custom
                          </span>
                        )}
                      </button>
                      {isCustom && (
                        <button
                          onClick={() => onResetIcon(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600"
                          title="Reset to default icon"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {expanded && (
                      <div className="px-2 pb-2 pt-1">
                        {customIconRecords.length > 0 && (
                          <div className="mb-2">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Custom SVG</p>
                            <div className="grid grid-cols-10 gap-1.5">
                              {customIconRecords.map((rec) => {
                                const ref = CUSTOM_ICON_PREFIX + rec.id;
                                const active = activeName === ref;
                                return (
                                  <button
                                    key={rec.id}
                                    title={rec.name}
                                    onClick={() => onSetIcon(item.id, ref)}
                                    className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${
                                      active
                                        ? "border-primary bg-primary/10"
                                        : "border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    <CustomSvgIcon svg={rec.svg} className="w-4 h-4" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Library</p>
                        <div className="grid grid-cols-10 gap-1.5">
                          {NAV_ICON_POOL.filter(({ Icon }) => !reservedIcons.has(Icon)).map(({ name, Icon: Opt }) => {
                            const active = activeName === name;
                            return (
                              <button
                                key={name}
                                title={name}
                                onClick={() => onSetIcon(item.id, name)}
                                className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${
                                  active
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <Opt className="w-3.5 h-3.5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Lightweight local builder so we don't need to import buildCustomIconMap here.
function buildMap(records) {
  const map = {};
  for (const rec of records || []) {
    if (rec?.id && rec.svg) map[CUSTOM_ICON_PREFIX + rec.id] = { name: rec.name, svg: rec.svg };
  }
  return map;
}
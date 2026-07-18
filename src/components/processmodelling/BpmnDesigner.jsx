import React, { useEffect, useRef, useState } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import { Button } from "@/components/ui/button";
import { Save, ZoomIn, ZoomOut, Maximize2, Download, FileImage, ArrowLeft, PanelRight, Upload } from "lucide-react";
import { toast } from "sonner";
import BpmnElementPalette from "@/components/processmodelling/BpmnElementPalette";
import BpmnDataPane from "@/components/processmodelling/BpmnDataPane";
import { getElementCategory } from "@/components/processmodelling/bpmnDataConfig";

export const EMPTY_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Start" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="172" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="180" y="145" width="22" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const newGuid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : "g-" + Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function BpmnDesigner({
  initialXml,
  initialCanvasMeta,
  initialElementMeta,
  onSave,
  saving,
  onBack,
  processLabel,
  companyId,
}) {
  const containerRef = useRef(null);
  const modelerRef = useRef(null);
  const [dirty, setDirty] = useState(false);
  const [canvasMeta, setCanvasMeta] = useState(() => initialCanvasMeta || {});
  const [elementMeta, setElementMeta] = useState(() => initialElementMeta || {});
  const [selection, setSelection] = useState(null); // { id, label, category }
  const [paneOpen, setPaneOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Ensure every BPMN element on the canvas has a stable GUID stored in its
  // element metadata. GUIDs are persisted with the diagram so machine-learning
  // pipelines can link back to a unique element across versions/exports.
  const ensureGuids = () => {
    const modeler = modelerRef.current;
    if (!modeler) return;
    setElementMeta((prev) => {
      const next = { ...prev };
      let changed = false;
      const all = modeler.get("elementRegistry").getAll();
      for (const el of all) {
        if (el.type === "label") continue;
        const cur = next[el.id] || {};
        if (!cur.guid) {
          next[el.id] = { ...cur, guid: newGuid() };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setCanvasMeta((prev) => (prev.guid ? prev : { ...prev, guid: newGuid() }));
  };

  // Seed source/target labels for sequence flows into element meta on selection.
  const describeSelection = (el) => {
    if (!el || el.type === "label") return null;
    const bo = el.businessObject || {};
    const label = bo.name || el.id;
    let category = getElementCategory(el);
    const seed = {};
    if (category === "sequence_flow") {
      const src = el.source && el.source.businessObject ? el.source.businessObject.name || el.source.id : "";
      const tgt = el.target && el.target.businessObject ? el.target.businessObject.name || el.target.id : "";
      if (src) seed.from_element = src;
      if (tgt) seed.to_element = tgt;
    }
    return { id: el.id, label, category, seed };
  };

  useEffect(() => {
    const modeler = new BpmnModeler({ container: containerRef.current });
    modelerRef.current = modeler;

    modeler
      .importXML(initialXml || EMPTY_BPMN_XML)
      .then(() => {
        modeler.get("canvas").zoom("fit-viewport");
        ensureGuids();
      })
      .catch((err) => toast.error("Failed to load diagram: " + (err?.message || err)));

    modeler.on("commandStack.changed", () => setDirty(true));

    // Assign a GUID to newly created elements (tasks, events, flows, …).
    const onShapeAdded = () => ensureGuids();
    modeler.on("shape.added", onShapeAdded);
    modeler.on("connection.added", onShapeAdded);

    const onSelectionChanged = ({ newSelection }) => {
      const el = newSelection && newSelection[0];
      const desc = describeSelection(el);
      if (!desc) {
        setSelection(null);
      } else {
        setSelection(desc);
        if (desc.seed && Object.keys(desc.seed).length) {
          setElementMeta((prev) => ({
            ...prev,
            [desc.id]: { ...desc.seed, ...(prev[desc.id] || {}) },
          }));
        }
        setPaneOpen(true);
      }
    };
    modeler.on("selection.changed", onSelectionChanged);

    return () => {
      modeler.off("selection.changed", onSelectionChanged);
      modeler.off("shape.added", onShapeAdded);
      modeler.off("connection.added", onShapeAdded);
      try { modeler.destroy(); } catch {}
      modelerRef.current = null;
    };
  }, []);

  const onCanvasChange = (key, value) => {
    setCanvasMeta((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const onElementChange = (key, value) => {
    if (!selection) return;
    const id = selection.id;
    setElementMeta((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: value } }));
    // "name" overrides the BPMN element label on the canvas.
    if (key === "name" && modelerRef.current) {
      try {
        const elementRegistry = modelerRef.current.get("elementRegistry");
        const el = elementRegistry.get(id);
        if (el) modelerRef.current.get("modeling").updateProperties(el, { name: value });
      } catch {}
    }
    setDirty(true);
  };

  const paneData = selection ? elementMeta[selection.id] || {} : canvasMeta;
  const paneCategory = selection ? selection.category : "canvas";

  const zoomIn = () => modelerRef.current?.get("zoomScroll").stepZoom(1);
  const zoomOut = () => modelerRef.current?.get("zoomScroll").stepZoom(-1);
  const fit = () => modelerRef.current?.get("canvas").zoom("fit-viewport");

  // Start a native bpmn-js drag-create from the docked palette so elements
  // can be dragged onto the canvas with live preview and proper drop targets
  // (lanes, pools, attaching boundary events to activities, etc.).
  const onDragStart = (event, type, options = {}) => {
    try {
      const modeler = modelerRef.current;
      if (!modeler) return;
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      const elementFactory = modeler.get("elementFactory");
      const create = modeler.get("create");
      const shapeOpts = { type };
      if (options.isExpanded !== undefined) shapeOpts.isExpanded = options.isExpanded;
      if (options.eventDefinitionType) shapeOpts.eventDefinitionType = options.eventDefinitionType;
      if (options.eventDefinitionTypes) shapeOpts.eventDefinitionTypes = options.eventDefinitionTypes;
      if (options.triggeredByEvent) shapeOpts.triggeredByEvent = options.triggeredByEvent;
      const shape = elementFactory.createShape(shapeOpts);
      create.start(event, shape, options.attach ? { attach: true } : undefined);
      setDirty(true);
    } catch (e) {
      toast.error("Could not start drag: " + (e?.message || e));
    }
  };

  const handleSave = async () => {
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      let svg = null;
      try {
        const { svg: svgStr } = await modelerRef.current.saveSVG();
        svg = svgStr;
      } catch {}
      await onSave(xml, svg, canvasMeta, elementMeta);
      setDirty(false);
    } catch (e) {
      toast.error("Save failed: " + (e?.message || e));
    }
  };

  const download = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadXml = async () => {
    const { xml } = await modelerRef.current.saveXML({ format: true });
    download(xml, `${(processLabel || "process").replace(/\s+/g, "_")}.bpmn`, "application/xml");
  };

  const handleDownloadSvg = async () => {
    try {
      const { svg } = await modelerRef.current.saveSVG();
      download(svg, `${(processLabel || "process").replace(/\s+/g, "_")}.svg`, "image/svg+xml");
    } catch (e) {
      toast.error("Export SVG failed: " + (e?.message || e));
    }
  };

  const handleImportXml = async (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!/\.(bpmn|xml)$/.test(name)) {
      toast.error("Please choose a .bpmn or .xml file");
      return;
    }
    try {
      const text = await file.text();
      await modelerRef.current.importXML(text);
      modelerRef.current.get("canvas").zoom("fit-viewport");
      // Imported elements start with no metadata; keep existing element_meta but
      // assign GUIDs to any new ids so traceability is preserved on save.
      ensureGuids();
      setDirty(true);
      toast.success("Diagram imported");
    } catch (e) {
      toast.error("Import failed: " + (e?.message || e));
    }
  };

  return (
    <div className="flex h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <BpmnElementPalette onDragStart={onDragStart} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50 flex-wrap">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button size="sm" variant="ghost" onClick={onBack} className="gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            )}
            <span className="text-sm font-semibold text-slate-700 truncate max-w-xs">{processLabel || "Process diagram"}</span>
            {dirty && <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />}
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={zoomOut} title="Zoom out"><ZoomOut className="w-4 h-4" /></Button>
            <Button size="sm" variant="ghost" onClick={zoomIn} title="Zoom in"><ZoomIn className="w-4 h-4" /></Button>
            <Button size="sm" variant="ghost" onClick={fit} title="Fit to screen"><Maximize2 className="w-4 h-4" /></Button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()} title="Import BPMN/XML"><Upload className="w-4 h-4" /></Button>
            <Button size="sm" variant="ghost" onClick={handleDownloadSvg} title="Export SVG"><FileImage className="w-4 h-4" /></Button>
            <Button size="sm" variant="ghost" onClick={handleDownloadXml} title="Download .bpmn"><Download className="w-4 h-4" /></Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".bpmn,.xml,application/xml,text/xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                handleImportXml(f);
                e.target.value = "";
              }}
            />
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <Button
              size="sm"
              variant={paneOpen ? "default" : "ghost"}
              onClick={() => setPaneOpen((v) => !v)}
              title="Toggle data pane"
              className="gap-1.5"
            >
              <PanelRight className="w-4 h-4" /> Data
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
        {/* Bounded canvas area: a white "page" on a grey workspace. Everything
            outside the page is clipped (overflow hidden), so the future image
            preview will only capture what is placed inside this canvas. */}
        <div className="flex-1 min-h-[60vh] bg-slate-200 p-3 md:p-5 overflow-auto flex justify-center">
          <div className="relative w-full max-w-[1200px] min-h-[560px] bg-white rounded-lg shadow-lg ring-1 ring-slate-300 overflow-hidden">
            <span className="pointer-events-none absolute top-2 left-3 z-10 text-[10px] font-semibold uppercase tracking-wide text-slate-300 select-none">
              Canvas
            </span>
            <div ref={containerRef} className="w-full h-full min-h-[560px]">
              {/* Hide the native floating bpmn-js palette — elements are now in the docked pane */}
              <style>{`.djs-palette{display:none!important}`}</style>
            </div>
          </div>
        </div>
      </div>

      {paneOpen && (
        <BpmnDataPane
          companyId={companyId}
          category={paneCategory}
          elementId={selection?.id}
          elementLabel={selection?.label}
          elementGuid={selection ? elementMeta[selection.id]?.guid : canvasMeta.guid}
          data={paneData}
          onChange={selection ? onElementChange : onCanvasChange}
          onClose={() => setPaneOpen(false)}
        />
      )}
    </div>
  );
}
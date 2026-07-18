import React, { useEffect, useRef, useState } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import { Button } from "@/components/ui/button";
import { Save, ZoomIn, ZoomOut, Maximize2, Download, FileImage, ArrowLeft, RectangleHorizontal, Rows3 } from "lucide-react";
import { toast } from "sonner";

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

export default function BpmnDesigner({ initialXml, onSave, saving, onBack, processLabel }) {
  const containerRef = useRef(null);
  const modelerRef = useRef(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const modeler = new BpmnModeler({ container: containerRef.current });
    modelerRef.current = modeler;

    modeler
      .importXML(initialXml || EMPTY_BPMN_XML)
      .then(() => {
        modeler.get("canvas").zoom("fit-viewport");
      })
      .catch((err) => toast.error("Failed to load diagram: " + (err?.message || err)));

    modeler.on("commandStack.changed", () => setDirty(true));

    return () => {
      try { modeler.destroy(); } catch {}
      modelerRef.current = null;
    };
  }, []);

  const zoomIn = () => modelerRef.current?.get("zoomScroll").stepZoom(1);
  const zoomOut = () => modelerRef.current?.get("zoomScroll").stepZoom(-1);
  const fit = () => modelerRef.current?.get("canvas").zoom("fit-viewport");

  const addPool = () => {
    try {
      const modeling = modelerRef.current.get("modeling");
      const elementFactory = modelerRef.current.get("elementFactory");
      const canvas = modelerRef.current.get("canvas");
      const root = canvas.getRootElement();
      const shape = elementFactory.createShape({ type: "bpmn:Participant", isExpanded: true });
      modeling.createShape(shape, { x: 400, y: 250 }, root);
      setDirty(true);
    } catch (e) {
      toast.error("Could not add pool: " + (e?.message || e));
    }
  };

  const addLane = () => {
    try {
      const modeling = modelerRef.current.get("modeling");
      const elementFactory = modelerRef.current.get("elementFactory");
      const selection = modelerRef.current.get("selection");
      const canvas = modelerRef.current.get("canvas");
      let participant = (selection.get() || []).find((el) => el.type === "bpmn:Participant");
      if (!participant) {
        const root = canvas.getRootElement();
        const children = root.children || [];
        participant = children.find((el) => el.type === "bpmn:Participant");
      }
      if (!participant) {
        toast.error("Add a Pool first, then add lanes to it.");
        return;
      }
      const lane = elementFactory.createShape({ type: "bpmn:Lane", isExpanded: true });
      modeling.createShape(lane, { x: 200, y: 150 }, participant);
      setDirty(true);
    } catch (e) {
      toast.error("Could not add lane: " + (e?.message || e));
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
      await onSave(xml, svg);
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

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
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
          <Button size="sm" variant="ghost" onClick={addPool} title="Add pool (participant)" className="gap-1.5">
            <RectangleHorizontal className="w-4 h-4" /> Pool
          </Button>
          <Button size="sm" variant="ghost" onClick={addLane} title="Add lane (swimlane)" className="gap-1.5">
            <Rows3 className="w-4 h-4" /> Lane
          </Button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <Button size="sm" variant="ghost" onClick={handleDownloadSvg} title="Export SVG"><FileImage className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" onClick={handleDownloadXml} title="Download .bpmn"><Download className="w-4 h-4" /></Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 min-h-[60vh] bg-slate-50" />
    </div>
  );
}
import React, { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

/* ---------------------------------------------------------------------------
   BPMN 2.0 element definitions, grouped by category.
   Each item: { label, type, ...createOpts }
   createOpts supported by the designer's createElement:
     isExpanded (bool), eventDefinitionType (string), eventDefinitionTypes ([string]),
     attach (bool, boundary events), triggeredByEvent (bool)
--------------------------------------------------------------------------- */

const EVENT = {
  message: "bpmn:MessageEventDefinition",
  timer: "bpmn:TimerEventDefinition",
  conditional: "bpmn:ConditionalEventDefinition",
  signal: "bpmn:SignalEventDefinition",
  link: "bpmn:LinkEventDefinition",
  error: "bpmn:ErrorEventDefinition",
  escalation: "bpmn:EscalationEventDefinition",
  cancel: "bpmn:CancelEventDefinition",
  compensate: "bpmn:CompensateEventDefinition",
  terminate: "bpmn:TerminateEventDefinition",
};

const COMMON_ELEMENTS = [
  { label: "Task", type: "bpmn:Task" },
  { label: "User Task", type: "bpmn:UserTask" },
  { label: "Sub-process (collapsed)", type: "bpmn:SubProcess", isExpanded: false },
  { label: "Start Event", type: "bpmn:StartEvent" },
  { label: "End Event", type: "bpmn:EndEvent" },
  { label: "Exclusive (XOR)", type: "bpmn:ExclusiveGateway" },
  { label: "Parallel (AND)", type: "bpmn:ParallelGateway" },
  { label: "Pool / Participant", type: "bpmn:Participant", isExpanded: true },
];

const CATEGORIES = [
  {
    key: "general",
    label: "BPMN 2.0 General",
    items: [
      { label: "Pool / Participant", type: "bpmn:Participant", isExpanded: true },
      { label: "Lane", type: "bpmn:Lane", isExpanded: true },
      { label: "Sub-process (collapsed)", type: "bpmn:SubProcess", isExpanded: false },
      { label: "Sub-process (expanded)", type: "bpmn:SubProcess", isExpanded: true },
      { label: "Ad-hoc Sub-process", type: "bpmn:AdHocSubProcess", isExpanded: false },
      { label: "Transaction", type: "bpmn:Transaction" },
      { label: "Call Activity", type: "bpmn:CallActivity" },
      { label: "Data Object", type: "bpmn:DataObjectReference" },
      { label: "Data Store", type: "bpmn:DataStoreReference" },
      { label: "Group", type: "bpmn:Group" },
      { label: "Text Annotation", type: "bpmn:TextAnnotation" },
    ],
  },
  {
    key: "tasks",
    label: "BPMN 2.0 Tasks",
    items: [
      { label: "Task", type: "bpmn:Task" },
      { label: "Service Task", type: "bpmn:ServiceTask" },
      { label: "User Task", type: "bpmn:UserTask" },
      { label: "Send Task", type: "bpmn:SendTask" },
      { label: "Receive Task", type: "bpmn:ReceiveTask" },
      { label: "Manual Task", type: "bpmn:ManualTask" },
      { label: "Script Task", type: "bpmn:ScriptTask" },
      { label: "Business Rule Task", type: "bpmn:BusinessRuleTask" },
    ],
  },
  {
    key: "choreographies",
    label: "BPMN 2.0 Choreographies",
    items: [
      { label: "Choreography Task", type: "bpmn:ChoreographyTask" },
      { label: "Sub-Choreography", type: "bpmn:SubChoreography", isExpanded: false },
      { label: "Call Choreography", type: "bpmn:CallChoreography" },
    ],
  },
  {
    key: "events",
    label: "BPMN 2.0 Events",
    items: [
      { label: "Start Event", type: "bpmn:StartEvent" },
      { label: "Message Start", type: "bpmn:StartEvent", eventDefinitionType: EVENT.message },
      { label: "Timer Start", type: "bpmn:StartEvent", eventDefinitionType: EVENT.timer },
      { label: "Conditional Start", type: "bpmn:StartEvent", eventDefinitionType: EVENT.conditional },
      { label: "Signal Start", type: "bpmn:StartEvent", eventDefinitionType: EVENT.signal },
      { label: "Intermediate Event", type: "bpmn:IntermediateCatchEvent" },
      { label: "Message Catch", type: "bpmn:IntermediateCatchEvent", eventDefinitionType: EVENT.message },
      { label: "Timer Catch", type: "bpmn:IntermediateCatchEvent", eventDefinitionType: EVENT.timer },
      { label: "Conditional Catch", type: "bpmn:IntermediateCatchEvent", eventDefinitionType: EVENT.conditional },
      { label: "Signal Catch", type: "bpmn:IntermediateCatchEvent", eventDefinitionType: EVENT.signal },
      { label: "Link Catch", type: "bpmn:IntermediateCatchEvent", eventDefinitionType: EVENT.link },
      { label: "Message Throw", type: "bpmn:IntermediateThrowEvent", eventDefinitionType: EVENT.message },
      { label: "Escalation Throw", type: "bpmn:IntermediateThrowEvent", eventDefinitionType: EVENT.escalation },
      { label: "Compensation Throw", type: "bpmn:IntermediateThrowEvent", eventDefinitionType: EVENT.compensate },
      { label: "Link Throw", type: "bpmn:IntermediateThrowEvent", eventDefinitionType: EVENT.link },
      { label: "Boundary Message", type: "bpmn:BoundaryEvent", eventDefinitionType: EVENT.message, attach: true },
      { label: "Boundary Timer", type: "bpmn:BoundaryEvent", eventDefinitionType: EVENT.timer, attach: true },
      { label: "Boundary Error", type: "bpmn:BoundaryEvent", eventDefinitionType: EVENT.error, attach: true },
      { label: "Boundary Signal", type: "bpmn:BoundaryEvent", eventDefinitionType: EVENT.signal, attach: true },
      { label: "Boundary Cancel", type: "bpmn:BoundaryEvent", eventDefinitionType: EVENT.cancel, attach: true },
      { label: "Boundary Compensation", type: "bpmn:BoundaryEvent", eventDefinitionType: EVENT.compensate, attach: true },
      { label: "End Event", type: "bpmn:EndEvent" },
      { label: "Message End", type: "bpmn:EndEvent", eventDefinitionType: EVENT.message },
      { label: "Error End", type: "bpmn:EndEvent", eventDefinitionType: EVENT.error },
      { label: "Cancel End", type: "bpmn:EndEvent", eventDefinitionType: EVENT.cancel },
      { label: "Terminate End", type: "bpmn:EndEvent", eventDefinitionType: EVENT.terminate },
      { label: "Compensation End", type: "bpmn:EndEvent", eventDefinitionType: EVENT.compensate },
      { label: "Escalation End", type: "bpmn:EndEvent", eventDefinitionType: EVENT.escalation },
    ],
  },
  {
    key: "gateways",
    label: "BPMN 2.0 Gateways",
    items: [
      { label: "Exclusive (XOR)", type: "bpmn:ExclusiveGateway" },
      { label: "Parallel (AND)", type: "bpmn:ParallelGateway" },
      { label: "Inclusive (OR)", type: "bpmn:InclusiveGateway" },
      { label: "Complex", type: "bpmn:ComplexGateway" },
      { label: "Event-based", type: "bpmn:EventBasedGateway" },
      { label: "Exclusive Event-based", type: "bpmn:ExclusiveEventBasedGateway" },
      { label: "Parallel Event-based", type: "bpmn:ParallelEventBasedGateway" },
    ],
  },
];

/* ----------------------------- SVG icon rendering ----------------------------- */

function innerEventSymbol(marker) {
  switch (marker) {
    case "message":
      return (
        <>
          <rect x="9" y="10.5" width="6" height="3" rx="0.4" />
          <path d="M9 10.6 L12 12.6 L15 10.6" />
        </>
      );
    case "timer":
      return (
        <>
          <circle cx="12" cy="12" r="2.6" />
          <path d="M12 12 L12 9.8 M12 12 L13.4 12" />
        </>
      );
    case "signal":
      return <path d="M9.4 14 L12 9.4 L14.6 14 Z" />;
    case "error":
      return <path d="M12 9.2 L12 12.4 M12 14.6 L12 15.3" strokeWidth="1.4" />;
    case "escalation":
      return <path d="M12 15 L12 10 M9.6 12 L12 9.6 L14.4 12" />;
    case "cancel":
      return <path d="M9.6 9.6 L14.4 14.4 M14.4 9.6 L9.6 14.4" />;
    case "terminate":
      return <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />;
    case "compensate":
      return <path d="M12.4 9.6 L9.4 12 L12.4 14.4 M15.6 9.6 L12.6 12 L15.6 14.4" />;
    case "conditional":
      return <path d="M9 9.6 L7.2 12 L9 14.4 M15 9.6 L16.8 12 L15 14.4" />;
    case "link":
      return <path d="M9.4 12 L14.6 12 M12 9.4 L14.6 12 L12 14.6" />;
    default:
      return null;
  }
}

function innerGatewaySymbol(gw) {
  switch (gw) {
    case "exclusive":
      return <path d="M9.5 9.5 L14.5 14.5 M14.5 9.5 L9.5 14.5" />;
    case "parallel":
      return <path d="M12 9.4 L12 14.6 M9.4 12 L14.6 12" />;
    case "inclusive":
      return <circle cx="12" cy="12" r="3.2" />;
    case "complex":
      return <path d="M12 7 L12 17 M7 12 L17 12 M8.7 8.7 L15.3 15.3 M15.3 8.7 L8.7 15.3" />;
    case "event":
      return <path d="M9.4 10.6 L9.4 13.4 L12 15 L14.6 13.4 L14.6 10.6 L12 9 Z" />;
    default:
      return null;
  }
}

function taskCornerGlyph(taskType) {
  switch (taskType) {
    case "service":
      return (
        <>
          <circle cx="6.4" cy="8.4" r="1.1" />
          <path d="M6.4 6.9 L6.4 6.3 M6.4 10.5 L6.4 9.9 M4.7 8.4 L4.1 8.4 M8.7 8.4 L8.1 8.4" />
        </>
      );
    case "user":
      return (
        <>
          <circle cx="6.4" cy="8" r="1" />
          <path d="M4.6 10.8 L4.6 10 a1.8 1.5 0 0 1 3.6 0 L8.2 10.8" />
        </>
      );
    case "send":
      return (
        <>
          <rect x="4.6" y="7.4" width="4" height="2.4" />
          <path d="M4.6 7.4 L6.6 8.9 L8.6 7.4" />
        </>
      );
    case "receive":
      return (
        <>
          <rect x="4.6" y="7.4" width="4" height="2.4" fill="currentColor" stroke="none" />
        </>
      );
    case "manual":
      return <path d="M5 7.4 L5 10.4 M6.2 7 L6.2 10.4 M7.4 7.4 L7.4 10.4 M5 10.4 L8.2 10.4" />;
    case "script":
      return <path d="M5 7.6 L8 7.6 M5 9 L8 9 M5 10.4 L7 10.4" />;
    case "businessRule":
      return (
        <>
          <rect x="4.6" y="7.4" width="4" height="3" />
          <path d="M6.6 7.4 L6.6 10.4 M4.6 8.9 L8.6 8.9" />
        </>
      );
    default:
      return null;
  }
}

/**
 * resolveIcon(item) -> { shape, ...attrs } describing the SVG to draw.
 */
function resolveIcon(item) {
  const t = item.type;
  if (t === "bpmn:Participant") return { shape: "pool" };
  if (t === "bpmn:Lane") return { shape: "lane" };
  if (t === "bpmn:DataObjectReference") return { shape: "data" };
  if (t === "bpmn:DataStoreReference") return { shape: "store" };
  if (t === "bpmn:Group") return { shape: "group" };
  if (t === "bpmn:TextAnnotation") return { shape: "text" };
  if (t === "bpmn:CallActivity") return { shape: "rect", thick: true };
  if (t === "bpmn:Transaction") return { shape: "transaction" };
  if (t === "bpmn:AdHocSubProcess") return { shape: "rect", marker: "adhoc" };
  if (t === "bpmn:SubProcess" || t === "bpmn:SubChoreography")
    return { shape: "rect", marker: item.isExpanded === false ? "collapsed" : "expanded" };
  if (t === "bpmn:ChoreographyTask") return { shape: "choreo" };
  if (t === "bpmn:CallChoreography") return { shape: "choreo", thick: true };

  if (t.endsWith("Task"))
    return { shape: "task", taskType: taskTypeOf(t) };
  if (t === "bpmn:CallActivity" || t === "bpmn:Task") return { shape: "task" };

  if (t === "bpmn:StartEvent" || t === "bpmn:EndEvent" || t === "bpmn:IntermediateCatchEvent" || t === "bpmn:IntermediateThrowEvent" || t === "bpmn:BoundaryEvent")
    return {
      shape: "event",
      kind:
        t === "bpmn:StartEvent" ? "start" :
        t === "bpmn:EndEvent" ? "end" :
        t === "bpmn:IntermediateThrowEvent" ? "throw" : "intermediate",
      marker: eventMarkerOf(item.eventDefinitionType),
      attach: item.attach,
    };

  if (t.endsWith("Gateway"))
    return { shape: "gateway", gw: gatewayKindOf(t) };

  return { shape: "rect" };
}

function taskTypeOf(t) {
  return {
    "bpmn:ServiceTask": "service",
    "bpmn:UserTask": "user",
    "bpmn:SendTask": "send",
    "bpmn:ReceiveTask": "receive",
    "bpmn:ManualTask": "manual",
    "bpmn:ScriptTask": "script",
    "bpmn:BusinessRuleTask": "businessRule",
  }[t];
}

function eventMarkerOf(def) {
  const inv = { [EVENT.message]: "message", [EVENT.timer]: "timer", [EVENT.signal]: "signal", [EVENT.error]: "error", [EVENT.escalation]: "escalation", [EVENT.cancel]: "cancel", [EVENT.terminate]: "terminate", [EVENT.compensate]: "compensate", [EVENT.conditional]: "conditional", [EVENT.link]: "link" };
  return inv[def];
}

function gatewayKindOf(t) {
  return {
    "bpmn:ExclusiveGateway": "exclusive",
    "bpmn:ParallelGateway": "parallel",
    "bpmn:InclusiveGateway": "inclusive",
    "bpmn:ComplexGateway": "complex",
    "bpmn:EventBasedGateway": "event",
    "bpmn:ExclusiveEventBasedGateway": "event",
    "bpmn:ParallelEventBasedGateway": "event",
  }[t];
}

function BpmnIcon({ item }) {
  const d = resolveIcon(item);
  const stroke = { stroke: "currentColor", strokeWidth: 1.5, fill: "none", strokeLinejoin: "round", strokeLinecap: "round" };
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" className="text-slate-700 shrink-0">
      {d.shape === "event" && (
        <>
          <circle cx="12" cy="12" r="9" {...stroke} strokeWidth={d.kind === "end" ? 3 : 1.6} />
          {d.kind === "intermediate" || d.kind === "throw" ? (
            <circle cx="12" cy="12" r="7" {...stroke} strokeWidth={1.2} />
          ) : null}
          {innerEventSymbol(d.marker)}
        </>
      )}
      {d.shape === "gateway" && (
        <>
          <path d="M12 3 L21 12 L12 21 L3 12 Z" {...stroke} />
          {innerGatewaySymbol(d.gw)}
        </>
      )}
      {d.shape === "task" && (
        <>
          <rect x="3" y="6" width="18" height="12" rx="3" {...stroke} strokeWidth={1.3} />
          {taskCornerGlyph(d.taskType)}
        </>
      )}
      {d.shape === "rect" && (
        <>
          <rect x="3" y="6" width="18" height="12" rx="3" {...stroke} strokeWidth={d.thick ? 3 : 1.3} />
          {d.marker === "collapsed" && (
            <rect x="9.5" y="14" width="5" height="5" rx="0.6" {...stroke} />
          )}
          {d.marker === "expanded" && (
            <rect x="9.5" y="14" width="5" height="5" rx="0.6" {...stroke} strokeDasharray="1.5,1.2" />
          )}
          {d.marker === "adhoc" && (
            <path d="M10 14.5 L14 17 M10 17 L14 14.5" {...stroke} />
          )}
        </>
      )}
      {d.shape === "pool" && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="1" {...stroke} />
          <line x1="8" y1="4" x2="8" y2="20" {...stroke} />
        </>
      )}
      {d.shape === "lane" && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="1" {...stroke} />
          <line x1="3" y1="9" x2="21" y2="9" {...stroke} />
        </>
      )}
      {d.shape === "data" && (
        <path d="M6 3 h8 l4 4 v14 H6 Z M14 3 v4 h4" {...stroke} />
      )}
      {d.shape === "store" && (
        <>
          <path d="M5 6 a4 3 0 0 0 0 12 a4 3 0 0 0 0 -12 Z M5 6 v12 M19 6 v12 M5 6 a4 3 0 0 1 14 0" {...stroke} />
          <ellipse cx="12" cy="6" rx="7" ry="3" {...stroke} />
        </>
      )}
      {d.shape === "group" && (
        <rect x="3" y="5" width="18" height="14" rx="4" {...stroke} strokeDasharray="3,3" />
      )}
      {d.shape === "text" && (
        <path d="M3 4 h14 v16 H3 M5 4 v16 M8 9 h7 M8 12 h7 M8 15 h5" {...stroke} />
      )}
      {d.shape === "transaction" && (
        <>
          <rect x="3" y="6" width="18" height="12" rx="3" {...stroke} />
          <rect x="5.5" y="8.5" width="13" height="7" rx="1" {...stroke} strokeWidth={1.1} />
        </>
      )}
      {d.shape === "choreo" && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="1" {...stroke} strokeWidth={d.thick ? 3 : 1.3} />
          <rect x="3" y="5" width="6" height="14" rx="1" {...stroke} strokeWidth={1} />
        </>
      )}
    </svg>
  );
}

/* ------------------------------- Component ------------------------------- */

export default function BpmnElementPalette({ onDragStart }) {
  const [open, setOpen] = useState(() => ({
    common: true,
    ...Object.fromEntries(CATEGORIES.map((c) => [c.key, true])),
  }));

  const toggle = (key) => setOpen((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Elements</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-slate-100 bg-indigo-50/30">
          <button
            type="button"
            onClick={() => toggle("common")}
            className="w-full flex items-center gap-1.5 px-3 py-2 text-left hover:bg-indigo-50"
          >
            {open.common ? (
              <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span className="text-xs font-semibold text-indigo-700">Common Elements</span>
          </button>
          {open.common && (
            <div className="grid grid-cols-2 gap-1 px-2 pb-3 pt-1">
              {COMMON_ELEMENTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  title={`Drag ${item.label} onto the canvas`}
                  onMouseDown={(e) => onDragStart(e, item.type, item)}
                  className="flex flex-col items-center gap-1 p-2 rounded-md border border-transparent hover:border-indigo-200 hover:bg-indigo-50/60 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <BpmnIcon item={item} />
                  <span className="text-[10px] leading-tight text-slate-600 text-center">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="border-b border-slate-100">
            <button
              type="button"
              onClick={() => toggle(cat.key)}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-left hover:bg-slate-50"
            >
              {open[cat.key] ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="text-xs font-semibold text-slate-700">{cat.label}</span>
            </button>
            {open[cat.key] && (
              <div className="grid grid-cols-2 gap-1 px-2 pb-3 pt-1">
                {cat.items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    title={`Drag ${item.label} onto the canvas`}
                    onMouseDown={(e) => onDragStart(e, item.type, item)}
                    className="flex flex-col items-center gap-1 p-2 rounded-md border border-transparent hover:border-indigo-200 hover:bg-indigo-50/60 transition-colors cursor-grab active:cursor-grabbing"
                  >
                    <BpmnIcon item={item} />
                    <span className="text-[10px] leading-tight text-slate-600 text-center">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, HelpCircle, Copy, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchableSelect from "@/components/ui/SearchableSelect";
import ActivityDescriptionEditor from "@/components/processmodelling/ActivityDescriptionEditor";
import DiagramProcessPicker from "@/components/processmodelling/DiagramProcessPicker";
import {
  FIELDS,
  CATEGORY_SECTIONS,
  CATEGORY_LABELS,
} from "@/components/processmodelling/bpmnDataConfig";

// Defensive label builders — option lists are built from whatever fields exist.
const LABEL_BUILDERS = {
  stakeholder: (s) =>
    s.full_name || s.name || s.stakeholder_name || `Stakeholder ${String(s.id).slice(-4)}`,
  ictsystem: (x) =>
    x.system_name || x.name || x.application_name || `System ${String(x.id).slice(-4)}`,
  risk: (r) =>
    `${r.risk_reference || ""} ${r.risk_title || r.title || r.name || ""}`.trim() ||
    `Risk ${String(r.id).slice(-4)}`,
  control: (c) =>
    `${c.control_id || c.reference_number || ""} ${c.control_name || c.name || c.title || ""}`.trim() ||
    `Control ${String(c.id).slice(-4)}`,
  framework: (f) =>
    `${f.name || ""}${f.framework_code ? ` (${f.framework_code})` : ""}`.trim() ||
    `Framework ${String(f.id).slice(-4)}`,
  orgprocess: (p) =>
    `${p.process_code || ""} ${p.name || ""}`.trim() || `Process ${String(p.id).slice(-4)}`,
};

// Map an OrgProcess record onto element-pane fields, used to auto-populate
// the element's data when it is linked to an existing company process.
const buildProcessFieldMap = (p) => ({
  name: p.name || "",
  process_reference: p.process_code || "",
  process_owner: p.process_owner || "",
  activity_owner_performer: p.process_owner || "",
  activity_description: p.description || "",
  input: p.inputs || "",
  output: p.outputs || "",
});

function useEntityOptions(companyId) {
  const enabled = !!companyId;
  const queries = {
    stakeholder: useQuery({
      queryKey: ["dpStakeholders", companyId],
      queryFn: () => base44.entities.Stakeholder.filter({ company_id: companyId }),
      enabled,
      staleTime: 60000,
    }),
    ictsystem: useQuery({
      queryKey: ["dpIctSystems", companyId],
      queryFn: () => base44.entities.ICTSystem.filter({ company_id: companyId }),
      enabled,
      staleTime: 60000,
    }),
    risk: useQuery({
      queryKey: ["dpRisks", companyId],
      queryFn: () => base44.entities.Risk.filter({ company_id: companyId }),
      enabled,
      staleTime: 60000,
    }),
    control: useQuery({
      queryKey: ["dpControls", companyId],
      queryFn: () => base44.entities.Control.filter({ company_id: companyId }),
      enabled,
      staleTime: 60000,
    }),
    framework: useQuery({
      queryKey: ["dpFrameworks", companyId],
      queryFn: async () => {
        const all = await base44.entities.Framework.list("-created_date", 500);
        // Deduplicate by name, preferring master frameworks
        const sorted = [...all].sort((a, b) => (b.is_master ? 1 : 0) - (a.is_master ? 1 : 0));
        const seen = new Map();
        for (const f of sorted) {
          const key = (f.name || "").toLowerCase().trim();
          if (key && !seen.has(key)) seen.set(key, f);
        }
        return Array.from(seen.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      },
      enabled,
      staleTime: 60000,
    }),
    orgprocess: useQuery({
      queryKey: ["dpOrgProcesses", companyId],
      queryFn: () => base44.entities.OrgProcess.filter({ company_id: companyId }),
      enabled,
      staleTime: 60000,
    }),
  };
  return useMemo(() => {
    const out = {};
    const records = {};
    Object.keys(queries).forEach((k) => {
      const rows = queries[k].data || [];
      out[k] = rows.map((r) => ({ id: r.id, label: (LABEL_BUILDERS[k] || (() => ""))(r) }));
      records[k] = {};
      rows.forEach((r) => { records[k][r.id] = r; });
    });
    return { options: out, records };
  }, [
    queries.stakeholder.data,
    queries.ictsystem.data,
    queries.risk.data,
    queries.control.data,
    queries.framework.data,
    queries.orgprocess.data,
  ]);
}

function Field({ fieldKey, def, value, onChange }) {
  const id = `dp-${fieldKey}`;
  const common = { id, value: value || "", onChange };
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs font-medium text-slate-600">
        {def.label}
      </Label>
      {def.readOnly ? (
        <Input id={id} value={value || ""} readOnly disabled className="bg-slate-50 text-slate-500" />
      ) : def.type === "textarea" ? (
        <Textarea id={id} value={value || ""} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : def.type === "select" ? (
        <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
          <SelectTrigger id={id}>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {def.options.map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          value={value || ""}
          placeholder={def.placeholder || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function LinkedProcessSummary({ record }) {
  if (!record) return null;
  const rows = [
    record.process_code && { k: "Code", v: record.process_code },
    record.name && { k: "Name", v: record.name },
    record.process_owner && { k: "Owner", v: record.process_owner },
    record.workstream && { k: "Workstream", v: record.workstream },
    record.value_chain && { k: "Value chain", v: record.value_chain },
    record.criticality && { k: "Criticality", v: record.criticality },
    record.status && { k: "Status", v: record.status },
  ].filter(Boolean);
  if (!rows.length) return null;
  return (
    <div className="mt-1.5 rounded-md border border-indigo-100 bg-indigo-50/50 p-2.5 space-y-1">
      {rows.map((r) => (
        <div key={r.k} className="flex gap-2 text-xs">
          <span className="w-20 shrink-0 text-slate-400 font-medium">{r.k}</span>
          <span className="text-slate-700 break-words">{r.v}</span>
        </div>
      ))}
      {record.description && (
        <p className="pt-1 text-xs text-slate-600 border-t border-indigo-100/70">{record.description}</p>
      )}
    </div>
  );
}

export default function BpmnDataPane({
  companyId,
  category,
  elementId,
  elementLabel,
  elementGuid,
  data,
  onChange, // (key, value) => void
  currentProcess,
  onClose,
}) {
  const { options, records } = useEntityOptions(companyId);
  const sections = CATEGORY_SECTIONS[category] || CATEGORY_SECTIONS.default;
  const [showGuid, setShowGuid] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyGuid = async () => {
    if (!elementGuid) return;
    try {
      await navigator.clipboard.writeText(elementGuid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const renderField = (key) => {
    const def = FIELDS[key];
    if (!def) return null;
    if (key === "activity_description") {
      return (
        <div key={key} className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">{def.label}</Label>
          <ActivityDescriptionEditor
            value={data?.[key]}
            onChange={(v) => onChange(key, v)}
          />
        </div>
      );
    }
    if (def.type === "search") {
      const isLink = key === "linked_process";
      const linkedRecord =
        isLink && data?.[key] ? (records.orgprocess || {})[data[key]] : null;
      const handle = (v) => {
        onChange(key, v);
        if (isLink && v) {
          const rec = (records.orgprocess || {})[v];
          if (rec) {
            const map = buildProcessFieldMap(rec);
            const allowed = new Set(sections.flatMap((s) => s.fields));
            Object.entries(map).forEach(([fk, fv]) => {
              if (fv && allowed.has(fk) && !data?.[fk]) onChange(fk, fv);
            });
          }
        }
      };
      return (
        <div key={key} className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">{def.label}</Label>
          <SearchableSelect
            value={data?.[key] || ""}
            onValueChange={handle}
            options={options[def.entity] || []}
            placeholder="Search…"
            noneLabel="— Clear"
          />
          {linkedRecord && <LinkedProcessSummary record={linkedRecord} />}
        </div>
      );
    }
    return (
      <Field
        key={key}
        fieldKey={key}
        def={def}
        value={data?.[key]}
        onChange={(v) => onChange(key, v)}
      />
    );
  };

  return (
    <aside className="w-[380px] shrink-0 border-l border-slate-200 bg-white flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
            {CATEGORY_LABELS[category]}
          </p>
          {elementId ? (
            <p className="text-sm font-semibold text-slate-800 truncate" title={elementLabel || elementId}>
              {elementLabel || elementId}
            </p>
          ) : (
            <p className="text-sm text-slate-500">Process-level metadata</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowGuid((v) => !v)}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500"
            title="Show unique element identifier (GUID)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500"
            title="Hide data pane"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showGuid && (
        <div className="px-4 py-2.5 border-b border-slate-200 bg-indigo-50/60">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
            Unique Identifier (GUID)
          </p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate text-xs text-slate-700 font-mono bg-white border border-slate-200 rounded px-2 py-1">
              {elementGuid || "—"}
            </code>
            <button
              onClick={copyGuid}
              disabled={!elementGuid}
              className="p-1.5 rounded-md hover:bg-indigo-100 text-indigo-600 disabled:opacity-40"
              title="Copy GUID"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            Stable link for machine-learning and cross-system traceability.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {category === "canvas" && (
          <DiagramProcessPicker
            companyId={companyId}
            parentProcessId={data?.parent_process_reference}
            value={data?.diagram_process_id}
            currentProcess={currentProcess}
            processes={Object.values(records.orgprocess || {})}
            onChange={onChange}
          />
        )}
        {sections.map((sec) => (
          <section key={sec.title} className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-indigo-500 border-b border-slate-100 pb-1">
              {sec.title}
            </h4>
            <div className="space-y-3">
              {sec.fields.map((k) => renderField(k))}
            </div>
          </section>
        ))}
        {category !== "canvas" && (
          <p className="text-[11px] text-slate-400 italic">
            Select a different element on the canvas to edit its data. Select nothing to edit
            canvas / process-level data.
          </p>
        )}
      </div>
    </aside>
  );
}
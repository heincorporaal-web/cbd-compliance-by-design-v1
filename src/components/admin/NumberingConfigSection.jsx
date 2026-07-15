import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hash, Settings2 } from "lucide-react";
import { DEFAULT_NUMBERING_CONFIG, buildRefNumber } from "@/lib/autoNumbering";
import { cn } from "@/lib/utils";
import AdvancedNumberingDialog from "@/components/admin/AdvancedNumberingDialog";

const ENTITY_ROWS = [
  { key: "risk",     label: "Risk" },
  { key: "control",  label: "Control" },
  { key: "process",  label: "Process" },
  { key: "issue",    label: "Issue" },
  { key: "evidence", label: "Evidence" },
];

const ISSUE_LINKED_TYPES = [
  { key: "Assessment",         label: "Assessment" },
  { key: "Control",            label: "Control" },
  { key: "Risk",               label: "Risk" },
  { key: "OrgProcess",         label: "Process" },
  { key: "ICTSystem",          label: "ICT System" },
  { key: "Incident",           label: "Incident" },
  { key: "ThirdPartyProvider", label: "Third Party" },
  { key: "Company",            label: "Company" },
];

const DIVIDER_OPTIONS = [
  { value: "-", label: "Hyphen  ( - )" },
  { value: ".", label: "Period  ( . )" },
  { value: "/", label: "Slash   ( / )" },
  { value: "_", label: "Underscore ( _ )" },
  { value: "none",  label: "None" },
];

export default function NumberingConfigSection({ numbering = {}, onChange }) {
  const [advanced, setAdvanced] = useState(null); // entityKey or null

  const getCfg = (key) => ({
    ...DEFAULT_NUMBERING_CONFIG[key],
    ...(numbering[key] || {}),
    auto_number_enabled: (numbering[key] || {}).auto_number_enabled !== false,
    segments: Array.isArray((numbering[key] || {}).segments) ? (numbering[key] || {}).segments : [],
    ...(key === "issue" ? {
      linked_prefixes: {
        ...DEFAULT_NUMBERING_CONFIG.issue.linked_prefixes,
        ...((numbering.issue || {}).linked_prefixes || {}),
      },
    } : {}),
  });

  const updateField = (entityKey, field, value) => {
    const current = getCfg(entityKey);
    onChange({ ...numbering, [entityKey]: { ...current, [field]: value } });
  };

  const updateLinkedPrefix = (entityType, value) => {
    const current = getCfg("issue");
    onChange({
      ...numbering,
      issue: {
        ...current,
        linked_prefixes: { ...current.linked_prefixes, [entityType]: value.toUpperCase() },
      },
    });
  };

  const advancedEntity = advanced ? ENTITY_ROWS.find(e => e.key === advanced) : null;

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Hash className="w-4 h-4 text-primary" />
          Reference Number Configuration
        </CardTitle>
        <p className="text-xs text-slate-400 mt-0.5">
          Toggle auto-numbering per entity and customise the format. Example preview shown in the Entity column.
        </p>
      </CardHeader>
      <CardContent className="pt-4 space-y-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 font-semibold">
                <th className="text-left px-3 py-2 rounded-l">Entity / Preview</th>
                <th className="text-left px-3 py-2">Auto #</th>
                <th className="text-left px-3 py-2">Alpha Prefix</th>
                <th className="text-left px-3 py-2">Divider</th>
                <th className="text-left px-3 py-2">Start #</th>
                <th className="text-left px-3 py-2">Zero Pad</th>
                <th className="text-left px-3 py-2 rounded-r">Advanced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ENTITY_ROWS.map(({ key, label }) => {
                const cfg = getCfg(key);
                const useSegments = Array.isArray(cfg.segments) && cfg.segments.length > 0;
                const preview = useSegments
                  ? buildRefNumber(cfg, 1)
                  : `${cfg.alpha_prefix}${cfg.divider}${String(cfg.start_number).padStart(cfg.zero_pad, "0")}`;
                return (
                  <tr key={key} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-700 text-sm">{label}</p>
                      <p className="text-xs font-mono text-primary">{preview}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateField(key, "auto_number_enabled", true)}
                          className={cn("px-2.5 py-1 text-xs rounded-md border transition-colors", cfg.auto_number_enabled ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50")}
                        >On</button>
                        <button
                          type="button"
                          onClick={() => updateField(key, "auto_number_enabled", false)}
                          className={cn("px-2.5 py-1 text-xs rounded-md border transition-colors", !cfg.auto_number_enabled ? "bg-slate-300 text-slate-700 border-slate-300" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50")}
                        >Off</button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Input
                        className="w-24 h-8 text-xs font-mono"
                        value={cfg.alpha_prefix}
                        onChange={e => updateField(key, "alpha_prefix", e.target.value.toUpperCase())}
                        maxLength={8}
                        disabled={useSegments}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <Select value={cfg.divider || "none"} onValueChange={v => updateField(key, "divider", v === "none" ? "" : v)}>
                        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DIVIDER_OPTIONS.map(d => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2.5">
                      <Input
                        type="number"
                        min={1}
                        className="w-20 h-8 text-xs"
                        value={cfg.start_number}
                        onChange={e => updateField(key, "start_number", Number(e.target.value))}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <Select
                        value={String(cfg.zero_pad)}
                        onValueChange={v => updateField(key, "zero_pad", Number(v))}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[2, 3, 4, 5, 6].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} digits</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => setAdvanced(key)}
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        {useSegments ? "Edit" : "Advanced"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Issue sub-prefix by linked entity */}
        <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/60">
          <p className="text-xs font-semibold text-slate-600 mb-1">
            Issue Sub-Prefix by Linked Entity Type
          </p>
          <p className="text-xs text-slate-400 mb-3">
            Used when advanced segments are not configured. Example: linked to Risk →{" "}
            <span className="font-mono text-primary">
              {getCfg("issue").alpha_prefix}-{getCfg("issue").linked_prefixes.Risk}-{String(getCfg("issue").start_number).padStart(getCfg("issue").zero_pad, "0")}
            </span>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ISSUE_LINKED_TYPES.map(({ key, label }) => {
              const val = getCfg("issue").linked_prefixes?.[key] ?? "";
              return (
                <div key={key} className="space-y-1">
                  <Label className="text-xs text-slate-500">{label}</Label>
                  <Input
                    className="h-8 text-xs font-mono"
                    value={val}
                    maxLength={6}
                    placeholder="e.g. ASS"
                    onChange={e => updateLinkedPrefix(key, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>

      {advancedEntity && (
        <AdvancedNumberingDialog
          open={true}
          onClose={() => setAdvanced(null)}
          entityKey={advancedEntity.key}
          entityLabel={advancedEntity.label}
          cfg={getCfg(advancedEntity.key)}
          onChange={(patch) => {
            const current = getCfg(advancedEntity.key);
            onChange({ ...numbering, [advancedEntity.key]: { ...current, ...patch } });
          }}
        />
      )}
    </Card>
  );
}
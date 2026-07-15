import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select";
import FileUpload from "@/components/FileUpload";
import { toast } from "sonner";
import {
  RefreshCw, FilePenLine, Plus, Upload, ArrowLeft, ArrowRight, Loader2, CheckCircle2, AlertTriangle
} from "lucide-react";

const MODES = [
  { id: "replace", title: "Replace entire framework", desc: "Delete all existing pillars and nodes for the selected framework and rebuild from the file. The Framework record is kept and its metadata updated.", icon: RefreshCw, danger: true },
  { id: "update", title: "Add updated items & end-date prior versions", desc: "Nodes in the file that already exist (by code) are end-dated (retired) and replaced with the new version. New nodes are added. Unmatched existing nodes stay active.", icon: FilePenLine, danger: false },
  { id: "new", title: "New framework", desc: "Create a brand-new master framework with its pillars and nodes. Use this to add a standard not yet in the library.", icon: Plus, danger: false },
];

const CATEGORIES = [
  { value: "information_security", label: "Information Security" },
  { value: "privacy", label: "Privacy" },
  { value: "compliance", label: "Compliance" },
  { value: "operational_risk", label: "Operational Risk" },
  { value: "financial", label: "Financial" },
  { value: "other", label: "Other" },
];

export default function FrameworkUploadWizard({ open, onClose, frameworks = [], onDone }) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null);
  const [targetFrameworkId, setTargetFrameworkId] = useState("");
  const [fwName, setFwName] = useState("");
  const [fwCode, setFwCode] = useState("");
  const [version, setVersion] = useState("");
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [outcome, setOutcome] = useState(null);

  const hierarchyFrameworks = frameworks.filter(f => f.legacy_framework_id != null);

  const reset = () => {
    setStep(0); setMode(null); setTargetFrameworkId(""); setFwName(""); setFwCode("");
    setVersion(""); setCategory("other"); setDescription(""); setFileUrl(""); setFileName("");
    setProcessing(false); setOutcome(null);
  };

  const close = () => { reset(); onClose(); };

  const canProceedFromStep1 = () => {
    if (!fileUrl) return false;
    if (mode === "new") return !!fwName.trim();
    return !!targetFrameworkId;
  };

  const runUpload = async () => {
    setProcessing(true);
    try {
      const payload = {
        file_url: fileUrl,
        mode,
        target_framework_id: mode === "new" ? undefined : targetFrameworkId,
        framework_name: mode === "new" ? fwName.trim() : undefined,
        framework_code: mode === "new" ? fwCode.trim() : undefined,
        version: mode === "new" ? version.trim() : undefined,
        category: mode === "new" ? category : undefined,
        description: mode === "new" ? description.trim() : undefined,
      };
      const res = await base44.functions.invoke('uploadFrameworkLibrary', payload);
      setOutcome(res.data);
      toast.success("Framework library updated");
      if (onDone) onDone();
    } catch (e) {
      setOutcome({ error: e.response?.data?.error || e.message || "Upload failed" });
      toast.error(e.response?.data?.error || "Upload failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Upload Framework Library</DialogTitle>
          <DialogDescription>Import or update master library frameworks from a structured file (CSV, Excel or JSON). The file should contain frameworks with their pillars and nodes.</DialogDescription>
        </DialogHeader>

        {/* Step 0: behaviour */}
        {step === 0 && !outcome && (
          <div className="space-y-3 py-2">
            <p className="text-sm font-semibold text-slate-700">Choose import behaviour</p>
            {MODES.map(m => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex gap-3 ${active ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                      {m.title}
                      {m.danger && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 1: details + file */}
        {step === 1 && !outcome && (
          <div className="space-y-4 py-2">
            {mode !== "new" && (
              <div>
                <Label className="mb-1.5 block text-sm">Target framework</Label>
                <Select value={targetFrameworkId} onValueChange={setTargetFrameworkId}>
                  <SelectTrigger><SelectValue placeholder="Select a framework with hierarchy…" /></SelectTrigger>
                  <SelectContent>
                    {hierarchyFrameworks.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {mode === "replace" && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> All existing pillars and nodes for this framework will be permanently deleted.</p>
                )}
              </div>
            )}
            {mode === "new" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="mb-1 block text-sm">Framework name *</Label>
                  <Input value={fwName} onChange={e => setFwName(e.target.value)} placeholder="e.g. ISO 22301" />
                </div>
                <div>
                  <Label className="mb-1 block text-sm">Short code</Label>
                  <Input value={fwCode} onChange={e => setFwCode(e.target.value)} placeholder="e.g. ISO22301" />
                </div>
                <div>
                  <Label className="mb-1 block text-sm">Version</Label>
                  <Input value={version} onChange={e => setVersion(e.target.value)} placeholder="e.g. 2019" />
                </div>
                <div className="col-span-2">
                  <Label className="mb-1 block text-sm">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="mb-1 block text-sm">Description</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short framework description" />
                </div>
              </div>
            )}
            <div>
              <Label className="mb-1.5 block text-sm">Upload structured file *</Label>
              <FileUpload onFileUploaded={(url, name) => { setFileUrl(url); setFileName(name); }} />
              {fileName && <p className="text-xs text-slate-500 mt-1">Selected: {fileName}</p>}
              <p className="text-xs text-slate-400 mt-2">Accepts CSV, Excel or JSON. The file should describe one or more frameworks, each with pillars and nodes (node_code, node_title, node_text, node_type_name, parent_node_code, level_no, sort_order, is_mandatory, external_ref, guidance_text, key_aspects).</p>
            </div>
          </div>
        )}

        {/* Step 2: review */}
        {step === 2 && !outcome && (
          <div className="space-y-3 py-2">
            <p className="text-sm font-semibold text-slate-700">Review and confirm</p>
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm">
              <Row label="Behaviour" value={MODES.find(m => m.id === mode)?.title} />
              {mode === "new" ? (
                <>
                  <Row label="New framework" value={fwName} />
                  <Row label="Code / version" value={`${fwCode || "—"} / ${version || "—"}`} />
                  <Row label="Category" value={CATEGORIES.find(c => c.value === category)?.label} />
                </>
              ) : (
                <Row label="Target framework" value={hierarchyFrameworks.find(f => f.id === targetFrameworkId)?.name || "—"} />
              )}
              <Row label="File" value={fileName || "—"} />
            </div>
            {mode === "replace" && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">This will permanently delete and rebuild the framework's pillars and nodes. This cannot be undone.</p>
              </div>
            )}
          </div>
        )}

        {/* Outcome */}
        {outcome && (
          <div className="py-4 space-y-3 text-center">
            {outcome.error ? (
              <>
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
                <p className="font-semibold text-slate-800">Upload failed</p>
                <p className="text-sm text-red-600">{outcome.error}</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-semibold text-slate-800">Import complete</p>
                <div className="text-sm text-slate-600 grid grid-cols-3 gap-2 max-w-sm mx-auto pt-1">
                  <Stat label="Frameworks" value={outcome.frameworks?.length || 0} />
                  <Stat label="Nodes created" value={outcome.nodesCreated || 0} />
                  <Stat label="Pillars" value={outcome.pillarsCreated || 0} />
                </div>
                {outcome.nodesRetired > 0 && <p className="text-xs text-amber-600">{outcome.nodesRetired} prior version(s) end-dated.</p>}
              </>
            )}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between">
          <Button variant="ghost" onClick={close}>{outcome ? "Close" : "Cancel"}</Button>
          {!outcome && (
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} disabled={processing}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              )}
              {step === 0 && (
                <Button onClick={() => setStep(1)} disabled={!mode}>
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              {step === 1 && (
                <Button onClick={() => setStep(2)} disabled={!canProceedFromStep1()}>
                  Review <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              {step === 2 && (
                <Button onClick={runUpload} disabled={processing}>
                  {processing ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Importing…</> : <><Upload className="w-4 h-4 mr-1" /> Run import</>}
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right">{value || "—"}</span>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
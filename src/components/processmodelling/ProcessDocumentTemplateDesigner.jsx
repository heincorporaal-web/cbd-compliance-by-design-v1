import React, { useMemo, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FIELDS,
  CATEGORY_SECTIONS,
  CATEGORY_LABELS,
} from "@/components/processmodelling/bpmnDataConfig";
import { OPEN_SOURCE_FONTS } from "@/components/processmodelling/ActivityDescriptionEditor";

const FontAttributor = Quill.import("formats/font");
FontAttributor.whitelist = OPEN_SOURCE_FONTS;
Quill.register(FontAttributor, true);

const MODULES = {
  toolbar: {
    container: [
      [{ font: OPEN_SOURCE_FONTS }, { size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
    ],
  },
};

const STATUS_OPTIONS = [
  { value: "collaborate", label: "Collaborate" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "approved", label: "Approved" },
];

// Document-level merge tokens always available
const DOC_META_FIELDS = [
  { key: "created_by", label: "Created By" },
  { key: "status", label: "Status" },
  { key: "process_name", label: "Process Name" },
  { key: "process_code", label: "Process Code" },
  { key: "created_date", label: "Created Date" },
  { key: "template_version", label: "Template Version" },
];

function extractTokens(html) {
  const re = /{{\s*([a-z0-9_]+)\s*}}/gi;
  const out = [];
  let m;
  while ((m = re.exec(html || ""))) out.push(m[1]);
  return Array.from(new Set(out));
}

export default function ProcessDocumentTemplateDesigner({ template, onSave, onCancel, saving }) {
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [category, setCategory] = useState(template?.category || "");
  const [status, setStatus] = useState(template?.status || "collaborate");
  const [versionLabel, setVersionLabel] = useState(template?.version_label || "");
  const [bodyHtml, setBodyHtml] = useState(template?.body_html || "");
  const quillRef = useRef(null);

  const fieldGroups = useMemo(() => {
    const groups = [];
    Object.entries(CATEGORY_SECTIONS).forEach(([cat, sections]) => {
      const fields = [];
      sections.forEach((sec) =>
        sec.fields.forEach((k) => {
          if (FIELDS[k] && !fields.find((f) => f.key === k)) {
            fields.push({ key: k, label: FIELDS[k].label });
          }
        })
      );
      if (fields.length) groups.push({ category: cat, label: CATEGORY_LABELS[cat] || cat, fields });
    });
    return groups;
  }, []);

  const insertToken = (token) => {
    const editor = quillRef.current?.getEditor?.();
    if (!editor) {
      setBodyHtml((b) => b + token);
      return;
    }
    const range = editor.getSelection();
    const index = range ? range.index : editor.getLength();
    editor.insertText(index, token, "user");
    editor.setSelection(index + token.length, 0);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      status,
      version_label: versionLabel.trim(),
      body_html: bodyHtml,
      fields_used: extractTokens(bodyHtml),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Template name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SOP — Order Management" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="SOP, Work Instruction, Report…" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Version label</Label>
            <Input value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} placeholder="v1.0" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Template body — click a field on the right to insert it</Label>
          <div className="doc-template-editor">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={bodyHtml}
              onChange={setBodyHtml}
              modules={MODULES}
              placeholder="Compose the document template…"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {template?.id ? "Update" : "Create"} template
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-500 border-b border-slate-100 pb-1">Document fields</p>
          <div className="mt-2 space-y-1">
            {DOC_META_FIELDS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => insertToken(`{{${f.key}}}`)}
                className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-indigo-50 text-slate-700 flex items-center justify-between"
              >
                <span>{f.label}</span>
                <code className="text-[10px] text-slate-400">{`{{${f.key}}}`}</code>
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[460px] overflow-y-auto pr-1 space-y-3">
          {fieldGroups.map((g) => (
            <div key={g.category}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-100 pb-1">{g.label}</p>
              <div className="mt-1 space-y-0.5">
                {g.fields.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => insertToken(`{{${f.key}}}`)}
                    className="w-full text-left text-xs px-2 py-1 rounded hover:bg-slate-100 text-slate-600 flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{f.label}</span>
                    <code className="text-[10px] text-slate-400 shrink-0">{`{{${f.key}}}`}</code>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
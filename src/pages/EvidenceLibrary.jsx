import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload, FileText, Image, Monitor, Table2, Presentation, File,
  Plus, Search, Tag, Link2, AlertTriangle, CheckCircle2, Clock,
  Folder, X, Eye, Trash2, BookOpen
} from "lucide-react";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { format, isPast, isWithinInterval, addDays } from "date-fns";
import { getEntityNumConfig, buildRefNumber, getNextSequence } from "@/lib/autoNumbering";

const FILE_TYPE_ICONS = {
  document: FileText,
  image: Image,
  screenshot: Monitor,
  spreadsheet: Table2,
  presentation: Presentation,
  other: File,
};

const CATEGORY_COLORS = {
  "Policy": "bg-blue-100 text-blue-700",
  "Procedure": "bg-indigo-100 text-indigo-700",
  "Test Evidence": "bg-green-100 text-green-700",
  "Interview Notes": "bg-yellow-100 text-yellow-700",
  "System Output": "bg-cyan-100 text-cyan-700",
  "Report": "bg-purple-100 text-purple-700",
  "Walkthrough": "bg-pink-100 text-pink-700",
  "Data Extract": "bg-orange-100 text-orange-700",
  "Observation": "bg-teal-100 text-teal-700",
  "Other": "bg-slate-100 text-slate-600",
};

const CATEGORIES = ["Policy", "Procedure", "Test Evidence", "Interview Notes", "System Output", "Report", "Walkthrough", "Data Extract", "Observation", "Other"];
const FILE_TYPES = ["document", "image", "screenshot", "spreadsheet", "presentation", "other"];

export default function EvidenceLibrary() {
  const [globalCompany] = useCompanyFilter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("library");

  const emptyForm = () => ({
    name: "", description: "", file_url: "", file_name: "", file_type: "document",
    category: "Other", tags: [], company_id: globalCompany !== "all" ? globalCompany : "",
    linked_control_ids: [], linked_cycle_ids: [], linked_control_assessment_ids: [],
    notes: "", expiry_date: "",
  });

  const [form, setForm] = useState(emptyForm);

  const { data: evidenceList = [] } = useQuery({
    queryKey: ["evidence"],
    queryFn: () => base44.entities.Evidence.list("-created_date"),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: companyPrefs = [] } = useQuery({
    queryKey: ["companyPrefs"],
    queryFn: () => base44.entities.CompanyPreference.list(),
  });

  const { data: controls = [] } = useQuery({
    queryKey: ["controls-active"],
    queryFn: () => base44.entities.Control.filter({ status: "active" }),
  });

  const { data: cycles = [] } = useQuery({
    queryKey: ["control-cycles"],
    queryFn: () => base44.entities.ControlAssessmentCycle.list("-created_date"),
  });

  const { data: controlAssessments = [] } = useQuery({
    queryKey: ["control-assessments"],
    queryFn: () => base44.entities.ControlAssessment.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const pref = companyPrefs.find(p => p.company_id === data.company_id) || null;
      const cfg  = getEntityNumConfig(pref, "evidence");
      const companyEvidence = evidenceList.filter(e => e.company_id === data.company_id);
      const seq  = getNextSequence(companyEvidence, cfg);
      const refNum = buildRefNumber(cfg, seq);
      return base44.entities.Evidence.create({ ...data, reference_number: refNum });
    },
    onSuccess: () => { queryClient.invalidateQueries(["evidence"]); setIsUploadOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Evidence.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["evidence"]),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const ext = file.name.split(".").pop().toLowerCase();
    const guessedType = ["jpg","jpeg","png","gif","webp","svg"].includes(ext) ? "image"
      : ["xlsx","csv","xls"].includes(ext) ? "spreadsheet"
      : ["pptx","ppt"].includes(ext) ? "presentation"
      : ["pdf","doc","docx","txt"].includes(ext) ? "document" : "other";
    setForm(p => ({ ...p, file_url, file_name: file.name, file_type: guessedType, name: p.name || file.name.replace(/\.[^.]+$/, "") }));
    setUploading(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(p => ({ ...p, tags: [...p.tags, tagInput.trim()] }));
    }
    setTagInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const toggleMultiLink = (field, id) => {
    setForm(p => ({
      ...p, [field]: p[field].includes(id) ? p[field].filter(x => x !== id) : [...p[field], id]
    }));
  };

  const openUpload = (prefill = {}) => {
    setForm({ ...emptyForm(), ...prefill });
    setTagInput("");
    setIsUploadOpen(true);
  };

  // Filtered evidence
  const filtered = useMemo(() => {
    return evidenceList.filter(e => {
      if (globalCompany !== "all" && e.company_id !== globalCompany) return false;
      if (filterCategory !== "all" && e.category !== filterCategory) return false;
      if (filterType !== "all" && e.file_type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return e.name?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.tags?.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [evidenceList, globalCompany, filterCategory, filterType, search]);

  // Missing evidence analysis
  const missingAnalysis = useMemo(() => {
    const linkedAssessmentIds = new Set(evidenceList.flatMap(e => e.linked_control_assessment_ids || []));
    const linkedCycleIds = new Set(evidenceList.flatMap(e => e.linked_cycle_ids || []));
    const now = new Date();
    const soon = addDays(now, 14);

    const missingAssessments = controlAssessments.filter(a =>
      a.assessment_status !== "reviewed" && !linkedAssessmentIds.has(a.id)
    );

    const cyclesWithMissing = cycles
      .filter(c => c.status !== "closed" && !linkedCycleIds.has(c.id))
      .map(c => ({
        ...c,
        isOverdue: c.end_date && isPast(new Date(c.end_date)),
        isDueSoon: c.end_date && isWithinInterval(new Date(c.end_date), { start: now, end: soon }),
      }));

    return { missingAssessments, cyclesWithMissing };
  }, [evidenceList, controlAssessments, cycles]);

  const getControl = (id) => controls.find(c => c.id === id);
  const getCycle = (id) => cycles.find(c => c.id === id);

  const scopedEvidence = evidenceList.filter(e => globalCompany === "all" || e.company_id === globalCompany);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Evidence Library</h1>
          <p className="text-slate-500 text-sm">Upload, tag, and link audit evidence to controls and assessment cycles</p>
        </div>
        <Button onClick={() => openUpload()}>
          <Upload className="w-4 h-4 mr-2" /> Upload Evidence
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Files", value: scopedEvidence.length, icon: Folder, color: "text-primary" },
          { label: "Active Files", value: scopedEvidence.filter(e => e.status === "active").length, icon: CheckCircle2, color: "text-green-600" },
          { label: "Workpapers Missing Evidence", value: missingAnalysis.missingAssessments.length, icon: AlertTriangle, color: "text-amber-500" },
          { label: "Cycles Without Evidence", value: missingAnalysis.cyclesWithMissing.length, icon: Clock, color: "text-red-500" },
        ].map(s => (
          <Card key={s.label} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="library"><BookOpen className="w-4 h-4 mr-1.5" />Library</TabsTrigger>
          <TabsTrigger value="missing"><AlertTriangle className="w-4 h-4 mr-1.5" />Missing Evidence</TabsTrigger>
        </TabsList>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search name, description, or tag…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {FILE_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-200 bg-slate-50">
              <CardContent className="p-12 text-center">
                <Folder className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No evidence files found. Upload your first file to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(ev => {
                const Icon = FILE_TYPE_ICONS[ev.file_type] || File;
                const linkedControls = (ev.linked_control_ids || []).map(id => getControl(id)).filter(Boolean);
                const linkedCyclesItems = (ev.linked_cycle_ids || []).map(id => getCycle(id)).filter(Boolean);
                const totalLinks = linkedControls.length + linkedCyclesItems.length;
                return (
                  <Card key={ev.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{ev.name}</p>
                          {ev.reference_number && (
                            <p className="text-xs font-mono text-primary">{ev.reference_number}</p>
                          )}
                          <p className="text-xs text-slate-400 truncate">{ev.file_name}</p>
                        </div>
                        <Badge className={`text-xs shrink-0 border-0 ${CATEGORY_COLORS[ev.category] || ""}`}>{ev.category}</Badge>
                      </div>
                      {ev.description && <p className="text-xs text-slate-500 line-clamp-2">{ev.description}</p>}
                      {ev.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {ev.tags.map(t => (
                            <span key={t} className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                              <Tag className="w-2.5 h-2.5" />{t}
                            </span>
                          ))}
                        </div>
                      )}
                      {totalLinks > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-50">
                          {linkedControls.slice(0, 2).map(c => (
                            <span key={c.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                              <Link2 className="w-2.5 h-2.5 inline mr-1" />{c.control_id}
                            </span>
                          ))}
                          {linkedCyclesItems.slice(0, 1).map(c => (
                            <span key={c.id} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded truncate max-w-[120px]">
                              <Link2 className="w-2.5 h-2.5 inline mr-1" />{c.name}
                            </span>
                          ))}
                          {totalLinks > 3 && <span className="text-xs text-slate-400">+{totalLinks - 3} more</span>}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        {ev.file_url && (
                          <a href={ev.file_url} target="_blank" rel="noreferrer" className="flex-1">
                            <Button size="sm" variant="outline" className="w-full text-xs h-7">
                              <Eye className="w-3.5 h-3.5 mr-1" />View File
                            </Button>
                          </a>
                        )}
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 h-7" onClick={() => deleteMutation.mutate(ev.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Missing Evidence Tab */}
        <TabsContent value="missing" className="space-y-6 mt-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Assessment Cycles Without Evidence
                <Badge variant="outline" className="ml-auto">{missingAnalysis.cyclesWithMissing.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {missingAnalysis.cyclesWithMissing.length === 0 ? (
                <p className="px-5 py-6 text-sm text-center text-slate-400">All active cycles have linked evidence.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Cycle</th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Status</th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">End Date</th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Urgency</th>
                        <th className="px-5 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {missingAnalysis.cyclesWithMissing.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                          <td className="px-5 py-3"><Badge variant="outline" className="text-xs capitalize">{c.status}</Badge></td>
                          <td className="px-5 py-3 text-slate-500 text-xs">{c.end_date ? format(new Date(c.end_date), "dd MMM yyyy") : "—"}</td>
                          <td className="px-5 py-3">
                            {c.isOverdue ? (
                              <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><AlertTriangle className="w-3.5 h-3.5" />Overdue</span>
                            ) : c.isDueSoon ? (
                              <span className="flex items-center gap-1 text-xs text-amber-600 font-medium"><Clock className="w-3.5 h-3.5" />Due soon</span>
                            ) : (
                              <span className="text-xs text-slate-400">Active</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openUpload({ linked_cycle_ids: [c.id] })}>
                              <Upload className="w-3 h-3 mr-1" />Add Evidence
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Control Workpapers Without Evidence
                <Badge variant="outline" className="ml-auto">{missingAnalysis.missingAssessments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {missingAnalysis.missingAssessments.length === 0 ? (
                <p className="px-5 py-6 text-sm text-center text-slate-400">All in-progress workpapers have linked evidence.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Control</th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Assigned To</th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Status</th>
                        <th className="px-5 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {missingAnalysis.missingAssessments.slice(0, 50).map(a => {
                        const ctrl = getControl(a.control_id);
                        return (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="px-5 py-3 font-medium text-slate-800 text-sm">
                              {ctrl ? <span><span className="font-mono text-primary text-xs mr-2">{ctrl.control_id}</span>{ctrl.title}</span> : a.control_id}
                            </td>
                            <td className="px-5 py-3 text-slate-500 text-xs">{a.assigned_to_name || "—"}</td>
                            <td className="px-5 py-3">
                              <Badge variant="outline" className="text-xs capitalize">{(a.assessment_status || "").replace(/_/g, " ")}</Badge>
                            </td>
                            <td className="px-5 py-3">
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openUpload({ linked_control_assessment_ids: [a.id], linked_control_ids: a.control_id ? [a.control_id] : [] })}>
                                <Upload className="w-3 h-3 mr-1" />Add Evidence
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Evidence</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File zone */}
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center relative hover:border-primary transition-colors">
              {form.file_url ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <span className="text-sm font-medium text-slate-700">{form.file_name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm(p => ({ ...p, file_url: "", file_name: "" }))}><X className="w-4 h-4" /></Button>
                </div>
              ) : uploading ? (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Uploading…
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Click to select a file</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOCX, XLSX, PNG, JPG and more</p>
                </>
              )}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={uploading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Evidence title" required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>File Type</Label>
                <Select value={form.file_type} onValueChange={v => setForm(p => ({ ...p, file_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FILE_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company *</Label>
                <Select value={form.company_id} onValueChange={v => setForm(p => ({ ...p, company_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expiry Date <span className="text-slate-400 text-xs">(optional)</span></Label>
                <Input type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What does this evidence demonstrate?" />
              </div>

              {/* Tags */}
              <div className="space-y-2 md:col-span-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="Type a tag and press Enter" />
                  <Button type="button" variant="outline" onClick={addTag}><Plus className="w-4 h-4" /></Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {form.tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {t}
                        <button type="button" onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }))}><X className="w-2.5 h-2.5" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Link to Controls */}
              {controls.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Link to Controls <span className="text-slate-400 text-xs">(multi-select)</span></Label>
                  <div className="border border-slate-200 rounded-lg max-h-36 overflow-y-auto divide-y divide-slate-50">
                    {controls.slice(0, 100).map(c => (
                      <label key={c.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 text-sm ${form.linked_control_ids.includes(c.id) ? "bg-primary/5" : ""}`}>
                        <input type="checkbox" checked={form.linked_control_ids.includes(c.id)} onChange={() => toggleMultiLink("linked_control_ids", c.id)} className="rounded" />
                        <span className="font-mono text-xs text-primary">{c.control_id}</span>
                        <span className="text-slate-600 truncate">{c.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Link to Cycles */}
              {cycles.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Link to Assessment Cycles <span className="text-slate-400 text-xs">(multi-select)</span></Label>
                  <div className="border border-slate-200 rounded-lg max-h-32 overflow-y-auto divide-y divide-slate-50">
                    {cycles.map(c => (
                      <label key={c.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 text-sm ${form.linked_cycle_ids.includes(c.id) ? "bg-primary/5" : ""}`}>
                        <input type="checkbox" checked={form.linked_cycle_ids.includes(c.id)} onChange={() => toggleMultiLink("linked_cycle_ids", c.id)} className="rounded" />
                        <span className="text-slate-700 truncate">{c.name}</span>
                        <Badge variant="outline" className="ml-auto text-xs">{c.status}</Badge>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || uploading}>
                <Upload className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "Saving…" : "Save Evidence"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
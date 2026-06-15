import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Plus, Search, Edit2, Trash2, Target, AlertTriangle, Upload, Palette, RefreshCw, Image, FileText, Eye, CalendarDays, BookOpen, CalendarOff, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import EndDateBadge, { isExpired } from "@/components/ui/EndDateBadge";
import CompanyCalendarTab from "@/components/companies/CompanyCalendarTab";
import FrameworkAssignmentTab from "@/components/companies/FrameworkAssignmentTab";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_COLORS = {
  primary: "#1e40af", secondary: "#3b82f6", accent: "#0ea5e9", background: "#f8fafc", text: "#0f172a",
};

const COLOR_PRESETS = [
  { name: "Ocean Blue", colors: { primary: "#1e40af", secondary: "#3b82f6", accent: "#0ea5e9", background: "#f0f9ff", text: "#0f172a" } },
  { name: "Forest Green", colors: { primary: "#166534", secondary: "#16a34a", accent: "#4ade80", background: "#f0fdf4", text: "#0f172a" } },
  { name: "Royal Purple", colors: { primary: "#6b21a8", secondary: "#9333ea", accent: "#c084fc", background: "#faf5ff", text: "#0f172a" } },
  { name: "Sunset Orange", colors: { primary: "#9a3412", secondary: "#ea580c", accent: "#fb923c", background: "#fff7ed", text: "#0f172a" } },
  { name: "Charcoal", colors: { primary: "#1e293b", secondary: "#475569", accent: "#94a3b8", background: "#f8fafc", text: "#0f172a" } },
  { name: "Rose", colors: { primary: "#9f1239", secondary: "#e11d48", accent: "#fb7185", background: "#fff1f2", text: "#0f172a" } },
];

export default function Companies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef();
  const queryClient = useQueryClient();

  const [showExpired, setShowExpired] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    contact_name: "",
    contact_email: "",
    status: "active",
    end_date: "",
    description: "",
    objectives: [],
    principle_risks: [],
    framework_assignments: [],
    logo_url: "",
    brand_colors: { ...DEFAULT_COLORS },
    include_logo_in_reports: true,
    report_header_text: "",
    report_footer_text: "",
  });

  // Fetch frameworks for assignment
  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list('-created_date'),
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Company.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      industry: "",
      contact_name: "",
      contact_email: "",
      status: "active",
      end_date: "",
      description: "",
      objectives: [],
      principle_risks: [],
      framework_assignments: [],
      logo_url: "",
      brand_colors: { ...DEFAULT_COLORS },
      include_logo_in_reports: true,
      report_header_text: "",
      report_footer_text: "",
    });
    setEditingCompany(null);
  };

  // Handle framework assignments update
  const handleFrameworkAssignmentsChange = (assignments) => {
    setFormData(prev => ({ ...prev, framework_assignments: assignments }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, logo_url: file_url }));
    setUploadingLogo(false);
  };

  const addObjective = () => {
    const newObjective = { id: Date.now().toString(), title: "", description: "" };
    setFormData({ ...formData, objectives: [...(formData.objectives || []), newObjective] });
  };

  const updateObjective = (id, field, value) => {
    setFormData({
      ...formData,
      objectives: formData.objectives.map(obj => obj.id === id ? { ...obj, [field]: value } : obj)
    });
  };

  const removeObjective = (id) => {
    setFormData({ ...formData, objectives: formData.objectives.filter(obj => obj.id !== id) });
  };

  const addPrincipleRisk = () => {
    const newRisk = { id: Date.now().toString(), title: "", description: "" };
    setFormData({ ...formData, principle_risks: [...(formData.principle_risks || []), newRisk] });
  };

  const updatePrincipleRisk = (id, field, value) => {
    setFormData({
      ...formData,
      principle_risks: formData.principle_risks.map(risk => risk.id === id ? { ...risk, [field]: value } : risk)
    });
  };

  const removePrincipleRisk = (id) => {
    setFormData({ ...formData, principle_risks: formData.principle_risks.filter(risk => risk.id !== id) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      ...company,
      brand_colors: { ...DEFAULT_COLORS, ...(company.brand_colors || {}) },
      include_logo_in_reports: company.include_logo_in_reports !== false,
      framework_assignments: company.framework_assignments || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this company?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    const expired = isExpired(company.end_date);
    return matchesSearch && (showExpired || !expired);
  });

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700 border-green-200',
      inactive: 'bg-slate-100 text-slate-700 border-slate-200',
      onboarding: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Companies</h1>
          <p className="text-slate-600">Manage organizations for risk assessment</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="details">
                <TabsList className="flex flex-wrap h-auto gap-1">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="objectives">
                    Objectives
                    {formData.objectives?.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{formData.objectives.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="risks">
                    Principal Risks
                    {formData.principle_risks?.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{formData.principle_risks.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                  <TabsTrigger value="frameworks">
                    <BookOpen className="w-3.5 h-3.5 mr-1" />
                    Frameworks
                    {formData.framework_assignments?.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{formData.framework_assignments.length}</Badge>
                    )}
                  </TabsTrigger>
                  {editingCompany && (
                    <TabsTrigger value="calendar" className="gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" /> Calendar
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date" className="flex items-center gap-1.5">
                    <CalendarOff className="w-3.5 h-3.5 text-slate-400" /> End Date
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date || ""}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                  <p className="text-xs text-slate-400">Set to mark this company as expired on that date</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
                </TabsContent>

                <TabsContent value="objectives" className="space-y-4 mt-4">
                  <p className="text-sm text-slate-600">Define strategic objectives for this company. For full detail management, use the <Link to="/OrgObjectives" className="text-blue-600 underline">Organisational Objectives</Link> page.</p>
                  {formData.objectives?.length > 0 ? (
                    <div className="space-y-3">
                      {formData.objectives.map((obj, idx) => (
                        <Card key={obj.id} className="p-4 border">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-sm">Objective #{idx + 1}</span>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeObjective(obj.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Reference</Label>
                                <Input placeholder="e.g. OBJ-001" value={obj.reference_number || ""} onChange={(e) => updateObjective(obj.id, 'reference_number', e.target.value)} className="h-8 text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Title *</Label>
                                <Input placeholder="Objective title" value={obj.title} onChange={(e) => updateObjective(obj.id, 'title', e.target.value)} className="h-8 text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Category</Label>
                                <Select value={obj.category || "Operational"} onValueChange={v => updateObjective(obj.id, 'category', v)}>
                                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {["Compliance","IT Compliance","Operational","Financial","Client Relations","Resilience","Data","Fundamentals"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Objective Type</Label>
                                <Select value={obj.objective_type || "Strategic"} onValueChange={v => updateObjective(obj.id, 'objective_type', v)}>
                                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {["Strategic","Tactical","Regulatory","Operational"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Status</Label>
                                <Select value={obj.status || "Draft"} onValueChange={v => updateObjective(obj.id, 'status', v)}>
                                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {["Draft","Approved","Active","Under Review","Retired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Criticality (MoSCoW)</Label>
                                <Select value={obj.criticality || "Must Have"} onValueChange={v => updateObjective(obj.id, 'criticality', v)}>
                                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {["Must Have","Should Have","Could Have","Won't Have"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Time Horizon</Label>
                                <Select value={obj.time_horizon || "Annual"} onValueChange={v => updateObjective(obj.id, 'time_horizon', v)}>
                                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {["Annual","3 Year","5 Year","Continuous"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Strategic Theme</Label>
                                <Input placeholder="Free text theme" value={obj.strategic_theme || ""} onChange={(e) => updateObjective(obj.id, 'strategic_theme', e.target.value)} className="h-8 text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Objective Owner</Label>
                                <Input placeholder="Owner name" value={obj.objective_owner || ""} onChange={(e) => updateObjective(obj.id, 'objective_owner', e.target.value)} className="h-8 text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Performance Owner</Label>
                                <Input placeholder="Performance owner" value={obj.performance_owner || ""} onChange={(e) => updateObjective(obj.id, 'performance_owner', e.target.value)} className="h-8 text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Valid From</Label>
                                <Input type="date" value={obj.valid_from || ""} onChange={(e) => updateObjective(obj.id, 'valid_from', e.target.value)} className="h-8 text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Valid To</Label>
                                <Input type="date" value={obj.valid_to || ""} onChange={(e) => updateObjective(obj.id, 'valid_to', e.target.value)} className="h-8 text-sm" />
                              </div>
                            </div>
                            <Textarea placeholder="Objective description" value={obj.description || ""} onChange={(e) => updateObjective(obj.id, 'description', e.target.value)} rows={2} className="text-sm" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No objectives defined yet</p>
                    </div>
                  )}
                  <div className="flex justify-center pt-1">
                    <Button type="button" onClick={addObjective} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />Add Objective
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="risks" className="space-y-4 mt-4">
                  <p className="text-sm text-slate-600">Define principal risks for this company. For full detail management, use the <Link to="/PrincipalRisks" className="text-blue-600 underline">Principal Risks</Link> page.</p>
                  {formData.principle_risks?.length > 0 ? (
                    <div className="space-y-3">
                      {formData.principle_risks.map((risk, idx) => (
                        <Card key={risk.id} className="p-4 border">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                              <span className="font-medium text-sm">Principal Risk #{idx + 1}</span>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePrincipleRisk(risk.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Reference</Label>
                                <Input placeholder="e.g. PR-001" value={risk.risk_reference || ""} onChange={(e) => updatePrincipleRisk(risk.id, 'risk_reference', e.target.value)} className="h-8 text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Risk Title *</Label>
                                <Input placeholder='e.g. "IT Compliance & Control Risk"' value={risk.risk_title || risk.title || ""} onChange={(e) => updatePrincipleRisk(risk.id, 'risk_title', e.target.value)} className="h-8 text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Risk Category</Label>
                                <Select value={risk.risk_category || "Operational"} onValueChange={v => updatePrincipleRisk(risk.id, 'risk_category', v)}>
                                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {["Strategic","Compliance","IT","Operational","Cyber","Data","Third Party","Financial Crime"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Sub-Category</Label>
                                <Input placeholder="More granular classification" value={risk.risk_sub_category || ""} onChange={(e) => updatePrincipleRisk(risk.id, 'risk_sub_category', e.target.value)} className="h-8 text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Status</Label>
                                <Select value={risk.status || "Draft"} onValueChange={v => updatePrincipleRisk(risk.id, 'status', v)}>
                                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {["Draft","Active","Under Review","Retired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Priority</Label>
                                <Select value={risk.priority || "Medium"} onValueChange={v => updatePrincipleRisk(risk.id, 'priority', v)}>
                                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {["High","Medium","Low"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Criticality</Label>
                                <Select value={risk.criticality || "Medium"} onValueChange={v => updatePrincipleRisk(risk.id, 'criticality', v)}>
                                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {["Critical","High","Medium","Low"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Review Frequency</Label>
                                <Select value={risk.review_frequency || "Quarterly"} onValueChange={v => updatePrincipleRisk(risk.id, 'review_frequency', v)}>
                                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {["Monthly","Quarterly","Annually"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Valid From</Label>
                                <Input type="date" value={risk.valid_from || ""} onChange={(e) => updatePrincipleRisk(risk.id, 'valid_from', e.target.value)} className="h-8 text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Next Review Date</Label>
                                <Input type="date" value={risk.next_review_date || ""} onChange={(e) => updatePrincipleRisk(risk.id, 'next_review_date', e.target.value)} className="h-8 text-sm" />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Risk Statement</Label>
                              <Textarea placeholder="Full cause-event-impact statement…" value={risk.risk_statement || ""} onChange={(e) => updatePrincipleRisk(risk.id, 'risk_statement', e.target.value)} rows={2} className="text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs">Risk Description</Label>
                              <Textarea placeholder="Longer explanation of the risk…" value={risk.risk_description || risk.description || ""} onChange={(e) => updatePrincipleRisk(risk.id, 'risk_description', e.target.value)} rows={2} className="text-sm" />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No principal risks defined yet</p>
                    </div>
                  )}
                  <div className="flex justify-center pt-1">
                    <Button type="button" onClick={addPrincipleRisk} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />Add Principal Risk
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="branding" className="space-y-5 mt-4">

                  {/* Live preview */}
                  <div className="space-y-2">
                    <Label className="font-medium flex items-center gap-2"><Eye className="w-4 h-4 text-violet-500" /> Live Preview</Label>
                    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      {/* Report header preview */}
                      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: formData.brand_colors?.primary || DEFAULT_COLORS.primary }}>
                        <div className="flex items-center gap-3">
                          {formData.logo_url && formData.include_logo_in_reports !== false ? (
                            <img src={formData.logo_url} alt="logo" className="h-8 object-contain rounded" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-white/60" />
                            </div>
                          )}
                          <span className="text-white font-semibold text-sm">
                            {formData.report_header_text || formData.name || "Company Name — Risk Assessment"}
                          </span>
                        </div>
                        <span className="text-white/60 text-xs">Report Preview</span>
                      </div>
                      {/* Body preview */}
                      <div className="px-5 py-4" style={{ backgroundColor: formData.brand_colors?.background || DEFAULT_COLORS.background }}>
                        <div className="flex gap-3 mb-3">
                          {["primary", "secondary", "accent"].map(k => (
                            <div key={k} className="h-2 rounded-full flex-1" style={{ backgroundColor: formData.brand_colors?.[k] || DEFAULT_COLORS[k] }} />
                          ))}
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 rounded" style={{ backgroundColor: formData.brand_colors?.text || DEFAULT_COLORS.text, opacity: 0.15, width: "70%" }} />
                          <div className="h-3 rounded" style={{ backgroundColor: formData.brand_colors?.text || DEFAULT_COLORS.text, opacity: 0.1, width: "50%" }} />
                        </div>
                      </div>
                      {/* Footer preview */}
                      <div className="px-5 py-2 border-t flex items-center justify-between" style={{ backgroundColor: formData.brand_colors?.secondary || DEFAULT_COLORS.secondary }}>
                        <span className="text-white/80 text-xs">
                          {formData.report_footer_text || "Confidential — Internal Use Only"}
                        </span>
                        <span className="text-white/50 text-xs">Page 1</span>
                      </div>
                    </div>
                  </div>

                  {/* Logo */}
                  <div className="space-y-2">
                    <Label className="font-medium flex items-center gap-2"><Image className="w-4 h-4 text-violet-500" /> Company Logo</Label>
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 shrink-0">
                        {formData.logo_url ? (
                          <img src={formData.logo_url} alt="logo" className="max-w-full max-h-full object-contain p-1 rounded" />
                        ) : (
                          <Image className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-2 flex-wrap">
                          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo} className="gap-2">
                            <Upload className="w-3.5 h-3.5" />
                            {uploadingLogo ? "Uploading…" : "Upload Logo"}
                          </Button>
                          {formData.logo_url && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(p => ({ ...p, logo_url: "" }))} className="text-red-500 gap-2">
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </Button>
                          )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        {formData.logo_url && (
                          <div className="flex items-center gap-2">
                            <input id="include-logo" type="checkbox" checked={formData.include_logo_in_reports !== false} onChange={e => setFormData(p => ({ ...p, include_logo_in_reports: e.target.checked }))} className="rounded" />
                            <Label htmlFor="include-logo" className="text-sm text-slate-600 cursor-pointer">Include logo in exported reports</Label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Colour palette */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium flex items-center gap-2"><Palette className="w-4 h-4 text-violet-500" /> Colour Palette</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(p => ({ ...p, brand_colors: { ...DEFAULT_COLORS } }))} className="text-slate-500 gap-1">
                        <RefreshCw className="w-3.5 h-3.5" /> Reset
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {COLOR_PRESETS.map(preset => (
                        <button type="button" key={preset.name} onClick={() => setFormData(p => ({ ...p, brand_colors: { ...p.brand_colors, ...preset.colors } }))}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-xs font-medium text-slate-600 transition-colors">
                          <span className="flex gap-0.5">
                            {["primary", "secondary", "accent"].map(k => (
                              <span key={k} className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.colors[k] }} />
                            ))}
                          </span>
                          {preset.name}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[{ key: "primary", label: "Primary" }, { key: "secondary", label: "Secondary" }, { key: "accent", label: "Accent" }, { key: "background", label: "Background" }, { key: "text", label: "Text" }].map(({ key, label }) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-xs text-slate-500">{label}</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm cursor-pointer relative overflow-hidden" style={{ backgroundColor: formData.brand_colors?.[key] || DEFAULT_COLORS[key] }}>
                              <input type="color" value={formData.brand_colors?.[key] || DEFAULT_COLORS[key]} onChange={e => setFormData(p => ({ ...p, brand_colors: { ...p.brand_colors, [key]: e.target.value } }))} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                            </div>
                            <Input value={formData.brand_colors?.[key] || DEFAULT_COLORS[key]} onChange={e => setFormData(p => ({ ...p, brand_colors: { ...p.brand_colors, [key]: e.target.value } }))} className="h-8 text-xs font-mono w-24" maxLength={7} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Report settings */}
                  <div className="space-y-3">
                    <Label className="font-medium flex items-center gap-2"><FileText className="w-4 h-4 text-violet-500" /> Report Settings</Label>
                    <div className="space-y-2">
                      <Label className="text-sm">Report Header Text</Label>
                      <Input value={formData.report_header_text || ""} onChange={e => setFormData(p => ({ ...p, report_header_text: e.target.value }))} placeholder={formData.name || "Company Name — Risk Assessment"} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Report Footer Text</Label>
                      <Textarea value={formData.report_footer_text || ""} onChange={e => setFormData(p => ({ ...p, report_footer_text: e.target.value }))} placeholder="Confidential — Internal Use Only" rows={2} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="frameworks" className="space-y-4 mt-4">
                  <FrameworkAssignmentTab
                    companyId={editingCompany?.id}
                    existingAssignments={formData.framework_assignments || []}
                    frameworks={frameworks}
                    onAssignmentsChange={handleFrameworkAssignmentsChange}
                  />
                </TabsContent>

                {editingCompany && (
                  <TabsContent value="calendar" className="mt-4">
                    <CompanyCalendarTab companyId={editingCompany.id} />
                  </TabsContent>
                )}
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingCompany ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant={showExpired ? "default" : "outline"} size="sm" onClick={() => setShowExpired(v => !v)} className="gap-1.5 shrink-0">
              <CalendarOff className="w-4 h-4" />
              {showExpired ? "Hiding Expired" : "Show Expired"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading companies...</div>
          ) : filteredCompanies.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredCompanies.map((company) => (
                <div key={company.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building2 className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{company.name}</h3>
                          <Badge variant="outline" className={`${getStatusColor(company.status)} border`}>
                            {company.status}
                          </Badge>
                          <EndDateBadge endDate={company.end_date} />
                        </div>
                        {company.industry && (
                          <p className="text-sm text-slate-600 mb-1">{company.industry}</p>
                        )}
                        {company.contact_name && (
                          <p className="text-sm text-slate-500">
                            Contact: {company.contact_name}
                            {company.contact_email && ` • ${company.contact_email}`}
                          </p>
                        )}
                        {company.description && (
                          <p className="text-sm text-slate-500 mt-2">{company.description}</p>
                        )}
                        {company.framework_assignments?.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs text-slate-500">
                              {company.framework_assignments.length} framework{company.framework_assignments.length !== 1 ? 's' : ''} assigned
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(company.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No companies found</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Add Your First Company
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
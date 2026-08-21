import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen, Globe, Lock, Search, Plus, FileText, Calendar, User,
  ChevronRight, AlertTriangle, CheckCircle2, Clock, Archive,
  BarChart3, GitBranch, ClipboardList, Eye, Edit3, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import ModuleToggleStrip from "@/components/branding/ModuleToggleStrip";
import GovernanceLinksPanel from "@/components/governance/GovernanceLinksPanel";
import { BRANDS } from "@/lib/moduleBrands";

// ── Constants ──────────────────────────────────────────────────────────────

const DOC_TYPE_LABEL = {
  framework: "Framework",
  policy: "Policy",
  standard: "Standard",
  procedure: "Procedure",
  guideline: "Guideline",
};

const STATUS_CONFIG = {
  draft:             { label: "Draft",             color: "bg-slate-100 text-slate-600 border-slate-200" },
  internal_review:   { label: "Internal Review",   color: "bg-amber-100 text-amber-700 border-amber-200" },
  awaiting_approval: { label: "Awaiting Approval", color: "bg-orange-100 text-orange-700 border-orange-200" },
  approved:          { label: "Approved",          color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  published:         { label: "Published",         color: "bg-green-100 text-green-700 border-green-200" },
  under_review:      { label: "Under Review",      color: "bg-blue-100 text-blue-700 border-blue-200" },
  superseded:        { label: "Superseded",        color: "bg-purple-100 text-purple-700 border-purple-200" },
  retired:           { label: "Retired",           color: "bg-red-100 text-red-700 border-red-200" },
  expired:           { label: "Expired",           color: "bg-red-100 text-red-700 border-red-200" },
};

const GOVERNANCE_DOMAINS = [
  "Information Security", "Operational Resilience", "Third Party Management",
  "Data Governance", "Technology Governance", "Risk Management",
  "Compliance", "Human Capital", "Finance", "Legal", "Other",
];

const REVIEW_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "bi-annual", label: "Bi-annual" },
  { value: "annual", label: "Annual" },
  { value: "two_yearly", label: "Every 2 years" },
  { value: "as_required", label: "As required" },
];

const CRITICALITY_COLOR = {
  critical: "bg-red-100 text-red-700",
  high:     "bg-orange-100 text-orange-700",
  medium:   "bg-amber-100 text-amber-700",
  low:      "bg-slate-100 text-slate-600",
};

// ── Review-status helper ────────────────────────────────────────────────────

function getReviewStatus(doc) {
  if (!doc.next_review_date) return null;
  const days = differenceInDays(parseISO(doc.next_review_date), new Date());
  if (days < 0) return { label: "Overdue", color: "text-red-600 bg-red-50", days };
  if (days <= 30) return { label: `${days}d`, color: "text-orange-600 bg-orange-50", days };
  if (days <= 90) return { label: `${days}d`, color: "text-amber-600 bg-amber-50", days };
  return { label: `${days}d`, color: "text-green-700 bg-green-50", days };
}

// ── Document form dialog ────────────────────────────────────────────────────

function DocumentFormDialog({ open, onOpenChange, doc, companyId, onSave }) {
  const isNew = !doc;
  const [form, setForm] = useState(() => doc || {
    document_name: "",
    document_code: "",
    document_type: "policy",
    governance_domain: "",
    policy_category: "",
    description: "",
    owner_name: "",
    approver_name: "",
    status: "draft",
    current_version: "1.0",
    effective_date: "",
    next_review_date: "",
    review_frequency: "annual",
    review_lead_days: 60,
    business_criticality: "medium",
    regulatory_significance: "medium",
    mandatory_advisory: "mandatory",
    document_url: "",
    company_id: companyId,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.document_name.trim()) {
      toast.error("Document name is required.");
      return;
    }
    onSave({ ...form, company_id: companyId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "New Governance Document" : "Edit Document"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Document Name *</Label>
              <Input value={form.document_name} onChange={(e) => set("document_name", e.target.value)} placeholder="e.g. Information Security Policy" />
            </div>
            <div>
              <Label>Document Code</Label>
              <Input value={form.document_code || ""} onChange={(e) => set("document_code", e.target.value)} placeholder="e.g. POL-SEC-001" />
            </div>
            <div>
              <Label>Document Type</Label>
              <Select value={form.document_type} onValueChange={(v) => set("document_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Governance Domain</Label>
              <Select value={form.governance_domain || ""} onValueChange={(v) => set("governance_domain", v)}>
                <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                <SelectContent>
                  {GOVERNANCE_DOMAINS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.policy_category || ""} onChange={(e) => set("policy_category", e.target.value)} placeholder="e.g. Access Management" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Owner</Label>
              <Input value={form.owner_name || ""} onChange={(e) => set("owner_name", e.target.value)} placeholder="Name or role" />
            </div>
            <div>
              <Label>Approver</Label>
              <Input value={form.approver_name || ""} onChange={(e) => set("approver_name", e.target.value)} placeholder="Name or role" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Version</Label>
              <Input value={form.current_version || ""} onChange={(e) => set("current_version", e.target.value)} placeholder="e.g. 1.0" />
            </div>
            <div>
              <Label>Effective Date</Label>
              <Input type="date" value={form.effective_date || ""} onChange={(e) => set("effective_date", e.target.value)} />
            </div>
            <div>
              <Label>Next Review Date</Label>
              <Input type="date" value={form.next_review_date || ""} onChange={(e) => set("next_review_date", e.target.value)} />
            </div>
            <div>
              <Label>Review Frequency</Label>
              <Select value={form.review_frequency || "annual"} onValueChange={(v) => set("review_frequency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REVIEW_FREQUENCIES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Business Criticality</Label>
              <Select value={form.business_criticality || "medium"} onValueChange={(v) => set("business_criticality", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mandatory / Advisory</Label>
              <Select value={form.mandatory_advisory || "mandatory"} onValueChange={(v) => set("mandatory_advisory", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mandatory">Mandatory</SelectItem>
                  <SelectItem value="advisory">Advisory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Document URL / Location</Label>
              <Input value={form.document_url || ""} onChange={(e) => set("document_url", e.target.value)} placeholder="https:// or SharePoint path" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-[#800020] hover:bg-[#65081F] text-white">
            {isNew ? "Create" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Document detail dialog ──────────────────────────────────────────────────

function DocumentDetailDialog({ open, onOpenChange, doc, onEdit, onDelete, onStatusChange, companyId }) {
  if (!doc) return null;
  const sc = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
  const reviewStatus = getReviewStatus(doc);

  const TRANSITIONS = {
    draft:             ["internal_review", "awaiting_approval"],
    internal_review:   ["awaiting_approval", "draft"],
    awaiting_approval: ["approved", "draft"],
    approved:          ["published"],
    published:         ["under_review", "superseded", "retired"],
    under_review:      ["published", "awaiting_approval", "draft"],
    superseded:        ["retired"],
    retired:           [],
    expired:           ["under_review", "retired"],
  };

  const nextStates = TRANSITIONS[doc.status] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs text-slate-400 font-mono">{doc.document_code || "—"}</p>
              <DialogTitle className="text-xl leading-tight">{doc.document_name}</DialogTitle>
            </div>
            <Badge variant="outline" className={sc.color}>{sc.label}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><span className="text-slate-400">Type:</span> <span className="font-medium">{DOC_TYPE_LABEL[doc.document_type] || doc.document_type}</span></div>
            <div><span className="text-slate-400">Version:</span> <span className="font-medium">{doc.current_version || "—"}</span></div>
            <div><span className="text-slate-400">Domain:</span> <span className="font-medium">{doc.governance_domain || "—"}</span></div>
            <div><span className="text-slate-400">Category:</span> <span className="font-medium">{doc.policy_category || "—"}</span></div>
            <div><span className="text-slate-400">Owner:</span> <span className="font-medium">{doc.owner_name || "—"}</span></div>
            <div><span className="text-slate-400">Approver:</span> <span className="font-medium">{doc.approver_name || "—"}</span></div>
            <div><span className="text-slate-400">Effective:</span> <span className="font-medium">{doc.effective_date ? format(parseISO(doc.effective_date), "d MMM yyyy") : "—"}</span></div>
            <div>
              <span className="text-slate-400">Next Review:</span>{" "}
              <span className="font-medium">{doc.next_review_date ? format(parseISO(doc.next_review_date), "d MMM yyyy") : "—"}</span>
              {reviewStatus && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-semibold ${reviewStatus.color}`}>
                  {reviewStatus.days < 0 ? "Overdue" : `${reviewStatus.days}d`}
                </span>
              )}
            </div>
            <div><span className="text-slate-400">Review Freq:</span> <span className="font-medium capitalize">{doc.review_frequency || "—"}</span></div>
            <div><span className="text-slate-400">Criticality:</span> <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${CRITICALITY_COLOR[doc.business_criticality] || ""}`}>{doc.business_criticality || "—"}</span></div>
          </div>

          {doc.description && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Description</p>
              <p className="text-sm text-slate-700">{doc.description}</p>
            </div>
          )}

          {doc.document_url && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Document location</p>
              <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#800020] hover:underline break-all">{doc.document_url}</a>
            </div>
          )}

          {/* Linked entities summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Linked Risks", count: (doc.linked_risk_ids || []).length, color: "text-red-600" },
              { label: "Linked Controls", count: (doc.linked_control_ids || []).length, color: "text-blue-600" },
              { label: "Linked Frameworks", count: (doc.linked_framework_ids || []).length, color: "text-purple-600" },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Lifecycle transitions */}
          {nextStates.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Advance status</p>
              <div className="flex flex-wrap gap-2">
                {nextStates.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <Button key={s} size="sm" variant="outline" onClick={() => onStatusChange(doc.id, s)} className="text-xs gap-1.5">
                      <ChevronRight className="w-3 h-3" /> {cfg?.label || s}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Traceability links to OBD processes and ABD assets */}
          <GovernanceLinksPanel doc={doc} companyId={companyId} />
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="destructive" size="sm" onClick={() => onDelete(doc.id)} className="mr-auto gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => { onOpenChange(false); onEdit(doc); }} className="bg-[#800020] hover:bg-[#65081F] text-white gap-1.5">
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Summary stat card ───────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color = "text-slate-800" }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#800020]" />
      </div>
      <div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </Card>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function GovernanceByDesignModule() {
  const [companyId] = useCompanyFilter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("library");

  const [formOpen, setFormOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [detailDoc, setDetailDoc] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const effectiveCompanyId = companyId === "all" ? null : companyId;

  // Role check
  const { data: roles = [] } = useQuery({
    queryKey: ["userRoles"],
    queryFn: () => base44.entities.UserRole.list("-created_date", 2000),
    enabled: !!user?.custom_role_id,
  });
  const myRole = roles.find((r) => r.id === user?.custom_role_id);
  const isProductOwner = user?.role === "admin" || !!myRole?.is_product_owner;

  // Company preferences
  const { data: prefs = [] } = useQuery({
    queryKey: ["companyPrefs", effectiveCompanyId],
    queryFn: () => base44.entities.CompanyPreference.filter({ company_id: effectiveCompanyId }),
    enabled: !!effectiveCompanyId,
  });
  const pref = prefs[0];
  const moduleEnabled = !!pref?.enable_governance_by_design;

  const enableModuleMutation = useMutation({
    mutationFn: async (enable) => {
      if (pref) {
        return base44.entities.CompanyPreference.update(pref.id, { enable_governance_by_design: enable });
      }
      return base44.entities.CompanyPreference.create({
        company_id: effectiveCompanyId,
        enable_governance_by_design: enable,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["companyPrefs", effectiveCompanyId]);
      toast.success(`Governance by Design ${moduleEnabled ? "disabled" : "enabled"}`);
    },
  });

  // Governance documents
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["governanceDocs", effectiveCompanyId],
    queryFn: () => base44.entities.GovernanceDocument.filter({ company_id: effectiveCompanyId }),
    enabled: !!effectiveCompanyId && moduleEnabled,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) return base44.entities.GovernanceDocument.update(data.id, data);
      return base44.entities.GovernanceDocument.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["governanceDocs"]);
      setFormOpen(false);
      setEditDoc(null);
      toast.success("Document saved");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GovernanceDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["governanceDocs"]);
      setDetailOpen(false);
      toast.success("Document deleted");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.GovernanceDocument.update(id, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries(["governanceDocs"]);
      setDetailOpen(false);
      toast.success(`Status updated to ${STATUS_CONFIG[vars.status]?.label || vars.status}`);
    },
  });

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter((d) => {
      const matchQ = !q || [d.document_name, d.document_code, d.owner_name, d.governance_domain, d.policy_category].filter(Boolean).some((v) => v.toLowerCase().includes(q));
      const matchType = typeFilter === "all" || d.document_type === typeFilter;
      const matchStatus = statusFilter === "all" || d.status === statusFilter;
      const matchDomain = domainFilter === "all" || d.governance_domain === domainFilter;
      return matchQ && matchType && matchStatus && matchDomain;
    });
  }, [docs, search, typeFilter, statusFilter, domainFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: docs.length,
    published: docs.filter((d) => d.status === "published").length,
    draftOrReview: docs.filter((d) => ["draft", "internal_review", "awaiting_approval", "under_review"].includes(d.status)).length,
    overdue: docs.filter((d) => {
      if (!d.next_review_date) return false;
      return differenceInDays(parseISO(d.next_review_date), new Date()) < 0;
    }).length,
    dueSoon: docs.filter((d) => {
      if (!d.next_review_date) return false;
      const days = differenceInDays(parseISO(d.next_review_date), new Date());
      return days >= 0 && days <= 30;
    }).length,
  }), [docs]);

  // Domains present in current data
  const presentDomains = useMemo(() => [...new Set(docs.map((d) => d.governance_domain).filter(Boolean))], [docs]);

  // ── No company guard ────────────────────────────────────────────────────
  if (!effectiveCompanyId) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="p-10 text-center text-slate-500">
          <Globe className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">Select a specific company to manage Governance by Design.</p>
          <p className="text-sm text-slate-400 mt-1">The add-on is switched on per company.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-5">
      {/* Module toggle */}
      {isProductOwner && (
        <ModuleToggleStrip
          brand={BRANDS.gbd}
          moduleName="Governance by Design"
          moduleEnabled={moduleEnabled}
          onToggle={(v) => enableModuleMutation.mutate(v)}
          enabledLabel="Switched on — manage your governance artefact library with full policy lifecycle management."
          disabledLabel="Switched off — enable the add-on to begin managing policy governance."
        />
      )}

      {/* Disabled state */}
      {!moduleEnabled ? (
        <Card className="p-10 text-center text-slate-500">
          {isProductOwner ? (
            <>
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Governance by Design is switched off.</p>
              <p className="text-sm text-slate-400 mt-1">Enable the add-on above to begin managing your governance artefact library.</p>
            </>
          ) : (
            <>
              <Lock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Governance by Design is not enabled for your company.</p>
              <p className="text-sm text-slate-400 mt-1">
                Request activation using the Contact form in the{" "}
                <Link to="/about" className="text-[#800020] font-medium hover:underline">About section</Link>.
              </p>
            </>
          )}
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="library">Governance Library</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            </TabsList>

            {/* ── LIBRARY TAB ── */}
            <TabsContent value="library" className="space-y-4 mt-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents…" className="pl-9" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="All types" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={domainFilter} onValueChange={setDomainFilter}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="All domains" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All domains</SelectItem>
                      {presentDomains.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Badge variant="secondary">{filtered.length} document{filtered.length !== 1 ? "s" : ""}</Badge>
                  <Button
                    onClick={() => { setEditDoc(null); setFormOpen(true); }}
                    className="gap-1.5 bg-[#800020] hover:bg-[#65081F] text-white"
                  >
                    <Plus className="w-4 h-4" /> New document
                  </Button>
                </div>
              </div>

              {/* Document table / cards */}
              {isLoading ? (
                <div className="text-center text-slate-400 py-16">Loading…</div>
              ) : filtered.length === 0 ? (
                <Card className="p-10 text-center text-slate-500">
                  <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">No governance documents yet.</p>
                  <p className="text-sm text-slate-400 mt-1 mb-4">Create your first policy, standard or framework to get started.</p>
                  <Button onClick={() => { setEditDoc(null); setFormOpen(true); }} className="gap-1.5 bg-[#800020] hover:bg-[#65081F] text-white">
                    <Plus className="w-4 h-4" /> New document
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filtered.map((doc) => {
                    const sc = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
                    const rv = getReviewStatus(doc);
                    return (
                      <Card
                        key={doc.id}
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-[#800020]"
                        onClick={() => { setDetailDoc(doc); setDetailOpen(true); }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {doc.document_code && (
                                <span className="text-xs font-mono text-slate-400 shrink-0">{doc.document_code}</span>
                              )}
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{DOC_TYPE_LABEL[doc.document_type] || doc.document_type}</Badge>
                            </div>
                            <h3 className="font-semibold text-slate-800 mt-0.5 leading-snug">{doc.document_name}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{doc.governance_domain || ""}{doc.policy_category ? ` · ${doc.policy_category}` : ""}</p>
                          </div>
                          <Badge variant="outline" className={`${sc.color} shrink-0 text-xs`}>{sc.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 gap-2 flex-wrap">
                          <div className="flex items-center gap-3">
                            {doc.owner_name && (
                              <span className="flex items-center gap-1"><User className="w-3 h-3" />{doc.owner_name}</span>
                            )}
                            {doc.current_version && (
                              <span className="flex items-center gap-1"><FileText className="w-3 h-3" />v{doc.current_version}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.next_review_date && rv && (
                              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${rv.color}`}>
                                <Calendar className="w-3 h-3" />
                                {rv.days < 0 ? "Review overdue" : `Review in ${rv.days}d`}
                              </span>
                            )}
                            {doc.business_criticality && (
                              <span className={`px-1.5 py-0.5 rounded text-xs capitalize ${CRITICALITY_COLOR[doc.business_criticality] || ""}`}>
                                {doc.business_criticality}
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ── DASHBOARD TAB ── */}
            <TabsContent value="dashboard" className="space-y-5 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Documents" value={stats.total} icon={FileText} />
                <StatCard label="Published" value={stats.published} icon={CheckCircle2} color="text-green-700" />
                <StatCard label="In Progress" value={stats.draftOrReview} icon={Clock} color="text-amber-700" />
                <StatCard label="Overdue Reviews" value={stats.overdue} icon={AlertTriangle} color="text-red-700" />
              </div>

              {/* By domain */}
              {presentDomains.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#800020]" /> Policy Landscape by Domain
                  </h3>
                  <div className="space-y-2.5">
                    {presentDomains.map((domain) => {
                      const domainDocs = docs.filter((d) => d.governance_domain === domain);
                      const published = domainDocs.filter((d) => d.status === "published").length;
                      const pct = domainDocs.length > 0 ? Math.round((published / domainDocs.length) * 100) : 0;
                      return (
                        <div key={domain} className="flex items-center gap-3">
                          <span className="text-sm text-slate-600 w-48 truncate shrink-0">{domain}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-2.5 min-w-0">
                            <div className="h-2.5 rounded-full bg-[#800020] transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 w-16 text-right shrink-0">{domainDocs.length} docs · {pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Review pipeline */}
              <Card className="p-5">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#800020]" /> Upcoming Reviews
                </h3>
                {(() => {
                  const upcoming = docs
                    .filter((d) => d.next_review_date)
                    .map((d) => ({ ...d, daysLeft: differenceInDays(parseISO(d.next_review_date), new Date()) }))
                    .filter((d) => d.daysLeft <= 90)
                    .sort((a, b) => a.daysLeft - b.daysLeft)
                    .slice(0, 8);
                  if (upcoming.length === 0) {
                    return <p className="text-sm text-slate-400">No reviews due within 90 days.</p>;
                  }
                  return (
                    <div className="space-y-2">
                      {upcoming.map((d) => {
                        const isOverdue = d.daysLeft < 0;
                        return (
                          <div key={d.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-800 truncate">{d.document_name}</p>
                              <p className="text-xs text-slate-400">{d.document_code || ""}{d.governance_domain ? ` · ${d.governance_domain}` : ""}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${isOverdue ? "bg-red-100 text-red-700" : d.daysLeft <= 30 ? "bg-orange-100 text-orange-700" : "bg-amber-50 text-amber-700"}`}>
                              {isOverdue ? `${Math.abs(d.daysLeft)}d overdue` : `${d.daysLeft}d`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </Card>

              {/* Status breakdown */}
              <Card className="p-5">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[#800020]" /> Lifecycle Status Distribution
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                    const count = docs.filter((d) => d.status === status).length;
                    if (count === 0) return null;
                    return (
                      <div key={status} className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-2xl font-bold text-slate-800">{count}</p>
                        <Badge variant="outline" className={`${cfg.color} text-xs mt-1`}>{cfg.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Dialogs */}
      <DocumentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        doc={editDoc}
        companyId={effectiveCompanyId}
        onSave={(data) => saveMutation.mutate(data)}
      />
      <DocumentDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        doc={detailDoc}
        companyId={effectiveCompanyId}
        onEdit={(doc) => { setEditDoc(doc); setFormOpen(true); }}
        onDelete={(id) => deleteMutation.mutate(id)}
        onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
      />
    </div>
  );
}
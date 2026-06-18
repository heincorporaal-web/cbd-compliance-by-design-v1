import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Palette, Upload, Image, Save, CheckCircle, Eye,
  FileText, Building2, RefreshCw, Trash2
} from "lucide-react";
import ConfidentialityClassificationPanel from "@/components/reports/ConfidentialityClassificationPanel";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";

const DEFAULT_COLORS = {
  primary: "#1e40af",
  secondary: "#3b82f6",
  accent: "#0ea5e9",
  background: "#f8fafc",
  text: "#0f172a",
};

const COLOR_PRESETS = [
  {
    name: "Ocean Blue",
    colors: { primary: "#1e40af", secondary: "#3b82f6", accent: "#0ea5e9", background: "#f0f9ff", text: "#0f172a" }
  },
  {
    name: "Forest Green",
    colors: { primary: "#166534", secondary: "#16a34a", accent: "#4ade80", background: "#f0fdf4", text: "#0f172a" }
  },
  {
    name: "Royal Purple",
    colors: { primary: "#6b21a8", secondary: "#9333ea", accent: "#c084fc", background: "#faf5ff", text: "#0f172a" }
  },
  {
    name: "Sunset Orange",
    colors: { primary: "#9a3412", secondary: "#ea580c", accent: "#fb923c", background: "#fff7ed", text: "#0f172a" }
  },
  {
    name: "Charcoal",
    colors: { primary: "#1e293b", secondary: "#475569", accent: "#94a3b8", background: "#f8fafc", text: "#0f172a" }
  },
  {
    name: "Rose",
    colors: { primary: "#9f1239", secondary: "#e11d48", accent: "#fb7185", background: "#fff1f2", text: "#0f172a" }
  },
];

function ColorSwatch({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-slate-500">{label}</Label>
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-lg border border-slate-200 shadow-sm cursor-pointer relative overflow-hidden"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-9 text-xs font-mono w-28"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function ReportPreview({ company, colors, logoUrl }) {
  const headerBg = colors.primary || "#1e40af";
  const accentColor = colors.accent || "#0ea5e9";

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-md text-xs font-sans bg-white" style={{ minHeight: 280 }}>
      {/* Report header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: headerBg }}>
        <div className="flex items-center gap-3">
          {company?.include_logo_in_reports !== false && logoUrl ? (
            <img src={logoUrl} alt="logo" className="h-8 w-auto object-contain bg-white/20 rounded p-0.5" />
          ) : (
            <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white/70" />
            </div>
          )}
          <span className="text-white font-semibold text-sm">
            {company?.report_header_text || company?.name || "Company Name"}
          </span>
        </div>
        <span className="text-white/60 text-xs">Risk Assessment Report</span>
      </div>

      {/* Report body */}
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          {["Identified", "Pending Review", "Approved"].map((s, i) => (
            <span key={s} className="px-2 py-0.5 rounded text-white text-xs" style={{ backgroundColor: i === 2 ? "#16a34a" : i === 1 ? "#d97706" : accentColor }}>{s}</span>
          ))}
        </div>
        <div className="h-2 rounded-full" style={{ backgroundColor: colors.background || "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="h-full rounded-full w-2/3" style={{ backgroundColor: accentColor }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[12, 4, 8].map((n, i) => (
            <div key={i} className="rounded p-2 text-center" style={{ backgroundColor: colors.background || "#f8fafc", border: `1px solid ${colors.secondary || "#e2e8f0"}` }}>
              <div className="text-lg font-bold" style={{ color: colors.primary }}>{n}</div>
              <div className="text-slate-500">Risks</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      {company?.report_footer_text && (
        <div className="px-5 py-2 border-t text-slate-400 text-xs" style={{ borderColor: colors.secondary + "40" }}>
          {company.report_footer_text}
        </div>
      )}
    </div>
  );
}

export default function CompanyBranding() {
  const [selectedCompanyId] = useCompanyFilter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef();

  const [selectedCompany, setSelectedCompany] = useState(selectedCompanyId || "");
  const [colors, setColors] = useState({ ...DEFAULT_COLORS });
  const [logoUrl, setLogoUrl] = useState("");
  const [includeLogoInReports, setIncludeLogoInReports] = useState(true);
  const [reportHeaderText, setReportHeaderText] = useState("");
  const [reportFooterText, setReportFooterText] = useState("");
  const [confidentialityLevels, setConfidentialityLevels] = useState([]);
  const [defaultClassification, setDefaultClassification] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list("-created_date"),
  });

  const { data: company } = useQuery({
    queryKey: ["company-detail", selectedCompany],
    queryFn: () => base44.entities.Company.filter({ id: selectedCompany }).then(r => r[0]),
    enabled: !!selectedCompany,
  });

  // Sync form when company changes
  useEffect(() => {
    if (company) {
      setColors({ ...DEFAULT_COLORS, ...(company.brand_colors || {}) });
      setLogoUrl(company.logo_url || "");
      setIncludeLogoInReports(company.include_logo_in_reports !== false);
      setReportHeaderText(company.report_header_text || "");
      setReportFooterText(company.report_footer_text || "");
      setConfidentialityLevels(company.confidentiality_levels || []);
      setDefaultClassification(company.default_classification || "");
    }
  }, [company]);

  // Auto-select first company
  useEffect(() => {
    if (!selectedCompany && companies.length > 0) {
      setSelectedCompany(companies[0].id);
    }
  }, [companies, selectedCompany]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.update(selectedCompany, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["company-detail", selectedCompany]);
      queryClient.invalidateQueries(["companies"]);
      queryClient.invalidateQueries(["company-branding", selectedCompany]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setLogoUrl(file_url);
    setUploadingLogo(false);
  };

  const handleRemoveLogo = () => setLogoUrl("");

  const applyPreset = (preset) => setColors({ ...colors, ...preset.colors });

  const handleSave = () => {
    updateMutation.mutate({
      brand_colors: colors,
      logo_url: logoUrl,
      include_logo_in_reports: includeLogoInReports,
      report_header_text: reportHeaderText,
      report_footer_text: reportFooterText,
      confidentiality_levels: confidentialityLevels,
      default_classification: defaultClassification,
    });
  };

  const resetToDefaults = () => {
    setColors({ ...DEFAULT_COLORS });
  };

  const previewCompany = {
    ...company,
    include_logo_in_reports: includeLogoInReports,
    report_header_text: reportHeaderText,
    report_footer_text: reportFooterText,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Company Branding</h1>
            <p className="text-slate-500">Logo, colour palette, and report customisation per company</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={!selectedCompany || updateMutation.isPending}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : updateMutation.isPending ? "Saving…" : "Save Branding"}
        </Button>
      </div>

      {/* Company selector */}
      <Card className="border-none shadow-sm">
        <CardContent className="py-4 flex items-center gap-4">
          <Building2 className="w-5 h-5 text-slate-400 shrink-0" />
          <div className="flex-1">
            <Label className="text-xs text-slate-500 mb-1 block">Select Company</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Choose a company…" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {company?.logo_url && (
            <img src={company.logo_url} alt="current logo" className="h-10 w-auto object-contain rounded border border-slate-100 p-1" />
          )}
        </CardContent>
      </Card>

      {selectedCompany && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Logo + Palette + Report settings */}
          <div className="xl:col-span-2 space-y-6">

            {/* Logo */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Image className="w-4 h-4 text-violet-500" /> Company Logo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-28 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="logo" className="max-w-full max-h-full object-contain p-1 rounded" />
                    ) : (
                      <Image className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">Upload your company logo (PNG, SVG, JPG recommended)</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="gap-2"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingLogo ? "Uploading…" : "Upload Logo"}
                      </Button>
                      {logoUrl && (
                        <Button variant="ghost" size="sm" onClick={handleRemoveLogo} className="text-red-500 gap-2">
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </Button>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    {logoUrl && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          id="include-logo"
                          type="checkbox"
                          checked={includeLogoInReports}
                          onChange={e => setIncludeLogoInReports(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="include-logo" className="text-sm text-slate-600 cursor-pointer">
                          Include logo in exported reports
                        </Label>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Colour palette */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Palette className="w-4 h-4 text-violet-500" /> Colour Palette
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetToDefaults} className="text-slate-500 gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Presets */}
                <div>
                  <Label className="text-xs text-slate-500 mb-2 block">Quick Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-xs font-medium text-slate-600 transition-colors"
                      >
                        <span className="flex gap-0.5">
                          {["primary", "secondary", "accent"].map(k => (
                            <span key={k} className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.colors[k] }} />
                          ))}
                        </span>
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom colours */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { key: "primary",    label: "Primary" },
                    { key: "secondary",  label: "Secondary" },
                    { key: "accent",     label: "Accent" },
                    { key: "background", label: "Background" },
                    { key: "text",       label: "Text" },
                  ].map(({ key, label }) => (
                    <ColorSwatch
                      key={key}
                      label={label}
                      value={colors[key] || DEFAULT_COLORS[key]}
                      onChange={v => setColors(prev => ({ ...prev, [key]: v }))}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Report settings */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-4 h-4 text-violet-500" /> Report Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="report-header" className="text-sm">Report Header Text</Label>
                  <Input
                    id="report-header"
                    value={reportHeaderText}
                    onChange={e => setReportHeaderText(e.target.value)}
                    placeholder={company?.name || "Company Name — Risk Assessment"}
                  />
                  <p className="text-xs text-slate-400">Shown in the top bar of generated reports. Defaults to the company name.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-footer" className="text-sm">Report Footer Text</Label>
                  <Textarea
                    id="report-footer"
                    value={reportFooterText}
                    onChange={e => setReportFooterText(e.target.value)}
                    placeholder="Confidential — Internal Use Only"
                    rows={2}
                  />
                  <p className="text-xs text-slate-400">Optional disclaimer or classification text at the bottom of reports.</p>
                </div>
              </CardContent>
            </Card>

            {/* Confidentiality classifications */}
            <ConfidentialityClassificationPanel
              levels={confidentialityLevels}
              defaultClassification={defaultClassification}
              onChange={setConfidentialityLevels}
              onDefaultChange={setDefaultClassification}
            />
          </div>

          {/* Right: Live preview */}
          <div className="space-y-4">
            <Card className="border-none shadow-sm sticky top-24">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="w-4 h-4 text-violet-500" /> Live Preview
                </CardTitle>
                <p className="text-xs text-slate-400">How reports will look with this branding</p>
              </CardHeader>
              <CardContent>
                <ReportPreview company={previewCompany} colors={colors} logoUrl={logoUrl} />

                {/* Colour strip */}
                <div className="mt-4 flex rounded-lg overflow-hidden h-5 shadow-sm">
                  {["primary", "secondary", "accent", "background"].map(k => (
                    <div key={k} className="flex-1" style={{ backgroundColor: colors[k] }} title={k} />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1 px-0.5">
                  <span>Primary</span><span>Secondary</span><span>Accent</span><span>BG</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!selectedCompany && (
        <div className="py-16 text-center text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a company above to configure its branding.</p>
        </div>
      )}
    </div>
  );
}
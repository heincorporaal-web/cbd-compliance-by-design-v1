import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, Building2, Mail, Settings2, Shield, BarChart2, CheckSquare } from "lucide-react";
import NumberingConfigSection from "@/components/admin/NumberingConfigSection";
import { toast } from "sonner";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const RISK_APPETITE_OPTIONS = ["Very Low","Low","Medium","High","Very High"];

const emptyPrefs = {
  numbering_config: {},
  default_assessment_model_id: "",
  default_assessment_model_name: "",
  default_workflow_approver_email: "",
  default_issue_approver_email: "",
  risk_mailbox: "",
  compliance_mailbox: "",
  audit_mailbox: "",
  governance_mailbox: "",
  notification_from_name: "",
  default_currency: "USD",
  fiscal_year_start_month: 1,
  risk_review_frequency_days: 90,
  issue_escalation_days: 14,
  require_evidence_on_assessment: false,
  enable_workflow_email_notifications: true,
  enable_risk_auto_scoring: false,
  default_risk_appetite: "Medium",
  control_assessment_reminder_days: 7,
  max_resubmissions: 3,
};

function Section({ icon: Icon, title, children }) {
  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </CardContent>
    </Card>
  );
}

function FieldText({ label, hint, value, onChange, type = "text", placeholder }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function FieldToggle({ label, hint, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
      <Switch checked={!!value} onCheckedChange={onChange} />
    </div>
  );
}

export default function CompanyPreferencesPanel() {
  const queryClient = useQueryClient();
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [form, setForm] = useState(emptyPrefs);

  const { data: companies = [] } = useQuery({
    queryKey: ["companies_prefs"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: assessmentModels = [] } = useQuery({
    queryKey: ["assessmentModels_prefs"],
    queryFn: () => base44.entities.AssessmentModel.list(),
  });

  const { data: existingPrefs = [] } = useQuery({
    queryKey: ["companyPreference", selectedCompanyId],
    queryFn: () => base44.entities.CompanyPreference.filter({ company_id: selectedCompanyId }),
    enabled: !!selectedCompanyId,
  });

  const currentPref = existingPrefs[0];

  useEffect(() => {
    if (currentPref) {
      setForm({ ...emptyPrefs, ...currentPref });
    } else if (selectedCompanyId) {
      setForm({ ...emptyPrefs });
    }
  }, [currentPref?.id, selectedCompanyId]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const selectedCompany = companies.find(c => c.id === selectedCompanyId);
      const payload = {
        ...data,
        company_id: selectedCompanyId,
        company_name: selectedCompany?.name || "",
      };
      if (currentPref?.id) {
        return base44.entities.CompanyPreference.update(currentPref.id, payload);
      } else {
        return base44.entities.CompanyPreference.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["companyPreference", selectedCompanyId]);
      toast.success("Company preferences saved.");
    },
  });

  const set = (key) => (val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-64">
          <Label className="text-xs mb-1 block">Select Company</Label>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a company…" />
            </SelectTrigger>
            <SelectContent>
              {companies.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedCompanyId && (
          <div className="text-xs text-slate-400 mt-4">
            {currentPref ? "Editing existing preferences" : "No preferences saved yet — fill in and save"}
          </div>
        )}
      </div>

      {!selectedCompanyId && (
        <div className="text-center py-12 text-slate-400">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
          Select a company to view and edit its preferences.
        </div>
      )}

      {selectedCompanyId && (
        <div className="space-y-4">

          <Section icon={BarChart2} title="Assessment & Risk Defaults">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Default Assessment Model</Label>
              <Select
                value={form.default_assessment_model_id || ""}
                onValueChange={val => {
                  const m = assessmentModels.find(m => m.id === val);
                  setForm(p => ({ ...p, default_assessment_model_id: val, default_assessment_model_name: m?.name || "" }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model…" />
                </SelectTrigger>
                <SelectContent>
                  {assessmentModels.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Default Risk Appetite</Label>
              <Select value={form.default_risk_appetite || "Medium"} onValueChange={set("default_risk_appetite")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RISK_APPETITE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <FieldText
              label="Risk Review Frequency (days)"
              hint="Default days between periodic risk reviews"
              type="number"
              value={form.risk_review_frequency_days}
              onChange={val => setForm(p => ({ ...p, risk_review_frequency_days: Number(val) }))}
              placeholder="90"
            />
            <FieldText
              label="Control Assessment Reminder (days before due)"
              hint="Days before cycle end-date to send assessor reminders"
              type="number"
              value={form.control_assessment_reminder_days}
              onChange={val => setForm(p => ({ ...p, control_assessment_reminder_days: Number(val) }))}
              placeholder="7"
            />
          </Section>

          <Section icon={Mail} title="Mailboxes & Notifications">
            <FieldText label="Risk Mailbox" hint="Receives risk-related notifications" value={form.risk_mailbox} onChange={set("risk_mailbox")} placeholder="risk@company.com" type="email" />
            <FieldText label="Compliance Mailbox" hint="Receives compliance notifications" value={form.compliance_mailbox} onChange={set("compliance_mailbox")} placeholder="compliance@company.com" type="email" />
            <FieldText label="Audit Mailbox" hint="Receives audit cycle notifications" value={form.audit_mailbox} onChange={set("audit_mailbox")} placeholder="audit@company.com" type="email" />
            <FieldText label="Governance Mailbox" hint="Receives governance notifications" value={form.governance_mailbox} onChange={set("governance_mailbox")} placeholder="governance@company.com" type="email" />
            <FieldText label="Notification From Name" hint="Display name for outgoing platform emails" value={form.notification_from_name} onChange={set("notification_from_name")} placeholder="CBD GRC Platform" />
          </Section>

          <Section icon={Shield} title="Workflow & Approval Defaults">
            <FieldText label="Default Workflow Approver / Router" hint="Fallback approver when none is configured on the step" value={form.default_workflow_approver_email} onChange={set("default_workflow_approver_email")} placeholder="approver@company.com" type="email" />
            <FieldText label="Default Issue Approver" hint="Default email to assign as issue approver" value={form.default_issue_approver_email} onChange={set("default_issue_approver_email")} placeholder="issueapprover@company.com" type="email" />
            <FieldText
              label="Issue Escalation (days)"
              hint="Days before an unresolved issue is escalated"
              type="number"
              value={form.issue_escalation_days}
              onChange={val => setForm(p => ({ ...p, issue_escalation_days: Number(val) }))}
              placeholder="14"
            />
            <FieldText
              label="Max Workflow Resubmissions"
              hint="Maximum times an item can be resubmitted"
              type="number"
              value={form.max_resubmissions}
              onChange={val => setForm(p => ({ ...p, max_resubmissions: Number(val) }))}
              placeholder="3"
            />
          </Section>

          <Section icon={Settings2} title="Organisation & Financial Settings">
            <FieldText label="Default Currency" hint="ISO code, e.g. USD, EUR, ZAR, GBP" value={form.default_currency} onChange={set("default_currency")} placeholder="USD" />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fiscal Year Start Month</Label>
              <Select
                value={String(form.fiscal_year_start_month || 1)}
                onValueChange={val => setForm(p => ({ ...p, fiscal_year_start_month: Number(val) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">Used for annual reporting and cycle defaults</p>
            </div>
          </Section>

          <Section icon={CheckSquare} title="Platform Behaviour">
            <div className="md:col-span-2 space-y-2">
              <FieldToggle
                label="Require evidence on control assessment submission"
                hint="Assessors must attach at least one evidence file before submitting"
                value={form.require_evidence_on_assessment}
                onChange={set("require_evidence_on_assessment")}
              />
              <FieldToggle
                label="Enable workflow email notifications"
                hint="Send approval request and completion emails to approvers and originators"
                value={form.enable_workflow_email_notifications}
                onChange={set("enable_workflow_email_notifications")}
              />
              <FieldToggle
                label="Enable automatic risk scoring"
                hint="Auto-calculate inherent risk scores based on likelihood × impact settings"
                value={form.enable_risk_auto_scoring}
                onChange={set("enable_risk_auto_scoring")}
              />
            </div>
          </Section>

          <NumberingConfigSection
            numbering={form.numbering_config || {}}
            onChange={(cfg) => setForm(p => ({ ...p, numbering_config: cfg }))}
          />

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? "Saving…" : "Save Preferences"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
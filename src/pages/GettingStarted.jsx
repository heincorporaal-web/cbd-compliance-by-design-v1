import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Building2, Shield, TriangleAlert, Users, ClipboardCheck, Network,
  Server, BookOpen, ChevronDown, ChevronRight, CheckCircle2, ArrowRight,
  HelpCircle, Layers, FileText, Settings, GitBranch, Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NavIcon from "@/hooks/useNavIcon.jsx";

const STEPS = [
  {
    step: 1,
    title: "Set Up Your Company",
    icon: Building2,
    color: "bg-blue-100 text-blue-700",
    border: "border-blue-200",
    description: "Start by creating your company profile. This is the foundation that all other data is linked to.",
    actions: [
      { label: "Go to Companies", url: createPageUrl("Companies") },
    ],
    tips: [
      "Add your company name, industry, and contact details.",
      "Upload your logo and set brand colours for reports.",
      "Define your strategic objectives and principle risks.",
      "Assign frameworks (e.g. ISO 27001, COSO, DORA) that apply to your company.",
    ],
  },
  {
    step: 2,
    title: "Add Business Units & Value Chains",
    icon: Network,
    color: "bg-purple-100 text-purple-700",
    border: "border-purple-200",
    description: "Structure your organisation by defining business units, value chains and workstreams.",
    actions: [
      { label: "Go to Business Units", url: createPageUrl("BusinessUnits") },
      { label: "Go to Value Chains", url: createPageUrl("ValueChains") },
    ],
    tips: [
      "Create a hierarchy of departments, divisions and teams.",
      "Define value chains (e.g. Order-to-Cash, Procure-to-Pay).",
      "Map workstreams to value chains to enable process linkage.",
    ],
  },
  {
    step: 3,
    title: "Manage Stakeholders",
    icon: Users,
    color: "bg-green-100 text-green-700",
    border: "border-green-200",
    description: "Register the people in your organisation who own risks, controls, and processes.",
    actions: [
      { label: "Go to Stakeholders", url: createPageUrl("Stakeholders") },
    ],
    tips: [
      "Add stakeholders with their job titles and departments.",
      "Assign stakeholders to groups (e.g. Risk Owners, Process Owners).",
      "Link stakeholders to their manager to build the hierarchy.",
      "Connect stakeholders to system users for workflow automation.",
    ],
  },
  {
    step: 4,
    title: "Build Your Control Library",
    icon: Shield,
    color: "bg-cyan-100 text-cyan-700",
    border: "border-cyan-200",
    description: "Import or create controls and link them to your frameworks and risks.",
    actions: [
      { label: "Go to Controls", url: createPageUrl("Controls") },
      { label: "Go to Frameworks", url: createPageUrl("Frameworks") },
    ],
    tips: [
      "Use the Master Library tab to import reference controls via CSV.",
      "In the Company tab, create company-specific controls linked to a framework.",
      "Set control attributes: type (Preventive/Detective/Corrective), frequency, execution type.",
      "Use the Library Fields tab on each control to link it to a reference risk.",
      "Create Test Plans for controls to define how they should be audited.",
    ],
  },
  {
    step: 5,
    title: "Register Risks",
    icon: TriangleAlert,
    color: "bg-orange-100 text-orange-700",
    border: "border-orange-200",
    description: "Populate your risk register with identified risks and link them to controls.",
    actions: [
      { label: "Go to Risk Register", url: createPageUrl("RiskRegister") },
    ],
    tips: [
      "Import library risks from CSV or create them manually.",
      "Set likelihood, impact, and risk type for each risk.",
      "Assign a risk owner from your stakeholders.",
      "Link risks to controls that mitigate them.",
      "Create Risk Assessment Cycles to schedule periodic reviews.",
    ],
  },
  {
    step: 6,
    title: "Map Processes",
    icon: Network,
    color: "bg-indigo-100 text-indigo-700",
    border: "border-indigo-200",
    description: "Document your business processes and map them to risks, controls and ICT systems.",
    actions: [
      { label: "Go to Process Management", url: createPageUrl("ProcessManagement") },
      { label: "Go to ICT Systems", url: createPageUrl("ICTSystems") },
    ],
    tips: [
      "Create process flows and link them to value chains / workstreams.",
      "Register ICT systems and their modules that support each process.",
      "Use the iHPOM view for an integrated process and risk map.",
    ],
  },
  {
    step: 7,
    title: "Run Assessments & Surveys",
    icon: ClipboardCheck,
    color: "bg-teal-100 text-teal-700",
    border: "border-teal-200",
    description: "Assess your controls and gather evidence through assessments and surveys.",
    actions: [
      { label: "Go to Assessments", url: createPageUrl("Assessments") },
      { label: "Go to Surveys", url: createPageUrl("Surveys") },
    ],
    tips: [
      "Create Control Assessment Cycles and attach controls to be tested.",
      "Build surveys with the Survey Builder and distribute them to stakeholders.",
      "Use AI analysis to summarise survey results.",
    ],
  },
  {
    step: 8,
    title: "Configure Workflows & Automation",
    icon: GitBranch,
    color: "bg-rose-100 text-rose-700",
    border: "border-rose-200",
    description: "Set up approval workflows so that changes to risks, controls and frameworks go through a formal review process.",
    actions: [
      { label: "Go to Workflows", url: createPageUrl("Workflows") },
    ],
    tips: [
      "Create workflows for Risks, Controls, Frameworks and more.",
      "Configure approvers by named email, stakeholder group, or dynamic role.",
      "Attach a workflow to a control or risk to trigger the review process.",
      "Monitor pending approvals from the Dashboard.",
    ],
  },
];

const QUICK_LINKS = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: TriangleAlert, desc: "Your GRC overview at a glance" },
  { title: "Risk Register", url: createPageUrl("RiskRegister"), icon: TriangleAlert, desc: "View and manage all risks" },
  { title: "Controls", url: createPageUrl("Controls"), icon: Shield, desc: "Control library and company register" },
  { title: "Reports", url: createPageUrl("Reports"), icon: FileText, desc: "Generate compliance reports" },
  { title: "Audit Logs", url: createPageUrl("AuditLogs"), icon: Settings, desc: "Track all system changes" },
  { title: "Knowledge", url: createPageUrl("KnowledgeManagement"), icon: BookOpen, desc: "GRC knowledge base" },
];

function StepCard({ step }) {
  const [open, setOpen] = useState(step.step === 1);
  const Icon = step.icon;

  return (
    <div className={`border rounded-xl overflow-hidden ${step.border} bg-white shadow-sm`}>
      <button
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${step.color}`}>
          <span className="font-bold text-sm">{step.step}</span>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${step.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900">{step.title}</h3>
          <p className="text-sm text-slate-500 truncate">{step.description}</p>
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-6 pb-5 border-t border-slate-100 bg-slate-50/50">
          <p className="text-sm text-slate-600 mt-4 mb-3">{step.description}</p>
          <ul className="space-y-2 mb-4">
            {step.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                {tip}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {step.actions.map((a, i) => (
              <Link
                key={i}
                to={a.url}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-primary hover:bg-primary hover:text-white transition-colors shadow-sm"
              >
                {a.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GettingStarted() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border border-primary/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <NavIcon itemId="getting_started" defaultIcon={HelpCircle} className="w-6 h-6 text-white" forceWhite />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Getting Started with CBD</h1>
            <p className="text-slate-500 text-sm">Compliance by Design — your integrated GRC platform</p>
          </div>
        </div>
        <p className="text-slate-700 leading-relaxed">
          Welcome to <strong>Compliance by Design (CBD)</strong>. This guide walks you through the recommended setup sequence so you get the most out of the platform. Follow the steps below in order — each one builds on the last.
        </p>
        <div className="flex items-center gap-2 mt-4">
          <Badge className="bg-primary/20 text-primary border-primary/30">8 Steps</Badge>
          <Badge className="bg-green-100 text-green-700 border-green-200">Click any step to expand</Badge>
        </div>
      </div>

      {/* Steps */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Setup Sequence
        </h2>
        <div className="space-y-3">
          {STEPS.map(step => <StepCard key={step.step} step={step} />)}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-primary" />
          Quick Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {QUICK_LINKS.map(link => {
            const Icon = link.icon;
            return (
              <Link key={link.title} to={link.url}>
                <Card className="border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{link.title}</p>
                      <p className="text-xs text-slate-500">{link.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800">
        <strong>Tip:</strong> Use the star (⭐) icon next to any menu item in the sidebar to pin your most-used pages to the Favorites section at the top of the navigation.
      </div>
    </div>
  );
}
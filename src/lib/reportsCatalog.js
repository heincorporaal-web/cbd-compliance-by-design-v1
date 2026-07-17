import {
  Building2, BarChart3, Network, Users, ShieldAlert, CheckSquare,
  AlertTriangle, MessageSquareWarning, Siren, ClipboardList, Building, Cpu
} from "lucide-react";
import { createPageUrl } from "@/utils";

export const PERFORMANCE_REPORTS = [
  {
    id: "company-overview",
    title: "Company Overview Report",
    description: "Comprehensive report showing all statistics for each company including frameworks, processes, maturity scores, goals, risks, and controls.",
    icon: Building2,
    color: "from-blue-500 to-indigo-600",
    url: createPageUrl("CompanyOverviewReport"),
    exports: ["Print / PDF", "Word", "PowerPoint"],
  },
  {
    id: "ihpom-tree",
    title: "iHPOM Tree View Report",
    description: "Hierarchical tree view of business processes from Level 0 (Value Chain) to Level 5 (Tasks) with drill-down capabilities.",
    icon: BarChart3,
    color: "from-purple-500 to-pink-600",
    url: createPageUrl("iHPOMTreeReport"),
    exports: ["Print / PDF", "Word", "PowerPoint"],
  },
  {
    id: "process-company",
    title: "Process Company Report",
    description: "List all processes assigned to a company with date range filtering, hierarchy level selection, ownership, key requirements and descriptions.",
    icon: Network,
    color: "from-teal-500 to-green-600",
    url: createPageUrl("ProcessCompanyReport"),
    exports: ["Print / PDF", "Word", "PowerPoint"],
  },
];

export const DATA_LIBRARY_REPORTS = [
  {
    id: "stakeholder-list",
    title: "Stakeholder List",
    description: "Export a configurable list of stakeholders. Filter by company, status, department, job title, or group.",
    icon: Users,
    color: "from-orange-500 to-amber-500",
    url: createPageUrl("StakeholderListReport"),
    exports: ["CSV", "PDF"],
  },
  {
    id: "risks",
    title: "Risks",
    description: "All risks with configurable fields. Filter by company, status, category, risk type, and owner.",
    icon: ShieldAlert,
    color: "from-red-500 to-rose-600",
    url: createPageUrl("RisksReport"),
    exports: ["CSV", "PDF"],
  },
  {
    id: "controls",
    title: "Controls",
    description: "All controls with configurable fields. Filter by status, category, type, owner, and framework.",
    icon: CheckSquare,
    color: "from-green-500 to-emerald-600",
    url: createPageUrl("ControlsReport"),
    exports: ["CSV", "PDF"],
  },
  {
    id: "principal-risks",
    title: "Principal Risks",
    description: "Principal risks with configurable fields. Filter by company, status, category, priority, and criticality.",
    icon: AlertTriangle,
    color: "from-orange-600 to-red-600",
    url: createPageUrl("PrincipalRisksReport"),
    exports: ["CSV", "PDF"],
  },
  {
    id: "assessments",
    title: "Assessments",
    description: "All assessments with configurable fields. Filter by company, status, model, framework, and assessor.",
    icon: ClipboardList,
    color: "from-cyan-500 to-blue-600",
    url: createPageUrl("AssessmentsReport"),
    exports: ["CSV", "PDF"],
  },
  {
    id: "third-parties",
    title: "Third Parties",
    description: "All third-party providers. Filter by company, status, service type, criticality, and risk rating.",
    icon: Building,
    color: "from-violet-500 to-purple-600",
    url: createPageUrl("ThirdPartiesReport"),
    exports: ["CSV", "PDF"],
  },
  {
    id: "it-capabilities",
    title: "IT Capabilities",
    description: "All IT capabilities with configurable fields. Filter by company, status, category, maturity level, and owner.",
    icon: Cpu,
    color: "from-slate-500 to-slate-700",
    url: createPageUrl("ITCapabilitiesReport"),
    exports: ["CSV", "PDF"],
  },
];

export const ISSUE_REPORTS = [
  {
    id: "issues",
    title: "Issues",
    description: "All issues and action items. Filter by company, status, type, priority, and assignee.",
    icon: MessageSquareWarning,
    color: "from-yellow-500 to-orange-500",
    url: createPageUrl("IssuesReport"),
    exports: ["CSV", "PDF"],
  },
  {
    id: "incidents",
    title: "Incidents",
    description: "All incidents with configurable fields. Filter by company, status, type, and severity.",
    icon: Siren,
    color: "from-rose-600 to-pink-600",
    url: createPageUrl("IncidentsReport"),
    exports: ["CSV", "PDF"],
  },
];

export const ALL_REPORTS = [...PERFORMANCE_REPORTS, ...DATA_LIBRARY_REPORTS, ...ISSUE_REPORTS];
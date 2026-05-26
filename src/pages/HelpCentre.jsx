import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Search, BookOpen, Shield, TriangleAlert, Users, ClipboardCheck,
  Network, Server, ChevronDown, ChevronRight, HelpCircle, MessageCircle,
  FileText, Settings, GitBranch, Building2, Layers, Star, X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  {
    id: "general",
    title: "General & Navigation",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-700",
    articles: [
      {
        q: "How do I navigate the platform?",
        a: "Use the sidebar on the left to navigate between modules. Sections are grouped by function (Overview, Governance, Risk Management, etc.). Click a group header to expand or collapse it. You can star any item to pin it to your Favorites at the top of the sidebar.",
      },
      {
        q: "What is the Company Filter?",
        a: "The Company Filter (top-right of the header) lets you scope all views to a specific company. When a company is selected, lists and dashboards will only show data for that company. Clear the filter to see data across all companies.",
      },
      {
        q: "How do I customise my navigation favourites?",
        a: "Hover over any item in the sidebar and click the star icon that appears on the right. Starred items appear in the Favorites section at the top of the nav for quick access. Click the star again to remove it.",
      },
      {
        q: "Where can I see audit logs?",
        a: "Go to Administration → Audit Logs. You can filter by entity type, event type, and company, and view field-level changes for every record update.",
      },
    ],
  },
  {
    id: "companies",
    title: "Companies & Structure",
    icon: Building2,
    color: "bg-violet-100 text-violet-700",
    articles: [
      {
        q: "How do I add a new company?",
        a: "Go to Overview → Companies and click 'New Company'. Fill in the name, industry and contact details. You can also upload a logo and set brand colours used in reports.",
      },
      {
        q: "How do I assign frameworks to a company?",
        a: "Open the company record and go to the 'Frameworks' tab. Click 'Assign Framework', select a framework from the list, and add a justification note. Only frameworks that are active in the Framework library are available.",
      },
      {
        q: "What are Business Units used for?",
        a: "Business Units represent the organisational structure (departments, divisions, regions, etc.). They link to value chains and workstreams, and can be assigned to risks, controls and processes to provide scoping context.",
      },
      {
        q: "What is a Value Chain?",
        a: "Value Chains represent end-to-end business processes (e.g. Order-to-Cash, Procure-to-Pay). Each Value Chain can have multiple Workstreams. These are used to map risks, controls and ICT systems to business activities.",
      },
    ],
  },
  {
    id: "controls",
    title: "Controls & Frameworks",
    icon: Shield,
    color: "bg-cyan-100 text-cyan-700",
    articles: [
      {
        q: "What is the difference between the Master Library and Company controls?",
        a: "The Master Library contains reference controls that are not company-specific — these are typically imported from a standard framework. Company controls are linked to a specific company and framework, and can be assigned owners, reviewers and test plans.",
      },
      {
        q: "How do I import controls from a CSV file?",
        a: "Go to Governance → Controls, select the Company tab, and click 'Import Controls'. Download the template, fill in your control data, and upload the file. Controls will be created in draft status and linked to the framework you specify.",
      },
      {
        q: "What is a Test Plan?",
        a: "A Test Plan defines the structured testing steps (workpapers) that auditors or assessors must follow to validate a control. Open a control and go to the 'Test Plan' tab to create steps. Each step has a type (e.g. IUC, Walkthrough, Data Extract), description, and expected evidence.",
      },
      {
        q: "How does the control lifecycle workflow work?",
        a: "Controls follow a lifecycle: Draft → Pending Review → Approved → Active. You can attach a Workflow (configured in Administration → Workflows) to route a control through approvers. Use the 'Submit for Review' button on the control detail page to start the process.",
      },
      {
        q: "How do I link a control to a risk?",
        a: "Open a library control and go to the 'Library Fields' tab. The system will auto-suggest a matching risk by swapping the prefix (C→D in the reference number). You can accept the suggestion or manually select any risk from the dropdown.",
      },
    ],
  },
  {
    id: "risks",
    title: "Risk Management",
    icon: TriangleAlert,
    color: "bg-orange-100 text-orange-700",
    articles: [
      {
        q: "How do I add a risk to the register?",
        a: "Go to Risk Management → Risk Register and click 'New Risk'. Complete the risk title, category, likelihood, impact and assign an owner. You can also link it to controls, frameworks and strategic objectives.",
      },
      {
        q: "What is a Risk Assessment Cycle?",
        a: "A Risk Assessment Cycle is a time-bounded period for reviewing and updating risk ratings. Create a cycle, attach the relevant risks, then progress it through Planning → In Review → Approved → Closed. Approved cycles are locked and any changes require a formal amendment.",
      },
      {
        q: "What is the Risk Control Engine?",
        a: "The Risk Control Engine provides a combined RACM (Risk & Control Matrix) view, showing how risks and controls are linked and the current control effectiveness. Use it to identify gaps and overlaps in your control coverage.",
      },
      {
        q: "How do I record root causes for a risk?",
        a: "Open a risk record and set the Root Cause Category and Root Cause Type fields. Root cause categories (e.g. Human-Related, Process-Related, Technology-Related) are managed in Governance → Root Cause Categories.",
      },
    ],
  },
  {
    id: "assessments",
    title: "Assessments & Surveys",
    icon: ClipboardCheck,
    color: "bg-teal-100 text-teal-700",
    articles: [
      {
        q: "What is the difference between an Assessment and a Survey?",
        a: "An Assessment is a structured evaluation of a control or process against defined criteria, typically performed by an auditor. A Survey is a questionnaire distributed to stakeholders to gather their input or self-assessment on specific topics.",
      },
      {
        q: "How do I create a Control Assessment Cycle?",
        a: "Go to Governance → Control Assessment Cycles and click 'New Cycle'. Set the name, year and date range. Then add controls to the cycle. Once in review, assessors can record results against each control.",
      },
      {
        q: "How do I distribute a survey?",
        a: "Open a survey and go to the Distribution tab. Add the email addresses of respondents, set an optional deadline, and click Send. Respondents receive an email with a link to complete the survey. Results are visible in the Responses tab.",
      },
      {
        q: "Can I use AI to analyse survey results?",
        a: "Yes. Once a survey has responses, open it and click the 'AI Analysis' tab. The system will summarise the key themes and sentiment from respondent answers using the built-in AI integration.",
      },
    ],
  },
  {
    id: "stakeholders",
    title: "Stakeholders & Sign-Offs",
    icon: Users,
    color: "bg-green-100 text-green-700",
    articles: [
      {
        q: "How do I link a stakeholder to a system user?",
        a: "Open a stakeholder record and set the 'Linked User' field to the system user's account. This enables workflow steps to be assigned to them automatically based on their role (e.g. as control owner or reviewer).",
      },
      {
        q: "What are Stakeholder Groups?",
        a: "Stakeholder Groups (e.g. Risk Owners, Process Owners, Audit Team) allow you to categorise stakeholders and use them as targets for workflow steps and notifications. Assign a stakeholder to one or more groups from their profile.",
      },
      {
        q: "What is a Sign-Off?",
        a: "Sign-Offs are formal acknowledgements that a stakeholder has reviewed and agreed to a document or policy. Go to Stakeholders → Sign-Offs to create a sign-off request, attach a document, and track responses.",
      },
      {
        q: "What is the Delegation of Authority (DOA)?",
        a: "The DOA module lets you record formal approval authorities — who can approve what, up to what value. Each DOA record contains activities with approver chains and value-range rules. Use it to document and enforce your corporate governance structure.",
      },
    ],
  },
  {
    id: "workflows",
    title: "Workflows & Approvals",
    icon: GitBranch,
    color: "bg-rose-100 text-rose-700",
    articles: [
      {
        q: "How do I set up an approval workflow?",
        a: "Go to Configuration → Workflows and click 'New Workflow'. Select the entity type (Risk, Control, Framework, etc.) and add steps. Each step can be an Approval, Notification, Return to Originator, or Conditional branch. Assign approvers by named email, stakeholder group, or dynamic role field.",
      },
      {
        q: "How do dynamic role approvers work?",
        a: "When you set a step's assignee type to 'Dynamic Role', you specify a field on the entity (e.g. 'owner_stakeholder_id'). At runtime, the workflow resolves the approver to whoever is currently set in that field on the specific record being reviewed.",
      },
      {
        q: "What happens when a workflow step is returned?",
        a: "If an approver clicks 'Return', the record goes back to 'Returned' status and the originator is notified. The originator can make changes and re-submit for review. The full history of approvals and returns is recorded on the record.",
      },
      {
        q: "Can I approve items directly from the platform?",
        a: "Yes. Go to the specific record (e.g. a Control) and scroll to the Workflow panel at the bottom. If you are the current approver, you will see Approve / Return buttons. You can also view all pending approvals from the Dashboard.",
      },
    ],
  },
  {
    id: "processes",
    title: "Processes & ICT Systems",
    icon: Network,
    color: "bg-indigo-100 text-indigo-700",
    articles: [
      {
        q: "How do I map a process to a risk or control?",
        a: "Open a process in Process Management → Process Management. Use the Risks and Controls tabs within the process detail to link them. You can also link from the risk or control side using the process reference field.",
      },
      {
        q: "What is the iHPOM view?",
        a: "iHPOM (Integrated Hierarchical Process Ownership Model) provides a visual, hierarchical tree view of all your processes, with associated risks and controls displayed inline. Access it via Process Management → iHPOM.",
      },
      {
        q: "How do I add modules to an ICT system?",
        a: "Open an ICT System record and go to the 'Modules' tab. Click 'Add Module' to define functional areas within the system (e.g. a specific SAP module). Modules can be assigned owners and linked to workstreams.",
      },
    ],
  },
];

function ArticleItem({ article }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        className="w-full flex items-start gap-3 py-3.5 text-left hover:text-primary transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="mt-0.5 shrink-0">
          {open
            ? <ChevronDown className="w-4 h-4 text-primary" />
            : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
        <span className="text-sm font-medium text-slate-800 group-hover:text-primary">{article.q}</span>
      </button>
      {open && (
        <p className="text-sm text-slate-600 leading-relaxed pb-4 pl-7 pr-2">{article.a}</p>
      )}
    </div>
  );
}

function CategoryCard({ cat, isActive, onClick }) {
  const Icon = cat.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
        isActive ? "bg-primary text-white shadow-sm" : "hover:bg-slate-100 text-slate-700"
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-white/20" : cat.color}`}>
        <Icon className={`w-4 h-4 ${isActive ? "text-white" : ""}`} />
      </div>
      <span className="text-sm font-medium truncate">{cat.title}</span>
      <Badge className={`ml-auto shrink-0 text-xs ${isActive ? "bg-white/20 text-white border-white/30" : "bg-slate-200 text-slate-600 border-transparent"}`}>
        {cat.articles.length}
      </Badge>
    </button>
  );
}

export default function HelpCentre() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");

  const allArticles = CATEGORIES.flatMap(c => c.articles.map(a => ({ ...a, category: c.title })));

  const searchResults = search.trim().length > 1
    ? allArticles.filter(a =>
        a.q.toLowerCase().includes(search.toLowerCase()) ||
        a.a.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  const activeCat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border border-primary/20 text-center">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Help Centre</h1>
        <p className="text-slate-600 mb-6">Find answers to common questions about the CBD platform.</p>

        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search help articles…"
            className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {searchResults && (
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{search}"
            </p>
            {searchResults.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No articles matched your search. Try different keywords.</p>
            ) : (
              <div className="space-y-0">
                {searchResults.map((a, i) => (
                  <div key={i}>
                    <p className="text-xs text-primary font-medium mb-1 pt-3">{a.category}</p>
                    <ArticleItem article={a} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category browse */}
      {!searchResults && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-none shadow-lg sticky top-6">
              <CardContent className="p-3 space-y-1">
                {CATEGORIES.map(cat => (
                  <CategoryCard
                    key={cat.id}
                    cat={cat}
                    isActive={activeCategory === cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Articles */}
          <div className="lg:col-span-3">
            {activeCat && (
              <Card className="border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeCat.color}`}>
                      <activeCat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900">{activeCat.title}</h2>
                      <p className="text-sm text-slate-500">{activeCat.articles.length} articles</p>
                    </div>
                  </div>
                  <div>
                    {activeCat.articles.map((article, i) => (
                      <ArticleItem key={i} article={article} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-slate-800">New to the platform?</p>
            <p className="text-xs text-slate-500">Follow the step-by-step setup guide to get started quickly.</p>
          </div>
        </div>
        <Link
          to={createPageUrl("GettingStarted")}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          View Getting Started Guide →
        </Link>
      </div>
    </div>
  );
}
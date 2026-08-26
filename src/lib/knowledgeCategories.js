import { BookOpen, Lightbulb, FileText, ListChecks, CheckSquare, Globe } from "lucide-react";

export const KNOWLEDGE_CATEGORY_LABELS = {
  implementation_guide: "Implementation Guide",
  best_practice: "Best Practice",
  policy_template: "Policy Template",
  procedure: "Procedure",
  checklist: "Checklist",
  wiki_article: "Wiki Article",
};

export const KNOWLEDGE_CATEGORY_TILE = {
  implementation_guide: "from-indigo-500 to-purple-600",
  best_practice: "from-emerald-500 to-green-600",
  policy_template: "from-violet-500 to-fuchsia-600",
  procedure: "from-amber-500 to-orange-600",
  checklist: "from-red-500 to-rose-600",
  wiki_article: "from-cyan-500 to-blue-600",
};

export const KNOWLEDGE_CATEGORY_BADGE = {
  implementation_guide: "bg-indigo-100 text-indigo-700",
  best_practice: "bg-emerald-100 text-emerald-700",
  policy_template: "bg-violet-100 text-violet-700",
  procedure: "bg-amber-100 text-amber-700",
  checklist: "bg-red-100 text-red-700",
  wiki_article: "bg-cyan-100 text-cyan-700",
};

export const KNOWLEDGE_CATEGORY_ICON_COLOR = {
  implementation_guide: "text-indigo-500",
  best_practice: "text-emerald-500",
  policy_template: "text-violet-500",
  procedure: "text-amber-500",
  checklist: "text-red-500",
  wiki_article: "text-cyan-500",
};

export const KNOWLEDGE_CATEGORY_ICONS = {
  implementation_guide: BookOpen,
  best_practice: Lightbulb,
  policy_template: FileText,
  procedure: ListChecks,
  checklist: CheckSquare,
  wiki_article: Globe,
};

export const KNOWLEDGE_CATEGORY_CODES = {
  implementation_guide: "IG",
  best_practice: "BP",
  policy_template: "POL",
  procedure: "PROC",
  checklist: "CHL",
  wiki_article: "WKI",
};

export const isWikiArticle = (article) => article?.category === "wiki_article";
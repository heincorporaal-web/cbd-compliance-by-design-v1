import React from "react";
import { BookOpen, GitBranch, ClipboardCheck, BarChart3 } from "lucide-react";
import ModuleLanding from "@/components/branding/ModuleLanding";
import { BRANDS } from "@/lib/moduleBrands";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Governance Library",
    desc: "Central searchable catalogue of policies, standards, procedures and guidelines with full metadata, versioning and lifecycle tracking.",
  },
  {
    icon: GitBranch,
    title: "Policy Lifecycle",
    desc: "Draft, review, approve, publish and retire governance artefacts with structured workflows, version history and approval records.",
  },
  {
    icon: ClipboardCheck,
    title: "Review Management",
    desc: "Structured periodic and event-driven reviews with questionnaires, outcomes and automated due-date tracking.",
  },
  {
    icon: BarChart3,
    title: "Governance Traceability",
    desc: "Link policies to existing CBD risks, controls, frameworks and processes — trace governance intent through to operational evidence.",
  },
];

export default function GovernanceByDesign() {
  return (
    <ModuleLanding
      brand={BRANDS.gbd}
      Icon={BookOpen}
      features={FEATURES}
      logoUrl={BRANDS.gbd.logoUrl}
    />
  );
}
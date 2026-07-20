import React from "react";
import { Workflow, FileText, GitBranch, ShieldCheck } from "lucide-react";
import ModuleLanding from "@/components/branding/ModuleLanding";
import { BRANDS } from "@/lib/moduleBrands";

const FEATURES = [
  { icon: Workflow, title: "BPMN 2.0 Designer", desc: "Model end-to-end processes with a full BPMN 2.0 canvas, element data pane and SVG snapshots." },
  { icon: FileText, title: "Document Templates", desc: "Compose SOPs and work instructions that merge data fields straight from your process flows." },
  { icon: GitBranch, title: "Process Hierarchy", desc: "Navigate the full process tree, link risks, controls and systems, and keep versions in check." },
  { icon: ShieldCheck, title: "Risk-based Assessment", desc: "Assess process maturity and risk posture, and turn gaps into tracked actions." },
];

export default function OperationsByDesign() {
  return <ModuleLanding brand={BRANDS.obd} Icon={Workflow} features={FEATURES} logoUrl={BRANDS.obd.logoUrl} />;
}
import React from "react";
import { Boxes, Radar, Link2, Activity } from "lucide-react";
import ModuleLanding from "@/components/branding/ModuleLanding";
import { BRANDS } from "@/lib/moduleBrands";

const FEATURES = [
  { icon: Boxes, title: "Configuration Items", desc: "Central CMDB of all infrastructure configuration items — servers, VMs, network devices, cloud resources — with unique CI IDs, classes and lifecycle tracking." },
  { icon: Radar, title: "Microsoft Discovery", desc: "Ingest from Defender for Endpoint, Intune, Entra ID and Azure Resource Graph through a staging and reconciliation pipeline — never write raw data straight to CIs." },
  { icon: Link2, title: "Relationship Mapping", desc: "Map CI-to-CI dependencies and link CBD applications to their supporting infrastructure — relationships live only in the CMDB, CBD stays read-only." },
  { icon: Activity, title: "Lifecycle & Audit", desc: "Track each CI from discovered through retired, with change detection, audit history and data quality scoring for full traceability." },
];

export default function AssetsByDesign() {
  return <ModuleLanding brand={BRANDS.abd} Icon={Boxes} features={FEATURES} logoUrl={BRANDS.abd.logoUrl} />;
}
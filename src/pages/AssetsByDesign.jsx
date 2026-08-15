import React from "react";
import { Boxes, Radar, Link2, Activity } from "lucide-react";
import ModuleLanding from "@/components/branding/ModuleLanding";
import { BRANDS } from "@/lib/moduleBrands";

const FEATURES = [
  { icon: Radar, title: "Microsoft Network Discovery", desc: "Scan the network with native Microsoft tools — Intune, Azure AD, SCCM and Azure Resource Graph — and import discovered items into the CMDB." },
  { icon: Boxes, title: "CMDB Inventory", desc: "Centralise discovered devices, software and cloud resources with hostname, IP, OS, manufacturer, model and serial data." },
  { icon: Link2, title: "Link to ICT Systems", desc: "Match discovered items to your existing ICT system register, or create a new ICT system straight from a discovered asset." },
  { icon: Activity, title: "Lifecycle & Status", desc: "Track each asset from discovered → linked → decommissioned, and keep discovery timestamps for audit traceability." },
];

export default function AssetsByDesign() {
  return <ModuleLanding brand={BRANDS.abd} Icon={Boxes} features={FEATURES} logoUrl={BRANDS.abd.logoUrl} />;
}
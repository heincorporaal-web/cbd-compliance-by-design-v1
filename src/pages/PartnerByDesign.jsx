import React from "react";
import { Handshake, ShieldAlert, Network, FileCheck, Globe } from "lucide-react";
import ModuleLanding from "@/components/branding/ModuleLanding";
import { BRANDS } from "@/lib/moduleBrands";

const FEATURES = [
  { icon: Globe, title: "Third-party Register", desc: "Centralise suppliers, service providers and sub-contractors with rich legal and relationship data." },
  { icon: ShieldAlert, title: "Inherent & Residual Risk", desc: "Rate inherent and residual risk, and link controls, frameworks and risks from the library." },
  { icon: Network, title: "Linked Operations", desc: "Connect third parties to value chains, workstreams, processes and ICT assets they support." },
  { icon: FileCheck, title: "BCP & Assurance", desc: "Flag business-continuity-critical partners, and track issues, incidents and assurance activity." },
];

export default function PartnerByDesign() {
  return <ModuleLanding brand={BRANDS.pbd} Icon={Handshake} features={FEATURES} />;
}
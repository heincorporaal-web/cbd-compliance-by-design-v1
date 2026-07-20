// Shared "distinct but similar" brand system for the CBD suite product modules.
// Each brand keeps the CBD design language (light surfaces, slate text, same components)
// but carries its own accent colour, monogram and identity.

export const BRANDS = {
  obd: {
    key: "obd",
    name: "Operations by Design",
    short: "OBD",
    suite: "CBD — Compliance by Design",
    tagline:
      "Model, document and assess your end-to-end operations with BPMN 2.0 — diagrams, templates and risk-based assessment in one focused workspace.",
    enterLabel: "Enter Operations by Design",
    enterPath: "/AdvancedProcessModelling",
    landingPath: "/OperationsByDesign",
    // Teal — operations / precision
    gradient: "from-teal-600 to-cyan-700",
    solid: "bg-teal-700",
    softBg: "bg-teal-50",
    softText: "text-teal-700",
    border: "border-teal-200",
    badgeBg: "bg-teal-100 text-teal-700",
    text: "text-teal-700",
  },
  pbd: {
    key: "pbd",
    name: "Partner by Design",
    short: "PBD",
    suite: "CBD — Compliance by Design",
    tagline:
      "Manage third-party and supplier risk end-to-end — inherent & residual ratings, controls, frameworks, processes, assets and business continuity.",
    enterLabel: "Enter Partner by Design",
    enterPath: "/AdvancedThirdPartyRiskManagement",
    landingPath: "/PartnerByDesign",
    // Plum — partnership / relationship
    gradient: "from-fuchsia-700 to-purple-800",
    solid: "bg-purple-700",
    softBg: "bg-purple-50",
    softText: "text-purple-700",
    border: "border-purple-200",
    badgeBg: "bg-purple-100 text-purple-700",
    text: "text-purple-700",
  },
};
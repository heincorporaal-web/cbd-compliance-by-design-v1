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
    logoUrl:
      "https://media.base44.com/images/public/6975dcbcbc9efd8b47128ae3/38769a811_file_00000000ff9081f4808ba318cfe7664a.png",
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
    logoUrl:
      "https://media.base44.com/images/public/6975dcbcbc9efd8b47128ae3/b2addef7f_file_00000000292481f4bc020f2871b3703d.png",
    // Plum — partnership / relationship
    gradient: "from-fuchsia-700 to-purple-800",
    solid: "bg-purple-700",
    softBg: "bg-purple-50",
    softText: "text-purple-700",
    border: "border-purple-200",
    badgeBg: "bg-purple-100 text-purple-700",
    text: "text-purple-700",
  },
  abd: {
    key: "abd",
    name: "Assets by Design",
    short: "ABD",
    suite: "CBD — Compliance by Design",
    tagline:
      "Run a CMDB with native Microsoft discovery — scan the network with Intune, Azure AD and SCCM, import discovered items, and match them to your ICT system register.",
    enterLabel: "Enter CMDB",
    enterPath: "/CMDBInventory",
    landingPath: "/AssetsByDesign",
    logoUrl:
      "https://media.base44.com/images/public/6975dcbcbc9efd8b47128ae3/fc8c4210c_file_000000002b88822fbcaf3d586c6138ee.png",
    // Blue — assets / infrastructure
    gradient: "from-blue-600 to-indigo-700",
    solid: "bg-blue-700",
    softBg: "bg-blue-50",
    softText: "text-blue-700",
    border: "border-blue-200",
    badgeBg: "bg-blue-100 text-blue-700",
    text: "text-blue-700",
  },
};

// Maps add-on module routes to their brand. When the app is on one of these
// routes, the top app bar shows the module identity instead of the CBD logo.
export const ROUTE_BRANDS = {
  "/AdvancedProcessModelling": BRANDS.obd,
  "/AdvancedThirdPartyRiskManagement": BRANDS.pbd,
  "/AdvancedAssetManagement": BRANDS.abd,
};

export function brandForRoute(pathname) {
  return ROUTE_BRANDS[pathname] || null;
}
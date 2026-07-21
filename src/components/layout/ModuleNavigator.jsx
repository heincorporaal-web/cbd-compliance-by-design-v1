import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { BRANDS } from "@/lib/moduleBrands";

// Routes that belong to each add-on module (for active highlighting)
const MODULE_ROUTES = {
  obd: ["/OperationsByDesign", "/AdvancedProcessModelling"],
  pbd: ["/PartnerByDesign", "/AdvancedThirdPartyRiskManagement"],
};

export default function ModuleNavigator() {
  const location = useLocation();
  const modules = [BRANDS.obd, BRANDS.pbd];

  return (
    <div className="px-2 pb-2">
      <p className="px-1 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <LayoutGrid className="w-3 h-3" /> Add-on modules
      </p>
      <div className="space-y-1.5">
        {modules.map((brand) => {
          const active = MODULE_ROUTES[brand.key].some((p) => location.pathname.startsWith(p));
          return (
            <Link
              key={brand.key}
              to={brand.landingPath}
              className={`flex items-center gap-2.5 px-2 py-2 rounded-lg border transition-colors ${
                active
                  ? `${brand.softBg} ${brand.border}`
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="w-8 h-8 rounded-md overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <img src={brand.logoUrl} alt={brand.short} className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{brand.name}</p>
                <p className={`text-[11px] font-medium ${brand.text} leading-tight`}>{brand.short}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
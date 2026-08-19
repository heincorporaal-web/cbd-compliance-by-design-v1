import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Branded page header shared by the OBD and PBD module pages.
// Keeps the CBD layout language but carries the module's accent + monogram
// and a link back to the module landing page.
export default function ModulePageHeader({ brand, Icon, title, subtitle, landingPath, logoUrl }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {logoUrl ? (
        <div className="w-12 h-12 rounded-xl bg-white shadow-lg flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-slate-200">
          <img src={logoUrl} alt={title} className="w-9 h-9 object-contain" />
        </div>
      ) : (
        <div className={`w-12 h-12 p-[2px] bg-gradient-to-br ${brand.gradient} rounded-xl shrink-0`}>
          <div className="w-full h-full bg-slate-100 rounded-[10px] flex items-center justify-center">
            <Icon className={`w-7 h-7 ${brand.softText}`} />
          </div>
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${brand.badgeBg}`}>
            {brand.short}
          </span>
        </div>
        <p className="text-slate-500 text-sm">{subtitle}</p>
      </div>
      <Link
        to={landingPath}
        className={`ml-auto inline-flex items-center gap-1.5 text-sm ${brand.text} font-medium hover:underline`}
      >
        <ArrowLeft className="w-4 h-4" /> {brand.name} overview
      </Link>
    </div>
  );
}
import React from "react";
import NavIcon from "@/hooks/useNavIcon.jsx";

/**
 * Shared page header block — the "My Actions" style:
 * a gradient tile icon next to a bold title and tagline.
 *
 * Drop this into a page's existing header wrapper (the right-side
 * actions stay untouched). Keeps heading size, tagline and tile
 * consistent across all pages.
 *
 * Props:
 *  - icon: lucide icon component (required if no navItemId)
 *  - navItemId: id from NAV_GROUPS for icon-override resolution
 *  - title: string (required)
 *  - tagline: string
 *  - gradient: tailwind gradient classes for the tile (e.g. "from-amber-500 to-orange-600")
 */
export default function PageHeader({ icon: Icon, navItemId, title, tagline, gradient = "from-primary to-secondary" }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg shrink-0`}>
        {navItemId ? (
          <NavIcon itemId={navItemId} defaultIcon={Icon} className="w-7 h-7 text-white" forceWhite />
        ) : (
          Icon ? <Icon className="w-7 h-7 text-white" /> : null
        )}
      </div>
      <div>
        <h1 className="text-3xl font-bold text-slate-900 leading-tight">{title}</h1>
        {tagline && <p className="text-slate-600">{tagline}</p>}
      </div>
    </div>
  );
}
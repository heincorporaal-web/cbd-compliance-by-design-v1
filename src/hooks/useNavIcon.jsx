import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { resolveIcon, buildCustomIconMap } from "@/lib/navIconStore";

// Shared resolver so page headers (and any other surface) render the same
// icon the sidebar shows — honouring admin nav_icon_overrides and uploaded
// custom icons. Reuses the ["appMeta"] / ["customIcons"] query cache used by
// NavTree, so changes in the customiser propagate here automatically.

export function useNavIconMap() {
  const { data: metas = [] } = useQuery({
    queryKey: ["appMeta"],
    queryFn: () => base44.entities.AppMeta.list("-updated_date", 1),
  });
  const meta = Array.isArray(metas) ? metas[0] : metas;
  const overrides = meta?.nav_icon_overrides || {};

  const { data: customIconRecords = [] } = useQuery({
    queryKey: ["customIcons"],
    queryFn: () => base44.entities.CustomIcon.list("-updated_date", 200),
  });
  const customIconMap = buildCustomIconMap(customIconRecords);
  return { overrides, customIconMap };
}

export function useNavIcon(itemId, defaultIcon) {
  const { overrides, customIconMap } = useNavIconMap();
  return resolveIcon(overrides, itemId, defaultIcon, customIconMap);
}

// Drop-in replacement for a hardcoded header icon: renders the resolved icon
// (lucide component or custom SVG) with the supplied className.
export default function NavIcon({ itemId, defaultIcon, className }) {
  const Icon = useNavIcon(itemId, defaultIcon);
  return <Icon className={className} />;
}
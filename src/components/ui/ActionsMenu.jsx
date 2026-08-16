import React from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

/**
 * Reusable "..." actions menu.
 * actions: array of
 *   { label, icon?: LucideComponent, onClick, disabled?, separatorBefore?, danger? }
 * header: optional title shown at the top of the menu
 */
export default function ActionsMenu({ actions = [], header, align = "end", size = "icon", variant = "outline" }) {
  const trigger =
    size === "icon" ? (
      <Button variant={variant} size="icon" title="Actions" aria-label="Actions">
        <MoreVertical className="w-4 h-4" />
      </Button>
    ) : (
      <Button variant={variant} size="sm" className="gap-1.5">
        <MoreVertical className="w-4 h-4" /> Actions
      </Button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        {header && <DropdownMenuLabel>{header}</DropdownMenuLabel>}
        {actions.map((a, i) => (
          <React.Fragment key={i}>
            {a.separatorBefore && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={a.onClick}
              disabled={a.disabled}
              className={`gap-2 ${a.danger ? "text-red-600 focus:text-red-600" : ""}`}
            >
              {a.icon && <a.icon className="w-4 h-4" />}
              <span>{a.label}</span>
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
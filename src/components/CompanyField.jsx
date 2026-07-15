import React from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Lock } from "lucide-react";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";

/**
 * Company selector that respects the logged-in user's company scope.
 * - Admins (multi-company): render a normal Select dropdown.
 * - Standard users (locked to assigned_company_id at login): render a read-only
 *   "Inherited" badge showing their company — no dropdown, no way to change it.
 *
 * Drop-in replacement for a `<div><Label>Company</Label><Select .../></div>` block.
 * `onChange` receives the selected company id (same as a normal Select onValueChange).
 */
export default function CompanyField({ value, onChange, companies = [], required = true, label = "Company" }) {
  const [, , { locked, assignedCompanyName }] = useCompanyFilter();

  if (locked) {
    const company = companies.find((c) => c.id === value);
    const name = company?.name || assignedCompanyName || "—";
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-slate-200 bg-slate-50">
          <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-sm font-medium text-slate-700 truncate">{name}</span>
          <Badge variant="outline" className="ml-auto bg-blue-50 text-blue-700 border-blue-200 shrink-0">
            <Lock className="w-3 h-3 mr-1" />Inherited
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}{required && " *"}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select company" />
        </SelectTrigger>
        <SelectContent>
          {companies.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
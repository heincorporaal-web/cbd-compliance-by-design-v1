import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";

export default function CompanyFilterBar() {
  const [selectedCompany, setSelectedCompany] = useCompanyFilter();

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
      <Select value={selectedCompany} onValueChange={setSelectedCompany}>
        <SelectTrigger className="w-52">
          <SelectValue placeholder="All Companies" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Companies</SelectItem>
          {companies.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
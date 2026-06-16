import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ToxicCombinationsDOAPanel from "./ToxicCombinationsDOAPanel";

export default function ToxicCombinationsDOASelector() {
  const [selectedDoaId, setSelectedDoaId] = useState("");

  const { data: doas = [] } = useQuery({
    queryKey: ["doa"],
    queryFn: () => base44.entities.DelegationOfAuthority.list(),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["doa-activities", selectedDoaId],
    queryFn: () => base44.entities.DOAActivity.filter({ doa_id: selectedDoaId }),
    enabled: !!selectedDoaId,
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholders"],
    queryFn: () => base44.entities.Stakeholder.list(),
  });

  const selectedDoa = doas.find(d => d.id === selectedDoaId);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="max-w-md space-y-1">
          <Label>Select Delegation of Authority</Label>
          <Select value={selectedDoaId || "none"} onValueChange={v => setSelectedDoaId(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Choose a DOA to configure rules…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Select a DOA —</SelectItem>
              {doas.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedDoa && (
        <ToxicCombinationsDOAPanel
          doaId={selectedDoa.id}
          doaName={selectedDoa.title}
          companyId={selectedDoa.company_id}
          activities={activities}
          stakeholders={stakeholders}
        />
      )}

      {!selectedDoa && (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-xl text-slate-400 text-sm">
          Select a DOA above to view or configure its toxic combination rules.
        </div>
      )}
    </div>
  );
}
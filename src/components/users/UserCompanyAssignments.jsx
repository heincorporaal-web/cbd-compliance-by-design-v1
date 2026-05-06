import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

const ROLE_COLORS = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  analyst: "bg-cyan-100 text-cyan-700",
  auditor: "bg-orange-100 text-orange-700",
  viewer: "bg-slate-100 text-slate-700",
};

const ROLES = ["admin", "manager", "analyst", "auditor", "viewer"];

export default function UserCompanyAssignments({ user }) {
  const queryClient = useQueryClient();
  const [newCompanyId, setNewCompanyId] = useState("");
  const [newRole, setNewRole] = useState("viewer");

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["userCompanyRoles", user.id],
    queryFn: () => base44.entities.UserCompanyRole.filter({ user_id: user.id }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UserCompanyRole.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["userCompanyRoles", user.id]);
      setNewCompanyId("");
      setNewRole("viewer");
      toast.success("Company assignment added");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserCompanyRole.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["userCompanyRoles", user.id]);
      toast.success("Assignment removed");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.UserCompanyRole.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries(["userCompanyRoles", user.id]);
    },
  });

  const assignedCompanyIds = assignments.map((a) => a.company_id);
  const availableCompanies = companies.filter((c) => !assignedCompanyIds.includes(c.id));

  const handleAdd = () => {
    if (!newCompanyId) return;
    const company = companies.find((c) => c.id === newCompanyId);
    createMutation.mutate({
      user_id: user.id,
      user_email: user.email,
      company_id: newCompanyId,
      company_name: company?.name || "",
      role: newRole,
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">Company Access & Roles</p>

      {assignments.length === 0 && (
        <p className="text-sm text-slate-400 italic">No company assignments yet.</p>
      )}

      <div className="space-y-2">
        {assignments.map((a) => {
          const company = companies.find((c) => c.id === a.company_id);
          return (
            <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="flex-1 text-sm font-medium text-slate-700 truncate">
                {company?.name || a.company_name || a.company_id}
              </span>
              <Select
                value={a.role}
                onValueChange={(role) => updateMutation.mutate({ id: a.id, role })}
              >
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-red-500"
                onClick={() => deleteMutation.mutate(a.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        })}
      </div>

      {availableCompanies.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <Select value={newCompanyId} onValueChange={setNewCompanyId}>
            <SelectTrigger className="flex-1 h-8 text-sm">
              <SelectValue placeholder="Add company…" />
            </SelectTrigger>
            <SelectContent>
              {availableCompanies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger className="w-28 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8 px-3"
            onClick={handleAdd}
            disabled={!newCompanyId || createMutation.isPending}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

// Module-level store so the selected company persists across page navigations.
// Only used by admin / product-owner users who can access multiple companies.
let globalCompanyId = "all";
const listeners = new Set();

function setGlobalCompanyId(id) {
  globalCompanyId = id;
  listeners.forEach(fn => fn(id));
}

// Returns [companyId, setCompanyId, { locked, assignedCompanyId, assignedCompanyName, isAdmin }]
//
// - Admins (role === "admin"): free selection across all companies; companyId may be "all".
//   This preserves the product owner's access to every company.
// - Standard users with an assigned_company_id: locked to that company. setCompanyId is a
//   no-op and companyId is always the assigned company id (never "all"), so every list
//   filter and form that consumes this hook is automatically scoped to their login company.
// - Master / seeded library data (frameworks, library controls, IHPOM nodes, knowledge
//   articles, global assessment models) has no company_id and remains accessible to all users.
export function useCompanyFilter() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const assignedCompanyId = !isAdmin ? (user?.assigned_company_id || null) : null;
  const assignedCompanyName = !isAdmin ? (user?.assigned_company_name || null) : null;
  const locked = !!assignedCompanyId;

  const [companyId, setCompanyId] = useState(locked ? assignedCompanyId : globalCompanyId);

  useEffect(() => {
    if (locked) {
      setCompanyId(assignedCompanyId);
      return;
    }
    setCompanyId(globalCompanyId);
    const handler = (id) => setCompanyId(id);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, [locked, assignedCompanyId]);

  const safeSet = (id) => { if (!locked) setGlobalCompanyId(id); };

  return [companyId, safeSet, { locked, assignedCompanyId, assignedCompanyName, isAdmin }];
}
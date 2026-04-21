import { useState, useEffect } from "react";

// Module-level store so the selected company persists across page navigations
let globalCompanyId = "all";
const listeners = new Set();

function setGlobalCompanyId(id) {
  globalCompanyId = id;
  listeners.forEach(fn => fn(id));
}

export function useCompanyFilter() {
  const [companyId, setCompanyId] = useState(globalCompanyId);

  useEffect(() => {
    const handler = (id) => setCompanyId(id);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return [companyId, setGlobalCompanyId];
}
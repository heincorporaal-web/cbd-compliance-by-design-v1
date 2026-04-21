import { useState, useEffect, useCallback } from "react";

// Module-level store - persists across renders and page navigations
let globalCompanyId = "all";
const listeners = new Set();

function setGlobalCompanyId(id) {
  globalCompanyId = id;
  listeners.forEach(fn => fn(id));
}

export function useCompanyFilter() {
  const [companyId, setLocalCompanyId] = useState(globalCompanyId);

  useEffect(() => {
    const handler = (id) => setLocalCompanyId(id);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const setCompany = useCallback((id) => {
    setGlobalCompanyId(id);
  }, []);

  return [companyId, setCompany];
}
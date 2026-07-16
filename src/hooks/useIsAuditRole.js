import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Matches custom role names that represent an audit function.
const AUDIT_NAME_RE = /\b(audit|auditor|assess)/i;

/**
 * Determines whether the current user holds an audit role.
 * A user is considered "audit" when:
 *   - any UserCompanyRole for them uses the built-in "auditor" role, OR
 *   - any custom UserRole linked to them has an audit-like name (audit / auditor / assess).
 * Platform admins (user.role === "admin") are always treated as non-audit.
 */
export function useIsAuditRole() {
  const { user } = useAuth();
  const enabled = !!user;

  const { data: ucr = [] } = useQuery({
    queryKey: ["userCompanyRoles", user?.id],
    queryFn: () => base44.entities.UserCompanyRole.filter({ user_id: user.id }),
    enabled,
  });

  const customRoleIds = Array.from(
    new Set((ucr || []).map((r) => r.custom_role_id).filter(Boolean))
  );

  const { data: roles = [] } = useQuery({
    queryKey: ["userRoles"],
    queryFn: () => base44.entities.UserRole.list("-created_date", 500),
    enabled,
  });

  if (!user) return { isAudit: false, isLoading: true };
  if (user.role === "admin") return { isAudit: false, isLoading: false };

  const isAuditorRole = (ucr || []).some((r) => r.role === "auditor");
  const customAudit = (roles || []).some(
    (r) => customRoleIds.includes(r.id) && AUDIT_NAME_RE.test(r.name || "")
  );

  return { isAudit: isAuditorRole || customAudit, isLoading: false };
}
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const KNOWLEDGE_MANAGER_RE = /\bknowledge\s*manager\b/i;

/**
 * Determines whether the current user can edit knowledge articles.
 * A user can edit when:
 *   - they are a platform admin (user.role === "admin"), OR
 *   - any custom UserRole linked to them has a name matching "Knowledge Manager".
 * All other roles are read-only for knowledge articles.
 */
export function useIsKnowledgeManager() {
  const { user } = useAuth();
  const enabled = !!user;

  const { data: ucr = [] } = useQuery({
    queryKey: ["userCompanyRoles", user?.id],
    queryFn: () => base44.entities.UserCompanyRole.filter({ user_id: user.id }),
    enabled,
  });

  const customRoleIds = Array.from(
    new Set(
      []
        .concat((ucr || []).map((r) => r.custom_role_id).filter(Boolean))
        .concat(user?.custom_role_id ? [user.custom_role_id] : [])
    )
  );

  const { data: roles = [] } = useQuery({
    queryKey: ["userRoles"],
    queryFn: () => base44.entities.UserRole.list("-created_date", 500),
    enabled,
  });

  if (!user) return { canEdit: false, isLoading: true };
  if (user.role === "admin") return { canEdit: true, isLoading: false };

  const myRoles = (roles || []).filter((r) => customRoleIds.includes(r.id));
  const isKnowledgeManager = myRoles.some((r) => KNOWLEDGE_MANAGER_RE.test(r.name || ""));

  return { canEdit: isKnowledgeManager, isLoading: false };
}
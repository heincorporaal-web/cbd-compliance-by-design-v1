import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Matches custom role names that represent the Implementer function.
const IMPLEMENTER_RE = /\bimplementer\b/i;

/**
 * Determines whether the current user is allowed to use Import functionalities.
 * A user can import when:
 *   - they are a platform admin (user.role === "admin"), OR
 *   - any custom UserRole linked to them has a name containing "Implementer", OR
 *   - any custom UserRole linked to them is flagged as Product Owner (is_product_owner).
 * Import access is restricted to the Implementer and Product Owner roles only.
 */
export function useIsImplementerRole() {
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

  if (!user) return { canImport: false, isLoading: true };
  if (user.role === "admin") return { canImport: true, isLoading: false };

  const myRoles = (roles || []).filter((r) => customRoleIds.includes(r.id));
  const isImplementer = myRoles.some((r) => IMPLEMENTER_RE.test(r.name || ""));
  const isProductOwner = myRoles.some((r) => r.is_product_owner);

  return { canImport: isImplementer || isProductOwner, isLoading: false };
}
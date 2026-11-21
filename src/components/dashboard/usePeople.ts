import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/access";

export type Person = {
  id: string;
  username: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  role: AppRole;
  customRoleIds: string[];
};

/** All profiles visible to staff, joined with their base role and custom role ids. */
export function usePeople(enabled = true) {
  return useQuery({
    queryKey: ["people"],
    enabled,
    queryFn: async (): Promise<Person[]> => {
      const [profiles, roles, assignments] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, email, is_active, created_at")
          .order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("user_role_assignments").select("user_id, role_id"),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      if (assignments.error) throw assignments.error;
      const roleBy = new Map(roles.data.map((r) => [r.user_id, r.role as AppRole]));
      return profiles.data.map((p) => ({
        ...p,
        role: roleBy.get(p.id) ?? "public",
        customRoleIds: assignments.data.filter((a) => a.user_id === p.id).map((a) => a.role_id),
      }));
    },
  });
}

export function displayName(p: { username: string | null; email: string | null } | undefined) {
  return p?.username ?? p?.email ?? "Unknown";
}

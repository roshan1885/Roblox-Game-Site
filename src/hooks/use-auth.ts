import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { hasPermission, type MyAccess, type Permission } from "@/lib/access";

/** Session from the browser auth client. `undefined` while loading (and during SSR). */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return session;
}

export function useAccess() {
  const session = useSession();
  const userId = session?.user.id;
  const query = useQuery({
    queryKey: ["my-access", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_access");
      if (error) throw error;
      return data as unknown as MyAccess;
    },
  });
  const access = query.data;
  return {
    session,
    loading: session === undefined || (!!userId && query.isLoading),
    access,
    can: (p: Permission) => !!access && hasPermission(access.permissions, p),
    refetch: query.refetch,
  };
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth/login", replace: true });
  };
}

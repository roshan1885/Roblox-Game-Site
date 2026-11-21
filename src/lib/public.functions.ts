import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// Public, read-only data for SSR pages. Uses the publishable key + anon RLS policies.
function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getSiteMeta = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [game, settings, socials, notices] = await Promise.all([
    sb.from("game_info").select("title, description, game_url, genre, thumbnail").limit(1).maybeSingle(),
    sb.from("site_settings").select("site_name, site_description, maintenance_mode, registration_open").limit(1).maybeSingle(),
    sb.from("social_links").select("id, platform, url, label, icon").eq("is_active", true).order("sort_order"),
    sb.from("notices").select("id, title, content, created_at").eq("is_published", true).order("created_at", { ascending: false }).limit(3),
  ]);
  if (game.error || settings.error || socials.error || notices.error) {
    console.error("getSiteMeta failed", game.error ?? settings.error ?? socials.error ?? notices.error);
  }
  return {
    game: game.data ?? {
      title: "Example Roblox Game",
      description: "Explore a new world, play with friends, and join the community.",
      game_url: "https://www.roblox.com",
      genre: "Adventure",
      thumbnail: null,
    },
    settings: settings.data ?? {
      site_name: "Example Roblox Game",
      site_description: null,
      maintenance_mode: false,
      registration_open: true,
    },
    socials: socials.data ?? [],
    notices: notices.data ?? [],
  };
});

// Publish only active team usernames and their assigned role labels.
export const listTeamMembers = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, username")
    .eq("is_active", true)
    .not("username", "is", null);

  if (profilesError) {
    console.error("listTeamMembers profiles failed", profilesError);
    throw new Error("Could not load team members");
  }

  const visibleProfiles = (profiles ?? []).flatMap((profile) => {
    const name = profile.username?.trim();
    return name ? [{ id: profile.id, name }] : [];
  });
  if (visibleProfiles.length === 0) return [];

  const userIds = visibleProfiles.map((profile) => profile.id);
  const [baseRoles, assignments] = await Promise.all([
    supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", userIds),
    supabaseAdmin.from("user_role_assignments").select("user_id, role_id").in("user_id", userIds),
  ]);
  if (baseRoles.error || assignments.error) {
    console.error("listTeamMembers roles failed", baseRoles.error ?? assignments.error);
    throw new Error("Could not load team members");
  }

  const roleIds = [...new Set((assignments.data ?? []).map((assignment) => assignment.role_id))];
  const customRoles = roleIds.length
    ? await supabaseAdmin.from("custom_roles").select("id, name").in("id", roleIds)
    : { data: [], error: null };
  if (customRoles.error) {
    console.error("listTeamMembers custom roles failed", customRoles.error);
    throw new Error("Could not load team members");
  }

  const baseRoleLabels = {
    owner: "Owner",
    co_owner: "Co-Owner",
    system: "Administrator",
    application_reader: "Application Reader",
  } as const;
  const customRoleNames = new Map((customRoles.data ?? []).map((role) => [role.id, role.name]));
  const members: { name: string; role: string }[] = [];

  for (const profile of visibleProfiles) {
    const roles = new Set<string>();
    const baseRole = baseRoles.data?.find((role) => role.user_id === profile.id)?.role;
    if (baseRole && baseRole !== "public" && baseRole !== "custom_role") {
      roles.add(baseRoleLabels[baseRole]);
    }

    for (const assignment of assignments.data ?? []) {
      if (assignment.user_id !== profile.id) continue;
      const roleName = customRoleNames.get(assignment.role_id);
      if (roleName) roles.add(roleName);
    }

    for (const role of roles) {
      members.push({ name: profile.name, role });
    }
  }

  const roleOrder = (role: string) => {
    if (role === "Owner") return 0;
    if (role === "Co-Owner") return 1;
    if (role === "Administrator") return 2;
    if (role === "Application Reader") return 3;
    return 4;
  };
  return members.sort(
    (a, b) =>
      roleOrder(a.role) - roleOrder(b.role) ||
      a.role.localeCompare(b.role) ||
      a.name.localeCompare(b.name),
  );
});

export const listAnnouncements = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(100).default(50) }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const { data: rows, error } = await publicClient()
      .from("announcements")
      .select("id, title, content, author_name, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) {
      console.error("listAnnouncements failed", error);
      return [];
    }
    return rows;
  });

export const listOpenPositions = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("application_forms")
    .select("id, title, description, role:custom_roles(id, name, description), fields:form_fields(id, label, type, required, options, placeholder, sort_order)")
    .eq("is_active", true)
    .order("created_at");
  if (error) {
    console.error("listOpenPositions failed", error);
    return [];
  }
  return data.map((f) => ({ ...f, fields: [...(f.fields ?? [])].sort((a, b) => a.sort_order - b.sort_order) }));
});

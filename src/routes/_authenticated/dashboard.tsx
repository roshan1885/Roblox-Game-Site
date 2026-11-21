import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Megaphone,
  BellRing,
  UserCheck,
  ListChecks,
  Users,
  ShieldPlus,
  Settings,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAccess, useSignOut } from "@/hooks/use-auth";
import { ROLE_LABELS, type Permission } from "@/lib/access";
import { Loading } from "@/components/dashboard/ui";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Example Roblox Game" },
      { name: "description", content: "Community dashboard for announcements, tasks, applications, and team management." },
      { property: "og:title", content: "Dashboard — Example Roblox Game" },
      { property: "og:description", content: "Game community dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardLayout,
});

type DashTo =
  | "/dashboard"
  | "/dashboard/tasks"
  | "/dashboard/announcements"
  | "/dashboard/notices"
  | "/dashboard/applications"
  | "/dashboard/users"
  | "/dashboard/roles"
  | "/dashboard/settings";
type NavItem = { name: string; to: DashTo; icon: typeof LayoutDashboard; perm?: Permission; staff?: boolean };
const items: NavItem[] = [
  { name: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", to: "/dashboard/tasks", icon: ListChecks, staff: true },
  { name: "Announcements", to: "/dashboard/announcements", icon: Megaphone, perm: "CAN_POST_ANNOUNCEMENTS" },
  { name: "Notices", to: "/dashboard/notices", icon: BellRing, perm: "CAN_POST_NOTICES" },
  { name: "Staff Applications", to: "/dashboard/applications", icon: UserCheck, perm: "CAN_VIEW_APPLICATIONS" },
  { name: "Users", to: "/dashboard/users", icon: Users, perm: "CAN_MANAGE_USERS" },
  { name: "Roles & Forms", to: "/dashboard/roles", icon: ShieldPlus, perm: "CAN_MANAGE_ROLES" },
  { name: "Settings", to: "/dashboard/settings", icon: Settings, perm: "CAN_MANAGE_SOCIALS" },
];

function DashboardLayout() {
  const { access, loading, can } = useAccess();
  const signOut = useSignOut();
  if (loading || !access) return <Loading />;

  const visible = items.filter((i) => (i.perm ? can(i.perm) || (i.perm === "CAN_MANAGE_ROLES" && can("CAN_CREATE_FORMS")) : i.staff ? access.is_staff : true));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row">
      <aside className="lg:w-64 lg:shrink-0">
        <div className="surface-crate p-4 lg:sticky lg:top-20">
          <div className="mb-4 border-b border-border pb-4">
            <p className="truncate font-display text-xl" title={access.username ?? access.email ?? undefined}>{access.username ?? access.email}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant={access.role === "public" ? "muted" : "lantern"}>{ROLE_LABELS[access.role]}</Badge>
              {access.custom_roles.map((r) => (
                <Badge key={r} variant="info">{r}</Badge>
              ))}
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {visible.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/dashboard" }}
                className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:bg-lantern data-[status=active]:text-lantern-foreground"
              >
                <item.icon className="size-4" />
                {item.name}
              </Link>
            ))}
            <button
              onClick={signOut}
              className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-destructive hover:bg-destructive/10 lg:mt-2"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </nav>
        </div>
      </aside>
      <section className="min-w-0 flex-1">
        <Outlet />
      </section>
    </div>
  );
}

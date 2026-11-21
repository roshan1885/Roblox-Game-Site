import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ListChecks, UserCheck, Megaphone, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/use-auth";
import { PageTitle, errorMessage } from "@/components/dashboard/ui";
import type { AppRole } from "@/lib/access";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Overview,
});

const ROLE_HEADLINE: Record<AppRole, { title: string; subtitle: string }> = {
  system: { title: "System Dashboard", subtitle: "Manage users, roles and everything else" },
  owner: { title: "Owner Dashboard", subtitle: "Manage co-owners, custom roles, and staff" },
  co_owner: { title: "Co-Owner Dashboard", subtitle: "Manage tasks and staff below you" },
  custom_role: { title: "Staff Dashboard", subtitle: "View tasks and applications" },
  application_reader: { title: "Staff Dashboard", subtitle: "Review staff applications" },
  public: { title: "My Dashboard", subtitle: "Track your staff applications" },
};

const statusVariant = { PENDING: "warning", UNDER_REVIEW: "info", ACCEPTED: "success", REJECTED: "destructive" } as const;

function Overview() {
  const { access, can } = useAccess();
  const qc = useQueryClient();
  const [username, setUsername] = useState(access?.username ?? "");
  const userId = access?.user_id;

  const myApps = useQuery({
    queryKey: ["my-applications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, submitted_at, notes, form:application_forms(title)")
        .eq("user_id", userId!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const myTasks = useQuery({
    queryKey: ["my-open-tasks", userId],
    enabled: !!userId && !!access?.is_staff,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", userId!)
        .in("status", ["PENDING", "IN_PROGRESS"]);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const pendingApps = useQuery({
    queryKey: ["pending-app-count"],
    enabled: can("CAN_VIEW_APPLICATIONS"),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("status", ["PENDING", "UNDER_REVIEW"]);
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (!access) return null;
  const head = ROLE_HEADLINE[access.role];

  async function saveUsername() {
    const value = username.trim();
    if (!/^[A-Za-z0-9_.-]{2,32}$/.test(value)) {
      toast.error("Use 2–32 letters, numbers, _ . or -");
      return;
    }
    const { error } = await supabase.from("profiles").update({ username: value }).eq("id", access!.user_id);
    if (error) {
      toast.error(error.code === "23505" ? "That username is taken" : errorMessage(error));
      return;
    }
    toast.success("Username saved");
    qc.invalidateQueries({ queryKey: ["my-access"] });
  }

  return (
    <div className="space-y-8">
      <PageTitle title={head.title} subtitle={head.subtitle} />

      {!access.is_active && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Your account is currently inactive, so staff tools are switched off. Contact an owner.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {access.is_staff && (
          <StatCard icon={ListChecks} label="My open tasks" value={myTasks.data} to="/dashboard/tasks" />
        )}
        {can("CAN_VIEW_APPLICATIONS") && (
          <StatCard icon={UserCheck} label="Applications to review" value={pendingApps.data} to="/dashboard/applications" />
        )}
        {can("CAN_POST_ANNOUNCEMENTS") && (
          <StatCard icon={Megaphone} label="Post an announcement" to="/dashboard/announcements" />
        )}
        {!access.is_staff && <StatCard icon={Briefcase} label="Browse open positions" to="/apply" />}
      </div>

      <section className="surface-crate p-6">
        <h2 className="mb-4 text-2xl">My applications</h2>
        {myApps.data && myApps.data.length > 0 ? (
          <ul className="divide-y divide-border">
            {myApps.data.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-bold">{a.form?.title ?? "Application"}</p>
                  <p className="text-xs text-muted-foreground">Submitted {new Date(a.submitted_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={statusVariant[a.status]}>{a.status.replace("_", " ")}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            You haven't applied yet.{" "}
            <Link to="/apply" className="font-bold text-primary hover:underline">See open positions</Link>
          </p>
        )}
      </section>

      <section className="surface-crate p-6">
        <h2 className="mb-4 text-2xl">Profile</h2>
        <p className="mb-3 text-sm text-muted-foreground">Signed in as {access.email}</p>
        <div className="flex max-w-md gap-2">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" aria-label="Username" />
          <Button variant="glow" onClick={saveUsername}>Save</Button>
        </div>
      </section>
    </div>
  );
}

type StatTo = "/dashboard/tasks" | "/dashboard/applications" | "/dashboard/announcements" | "/apply";

function StatCard({ icon: Icon, label, value, to }: { icon: typeof ListChecks; label: string; value?: number | undefined; to: StatTo }) {
  return (
    <Link to={to} className="surface-crate block p-5 transition-transform hover:-translate-y-0.5">
      <Icon className="mb-3 size-6 text-sky" />
      {value !== undefined && <p className="font-display text-4xl">{value}</p>}
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
    </Link>
  );
}

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ShieldPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/use-auth";
import { EmptyState, Loading, NoAccess, PageTitle, errorMessage } from "@/components/dashboard/ui";
import { displayName, usePeople } from "@/components/dashboard/usePeople";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/dashboard/applications")({
  component: ApplicationsPage,
});

type Status = Database["public"]["Enums"]["application_status"];
const STATUSES: Status[] = ["PENDING", "UNDER_REVIEW", "ACCEPTED", "REJECTED"];
const statusVariant = { PENDING: "warning", UNDER_REVIEW: "info", ACCEPTED: "success", REJECTED: "destructive" } as const;
const label = (s: string) => s.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

function ApplicationsPage() {
  const { access, can } = useAccess();
  const [filter, setFilter] = useState<Status | "ALL">("ALL");
  const [open, setOpen] = useState<string | null>(null);
  const people = usePeople(can("CAN_VIEW_APPLICATIONS"));

  const apps = useQuery({
    queryKey: ["applications", filter],
    enabled: can("CAN_VIEW_APPLICATIONS"),
    queryFn: async () => {
      let q = supabase
        .from("applications")
        .select("id, user_id, status, submitted_at, reviewed_at, reviewed_by, notes, form:application_forms(id, title, role_id, role:custom_roles(name))")
        .order("submitted_at", { ascending: false });
      if (filter !== "ALL") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  if (!access) return null;
  if (!can("CAN_VIEW_APPLICATIONS")) return <><PageTitle title="Staff Applications" /><NoAccess /></>;
  const personBy = new Map((people.data ?? []).map((p) => [p.id, p]));

  return (
    <div>
      <PageTitle
        title="Staff Applications"
        subtitle="Review applications for recruitable roles"
        action={
          <Select value={filter} onValueChange={(v) => setFilter(v as Status | "ALL")}>
            <SelectTrigger className="w-44" aria-label="Filter by status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />
      {apps.isLoading ? (
        <Loading />
      ) : !apps.data?.length ? (
        <EmptyState>No applications yet.</EmptyState>
      ) : (
        <div className="space-y-4">
          {apps.data.map((a) => {
            const person = personBy.get(a.user_id);
            return (
              <article key={a.id} className="surface-crate p-5">
                <button className="flex w-full flex-wrap items-center justify-between gap-3 text-left" onClick={() => setOpen(open === a.id ? null : a.id)}>
                  <div>
                    <p className="font-display text-xl">{displayName(person)}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.form?.title} · {a.form?.role?.name} · {new Date(a.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[a.status]}>{label(a.status)}</Badge>
                    <ChevronDown className={`size-4 transition-transform ${open === a.id ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {open === a.id && (
                  <ApplicationDetail
                    app={a}
                    alreadyHasRole={!!a.form?.role_id && !!person?.customRoleIds.includes(a.form.role_id)}
                    canManage={can("CAN_MANAGE_APPLICATIONS")}
                    canAssignRole={can("CAN_MANAGE_ROLES") && a.user_id !== access.user_id}
                    reviewerName={a.reviewed_by ? displayName(personBy.get(a.reviewed_by)) : null}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ApplicationDetail({
  app,
  canManage,
  canAssignRole,
  alreadyHasRole,
  reviewerName,
}: {
  app: { id: string; user_id: string; status: Status; notes: string | null; reviewed_at: string | null; form: { id: string; role_id: string; role: { name: string } | null } | null };
  canManage: boolean;
  canAssignRole: boolean;
  alreadyHasRole: boolean;
  reviewerName: string | null;
}) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>(app.status);
  const [notes, setNotes] = useState(app.notes ?? "");

  const responses = useQuery({
    queryKey: ["responses", app.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_responses")
        .select("id, value, field:form_fields(label, sort_order)")
        .eq("application_id", app.id);
      if (error) throw error;
      return [...data].sort((a, b) => (a.field?.sort_order ?? 0) - (b.field?.sort_order ?? 0));
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("applications")
        .update({ status, notes: notes.trim().slice(0, 5000) || null, reviewed_at: new Date().toISOString(), reviewed_by: u.user?.id ?? null })
        .eq("id", app.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review saved");
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["pending-app-count"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const grant = useMutation({
    mutationFn: async () => {
      if (!app.form) return;
      const { error } = await supabase.from("user_role_assignments").insert({ user_id: app.user_id, role_id: app.form.role_id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Gave the ${app.form?.role?.name} role`);
      qc.invalidateQueries({ queryKey: ["people"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      {responses.data?.map((r) => (
        <div key={r.id}>
          <p className="text-xs font-bold uppercase tracking-wider text-sky">{r.field?.label}</p>
          <p className="whitespace-pre-line text-sm">{r.value || "—"}</p>
        </div>
      ))}
      {reviewerName && app.reviewed_at && (
        <p className="text-xs text-muted-foreground">Last reviewed by {reviewerName} on {new Date(app.reviewed_at).toLocaleString()}</p>
      )}
      {canManage ? (
        <div className="space-y-3 rounded-lg bg-muted p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger className="w-44" aria-label="Decision"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="glow" onClick={() => save.mutate()} disabled={save.isPending}>Save review</Button>
            {app.status === "ACCEPTED" && canAssignRole && !alreadyHasRole && (
              <Button variant="hero" onClick={() => grant.mutate()} disabled={grant.isPending}>
                <ShieldPlus /> Give {app.form?.role?.name} role
              </Button>
            )}
            {alreadyHasRole && <Badge variant="success">Has role</Badge>}
          </div>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Private review notes" />
        </div>
      ) : (
        app.notes && <p className="text-sm text-muted-foreground">Notes: {app.notes}</p>
      )}
    </div>
  );
}

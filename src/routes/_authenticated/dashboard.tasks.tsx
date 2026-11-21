import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, MessageSquare, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/use-auth";
import { EmptyState, Loading, NoAccess, PageTitle, errorMessage } from "@/components/dashboard/ui";
import { displayName, usePeople } from "@/components/dashboard/usePeople";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/dashboard/tasks")({
  component: TasksPage,
});

type TaskStatus = Database["public"]["Enums"]["task_status"];
type TaskPriority = Database["public"]["Enums"]["task_priority"];
const STATUSES: TaskStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const priorityVariant = { LOW: "muted", MEDIUM: "info", HIGH: "warning", URGENT: "destructive" } as const;
const statusVariant = { PENDING: "warning", IN_PROGRESS: "info", COMPLETED: "success", CANCELLED: "muted" } as const;
const label = (s: string) => s.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

function TasksPage() {
  const { access, can } = useAccess();
  const qc = useQueryClient();
  const canAssign = can("CAN_ASSIGN_TASKS");
  const [view, setView] = useState<"mine" | "all">("mine");
  const [creating, setCreating] = useState(false);
  const [openReports, setOpenReports] = useState<string | null>(null);
  const people = usePeople(!!access?.is_staff);
  const userId = access?.user_id;

  const tasks = useQuery({
    queryKey: ["tasks", view, userId],
    enabled: !!userId,
    queryFn: async () => {
      let q = supabase.from("tasks").select("*").order("created_at", { ascending: false });
      if (view === "mine") q = q.or(`assigned_to.eq.${userId},created_by.eq.${userId}`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (!access?.is_staff) return <><PageTitle title="Tasks" /><NoAccess /></>;
  const personBy = new Map((people.data ?? []).map((p) => [p.id, p]));

  return (
    <div>
      <PageTitle
        title="Tasks"
        subtitle={canAssign ? "Assign and track tasks for your team members" : "View your assigned tasks and submit reports"}
        action={canAssign && <Button variant="glow" onClick={() => setCreating(true)}><Plus /> New task</Button>}
      />
      {canAssign && (
        <Tabs value={view} onValueChange={(v) => setView(v as "mine" | "all")} className="mb-6">
          <TabsList>
            <TabsTrigger value="mine">Mine</TabsTrigger>
            <TabsTrigger value="all">All tasks</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {tasks.isLoading ? (
        <Loading />
      ) : !tasks.data?.length ? (
        <EmptyState>No tasks here yet.</EmptyState>
      ) : (
        <div className="space-y-4">
          {tasks.data.map((t) => {
            const isAssignee = t.assigned_to === userId;
            return (
              <article key={t.id} className="surface-crate p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl">{t.title}</h3>
                      <Badge variant={priorityVariant[t.priority]}>{label(t.priority)}</Badge>
                      <Badge variant={statusVariant[t.status]}>{label(t.status)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      To {t.assigned_to ? displayName(personBy.get(t.assigned_to)) : "nobody yet"} · from {displayName(personBy.get(t.created_by))}
                      {t.due_date && (
                        <span className="ml-2 inline-flex items-center gap-1"><CalendarClock className="size-3" /> due {new Date(t.due_date).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(canAssign || isAssignee) && (
                      <Select value={t.status} onValueChange={(v) => updateStatus.mutate({ id: t.id, status: v as TaskStatus })}>
                        <SelectTrigger className="w-40" aria-label="Task status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    <Button variant="ghost" size="icon" aria-label="Reports" onClick={() => setOpenReports(openReports === t.id ? null : t.id)}>
                      <MessageSquare />
                    </Button>
                    {canAssign && (
                      <Button variant="ghost" size="icon" aria-label="Delete task" onClick={() => confirm(`Delete "${t.title}"?`) && remove.mutate(t.id)}>
                        <Trash2 className="text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                {t.description && <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{t.description}</p>}
                {openReports === t.id && <TaskReports taskId={t.id} names={(id) => displayName(personBy.get(id))} />}
              </article>
            );
          })}
        </div>
      )}

      <CreateTaskDialog open={creating} onClose={() => setCreating(false)} people={people.data ?? []} />
    </div>
  );
}

function TaskReports({ taskId, names }: { taskId: string; names: (id: string) => string }) {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const reports = useQuery({
    queryKey: ["task-reports", taskId],
    queryFn: async () => {
      const { data, error } = await supabase.from("task_reports").select("*").eq("task_id", taskId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const add = useMutation({
    mutationFn: async () => {
      const text = content.trim();
      if (!text) throw new Error("Write something first");
      const { error } = await supabase.from("task_reports").insert({ task_id: taskId, content: text.slice(0, 5000) });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      qc.invalidateQueries({ queryKey: ["task-reports", taskId] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <h4 className="font-display text-lg">Reports</h4>
      {reports.data?.length ? (
        reports.data.map((r) => (
          <div key={r.id} className="rounded-lg bg-muted p-3 text-sm">
            <p className="mb-1 text-xs text-muted-foreground">{names(r.user_id)} · {new Date(r.created_at).toLocaleString()}</p>
            <p className="whitespace-pre-line">{r.content}</p>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No reports yet.</p>
      )}
      <div className="flex gap-2">
        <Textarea rows={2} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a progress report…" />
        <Button variant="glow" onClick={() => add.mutate()} disabled={add.isPending}>Submit</Button>
      </div>
    </div>
  );
}

function CreateTaskDialog({ open, onClose, people }: { open: boolean; onClose: () => void; people: { id: string; username: string | null; email: string | null; is_active: boolean }[] }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM" as TaskPriority, due: "", assignee: "" });
  const create = useMutation({
    mutationFn: async () => {
      const title = form.title.trim();
      if (!title) throw new Error("Give the task a title");
      const { error } = await supabase.from("tasks").insert({
        title: title.slice(0, 200),
        description: form.description.trim().slice(0, 5000) || null,
        priority: form.priority,
        due_date: form.due ? new Date(form.due).toISOString() : null,
        assigned_to: form.assignee || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task created");
      setForm({ title: "", description: "", priority: "MEDIUM", due: "", assignee: "" });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display text-2xl">New task</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input id="t-title" maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Description</Label>
            <Textarea id="t-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{label(p)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Due date</Label>
              <Input id="t-due" type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Assign to</Label>
            <Select value={form.assignee} onValueChange={(v) => setForm({ ...form, assignee: v })}>
              <SelectTrigger><SelectValue placeholder="Choose a team member" /></SelectTrigger>
              <SelectContent>
                {people.filter((p) => p.is_active).map((p) => <SelectItem key={p.id} value={p.id}>{displayName(p)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="glow" onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? "Creating..." : "Create task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

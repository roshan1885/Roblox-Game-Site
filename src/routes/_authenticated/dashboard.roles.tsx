import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/use-auth";
import { EmptyState, Loading, NoAccess, PageTitle, errorMessage } from "@/components/dashboard/ui";
import { PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/lib/access";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/dashboard/roles")({
  component: RolesPage,
});

type FieldType = Database["public"]["Enums"]["form_field_type"];
const FIELD_TYPES: FieldType[] = ["TEXT", "TEXTAREA", "EMAIL", "NUMBER", "SELECT", "CHECKBOX", "RADIO", "DATE"];
type RoleRow = { id: string; name: string; description: string | null; permissions: Permission[]; is_recruitable: boolean };

function RolesPage() {
  const { can } = useAccess();
  const qc = useQueryClient();
  const canRoles = can("CAN_MANAGE_ROLES");
  const canForms = can("CAN_CREATE_FORMS");
  const [editing, setEditing] = useState<Partial<RoleRow> | null>(null);
  const [formFor, setFormFor] = useState<RoleRow | null>(null);

  const roles = useQuery({
    queryKey: ["custom-roles-full"],
    enabled: canRoles || canForms,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_roles")
        .select("id, name, description, permissions, is_recruitable, form:application_forms(id, title, is_active)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["custom-roles-full"] });
    qc.invalidateQueries({ queryKey: ["custom-roles"] });
    qc.invalidateQueries({ queryKey: ["open-positions"] });
  };

  const save = useMutation({
    mutationFn: async (r: Partial<RoleRow>) => {
      const name = r.name?.trim() ?? "";
      if (!name) throw new Error("Give the role a name");
      const row = { name: name.slice(0, 60), description: r.description?.trim().slice(0, 500) || null, permissions: r.permissions ?? [], is_recruitable: r.is_recruitable ?? false };
      const { error } = r.id ? await supabase.from("custom_roles").update(row).eq("id", r.id) : await supabase.from("custom_roles").insert(row);
      if (error) throw error.code === "23505" ? new Error("A role with that name already exists") : error;
    },
    onSuccess: () => {
      toast.success("Role saved");
      setEditing(null);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role deleted");
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (!canRoles && !canForms) return <><PageTitle title="Roles & Forms" /><NoAccess /></>;

  return (
    <div>
      <PageTitle
        title="Roles & Forms"
        subtitle="Create staff roles, choose what they can do, and open applications for them"
        action={canRoles && <Button variant="glow" onClick={() => setEditing({ permissions: [], is_recruitable: false })}><Plus /> Create Custom Role</Button>}
      />
      {roles.isLoading ? (
        <Loading />
      ) : !roles.data?.length ? (
        <EmptyState>No custom roles yet.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.data.map((r) => {
            const form = Array.isArray(r.form) ? r.form[0] : r.form;
            return (
              <article key={r.id} className="surface-crate flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl">{r.name}</h3>
                    {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  </div>
                  {canRoles && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" aria-label="Edit role" onClick={() => setEditing(r as RoleRow)}><Pencil /></Button>
                      <Button variant="ghost" size="icon" aria-label="Delete role" onClick={() => confirm(`Delete role "${r.name}"? People lose it immediately.`) && remove.mutate(r.id)}>
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {r.permissions.length ? r.permissions.map((p) => <Badge key={p} variant="info">{PERMISSION_LABELS[p as Permission]}</Badge>) : <Badge variant="muted">No permissions</Badge>}
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 mt-4">
                  <div className="flex gap-2">
                    {r.is_recruitable ? <Badge variant="lantern">Recruitable</Badge> : <Badge variant="muted">Not recruiting</Badge>}
                    {form && <Badge variant={form.is_active ? "success" : "muted"}>{form.is_active ? "Form open" : "Form closed"}</Badge>}
                  </div>
                  {canForms && (
                    <Button variant="outline" size="sm" onClick={() => setFormFor(r as RoleRow)}>
                      <ClipboardList /> {form ? "Edit form" : "Create form"}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing?.id ? "Edit role" : "Create custom role"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="r-name">Name</Label><Input id="r-name" maxLength={60} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="r-desc">Description</Label><Textarea id="r-desc" rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                {PERMISSIONS.map((p) => (
                  <label key={p} className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={editing.permissions?.includes(p) ?? false}
                      onCheckedChange={(c) => {
                        const cur = editing.permissions ?? [];
                        setEditing({ ...editing, permissions: c ? [...cur, p] : cur.filter((x) => x !== p) });
                      }}
                    />
                    {PERMISSION_LABELS[p]}
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-3 text-sm font-semibold">
                <Switch checked={editing.is_recruitable ?? false} onCheckedChange={(v) => setEditing({ ...editing, is_recruitable: v })} />
                People can apply for this role
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="glow" onClick={() => editing && save.mutate(editing)} disabled={save.isPending}>Save role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {formFor && <FormEditor role={formFor} onClose={() => { setFormFor(null); refresh(); }} />}
    </div>
  );
}

type FieldDraft = { id?: string; label: string; type: FieldType; required: boolean; options: string; placeholder: string };

function FormEditor({ role, onClose }: { role: RoleRow; onClose: () => void }) {
  const existing = useQuery({
    queryKey: ["form-editor", role.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_forms")
        .select("id, title, description, is_active, fields:form_fields(id, label, type, required, options, placeholder, sort_order)")
        .eq("role_id", role.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (existing.isLoading) return null;
  return <FormEditorInner role={role} initial={existing.data ?? null} onClose={onClose} />;
}

function FormEditorInner({
  role,
  initial,
  onClose,
}: {
  role: RoleRow;
  initial: { id: string; title: string; description: string | null; is_active: boolean; fields: { id: string; label: string; type: FieldType; required: boolean; options: string[]; placeholder: string | null; sort_order: number }[] } | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? `${role.name} Application`);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.is_active ?? false);
  const [fields, setFields] = useState<FieldDraft[]>(
    [...(initial?.fields ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((f) => ({ id: f.id, label: f.label, type: f.type, required: f.required, options: f.options.join(", "), placeholder: f.placeholder ?? "" })),
  );

  const save = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("The form needs a title");
      if (fields.some((f) => !f.label.trim())) throw new Error("Every question needs a label");
      const row = { role_id: role.id, title: title.trim().slice(0, 200), description: description.trim().slice(0, 2000) || null, is_active: active };
      let formId = initial?.id;
      if (formId) {
        const { error } = await supabase.from("application_forms").update(row).eq("id", formId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("application_forms").insert(row).select("id").single();
        if (error) throw error;
        formId = data.id;
      }
      const keepIds = fields.filter((f) => f.id).map((f) => f.id!);
      const removed = (initial?.fields ?? []).filter((f) => !keepIds.includes(f.id)).map((f) => f.id);
      if (removed.length) {
        const { error } = await supabase.from("form_fields").delete().in("id", removed);
        if (error) throw error;
      }
      for (const [i, f] of fields.entries()) {
        const data = {
          form_id: formId!,
          label: f.label.trim().slice(0, 200),
          type: f.type,
          required: f.required,
          options: f.options.split(",").map((o) => o.trim()).filter(Boolean).slice(0, 30),
          placeholder: f.placeholder.trim() || null,
          sort_order: i,
        };
        const { error } = f.id ? await supabase.from("form_fields").update(data).eq("id", f.id) : await supabase.from("form_fields").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Form saved");
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const update = (i: number, patch: Partial<FieldDraft>) => setFields((fs) => fs.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const move = (i: number, d: -1 | 1) =>
    setFields((fs) => {
      const next = [...fs];
      const j = i + d;
      if (j < 0 || j >= next.length) return fs;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl">Application form · {role.name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="f-title">Title</Label><Input id="f-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="f-desc">Description</Label><Textarea id="f-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <Switch checked={active} onCheckedChange={setActive} /> Accepting applications
          </label>
          {active && !role.is_recruitable && (
            <p className="text-xs text-warning">Tip: also mark the role as recruitable so it shows on the Apply page.</p>
          )}
          <div className="space-y-3">
            <Label>Questions</Label>
            {fields.map((f, i) => (
              <div key={f.id ?? `new-${i}`} className="space-y-2 rounded-lg bg-muted p-3">
                <div className="flex gap-2">
                  <Input value={f.label} placeholder="Question" onChange={(e) => update(i, { label: e.target.value })} />
                  <Select value={f.type} onValueChange={(v) => update(i, { type: v as FieldType })}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{FIELD_TYPES.map((t) => <SelectItem key={t} value={t}>{t.toLowerCase()}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {["SELECT", "RADIO", "CHECKBOX"].includes(f.type) && (
                  <Input value={f.options} placeholder="Options, separated by commas" onChange={(e) => update(i, { options: e.target.value })} />
                )}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.required} onCheckedChange={(c) => update(i, { required: !!c })} /> Required</label>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label="Move up" onClick={() => move(i, -1)}><ArrowUp /></Button>
                    <Button variant="ghost" size="icon" aria-label="Move down" onClick={() => move(i, 1)}><ArrowDown /></Button>
                    <Button variant="ghost" size="icon" aria-label="Remove question" onClick={() => setFields((fs) => fs.filter((_, j) => j !== i))}><Trash2 className="text-destructive" /></Button>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setFields((fs) => [...fs, { label: "", type: "TEXT", required: true, options: "", placeholder: "" }])}>
              <Plus /> Add question
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="glow" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save form"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/use-auth";
import { Loading, NoAccess, PageTitle, errorMessage } from "@/components/dashboard/ui";
import { displayName, usePeople, type Person } from "@/components/dashboard/usePeople";
import { canManageRole, getManageableRoles, ROLE_LABELS, type AppRole } from "@/lib/access";
import { createStaffUser } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/dashboard/users")({
  component: UsersPage,
});

function UsersPage() {
  const { access, can } = useAccess();
  const qc = useQueryClient();
  const allowed = can("CAN_MANAGE_USERS");
  const people = usePeople(allowed);
  const [creating, setCreating] = useState(false);
  const [editingRoles, setEditingRoles] = useState<Person | null>(null);
  const customRoles = useQuery({
    queryKey: ["custom-roles"],
    enabled: allowed,
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_roles").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AppRole }) => {
      const { error } = await supabase.rpc("set_user_role", { _target: id, _role: role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["people"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const setActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.rpc("set_user_active", { _target: id, _active: active });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (!access) return null;
  if (!allowed)
    return (
      <>
        <PageTitle title="Users" />
        <NoAccess />
      </>
    );
  const manageable = getManageableRoles(access.role);
  const roleName = new Map((customRoles.data ?? []).map((r) => [r.id, r.name]));
  const visiblePeople = (people.data ?? []).filter(
    (person) => access.role === "system" || person.role !== "system",
  );

  return (
    <div>
      <PageTitle
        title="Users"
        subtitle="Manage accounts and roles below you"
        action={
          <Button variant="glow" onClick={() => setCreating(true)}>
            <Plus /> Create User
          </Button>
        }
      />
      {people.isLoading ? (
        <Loading />
      ) : people.isError ? (
        <div className="surface-crate p-6 text-destructive" role="alert">
          {errorMessage(people.error)}
        </div>
      ) : (
        <div className="surface-crate overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Custom roles</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiblePeople.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No users to display.
                  </TableCell>
                </TableRow>
              ) : (
                visiblePeople.map((p) => {
                  const isSelf = p.id === access.user_id;
                  const canEdit = !isSelf && canManageRole(access.role, p.role);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{p.username ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.email}</TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Select
                            value={p.role}
                            onValueChange={(v) => setRole.mutate({ id: p.id, role: v as AppRole })}
                          >
                            <SelectTrigger
                              className="h-8 w-44"
                              aria-label={`Role for ${displayName(p)}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {manageable.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant={
                              p.role === "system"
                                ? "destructive"
                                : p.role === "public"
                                  ? "muted"
                                  : "lantern"
                            }
                          >
                            {ROLE_LABELS[p.role]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {p.customRoleIds.map((id) => (
                            <Badge key={id} variant="info">
                              {roleName.get(id) ?? "…"}
                            </Badge>
                          ))}
                          {can("CAN_MANAGE_ROLES") && !isSelf && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label="Edit custom roles"
                              onClick={() => setEditingRoles(p)}
                            >
                              <Tags />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={p.is_active}
                          disabled={!canEdit}
                          aria-label={`Active status for ${displayName(p)}`}
                          onCheckedChange={(v) => setActive.mutate({ id: p.id, active: v })}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <CreateUserDialog open={creating} onClose={() => setCreating(false)} roles={manageable} />
      <CustomRolesDialog
        person={editingRoles}
        onClose={() => setEditingRoles(null)}
        roles={customRoles.data ?? []}
      />
    </div>
  );
}

function CreateUserDialog({
  open,
  onClose,
  roles,
}: {
  open: boolean;
  onClose: () => void;
  roles: AppRole[];
}) {
  const qc = useQueryClient();
  const createUser = useServerFn(createStaffUser);
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "public" as AppRole,
  });
  const create = useMutation({
    mutationFn: async () => {
      if (form.password !== form.confirmPassword) throw new Error("Passwords do not match");
      if (form.password.length < 8) throw new Error("Password must be at least 8 characters");
      return createUser({
        data: {
          email: form.email,
          username: form.username,
          password: form.password,
          role: form.role,
        },
      });
    },
    onSuccess: () => {
      toast.success("User created");
      setForm({ email: "", username: "", password: "", confirmPassword: "", role: "public" });
      qc.invalidateQueries({ queryKey: ["people"] });
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const bind = (k: "email" | "username" | "password" | "confirmPassword") => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Create New User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cu-email">Email</Label>
            <Input id="cu-email" type="email" placeholder="email@example.com" {...bind("email")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cu-username">Username</Label>
            <Input id="cu-username" placeholder="username" {...bind("username")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cu-password">Password</Label>
            <Input
              id="cu-password"
              type="password"
              autoComplete="new-password"
              {...bind("password")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cu-confirm">Confirm Password</Label>
            <Input
              id="cu-confirm"
              type="password"
              autoComplete="new-password"
              {...bind("confirmPassword")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v as AppRole })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="glow" onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? "Creating..." : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomRolesDialog({
  person,
  onClose,
  roles,
}: {
  person: Person | null;
  onClose: () => void;
  roles: { id: string; name: string }[];
}) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: async ({ roleId, on }: { roleId: string; on: boolean }) => {
      if (!person) return;
      const { error } = on
        ? await supabase
            .from("user_role_assignments")
            .insert({ user_id: person.id, role_id: roleId })
        : await supabase
            .from("user_role_assignments")
            .delete()
            .eq("user_id", person.id)
            .eq("role_id", roleId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["people"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const current = qc.getQueryData<Person[]>(["people"])?.find((p) => p.id === person?.id) ?? person;

  return (
    <Dialog open={!!person} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Custom roles for {displayName(person ?? undefined)}
          </DialogTitle>
        </DialogHeader>
        {roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No custom roles yet — create one under Roles & Forms.
          </p>
        ) : (
          <div className="space-y-2">
            {roles.map((r) => (
              <label
                key={r.id}
                className="flex items-center gap-3 rounded-lg bg-muted p-3 text-sm font-semibold"
              >
                <Checkbox
                  checked={!!current?.customRoleIds.includes(r.id)}
                  onCheckedChange={(c) => toggle.mutate({ roleId: r.id, on: !!c })}
                />
                {r.name}
              </label>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="glow" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

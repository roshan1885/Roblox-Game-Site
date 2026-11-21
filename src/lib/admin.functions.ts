import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ROLES } from "./access";

const createUserSchema = z.object({
  email: z.string().trim().email().max(255),
  username: z.string().trim().min(2).max(32).regex(/^[A-Za-z0-9_.-]+$/, "Letters, numbers, _ . - only").optional().or(z.literal("")),
  password: z.string().min(8).max(72),
  role: z.enum(ROLES),
});

// Staff "Create user" (from the original admin dashboard). Caller must hold
// CAN_MANAGE_USERS and outrank the role they hand out.
export const createStaffUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createUserSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: allowed, error: checkError } = await context.supabase.rpc("can_manage_role", {
      _actor: context.userId,
      _target_role: data.role,
    });
    if (checkError) throw new Error("Could not verify your permissions");
    if (!allowed) throw new Error("You can't create a user with this role");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: data.username ? { username: data.username } : {},
    });
    if (error || !created.user) {
      throw new Error(error?.message?.includes("already") ? "A user with this email already exists" : "Could not create user");
    }
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: data.role }, { onConflict: "user_id" });
    if (roleError) throw new Error("User created, but the role could not be set");
    return { id: created.user.id, email: created.user.email };
  });

// Client-safe mirror of the database access rules (see role_default_permissions,
// role_level and can_manage_role in the database). The database is the source of
// truth; these helpers only decide what to show in the UI.

export const PERMISSIONS = [
  "CAN_POST_ANNOUNCEMENTS",
  "CAN_POST_NOTICES",
  "CAN_ASSIGN_TASKS",
  "CAN_MANAGE_USERS",
  "CAN_MANAGE_ROLES",
  "CAN_VIEW_APPLICATIONS",
  "CAN_MANAGE_APPLICATIONS",
  "CAN_MANAGE_SOCIALS",
  "CAN_CREATE_FORMS",
  "ADMINISTRATOR",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  CAN_POST_ANNOUNCEMENTS: "Post announcements",
  CAN_POST_NOTICES: "Post notices",
  CAN_ASSIGN_TASKS: "Assign tasks",
  CAN_MANAGE_USERS: "Manage users",
  CAN_MANAGE_ROLES: "Manage roles",
  CAN_VIEW_APPLICATIONS: "View applications",
  CAN_MANAGE_APPLICATIONS: "Review applications",
  CAN_MANAGE_SOCIALS: "Manage social links",
  CAN_CREATE_FORMS: "Create application forms",
  ADMINISTRATOR: "Administrator (everything)",
};

export const ROLES = ["system", "owner", "co_owner", "custom_role", "application_reader", "public"] as const;
export type AppRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  system: "System",
  owner: "Owner",
  co_owner: "Co-Owner",
  custom_role: "Custom Role",
  application_reader: "Application Reader",
  public: "Public",
};

export const ROLE_LEVEL: Record<AppRole, number> = {
  system: 100,
  owner: 80,
  co_owner: 70,
  custom_role: 50,
  application_reader: 40,
  public: 10,
};

const ALL: Permission[] = [...PERMISSIONS];

export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  system: ALL,
  owner: ALL,
  co_owner: [
    "CAN_POST_ANNOUNCEMENTS",
    "CAN_POST_NOTICES",
    "CAN_ASSIGN_TASKS",
    "CAN_VIEW_APPLICATIONS",
    "CAN_MANAGE_APPLICATIONS",
    "CAN_MANAGE_SOCIALS",
  ],
  custom_role: [],
  application_reader: ["CAN_VIEW_APPLICATIONS", "CAN_MANAGE_APPLICATIONS"],
  public: [],
};

export function hasPermission(userPermissions: readonly string[], required: Permission): boolean {
  return userPermissions.includes("ADMINISTRATOR") || userPermissions.includes(required);
}

export function getEffectivePermissions(role: AppRole, customRolePermissions: readonly string[] = []): Permission[] {
  const merged = new Set<string>([...(DEFAULT_ROLE_PERMISSIONS[role] ?? []), ...customRolePermissions]);
  return PERMISSIONS.filter((p) => merged.has(p));
}

/** Can someone with `actorRole` give/manage the `targetRole`? System can manage everyone. */
export function canManageRole(actorRole: AppRole, targetRole: AppRole): boolean {
  if (actorRole === "system") return true;
  return ROLE_LEVEL[actorRole] > ROLE_LEVEL[targetRole];
}

export function getManageableRoles(actorRole: AppRole): AppRole[] {
  return ROLES.filter((r) => canManageRole(actorRole, r));
}

export type MyAccess = {
  user_id: string;
  username: string | null;
  email: string | null;
  is_active: boolean;
  role: AppRole;
  is_staff: boolean;
  permissions: Permission[];
  custom_roles: string[];
};

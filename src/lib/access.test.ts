import { describe, expect, it } from "vitest";
import { canManageRole, getEffectivePermissions, getManageableRoles, hasPermission } from "./access";

describe("role permissions", () => {
  it("owner gets every permission including administrator", () => {
    expect(getEffectivePermissions("owner")).toContain("ADMINISTRATOR");
    expect(getEffectivePermissions("owner")).toHaveLength(10);
  });

  it("co-owner can post and assign tasks but not manage users or roles", () => {
    const p = getEffectivePermissions("co_owner");
    expect(p).toContain("CAN_ASSIGN_TASKS");
    expect(p).not.toContain("CAN_MANAGE_USERS");
    expect(p).not.toContain("CAN_MANAGE_ROLES");
  });

  it("application reader can only view and review applications", () => {
    expect(getEffectivePermissions("application_reader")).toEqual(["CAN_VIEW_APPLICATIONS", "CAN_MANAGE_APPLICATIONS"]);
  });

  it("custom roles add their permissions on top of the base role", () => {
    expect(getEffectivePermissions("public", ["CAN_POST_NOTICES"])).toEqual(["CAN_POST_NOTICES"]);
  });

  it("administrator implies any permission", () => {
    expect(hasPermission(["ADMINISTRATOR"], "CAN_MANAGE_SOCIALS")).toBe(true);
    expect(hasPermission(["CAN_POST_NOTICES"], "CAN_MANAGE_SOCIALS")).toBe(false);
  });
});

describe("role hierarchy", () => {
  it("only manages strictly lower roles", () => {
    expect(canManageRole("owner", "co_owner")).toBe(true);
    expect(canManageRole("owner", "owner")).toBe(false);
    expect(canManageRole("co_owner", "owner")).toBe(false);
  });

  it("system can manage every role", () => {
    expect(getManageableRoles("system")).toHaveLength(6);
  });

  it("owner cannot hand out owner or system", () => {
    expect(getManageableRoles("owner")).toEqual(["co_owner", "custom_role", "application_reader", "public"]);
  });
});

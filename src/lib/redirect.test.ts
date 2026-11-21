import { describe, expect, it } from "vitest";
import { safeRedirect } from "./redirect";

describe("safeRedirect", () => {
  it("keeps same-site paths", () => expect(safeRedirect("/apply")).toBe("/apply"));
  it("rejects other sites", () => {
    expect(safeRedirect("https://evil.example")).toBe("/dashboard");
    expect(safeRedirect("//evil.example")).toBe("/dashboard");
  });
});

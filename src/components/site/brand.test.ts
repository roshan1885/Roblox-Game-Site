import { describe, expect, it } from "vitest";
import { brandFor } from "./brand";

describe("brandFor", () => {
  it("uses the platform name", () => {
    expect(brandFor("Discord").key).toBe("discord");
    expect(brandFor("Twitter").key).toBe("x");
    expect(brandFor("X").key).toBe("x");
    expect(brandFor("Roblox Group").key).toBe("roblox");
  });
  it("falls back to the link address", () => {
    expect(brandFor("Our channel", "https://www.youtube.com/@pets").key).toBe("youtube");
    expect(brandFor("Server", "https://discord.gg/abc").key).toBe("discord");
  });
  it("uses a globe for unknown sites", () => {
    expect(brandFor("Wiki", "https://petsmugglers.fandom.com").key).toBe("web");
    expect(brandFor("Wiki", "not a url").key).toBe("web");
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { authenticateCronRequest } from "./cron-auth";

const originalCurrentSecret = process.env["CRON_SECRET"];
const originalPreviousSecret = process.env["CRON_SECRET_PREVIOUS"];

afterEach(() => {
  if (originalCurrentSecret === undefined) delete process.env["CRON_SECRET"];
  else process.env["CRON_SECRET"] = originalCurrentSecret;

  if (originalPreviousSecret === undefined) delete process.env["CRON_SECRET_PREVIOUS"];
  else process.env["CRON_SECRET_PREVIOUS"] = originalPreviousSecret;
});

describe("authenticateCronRequest", () => {
  it("accepts the current cron secret", async () => {
    process.env["CRON_SECRET"] = "current-secret";
    delete process.env["CRON_SECRET_PREVIOUS"];

    const response = await authenticateCronRequest(
      new Request("https://example.test/cron", {
        headers: { authorization: "Bearer current-secret" },
      }),
    );

    expect(response).toBeNull();
  });

  it("accepts the previous secret during rotation", async () => {
    process.env["CRON_SECRET"] = "current-secret";
    process.env["CRON_SECRET_PREVIOUS"] = "previous-secret";

    const response = await authenticateCronRequest(
      new Request("https://example.test/cron", {
        headers: { authorization: "Bearer previous-secret" },
      }),
    );

    expect(response).toBeNull();
  });
});

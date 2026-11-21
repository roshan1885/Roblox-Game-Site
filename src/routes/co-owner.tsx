import { createFileRoute, redirect } from "@tanstack/react-router";

// Old dashboard URL from the previous site; the role-aware dashboard now lives at /dashboard.
export const Route = createFileRoute("/co-owner")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard", replace: true });
  },
});

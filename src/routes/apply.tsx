import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Briefcase, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationForm, type FormFieldDef } from "@/components/site/ApplicationForm";
import { useAccess } from "@/hooks/use-auth";
import { openPositionsQuery } from "@/lib/queries";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Apply for the Team — Example Roblox Game" },
      { name: "description", content: "See open team positions and send in your application." },
      { property: "og:title", content: "Join the Game Team" },
      { property: "og:description", content: "Open team positions and community applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(openPositionsQuery),
  component: ApplyPage,
});

function ApplyPage() {
  const { data: positions } = useSuspenseQuery(openPositionsQuery);
  const { session } = useAccess();
  const [openId, setOpenId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string[]>([]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="text-5xl">Apply for Staff</h1>
      <p className="mt-2 text-muted-foreground">Help support the game community. Pick an open position and tell us about yourself.</p>

      {positions.length === 0 ? (
        <div className="surface-crate mt-10 py-16 text-center">
          <Briefcase className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-muted-foreground">No positions are open right now. Check back soon!</p>
        </div>
      ) : (
        <div className="mt-10 space-y-5">
          {positions.map((p) => (
            <section key={p.id} className="surface-crate p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Badge variant="lantern">{p.role?.name ?? "Staff"}</Badge>
                  <h2 className="mt-2 text-2xl">{p.title}</h2>
                  {p.description && <p className="mt-1 text-muted-foreground">{p.description}</p>}
                </div>
                {submitted.includes(p.id) ? (
                  <Badge variant="success">Submitted</Badge>
                ) : session ? (
                  <Button variant="glow" onClick={() => setOpenId(openId === p.id ? null : p.id)}>
                    {openId === p.id ? "Close" : "Apply"}
                  </Button>
                ) : (
                  <Button asChild variant="glow">
                    <Link to="/auth/login" search={{ redirect: "/apply" }}>
                      <LogIn /> Sign in to apply
                    </Link>
                  </Button>
                )}
              </div>
              {openId === p.id && session && !submitted.includes(p.id) && (
                <div className="mt-6 border-t border-border pt-6">
                  <ApplicationForm
                    formId={p.id}
                    fields={p.fields as FormFieldDef[]}
                    onDone={() => {
                      setSubmitted((s) => [...s, p.id]);
                      setOpenId(null);
                    }}
                  />
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

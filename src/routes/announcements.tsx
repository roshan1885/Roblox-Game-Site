import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Gamepad2 } from "lucide-react";
import { announcementsQuery, siteMetaQuery } from "@/lib/queries";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Example Roblox Game" },
      { name: "description", content: "Latest game news, community updates, and events." },
      { property: "og:title", content: "Game Announcements — Example Roblox Game" },
      { property: "og:description", content: "Latest game news and community updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(announcementsQuery(50)),
      context.queryClient.ensureQueryData(siteMetaQuery),
    ]),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { data: announcements } = useSuspenseQuery(announcementsQuery(50));
  const { data: meta } = useSuspenseQuery(siteMetaQuery);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-outline text-5xl md:text-6xl">Announcements</h1>
          <p className="mt-2 text-muted-foreground">Latest news and updates from {meta.game.title}</p>
        </div>
        <Button asChild variant="glow">
          <a href={meta.game.game_url} target="_blank" rel="noopener noreferrer">
            <Gamepad2 /> Play Game
          </a>
        </Button>
      </div>

      {announcements.length === 0 ? (
        <div className="surface-crate py-20 text-center text-muted-foreground">No announcements yet.</div>
      ) : (
        <div className="space-y-5">
          {announcements.map((a) => (
            <article key={a.id} className="surface-crate p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full border-2 border-ink bg-gradient-lantern font-display text-sm text-lantern-foreground">
                    {(a.author_name ?? "?")[0]?.toUpperCase()}
                  </span>
                  <span className="text-sm font-bold">{a.author_name ?? "Staff"}</span>
                </div>
                <time className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</time>
              </div>
              <h2 className="mb-2 text-2xl">{a.title}</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{a.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

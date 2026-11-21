import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { UserCheck, Megaphone, Shield, Users, Sparkles, BellRing, Gamepad2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { announcementsQuery, siteMetaQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Example Roblox Game — Official Community" },
      {
        name: "description",
        content: "The official community website for Example Roblox Game. Get game information, updates, and community news.",
      },
      { property: "og:title", content: "Example Roblox Game — Official Community" },
      { property: "og:description", content: "Get game information, updates, and community news." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(siteMetaQuery),
      context.queryClient.ensureQueryData(announcementsQuery(3)),
    ]),
  component: HomePage,
});

const features = [
  { title: "Game Information", description: "Learn about the game and find the link to start playing.", icon: Gamepad2, tile: "bg-gradient-primary text-primary-foreground" },
  { title: "Community", description: "Connect with other players and follow community links.", icon: Users, tile: "bg-gradient-sky text-sky-foreground" },
  { title: "Team", description: "Meet the people who help support the community.", icon: Shield, tile: "bg-gradient-bubble text-bubble-foreground" },
  { title: "Announcements", description: "Stay up to date with news, events, and updates.", icon: Megaphone, tile: "bg-gradient-lantern text-lantern-foreground" },
];

function HomePage() {
  const { data: meta } = useSuspenseQuery(siteMetaQuery);
  const { data: latest } = useSuspenseQuery(announcementsQuery(3));
  const gameUrl = meta.game.game_url;

  return (
    <div>
      {meta.settings.maintenance_mode && (
        <div className="border-b-2 border-ink bg-warning px-4 py-2 text-center text-sm font-bold text-warning-foreground">
          The game is under maintenance right now — check announcements for updates.
        </div>
      )}

      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b-4 border-ink bg-gradient-sky">
        {meta.game.thumbnail && (
          <img
            src={meta.game.thumbnail}
            alt={`${meta.game.title} artwork`}
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-hero-top" />
        <div className="mx-auto flex min-h-[600px] max-w-7xl flex-col items-center px-4 pb-24 pt-14 text-center md:min-h-[700px] md:pt-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-card px-4 py-1.5 shadow-press">
            <Gamepad2 className="size-4 text-primary" />
            <span className="text-sm font-bold">Official Community</span>
          </div>
          <h1 className="text-outline text-6xl leading-[0.95] md:text-8xl lg:text-9xl">{meta.game.title}</h1>
          <p className="mt-5 max-w-xl rounded-2xl border-2 border-ink bg-card/90 px-5 py-3 text-lg font-medium shadow-press md:text-xl">
            {meta.settings.site_description || meta.game.description}
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild variant="glow" size="xl" className="shine font-display tracking-wide">
              <a href={gameUrl} target="_blank" rel="noopener noreferrer">
                <Gamepad2 /> Play Game
              </a>
            </Button>
            <Button asChild variant="glass" size="xl" className="font-display tracking-wide">
              <Link to="/apply">
                <UserCheck /> Apply for Staff
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="relative z-10 mx-auto -mt-10 max-w-5xl px-4">
        <div className="surface-crate grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
          {[
            { icon: Gamepad2, label: "Game", value: meta.game.title, tile: "bg-gradient-primary text-primary-foreground" },
            { icon: Sparkles, label: "Genre", value: meta.game.genre || "Game", tile: "bg-gradient-bubble text-bubble-foreground" },
            { icon: Users, label: "Community", value: "Players & fans", tile: "bg-gradient-sky text-sky-foreground" },
            { icon: Clock, label: "Updates", value: "Latest news", tile: "bg-gradient-lantern text-lantern-foreground" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl p-2">
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl border-2 border-ink ${s.tile}`}>
                <s.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="truncate font-display text-lg leading-tight">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {meta.notices.length > 0 && (
        <section className="mx-auto mt-8 max-w-5xl px-4">
          <div className="surface-crate divide-y-2 divide-border">
            {meta.notices.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border-2 border-ink bg-lantern text-lantern-foreground">
                  <BellRing className="size-4" />
                </span>
                <div>
                  <p className="font-bold">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Game overview */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="surface-crate grid items-center gap-8 p-8 md:grid-cols-[auto_1fr] md:p-12">
          <div className="mx-auto grid size-28 place-items-center rounded-3xl border-2 border-ink bg-gradient-primary text-primary-foreground shadow-press md:size-36">
            <Gamepad2 className="size-16 md:size-20" />
          </div>
          <div>
            <Badge variant="lantern" className="mb-3">Discover the game</Badge>
            <h2 className="text-outline text-4xl md:text-5xl">{meta.game.title}</h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">{meta.game.description}</p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/about">More about the game →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y-4 border-ink bg-gradient-sky py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-outline mb-12 text-center text-5xl md:text-6xl">Features</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="surface-crate p-6 transition-transform hover:-translate-y-1">
                <div className={`mb-4 grid size-14 place-items-center rounded-2xl border-2 border-ink shadow-press ${f.tile}`}>
                  <f.icon className="size-7" />
                </div>
                <h3 className="mb-2 text-2xl">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="space-y-5">
            <h2 className="text-5xl">About the game</h2>
            <p className="leading-relaxed text-muted-foreground">
              {meta.game.description}
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Join the community for updates, announcements, and information about the team.
            </p>
            <Button asChild variant="outline">
              <Link to="/about">Learn more →</Link>
            </Button>
          </div>
          <div className="surface-crate p-6">
            <div className="mb-6 flex items-center gap-4">
              <Gamepad2 className="size-16 text-primary" aria-hidden />
              <div>
                <h3 className="text-3xl">{meta.game.title}</h3>
                <p className="text-sm text-muted-foreground">{meta.game.genre || "Game"}</p>
              </div>
            </div>
            <ul className="grid gap-3">
              {[
                { icon: Gamepad2, text: "Game information", tile: "bg-primary text-primary-foreground" },
                { icon: Clock, text: "News and updates", tile: "bg-sky text-sky-foreground" },
                { icon: Users, text: "Community resources", tile: "bg-lantern text-lantern-foreground" },
              ].map((row) => (
                <li key={row.text} className="flex items-center gap-3 rounded-xl bg-muted p-3 font-semibold">
                  <span className={`grid size-8 place-items-center rounded-lg border-2 border-ink ${row.tile}`}>
                    <row.icon className="size-4" />
                  </span>
                  {row.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Latest news */}
      {latest.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-5xl">Latest news</h2>
            <Link to="/announcements" className="font-bold text-sky hover:underline">All announcements →</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {latest.map((a) => (
              <article key={a.id} className="surface-crate p-6">
                <Badge variant="info">{new Date(a.created_at).toLocaleDateString()}</Badge>
                <h3 className="mt-3 text-2xl">{a.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.content}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="surface-crate relative overflow-hidden bg-gradient-lantern px-6 py-12 text-center md:px-12">
          <Gamepad2 className="mx-auto mb-4 size-16 md:absolute md:left-8 md:top-1/2 md:mb-0 md:size-20 md:-translate-y-1/2" aria-hidden />
          <h2 className="text-outline text-4xl md:text-5xl">Ready to play?</h2>
          <p className="mx-auto mb-8 mt-3 max-w-md font-semibold text-lantern-foreground">
            Start playing and join the community.
          </p>
          <Button asChild variant="glow" size="xl" className="shine font-display tracking-wide">
            <a href={gameUrl} target="_blank" rel="noopener noreferrer">
              <Gamepad2 /> Play Now
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Gamepad2, Users, Crown, ShieldHalf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteMetaQuery, teamMembersQuery } from "@/lib/queries";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Game — Example Roblox Game" },
      { name: "description", content: "Learn about the game, find its play link, and meet the team." },
      { property: "og:title", content: "About the Game — Example Roblox Game" },
      { property: "og:description", content: "Game information, the play link, and community team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(siteMetaQuery),
      context.queryClient.ensureQueryData(teamMembersQuery),
    ]),
  component: AboutPage,
});

function AboutPage() {
  const { data: meta } = useSuspenseQuery(siteMetaQuery);
  const { data: teamMembers } = useSuspenseQuery(teamMembersQuery);
  const info = [
    { icon: Gamepad2, title: "Game", value: meta.game.title, tile: "bg-gradient-primary text-primary-foreground" },
    { icon: Gamepad2, title: "Genre", value: meta.game.genre || "Not specified", tile: "bg-gradient-bubble text-bubble-foreground" },
    { icon: Users, title: "Community", value: "Players, news, and team", tile: "bg-gradient-sky text-sky-foreground" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <h1 className="text-outline mb-10 text-5xl md:text-6xl">About {meta.game.title}</h1>

      <section className="surface-crate mb-10 p-8">
        <h2 className="mb-4 text-3xl">Game Description</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          {meta.game.description}
        </p>
        <p className="leading-relaxed text-muted-foreground">
          Find the latest news, connect with the community, and learn more about the team behind the game.
        </p>
      </section>

      <section className="surface-crate mb-10 p-8">
        <h2 className="mb-6 text-3xl">Game Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {info.map((row) => (
            <div key={row.title} className="flex items-center gap-4 rounded-xl bg-muted p-4">
              <span className={`grid size-11 place-items-center rounded-xl border-2 border-ink ${row.tile}`}>
                <row.icon className="size-5" />
              </span>
              <div>
                <h3 className="text-lg">{row.title}</h3>
                <p className="text-muted-foreground">{row.value}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-4 rounded-xl bg-muted p-4">
            <span className="grid size-11 place-items-center rounded-xl border-2 border-ink bg-gradient-lantern text-lantern-foreground">
              <Gamepad2 className="size-5" />
            </span>
            <div className="flex-1">
              <h3 className="text-lg">Game Link</h3>
              <p className="text-sm text-muted-foreground">Click to play</p>
            </div>
            <Button asChild variant="glow" size="sm">
              <a href={meta.game.game_url} target="_blank" rel="noopener noreferrer">
                <Gamepad2 /> Play Game
              </a>
            </Button>
          </div>
        </div>
      </section>

      {teamMembers.length > 0 && (
        <section className="surface-crate p-8">
          <h2 className="mb-6 text-3xl">Team</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {teamMembers.map((member) => {
              const Icon =
                member.role === "Owner"
                  ? Crown
                  : member.role === "Co-Owner" || member.role === "Administrator"
                    ? ShieldHalf
                    : Users;
              return (
                <div
                  key={`${member.name}-${member.role}`}
                  className="rounded-2xl border-2 border-ink/15 bg-muted p-6 text-center"
                >
                  <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full border-[3px] border-ink bg-gradient-lantern text-lantern-foreground shadow-press">
                    <Icon className="size-7" />
                  </div>
                  <h3 className="text-xl">{member.name}</h3>
                  <p className="mb-2 text-sm font-bold text-sky">{member.role}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

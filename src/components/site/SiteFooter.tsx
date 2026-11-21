import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { siteMetaQuery } from "@/lib/queries";
import { brandFor } from "./brand";
import { Logo } from "./Logo";

export function SiteFooter() {
  const { data } = useQuery(siteMetaQuery);
  const socials = data?.socials ?? [];
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t-4 border-ink bg-ocean text-ocean-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Logo tone="light" />
          <div className="flex flex-wrap items-center justify-center gap-3">
            {socials.map((s) => {
              const brand = brandFor(s.platform, s.url);
              return (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label ?? s.platform}
                  title={s.label ?? s.platform}
                  className={`press grid size-11 place-items-center rounded-xl border-2 border-ink ${brand.className} shadow-press`}
                >
                  <brand.Icon aria-hidden className="size-5" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8 border-t border-ocean-foreground/15 pt-8 md:grid-cols-3">
          <div>
            <h4 className="mb-3 font-display text-lg">Game</h4>
            <Link to="/about" className="mb-2 block text-sm text-ocean-muted hover:text-ocean-foreground">About the Game</Link>
            <Link to="/announcements" className="mb-2 block text-sm text-ocean-muted hover:text-ocean-foreground">Announcements</Link>
            <a href={data?.game.game_url ?? "https://www.roblox.com"} target="_blank" rel="noopener noreferrer" className="mb-2 block text-sm text-ocean-muted hover:text-ocean-foreground">Play Game</a>
          </div>
          <div>
            <h4 className="mb-3 font-display text-lg">Staff</h4>
            <Link to="/auth/login" className="mb-2 block text-sm text-ocean-muted hover:text-ocean-foreground">Staff Login</Link>
            <Link to="/apply" className="mb-2 block text-sm text-ocean-muted hover:text-ocean-foreground">Apply for Staff</Link>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h4 className="mb-3 font-display text-lg">Community</h4>
            <p className="text-sm text-ocean-muted">Follow the community for news, events, and updates.</p>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-ocean-muted">© {year} {data?.settings.site_name || data?.game.title || "Example Roblox Game"}. This is an independent community website.</p>
        <p className="text-center text-xs text-ocean-muted">
          Site developed by <a href="https://roshan.is-a.dev/" target="_blank" rel="noopener noreferrer" className="text-ocean-foreground hover:underline">Roshan</a>
        </p>
      </div>
    </footer>
  );
}

import type { ComponentType } from "react";
import {
  SiDiscord,
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiReddit,
  SiRoblox,
  SiTiktok,
  SiTwitch,
  SiX,
  SiYoutube,
} from "react-icons/si";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type IconComp = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
/** className = tile background + logo color for that brand. */
export type Brand = { key: string; name: string; Icon: IconComp; className: string };

const BRANDS: Array<Brand & { match: RegExp }> = [
  { key: "roblox", name: "Roblox", Icon: SiRoblox, className: "bg-card text-brand-roblox", match: /roblox/ },
  { key: "discord", name: "Discord", Icon: SiDiscord, className: "bg-brand-discord text-brand-foreground", match: /discord/ },
  { key: "x", name: "X (Twitter)", Icon: SiX, className: "bg-brand-x text-brand-foreground", match: /twitter|^x$|x\.com/ },
  { key: "youtube", name: "YouTube", Icon: SiYoutube, className: "bg-brand-youtube text-brand-foreground", match: /youtube|youtu\.be/ },
  { key: "tiktok", name: "TikTok", Icon: SiTiktok, className: "bg-brand-tiktok text-brand-foreground", match: /tiktok/ },
  { key: "instagram", name: "Instagram", Icon: SiInstagram, className: "bg-brand-instagram text-brand-foreground", match: /instagram/ },
  { key: "twitch", name: "Twitch", Icon: SiTwitch, className: "bg-brand-twitch text-brand-foreground", match: /twitch/ },
  { key: "reddit", name: "Reddit", Icon: SiReddit, className: "bg-brand-reddit text-brand-foreground", match: /reddit/ },
  { key: "facebook", name: "Facebook", Icon: SiFacebook, className: "bg-brand-facebook text-brand-foreground", match: /facebook|fb\.com/ },
  { key: "github", name: "GitHub", Icon: SiGithub, className: "bg-brand-github text-brand-foreground", match: /github/ },
];

const FALLBACK: Brand = { key: "web", name: "Website", Icon: Globe, className: "bg-sky text-sky-foreground" };

/** Picks the right logo from the platform name first, then the link's address. */
export function brandFor(platform: string, url?: string): Brand {
  const p = platform.trim().toLowerCase();
  const byName = BRANDS.find((b) => b.match.test(p));
  if (byName) return byName;
  let host = "";
  try {
    host = url ? new URL(url).hostname.toLowerCase() : "";
  } catch {
    host = "";
  }
  return BRANDS.find((b) => host && b.match.test(host)) ?? FALLBACK;
}

export const SUPPORTED_BRANDS = BRANDS.map((b) => b.name);

export function RobloxIcon({ className }: { className?: string }) {
  return <SiRoblox aria-hidden className={cn("size-4", className)} />;
}

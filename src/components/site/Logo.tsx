import { Link } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { siteMetaQuery } from "@/lib/queries";

export function Logo({ size = "md", tone = "dark" }: { size?: "md" | "lg"; tone?: "dark" | "light" }) {
  const img = size === "lg" ? "size-16" : "size-11";
  const text = size === "lg" ? "text-3xl" : "text-2xl";
  const { data } = useQuery(siteMetaQuery);
  const siteName = data?.settings.site_name || data?.game.title || "Example Roblox Game";
  const iconSize = size === "lg" ? "size-8" : "size-6";
  return (
    <Link to="/" className="group flex items-center gap-2" aria-label={`${siteName} home`}>
      <span className={`${img} -my-2 grid place-items-center rounded-xl border-2 border-ink bg-primary text-primary-foreground shadow-press transition-transform group-hover:-rotate-6 group-hover:scale-105`}>
        <Gamepad2 className={iconSize} />
      </span>
      <span className={`font-display ${text} leading-none ${tone === "light" ? "text-ocean-foreground" : "text-foreground"}`}>{siteName}</span>
    </Link>
  );
}

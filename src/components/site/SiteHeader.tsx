import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  Megaphone,
  Info,
  UserCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAccess, useSignOut } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { siteMetaQuery } from "@/lib/queries";
import { Logo } from "./Logo";

const navItems = [
  { name: "Home", to: "/", icon: Home },
  { name: "Announcements", to: "/announcements", icon: Megaphone },
  { name: "About", to: "/about", icon: Info },
  { name: "Apply for Staff", to: "/apply", icon: UserCheck },
] as const;

export function SiteHeader() {
  const { session, access } = useAccess();
  const signOut = useSignOut();
  const { theme, toggleTheme } = useTheme();
  const { data: meta } = useQuery(siteMetaQuery);
  const [open, setOpen] = useState(false);
  const signedIn = !!session;
  const themeLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="flex items-center gap-2 rounded-xl border-2 border-transparent px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:border-ink data-[status=active]:bg-lantern data-[status=active]:text-lantern-foreground"
            >
              <item.icon className="size-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={themeLabel}
            title={themeLabel}
          >
            <ThemeIcon />
          </Button>
          <Button asChild variant="glow" size="sm" className="hidden lg:inline-flex">
            <a href={meta?.game.game_url ?? "https://www.roblox.com"} target="_blank" rel="noopener noreferrer">
              <Gamepad2 /> Play Game
            </a>
          </Button>
          {signedIn ? (
            <>
              <Button asChild variant="glass" size="sm">
                <Link to="/dashboard">
                  <LayoutDashboard /> {access?.is_staff ? "Staff Dashboard" : "My Dashboard"}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
                <LogOut />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth/login">Login</Link>
              </Button>
              <Button asChild variant="sky" size="sm">
                <Link to="/auth/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Toggle mobile menu"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 border-l-[3px] border-ink bg-card">
            <SheetTitle className="font-display text-xl">Menu</SheetTitle>
            <div className="mt-6 flex flex-col gap-1">
              <Button
                variant="ghost"
                className="justify-start"
                onClick={toggleTheme}
                aria-label={themeLabel}
              >
                <ThemeIcon /> {theme === "dark" ? "Light mode" : "Dark mode"}
              </Button>
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <item.icon className="size-4" />
                  {item.name}
                </Link>
              ))}
              <a
                href={meta?.game.game_url ?? "https://www.roblox.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-primary hover:bg-accent"
              >
                <Gamepad2 /> Play Game
              </a>
              <div className="my-3 border-t border-border" />
              {signedIn ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-accent"
                  >
                    <LayoutDashboard className="size-4" /> Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      void signOut();
                    }}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline">
                    <Link to="/auth/login" onClick={() => setOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button asChild variant="sky">
                    <Link to="/auth/register" onClick={() => setOpen(false)}>
                      Register
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

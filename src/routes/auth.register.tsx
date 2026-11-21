import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { AlertCircle, Lock, Mail, MailCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/site/AuthCard";
import { SocialSignIn } from "@/components/site/SocialSignIn";
import { siteMetaQuery } from "@/lib/queries";
import { safeRedirect } from "@/lib/redirect";

export const Route = createFileRoute("/auth/register")({
  validateSearch: (s) => z.object({ redirect: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Create Account — Example Roblox Game" },
      { name: "description", content: "Create an account to apply for team positions." },
      { property: "og:title", content: "Register — Example Roblox Game" },
      { property: "og:description", content: "Create an account and join the community team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteMetaQuery),
  component: RegisterPage,
});

const schema = z
  .object({
    email: z.string().trim().email("Enter a valid email").max(255),
    username: z.string().trim().min(2, "Username is too short").max(32).regex(/^[A-Za-z0-9_.-]+$/, "Use letters, numbers, _ . or -"),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

function RegisterPage() {
  const { redirect } = Route.useSearch();
  const target = safeRedirect(redirect);
  const { data: meta } = useSuspenseQuery(siteMetaQuery);
  const [form, setForm] = useState({ email: "", username: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}${target}`,
        data: { username: parsed.data.username },
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message || "Registration failed");
      return;
    }
    setSent(true);
  }

  if (!meta.settings.registration_open) {
    return (
      <AuthCard title="Registration closed" subtitle="New sign-ups are paused right now">
        <p className="text-center text-muted-foreground">Check back soon, or follow announcements for when it reopens.</p>
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link to="/auth/login">Back to login</Link>
        </Button>
      </AuthCard>
    );
  }

  if (sent) {
    return (
      <AuthCard title="Check your email" subtitle={`We sent a confirmation link to ${form.email}`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <MailCheck className="size-12 text-success" />
          <p className="text-muted-foreground">Click the link in the email to activate your account, then sign in.</p>
          <Button asChild variant="glow" className="w-full">
            <Link to="/auth/login">Go to login</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <AuthCard title="Create Account" subtitle="Join our staff team">
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" required autoComplete="email" className="h-11 pl-10" placeholder="example@gmail.com" {...field("email")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="username" required autoComplete="username" className="h-11 pl-10" placeholder="Your username" {...field("username")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" required autoComplete="new-password" className="h-11 pl-10" placeholder="••••••••" {...field("password")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="confirmPassword" type="password" required autoComplete="new-password" className="h-11 pl-10" placeholder="••••••••" {...field("confirmPassword")} />
          </div>
        </div>
        <Button type="submit" variant="glow" className="h-11 w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>
      <div className="mt-5">
        <SocialSignIn redirectTo={target} />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/auth/login" search={{ redirect }} className="font-bold text-primary hover:underline">Sign in</Link>
      </p>
    </AuthCard>
  );
}

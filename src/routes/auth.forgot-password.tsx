import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/site/AuthCard";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Your Password — Example Roblox Game" },
      { name: "description", content: "Get a link to set a new password for your account." },
      { property: "og:title", content: "Reset Password — Example Roblox Game" },
      { property: "og:description", content: "Get a password reset link for your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false);
    setSent(true);
  }

  return (
    <AuthCard title="Forgot password" subtitle="We'll email you a link to set a new one">
      {sent ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <MailCheck className="size-12 text-success" />
          <p className="text-muted-foreground">If an account exists for {email}, a reset link is on its way.</p>
          <Button asChild variant="outline" className="w-full"><Link to="/auth/login">Back to login</Link></Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" placeholder="example@gmail.com" />
          </div>
          <Button type="submit" variant="glow" className="h-11 w-full" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
          <p className="text-center text-sm"><Link to="/auth/login" className="font-bold text-primary hover:underline">Back to login</Link></p>
        </form>
      )}
    </AuthCard>
  );
}

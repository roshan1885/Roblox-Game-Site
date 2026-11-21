import { useState } from "react";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function SocialSignIn({ redirectTo }: { redirectTo: string }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function go() {
    setBusy("google");
    // Remember where to land; the OAuth return goes to the public home page first.
    sessionStorage.setItem("post-auth-redirect", redirectTo);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error("Sign-in failed. Please try again.");
      sessionStorage.removeItem("post-auth-redirect");
      setBusy(null);
    }
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="outline" className="w-full" disabled={!!busy} onClick={go}>
        <FcGoogle aria-hidden /> Continue with Google
      </Button>
    </div>
  );
}

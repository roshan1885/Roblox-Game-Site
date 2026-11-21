import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/use-auth";
import { NoAccess, PageTitle, errorMessage } from "@/components/dashboard/ui";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { can } = useAccess();
  if (!can("CAN_MANAGE_SOCIALS") && !can("ADMINISTRATOR")) return <><PageTitle title="Settings" /><NoAccess /></>;
  return (
    <div className="space-y-8">
      <PageTitle title="Settings" subtitle="Site details, game info and social links" />
      {can("ADMINISTRATOR") && <SiteAndGame />}
      {can("CAN_MANAGE_SOCIALS") && <Socials />}
    </div>
  );
}

function SiteAndGame() {
  const qc = useQueryClient();
  const data = useQuery({
    queryKey: ["settings-admin"],
    queryFn: async () => {
      const [g, s] = await Promise.all([
        supabase.from("game_info").select("*").limit(1).maybeSingle(),
        supabase.from("site_settings").select("*").limit(1).maybeSingle(),
      ]);
      if (g.error) throw g.error;
      if (s.error) throw s.error;
      return { game: g.data, settings: s.data };
    },
  });
  const [game, setGame] = useState({ title: "", description: "", game_url: "", genre: "", thumbnail: "" });
  const [settings, setSettings] = useState({ site_name: "", site_description: "", maintenance_mode: false, registration_open: true });

  useEffect(() => {
    if (data.data?.game) {
      const g = data.data.game;
      setGame({ title: g.title, description: g.description, game_url: g.game_url, genre: g.genre ?? "", thumbnail: g.thumbnail ?? "" });
    }
    if (data.data?.settings) {
      const s = data.data.settings;
      setSettings({ site_name: s.site_name, site_description: s.site_description ?? "", maintenance_mode: s.maintenance_mode, registration_open: s.registration_open });
    }
  }, [data.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!/^https:\/\//.test(game.game_url)) throw new Error("Game link must start with https://");
      if (game.thumbnail.trim() && !/^https:\/\//.test(game.thumbnail.trim())) throw new Error("Game artwork link must start with https://");
      if (data.data?.game) {
        const { error } = await supabase.from("game_info").update({ ...game, genre: game.genre || null, thumbnail: game.thumbnail.trim() || null }).eq("id", data.data.game.id);
        if (error) throw error;
      }
      if (data.data?.settings) {
        const { error } = await supabase.from("site_settings").update({ ...settings, site_description: settings.site_description || null }).eq("id", data.data.settings.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["settings-admin"] });
      qc.invalidateQueries({ queryKey: ["site-meta"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <section className="surface-crate space-y-6 p-6">
      <h2 className="text-2xl">Game & site</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="g-title">Game title</Label><Input id="g-title" value={game.title} onChange={(e) => setGame({ ...game, title: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="g-genre">Genre</Label><Input id="g-genre" value={game.genre} onChange={(e) => setGame({ ...game, genre: e.target.value })} /></div>
        <div className="space-y-1.5 md:col-span-2"><Label htmlFor="g-url">Game link</Label><Input id="g-url" value={game.game_url} onChange={(e) => setGame({ ...game, game_url: e.target.value })} /></div>
        <div className="space-y-1.5 md:col-span-2"><Label htmlFor="g-desc">Game description</Label><Textarea id="g-desc" rows={2} value={game.description} onChange={(e) => setGame({ ...game, description: e.target.value })} /></div>
        <div className="space-y-1.5 md:col-span-2"><Label htmlFor="g-thumbnail">Game artwork URL (optional)</Label><Input id="g-thumbnail" type="url" placeholder="https://…" value={game.thumbnail} onChange={(e) => setGame({ ...game, thumbnail: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="s-name">Site name</Label><Input id="s-name" value={settings.site_name} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="s-desc">Site description</Label><Input id="s-desc" value={settings.site_description} onChange={(e) => setSettings({ ...settings, site_description: e.target.value })} /></div>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-3 text-sm font-semibold"><Switch checked={settings.registration_open} onCheckedChange={(v) => setSettings({ ...settings, registration_open: v })} /> Registration open</label>
        <label className="flex items-center gap-3 text-sm font-semibold"><Switch checked={settings.maintenance_mode} onCheckedChange={(v) => setSettings({ ...settings, maintenance_mode: v })} /> Maintenance banner</label>
      </div>
      <Button variant="glow" onClick={() => save.mutate()} disabled={save.isPending}>Save settings</Button>
    </section>
  );
}

function Socials() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState({ platform: "", url: "", label: "" });
  const list = useQuery({
    queryKey: ["socials-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_links").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["socials-admin"] });
    qc.invalidateQueries({ queryKey: ["site-meta"] });
  };
  const add = useMutation({
    mutationFn: async () => {
      if (!draft.platform.trim()) throw new Error("Platform is required");
      if (!/^https:\/\//.test(draft.url.trim())) throw new Error("Link must start with https://");
      const { error } = await supabase.from("social_links").insert({
        platform: draft.platform.trim().slice(0, 40),
        url: draft.url.trim().slice(0, 500),
        label: draft.label.trim() || null,
        sort_order: (list.data?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft({ platform: "", url: "", label: "" });
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const update = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("social_links").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <section className="surface-crate space-y-4 p-6">
      <h2 className="text-2xl">Social links</h2>
      <p className="text-sm text-muted-foreground">Shown as logo buttons in the site footer. Roblox, Discord, X/Twitter, YouTube, TikTok, Instagram, Twitch, Reddit, Facebook and GitHub get their own logos; other sites show a globe.</p>
      <ul className="divide-y divide-border">
        {list.data?.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="font-bold">{s.platform}{s.label ? ` · ${s.label}` : ""}</p>
              <p className="truncate text-xs text-muted-foreground">{s.url}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={s.is_active} aria-label={`Show ${s.platform}`} onCheckedChange={(v) => update.mutate({ id: s.id, is_active: v })} />
              <Button variant="ghost" size="icon" aria-label="Delete link" onClick={() => remove.mutate(s.id)}><Trash2 className="text-destructive" /></Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="grid gap-2 md:grid-cols-[1fr_2fr_1fr_auto]">
        <Input placeholder="Platform (e.g. Discord)" value={draft.platform} onChange={(e) => setDraft({ ...draft, platform: e.target.value })} />
        <Input placeholder="https://…" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
        <Input placeholder="Label (optional)" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        <Button variant="glow" onClick={() => add.mutate()} disabled={add.isPending}><Plus /> Add</Button>
      </div>
    </section>
  );
}

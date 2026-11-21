import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, Loading, errorMessage } from "./ui";

type Post = { id: string; title: string; content: string; is_published: boolean; author_name: string | null; created_at: string };

export function PostsManager({ table, noun }: { table: "announcements" | "notices"; noun: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Post> | null>(null);

  const list = useQuery({
    queryKey: ["dash", table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("id, title, content, is_published, author_name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["dash", table] });
    qc.invalidateQueries({ queryKey: ["announcements"] });
    qc.invalidateQueries({ queryKey: ["site-meta"] });
  };

  const save = useMutation({
    mutationFn: async (p: Partial<Post>) => {
      const title = p.title?.trim() ?? "";
      const content = p.content?.trim() ?? "";
      if (!title || !content) throw new Error("Title and content are required");
      if (title.length > 200 || content.length > 10000) throw new Error("That's too long");
      const row = { title, content, is_published: p.is_published ?? true };
      const { error } = p.id
        ? await supabase.from(table).update(row).eq("id", p.id)
        : await supabase.from(table).insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${noun} saved`);
      setEditing(null);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${noun} deleted`);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button variant="glow" onClick={() => setEditing({ is_published: true })}>
          <Plus /> New {noun.toLowerCase()}
        </Button>
      </div>

      {list.isLoading ? (
        <Loading />
      ) : !list.data?.length ? (
        <EmptyState>No {noun.toLowerCase()}s yet.</EmptyState>
      ) : (
        <div className="space-y-4">
          {list.data.map((p) => (
            <article key={p.id} className="surface-crate p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl">{p.title}</h3>
                    <Badge variant={p.is_published ? "success" : "muted"}>{p.is_published ? "Published" : "Draft"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.author_name ?? "Staff"} · {new Date(p.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing(p)}><Pencil /></Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    onClick={() => confirm(`Delete "${p.title}"?`) && remove.mutate(p.id)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{p.content}</p>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editing?.id ? `Edit ${noun.toLowerCase()}` : `New ${noun.toLowerCase()}`}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form
              id="post-form"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(editing);
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" maxLength={200} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" rows={6} maxLength={10000} value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
              </div>
              <label className="flex items-center gap-3 text-sm font-semibold">
                <Switch checked={editing.is_published ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
                Published
              </label>
            </form>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="glow" type="submit" form="post-form" disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export type FormFieldDef = {
  id: string;
  label: string;
  type: "TEXT" | "TEXTAREA" | "EMAIL" | "NUMBER" | "SELECT" | "CHECKBOX" | "RADIO" | "DATE";
  required: boolean;
  options: string[];
  placeholder: string | null;
};

export function ApplicationForm({ formId, fields, onDone }: { formId: string; fields: FormFieldDef[]; onDone: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (id: string, v: string) => setValues((s) => ({ ...s, [id]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.rpc("submit_application", { _form_id: formId, _responses: values });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Could not submit your application");
      return;
    }
    toast.success("Application submitted! We'll review it soon.");
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {fields.map((f) => (
        <div key={f.id} className="space-y-1.5">
          <Label htmlFor={f.id}>
            {f.label} {f.required && <span className="text-destructive">*</span>}
          </Label>
          {f.type === "TEXTAREA" ? (
            <Textarea id={f.id} required={f.required} maxLength={5000} placeholder={f.placeholder ?? ""} value={values[f.id] ?? ""} onChange={(e) => set(f.id, e.target.value)} />
          ) : f.type === "SELECT" ? (
            <Select value={values[f.id] ?? ""} onValueChange={(v) => set(f.id, v)}>
              <SelectTrigger id={f.id}><SelectValue placeholder={f.placeholder ?? "Choose one"} /></SelectTrigger>
              <SelectContent>
                {f.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : f.type === "RADIO" ? (
            <RadioGroup value={values[f.id] ?? ""} onValueChange={(v) => set(f.id, v)}>
              {f.options.map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm"><RadioGroupItem value={o} /> {o}</label>
              ))}
            </RadioGroup>
          ) : f.type === "CHECKBOX" ? (
            <div className="space-y-2">
              {(f.options.length ? f.options : ["Yes"]).map((o) => {
                const selected = (values[f.id] ?? "").split(", ").filter(Boolean);
                const checked = selected.includes(o);
                return (
                  <label key={o} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => set(f.id, (c ? [...selected, o] : selected.filter((x) => x !== o)).join(", "))}
                    />
                    {o}
                  </label>
                );
              })}
            </div>
          ) : (
            <Input
              id={f.id}
              required={f.required}
              type={f.type === "EMAIL" ? "email" : f.type === "NUMBER" ? "number" : f.type === "DATE" ? "date" : "text"}
              maxLength={500}
              placeholder={f.placeholder ?? ""}
              value={values[f.id] ?? ""}
              onChange={(e) => set(f.id, e.target.value)}
            />
          )}
        </div>
      ))}
      <Button type="submit" variant="hero" size="lg" disabled={loading}>
        {loading ? "Submitting..." : "Submit application"}
      </Button>
    </form>
  );
}

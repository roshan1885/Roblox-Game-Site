import type { ReactNode } from "react";
import { ShieldOff } from "lucide-react";

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="surface-crate px-6 py-14 text-center text-muted-foreground">{children}</div>;
}

export function NoAccess() {
  return (
    <div className="surface-crate px-6 py-14 text-center">
      <ShieldOff className="mx-auto mb-3 size-10 text-muted-foreground" />
      <p className="font-bold">You don't have access to this section.</p>
      <p className="text-sm text-muted-foreground">Ask an owner if you think you should.</p>
    </div>
  );
}

export function Loading() {
  return <div className="py-16 text-center text-muted-foreground">Loading…</div>;
}

export function errorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return "Something went wrong";
}

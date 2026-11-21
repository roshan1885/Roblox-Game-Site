import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-ink bg-primary text-primary-foreground",
        secondary: "border-ink/20 bg-secondary text-secondary-foreground",
        destructive: "border-ink bg-destructive text-destructive-foreground",
        outline: "border-ink/30 text-foreground",
        success: "border-ink bg-success text-success-foreground",
        warning: "border-ink bg-warning text-warning-foreground",
        info: "border-ink bg-sky text-sky-foreground",
        muted: "border-ink/20 bg-muted text-muted-foreground",
        lantern: "border-ink bg-lantern text-lantern-foreground",
        rare: "border-ink bg-rarity-rare text-ink-foreground",
        epic: "border-ink bg-rarity-epic text-ink-foreground",
        legendary: "border-ink bg-rarity-legendary text-lantern-foreground",
        mythical: "border-ink bg-rarity-mythical text-ink-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

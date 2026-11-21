import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "press border-2 border-ink bg-primary font-bold text-primary-foreground shadow-press",
        destructive: "press border-2 border-ink bg-destructive font-bold text-destructive-foreground shadow-press",
        outline: "press border-2 border-ink bg-card font-semibold text-foreground shadow-press hover:bg-secondary",
        secondary: "press border-2 border-ink bg-secondary font-semibold text-secondary-foreground shadow-press",
        ghost: "font-semibold hover:bg-accent hover:text-accent-foreground",
        link: "text-sky underline-offset-4 hover:underline",
        // Big gold "coin" call-to-action.
        hero: "press border-[3px] border-ink bg-gradient-lantern font-display text-lantern-foreground tracking-wide shadow-press-lg",
        // Green "Play" game button.
        glow: "press border-2 border-ink bg-gradient-primary font-bold text-primary-foreground shadow-press",
        // White game button.
        glass: "press border-2 border-ink bg-card font-bold text-foreground shadow-press hover:bg-secondary",
        sky: "press border-2 border-ink bg-gradient-sky font-bold text-sky-foreground shadow-press",
      },
      size: {
        default: "h-10 rounded-xl px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-sm",
        lg: "h-11 rounded-xl px-8",
        xl: "h-14 rounded-2xl px-8 text-xl [&_svg]:size-5",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

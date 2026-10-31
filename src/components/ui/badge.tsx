import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-1 focus:ring-ring border select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brightloop-coral text-white font-bold uppercase tracking-wider",
        coral:
          "border-transparent bg-brightloop-coral text-white font-bold uppercase tracking-wider",
        overdue:
          "border-transparent bg-brightloop-coral text-white font-bold uppercase tracking-wider shadow-subtle",
        "coral-subtle":
          "border-brightloop-coral/30 bg-brightloop-coral-light text-brightloop-coral",
        sage:
          "border-transparent bg-brightloop-sage text-white font-bold uppercase tracking-wider",
        "sage-subtle":
          "border-brightloop-border bg-brightloop-bg text-brightloop-text font-medium",
        dark:
          "border-transparent bg-brightloop-dark text-white font-bold uppercase tracking-wider",
        outline:
          "border-border bg-white text-brightloop-text font-medium shadow-subtle",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-semibold",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-semibold",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

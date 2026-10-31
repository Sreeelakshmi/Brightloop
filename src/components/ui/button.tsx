import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-brightloop-coral-hover active:scale-[0.99]",
        coral:
          "bg-brightloop-coral text-white shadow-sm hover:bg-brightloop-coral-hover active:scale-[0.99]",
        orange:
          "bg-[#F27B4B] text-white shadow-sm hover:bg-[#E56F3E] active:scale-[0.99]",
        dark:
          "bg-brightloop-text text-white shadow-sm hover:bg-brightloop-text/90 active:scale-[0.99]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border bg-white text-foreground shadow-subtle hover:bg-brightloop-bg/40 hover:text-foreground",
        secondary:
          "bg-white border border-border text-foreground hover:bg-muted/60 shadow-subtle",
        sage:
          "bg-brightloop-bg border border-border text-brightloop-text hover:bg-muted/70",
        ghost:
          "text-foreground hover:bg-brightloop-bg/50 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-sm font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

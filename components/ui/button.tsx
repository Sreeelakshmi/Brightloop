import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[3px] text-xs font-semibold tracking-wider uppercase transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F57B4A] disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#2B302B] text-white hover:bg-[#1f231f] active:bg-[#161a16] border border-transparent",
        outline:
          "border-[1.5px] border-[#B9CBB9] bg-white text-[#2B302B] hover:bg-[#D3E3D3]/50 active:bg-[#D3E3D3]",
        secondary:
          "bg-[#D3E3D3] text-[#2B302B] hover:bg-[#c2d5c2] active:bg-[#b0c6b0] border border-transparent",
        orange:
          "bg-[#F57B4A] text-white hover:bg-[#e06836] active:bg-[#cb5928] border border-transparent",
        ghost:
          "text-[#2B302B] hover:bg-[#D3E3D3]/60 active:bg-[#D3E3D3]",
        link:
          "text-[#2B302B] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3 py-1.5 text-xs",
        sm: "h-7 px-2.5 text-[11px]",
        lg: "h-10 px-4 text-sm",
        icon: "h-8 w-8",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };


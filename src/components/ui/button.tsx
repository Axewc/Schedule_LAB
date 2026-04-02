import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#0077B6] text-white hover:bg-[#005f92] focus-visible:ring-[#0077B6]",
        secondary: "bg-[#00B4D8] text-white hover:bg-[#009ab8] focus-visible:ring-[#00B4D8]",
        success: "bg-[#06D6A0] text-white hover:bg-[#05b886] focus-visible:ring-[#06D6A0]",
        outline: "border border-[#0077B6] text-[#0077B6] bg-transparent hover:bg-[#0077B6]/10",
        ghost: "text-[#212529] hover:bg-[#F8F9FA]",
        destructive: "bg-[#E63946] text-white hover:bg-[#c9303c] focus-visible:ring-[#E63946]",
        warning: "bg-[#FFB703] text-[#212529] hover:bg-[#e6a500]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
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

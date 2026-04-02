import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "secondary" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[#0077B6] text-white",
  success: "bg-[#06D6A0] text-white",
  warning: "bg-[#FFB703] text-[#212529]",
  error: "bg-[#E63946] text-white",
  secondary: "bg-[#00B4D8] text-white",
  outline: "border border-[#0077B6] text-[#0077B6]",
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#212529] placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-[#0077B6] focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-[#E63946] aria-invalid:ring-[#E63946]/20",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

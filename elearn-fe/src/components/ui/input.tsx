import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "h-[32px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-[0_0_0_1px_rgba(0,0,0,0.15)] outline-none transition-shadow duration-100",
          "hover:shadow-[0_0_0_1px_rgba(0,0,0,0.25)]",
          "focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,115,129,0.2)]",
          "placeholder:text-gray-500",
          "disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed",
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

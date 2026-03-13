"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ className, size = "md" }: AvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-white/10 flex items-center justify-center",
        sizeClasses[size],
        className
      )}
    >
      <User
        className={cn(
          "text-white",
          size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"
        )}
      />
    </div>
  );
}

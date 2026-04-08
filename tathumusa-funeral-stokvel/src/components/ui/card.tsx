import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-panel rounded-[28px] border border-white/70 p-6 text-zinc-900 hover-lift",
        className,
      )}
      {...props}
    />
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

const styles = {
  primary: "bg-zinc-950 text-white shadow-lg hover:bg-zinc-800",
  secondary: "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100",
  ghost: "bg-transparent text-zinc-800 hover:bg-white/70",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof styles;
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

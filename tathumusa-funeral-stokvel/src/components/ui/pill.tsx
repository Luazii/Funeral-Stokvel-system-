import { cn } from "@/lib/utils";

export function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-zinc-200 bg-white/85 px-3 py-1 text-xs uppercase tracking-[0.25em] text-zinc-500",
        className,
      )}
    >
      {children}
    </span>
  );
}

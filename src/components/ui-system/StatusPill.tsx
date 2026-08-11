import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type StatusTone = "neutral" | "active" | "warning" | "danger" | "success";

const toneClass: Record<StatusTone, string> = {
  neutral: "border-border text-[hsl(var(--text-muted))]",
  active: "border-primary/40 text-primary bg-primary/10",
  success: "border-primary/30 text-primary/90",
  warning: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  danger: "border-destructive/40 text-destructive bg-destructive/10",
};

export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em]",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

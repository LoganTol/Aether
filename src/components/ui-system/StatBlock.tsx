import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function StatBlock({
  label,
  value,
  hint,
  emphasis = false,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-eyebrow">{label}</div>
      <div
        className={cn(
          "nums mt-1.5 font-heading text-2xl font-bold leading-none tracking-tight",
          emphasis ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </div>
      {hint && <div className="text-meta mt-1.5">{hint}</div>}
    </div>
  );
}

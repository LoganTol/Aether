import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** A single scannable record in a list: leading slot, label stack, trailing slot. */
export function DataRow({
  leading,
  title,
  subtitle,
  trailing,
  className,
  as: As = "div",
  ...rest
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  as?: "div" | "button" | "li";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <As
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left",
        As === "button" && "transition-colors hover:bg-[hsl(var(--surface-elevated))]",
        className,
      )}
      {...(rest as Record<string, unknown>)}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="text-ui-title truncate text-foreground">{title}</div>
        {subtitle && <div className="text-meta mt-0.5 truncate">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0 text-right">{trailing}</div>}
    </As>
  );
}

/** Vertical stack of DataRows with hairline separators. */
export function DataList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("divide-y divide-border", className)}>{children}</div>;
}

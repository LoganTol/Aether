import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

type Level = 1 | 2 | "elevated";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  level?: Level;
  bordered?: boolean;
  interactive?: boolean;
  padded?: boolean | "sm" | "lg";
}

const levelClass: Record<string, string> = {
  "1": "surface-1",
  "2": "surface-2",
  elevated: "surface-elevated",
};

/** Base container for grouped content. Replaces ad-hoc glass-card usage. */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ level = 2, bordered = true, interactive = false, padded = true, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl",
        levelClass[String(level)],
        bordered && "border border-border",
        padded === true && "p-5",
        padded === "sm" && "p-3.5",
        padded === "lg" && "p-6 sm:p-8",
        interactive &&
          "transition-colors hover:border-strong hover:bg-[hsl(var(--surface-elevated))]",
        className,
      )}
      {...props}
    />
  ),
);
Surface.displayName = "Surface";

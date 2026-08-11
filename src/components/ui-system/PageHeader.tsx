import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Title block: eyebrow, title, supporting line and an optional action cluster. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        {back}
        {eyebrow && <div className="text-eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-page-title text-foreground">{title}</h1>
        {description && <p className="text-body mt-2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

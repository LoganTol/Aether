import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Consistent horizontal rhythm for every screen in the product. */
export function PageContainer({
  children,
  className,
  width = "default",
}: {
  children: ReactNode;
  className?: string;
  width?: "default" | "narrow" | "wide";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6",
        width === "narrow" && "max-w-3xl",
        width === "default" && "max-w-5xl",
        width === "wide" && "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

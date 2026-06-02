import { cn } from "@/lib/utils";

type Status = "pending" | "proposed" | "scheduled" | "completed" | "forfeited" | "disputed" | "overdue";

export function deriveStatus(status: string, deadline_at: string): Status {
  if (status === "completed" || status === "forfeited" || status === "disputed") return status as Status;
  if (status !== "scheduled" && new Date(deadline_at).getTime() < Date.now()) return "overdue";
  return (status as Status) || "pending";
}

const STYLES: Record<Status, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  proposed: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  scheduled: "bg-primary/15 text-primary border-primary/40",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  forfeited: "bg-muted text-muted-foreground border-border",
  disputed: "bg-destructive/15 text-destructive border-destructive/40",
  overdue: "bg-destructive/15 text-destructive border-destructive/40",
};

const LABELS: Record<Status, string> = {
  pending: "Pending",
  proposed: "Proposed",
  scheduled: "Scheduled",
  completed: "Completed",
  forfeited: "Forfeit",
  disputed: "Disputed",
  overdue: "Overdue",
};

export default function MatchStatusBadge({ status, deadline_at, className }: { status: string; deadline_at: string; className?: string }) {
  const s = deriveStatus(status, deadline_at);
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border", STYLES[s], className)}>
      {LABELS[s]}
    </span>
  );
}
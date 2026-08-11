import { StatusPill, type StatusTone } from "@/components/ui-system";

type Status = "pending" | "proposed" | "scheduled" | "completed" | "forfeited" | "disputed" | "overdue";

export function deriveStatus(status: string, deadline_at: string): Status {
  if (status === "completed" || status === "forfeited" || status === "disputed") return status as Status;
  if (status !== "scheduled" && new Date(deadline_at).getTime() < Date.now()) return "overdue";
  return (status as Status) || "pending";
}

const TONES: Record<Status, StatusTone> = {
  pending: "neutral",
  proposed: "warning",
  scheduled: "active",
  completed: "success",
  forfeited: "neutral",
  disputed: "danger",
  overdue: "danger",
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
    <StatusPill tone={TONES[s]} className={className}>
      {LABELS[s]}
    </StatusPill>
  );
}

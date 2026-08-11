import { Link } from "react-router-dom";
import { MapPin, Trash2 } from "lucide-react";
import MatchStatusBadge from "./MatchStatusBadge";
import type { Match, SideLabel } from "./types";
import { Surface, SectionHeading, EmptyState } from "@/components/ui-system";

export default function ScheduleTab({
  matches,
  sideLabel,
  isCreator,
  onDelete,
}: {
  matches: Match[];
  sideLabel: SideLabel;
  isCreator?: boolean;
  onDelete?: (matchId: string) => void;
}) {
  if (matches.length === 0) {
    return (
      <Surface level={1} padded={false}>
        <EmptyState
          title="No matches yet"
          description="Once fixtures are generated or a match is scheduled, the season timeline appears here."
        />
      </Surface>
    );
  }
  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {rounds.map((round) => {
        const ms = matches.filter((m) => m.round === round);
        return (
          <section key={round}>
            <SectionHeading title={`Round ${round}`} hint={`${ms.length} match${ms.length === 1 ? "" : "es"}`} />
            <Surface level={1} padded={false} className="divide-y divide-border overflow-hidden">
              {ms.map((m) => {
                const deletable =
                  isCreator && (m.status === "pending" || m.status === "scheduled" || m.status === "proposed");
                return (
                  <div
                    key={m.id}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[hsl(var(--surface-2))]"
                  >
                    <Link to={`/app/matches/${m.id}`} className="min-w-0 flex-1">
                      <p className="text-ui-title truncate">
                        {sideLabel(m.side_kind, m.side_a_id)}{" "}
                        <span className="text-[hsl(var(--text-muted))]">vs</span>{" "}
                        {sideLabel(m.side_kind, m.side_b_id)}
                      </p>
                      <p className="text-meta mt-0.5 flex flex-wrap items-center gap-x-3">
                        <span>
                          {m.scheduled_at
                            ? new Date(m.scheduled_at).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })
                            : `Due ${new Date(m.deadline_at).toLocaleDateString()}`}
                        </span>
                        {m.location && (
                          <span className="inline-flex min-w-0 items-center gap-1 truncate">
                            <MapPin size={11} aria-hidden /> {m.location}
                          </span>
                        )}
                      </p>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <MatchStatusBadge status={m.status} deadline_at={m.deadline_at} />
                      {deletable && onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onDelete(m.id);
                          }}
                          aria-label="Delete match"
                          className="icon-btn h-8 w-8 opacity-0 transition-opacity hover:border-destructive/40 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </Surface>
          </section>
        );
      })}
    </div>
  );
}

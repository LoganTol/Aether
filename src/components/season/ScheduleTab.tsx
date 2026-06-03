import { Link } from "react-router-dom";
import { MapPin, Trash2 } from "lucide-react";
import MatchStatusBadge from "./MatchStatusBadge";
import type { Match, SideLabel } from "./types";

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
    return <p className="text-muted-foreground">No matches yet.</p>;
  }
  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {rounds.map((round) => {
        const ms = matches.filter((m) => m.round === round);
        return (
          <div key={round}>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Round {round}</h3>
            <div className="space-y-2">
              {ms.map((m) => {
                const deletable = isCreator && (m.status === "pending" || m.status === "scheduled" || m.status === "proposed");
                return (
                  <div
                    key={m.id}
                    className="glass-card p-4 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors group"
                  >
                    <Link to={`/app/matches/${m.id}`} className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {sideLabel(m.side_kind, m.side_a_id)} <span className="text-muted-foreground">vs</span> {sideLabel(m.side_kind, m.side_b_id)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {m.scheduled_at
                          ? new Date(m.scheduled_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                          : `Due ${new Date(m.deadline_at).toLocaleDateString()}`}
                      </p>
                      {m.location && (
                        <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1 truncate">
                          <MapPin size={11} /> {m.location}
                        </p>
                      )}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <MatchStatusBadge status={m.status} deadline_at={m.deadline_at} />
                      {deletable && onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(m.id); }}
                          aria-label="Delete match"
                          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

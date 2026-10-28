import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import MatchStatusBadge from "./MatchStatusBadge";
import type { Match, SideLabel } from "./types";

export interface ScheduleScore { match_id: string; set_number: number; side_a_games: number; side_b_games: number }
export default function SeasonMatchCard({ match, sideLabel, scores, own, onDelete }: { match: Match; sideLabel: SideLabel; scores: ScheduleScore[]; own: boolean; onDelete?: (id: string) => void }) {
  const sets = scores.filter(score => score.match_id === match.id).sort((a, b) => a.set_number - b.set_number);
  const winner = sets.length ? (sets.filter(set => set.side_a_games > set.side_b_games).length > sets.filter(set => set.side_b_games > set.side_a_games).length ? "a" : "b") : null;
  return <article className={`relative rounded-lg border bg-card transition-colors hover:border-primary/60 hover:bg-primary/5 ${own ? "border-primary/40" : "border-border"}`}>
    <Link to={`/app/matches/${match.id}`} aria-label={`Open ${sideLabel(match.side_kind, match.side_a_id)} vs ${sideLabel(match.side_kind, match.side_b_id)}`} className="block p-4 focus-visible:rounded-lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 pr-6"><span className={`text-xs font-medium ${own ? "text-primary" : "text-muted-foreground"}`}>{own ? "Your Match" : `Round ${match.round}`}</span><MatchStatusBadge status={match.status} deadline_at={match.deadline_at}/></div>
      <div className="space-y-3">
        {(["a", "b"] as const).map(side => <div key={side} className="flex items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-2 text-sm font-semibold">{winner === side && <Trophy size={14} className="shrink-0 text-primary" aria-hidden/>}<span className="break-words">{sideLabel(match.side_kind, side === "a" ? match.side_a_id : match.side_b_id)}</span></span>{sets.length > 0 && <span className="flex shrink-0 gap-2 tabular-nums">{sets.map(set => <span key={set.set_number} className={`w-5 text-center text-sm ${side === "a" ? set.side_a_games > set.side_b_games ? "font-semibold text-primary" : "text-muted-foreground" : set.side_b_games > set.side_a_games ? "font-semibold text-primary" : "text-muted-foreground"}`}>{side === "a" ? set.side_a_games : set.side_b_games}</span>)}</span>}</div>)}
      </div>
      <div className="mt-4 space-y-2 border-t border-border pt-3 text-xs text-muted-foreground"><p className="flex items-start gap-2"><CalendarDays size={13} className="mt-0.5 shrink-0" aria-hidden/><span>{match.scheduled_at ? new Date(match.scheduled_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Date & Time Not Set"}</span></p>{match.location && <p className="flex items-start gap-2"><MapPin size={13} className="mt-0.5 shrink-0" aria-hidden/><span className="break-words">{match.location}</span></p>}{sets.length>0&&match.status!=="completed"&&<p className="text-primary">{match.status==="disputed"?"Result Under Review":"Awaiting Result Confirmation"}</p>}</div>
    </Link>
    {onDelete && ["pending", "scheduled", "proposed"].includes(match.status) && sets.length === 0 && <Button variant="ghost" size="icon" title="Delete Match" aria-label="Delete Match" onClick={() => onDelete(match.id)} className="absolute right-1 top-2 h-7 w-7 text-muted-foreground hover:text-destructive"><Trash2 size={13}/></Button>}
  </article>;
}
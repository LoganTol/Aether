import { useState } from "react";
import { CalendarDays, GitBranch } from "lucide-react";
import type { Match, SideLabel, Team } from "./types";
import { Surface, SectionHeading, EmptyState } from "@/components/ui-system";
import { Button } from "@/components/ui/button";
import SeasonMatchCard, { type ScheduleScore } from "./SeasonMatchCard";
import { isOwnMatch } from "@/lib/match-access";

export default function ScheduleTab({
  matches,
  sideLabel,
  isCreator,
  onDelete,
  scores = [],
  myParticipantId,
  teams = [],
}: {
  matches: Match[];
  sideLabel: SideLabel;
  isCreator?: boolean;
  onDelete?: (matchId: string) => void;
  scores?: ScheduleScore[];
  myParticipantId?: string;
  teams?: Team[];
}) {
  const [view, setView] = useState<"schedule" | "bracket">("schedule");
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
    <div className="space-y-7">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5"><div><h2 className="text-page-title">Season Schedule</h2><p className="text-meta mt-2">{matches.length} {matches.length===1?"Match":"Matches"} · {rounds.length} {rounds.length===1?"Round":"Rounds"} · Round Robin</p></div><div className="inline-flex gap-1 rounded-lg border border-border bg-muted p-1" role="tablist" aria-label="Schedule View">{[{id:"schedule" as const,label:"Schedule",Icon:CalendarDays},{id:"bracket" as const,label:"Bracket",Icon:GitBranch}].map(({id,label,Icon})=><Button key={id} role="tab" aria-selected={view===id} variant={view===id?"default":"ghost"} size="sm" onClick={()=>setView(id)}><Icon/>{label}</Button>)}</div></section>
      <div className={view === "bracket" ? "flex gap-5 overflow-x-auto pb-4 scrollbar-dark" : "space-y-8"} aria-label={view === "bracket" ? "Round Robin Bracket" : "Full Schedule"}>
      {rounds.map((round) => {
        const ms = matches.filter((m) => m.round === round);
        return (
          <section key={round} className={view === "bracket" ? "w-72 shrink-0 border-t-2 border-primary pt-4" : ""}>
            <SectionHeading title={`Round ${round}`} hint={`${ms.length} match${ms.length === 1 ? "" : "es"}`} />
            <div className={view === "bracket" ? "space-y-3" : "grid gap-3 md:grid-cols-2"}>
              {ms.map((m) => {
                const deletable =
                  isCreator && (m.status === "pending" || m.status === "scheduled" || m.status === "proposed");
                return <SeasonMatchCard key={m.id} match={m} sideLabel={sideLabel} scores={scores} own={isOwnMatch(m,myParticipantId,teams)} onDelete={deletable?onDelete:undefined}/>;
              })}
            </div>
          </section>
        );
      })}
      </div>
    </div>
  );
}

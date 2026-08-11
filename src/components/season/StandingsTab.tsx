import type { Season, StandingRow, SideLabel } from "./types";
import { Surface, EmptyState, StatusPill } from "@/components/ui-system";
import { Trophy } from "lucide-react";

export default function StandingsTab({ season, standings, sideLabel }: { season: Season; standings: StandingRow[]; sideLabel: SideLabel }) {
  const sorted = sortStandings(standings);

  if (sorted.length === 0) {
    return (
      <Surface level={1} padded={false}>
        <EmptyState
          icon={<Trophy size={16} aria-hidden />}
          title="No matches played yet"
          description="Standings build themselves as soon as the first box score is recorded."
        />
      </Surface>
    );
  }

  const leader = sorted[0];

  return (
    <div className="space-y-5">
      <Surface level={1} className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-eyebrow">Currently leading</p>
          <p className="text-page-title mt-1.5 truncate">{sideLabel(leader.side_kind, leader.side_id)}</p>
          <p className="text-meta mt-1.5">
            {leader.wins}-{leader.losses} · {leader.sets_won - leader.sets_lost >= 0 ? "+" : ""}
            {leader.sets_won - leader.sets_lost} sets
          </p>
        </div>
        <StatusPill tone="active">#1</StatusPill>
      </Surface>

      <Surface level={1} padded={false} className="overflow-hidden">
        <div className="scrollbar-dark overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-eyebrow px-4 py-3 text-left">#</th>
                <th className="text-eyebrow px-4 py-3 text-left">
                  {season.format === "doubles" ? "Team" : "Player"}
                </th>
                <th className="text-eyebrow px-2 py-3 text-right">W</th>
                <th className="text-eyebrow px-2 py-3 text-right">L</th>
                <th className="text-eyebrow hidden px-2 py-3 text-right sm:table-cell">Sets</th>
                <th className="text-eyebrow hidden px-4 py-3 text-right sm:table-cell">Games</th>
              </tr>
            </thead>
            <tbody className="nums divide-y divide-border">
              {sorted.map((s, i) => (
                <tr key={s.side_id} className="transition-colors hover:bg-[hsl(var(--surface-2))]">
                  <td className={`px-4 py-3 font-semibold ${i === 0 ? "text-primary" : "text-[hsl(var(--text-muted))]"}`}>
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 text-foreground">{sideLabel(s.side_kind, s.side_id)}</td>
                  <td className="px-2 py-3 text-right font-semibold text-foreground">{s.wins}</td>
                  <td className="px-2 py-3 text-right text-[hsl(var(--text-muted))]">{s.losses}</td>
                  <td className="hidden px-2 py-3 text-right text-[hsl(var(--text-muted))] sm:table-cell">
                    {s.sets_won}-{s.sets_lost}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-[hsl(var(--text-muted))] sm:table-cell">
                    {s.games_won}-{s.games_lost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}

function sortStandings(rows: StandingRow[]): StandingRow[] {
  return [...rows].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const sa = a.sets_won - a.sets_lost;
    const sb = b.sets_won - b.sets_lost;
    if (sb !== sa) return sb - sa;
    return (b.games_won - b.games_lost) - (a.games_won - a.games_lost);
  });
}

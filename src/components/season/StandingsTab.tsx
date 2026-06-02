import { Trophy } from "lucide-react";
import type { Season, StandingRow, SideLabel } from "./types";

export default function StandingsTab({ season, standings, sideLabel }: { season: Season; standings: StandingRow[]; sideLabel: SideLabel }) {
  const sorted = sortStandings(standings);

  if (sorted.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <Trophy className="mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No matches played yet. Standings will appear here.</p>
      </div>
    );
  }

  const podium = sorted.slice(0, 3);
  const medalColors = ["text-amber-400", "text-slate-300", "text-amber-700"];
  const medalEmoji = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6">
      {podium.length >= 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {podium.map((s, i) => (
            <div key={s.side_id} className={`glass-card p-5 border ${i === 0 ? "border-primary/40 glow-shadow" : "border-border"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{medalEmoji[i]}</span>
                <span className={`text-xs uppercase tracking-wider font-semibold ${medalColors[i]}`}>#{i + 1}</span>
              </div>
              <p className="font-bold text-lg truncate">{sideLabel(s.side_kind, s.side_id)}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.wins}-{s.losses} · {s.sets_won - s.sets_lost >= 0 ? "+" : ""}{s.sets_won - s.sets_lost} sets</p>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-black/30">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">{season.format === "doubles" ? "Team" : "Player"}</th>
              <th className="text-right px-2 py-3">W</th>
              <th className="text-right px-2 py-3">L</th>
              <th className="text-right px-2 py-3 hidden sm:table-cell">Sets</th>
              <th className="text-right px-4 py-3 hidden sm:table-cell">Games</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr key={s.side_id} className="border-t border-border">
                <td className="px-4 py-3 font-bold">{i + 1}</td>
                <td className="px-4 py-3">{sideLabel(s.side_kind, s.side_id)}</td>
                <td className="px-2 py-3 text-right text-primary font-semibold">{s.wins}</td>
                <td className="px-2 py-3 text-right">{s.losses}</td>
                <td className="px-2 py-3 text-right hidden sm:table-cell">{s.sets_won}-{s.sets_lost}</td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">{s.games_won}-{s.games_lost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
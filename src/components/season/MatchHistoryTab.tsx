import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Match, SideLabel } from "./types";

interface Result { match_id: string; winner_side: "a" | "b" }
interface Score { match_id: string; set_number: number; side_a_games: number; side_b_games: number }

export default function MatchHistoryTab({ matches, sideLabel }: { matches: Match[]; sideLabel: SideLabel }) {
  const completed = matches
    .filter((m) => m.status === "completed")
    .sort((a, b) => {
      const ad = a.completed_at || a.updated_at || "";
      const bd = b.completed_at || b.updated_at || "";
      return bd.localeCompare(ad);
    });

  const [results, setResults] = useState<Record<string, Result>>({});
  const [scores, setScores] = useState<Record<string, Score[]>>({});

  useEffect(() => {
    if (completed.length === 0) return;
    const ids = completed.map((m) => m.id);
    (async () => {
      const [r, s] = await Promise.all([
        supabase.from("match_results").select("match_id,winner_side").in("match_id", ids),
        supabase.from("match_scores").select("match_id,set_number,side_a_games,side_b_games").in("match_id", ids).order("set_number"),
      ]);
      const rMap: Record<string, Result> = {};
      (r.data as Result[] | null)?.forEach((row) => { rMap[row.match_id] = row; });
      const sMap: Record<string, Score[]> = {};
      (s.data as Score[] | null)?.forEach((row) => {
        (sMap[row.match_id] ||= []).push(row);
      });
      setResults(rMap);
      setScores(sMap);
    })();
  }, [completed.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (completed.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <Trophy className="mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No completed matches yet. Results will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {completed.map((m) => {
        const r = results[m.id];
        const sets = scores[m.id] || [];
        const winnerSide = r?.winner_side === "a" ? m.side_a_id : r?.winner_side === "b" ? m.side_b_id : null;
        const loserSide = r?.winner_side === "a" ? m.side_b_id : r?.winner_side === "b" ? m.side_a_id : null;
        return (
          <Link
            key={m.id}
            to={`/app/matches/${m.id}/results`}
            className="glass-card p-4 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Round {m.round}</p>
              <p className="font-medium truncate">
                {winnerSide ? (
                  <>
                    <span className="text-primary">{sideLabel(m.side_kind, winnerSide)}</span>
                    <span className="text-muted-foreground"> def. </span>
                    <span>{sideLabel(m.side_kind, loserSide!)}</span>
                  </>
                ) : (
                  <>{sideLabel(m.side_kind, m.side_a_id)} vs {sideLabel(m.side_kind, m.side_b_id)}</>
                )}
              </p>
              <div className="flex flex-wrap gap-2 mt-1 text-xs font-mono text-muted-foreground">
                {sets.map((s) => (
                  <span key={s.set_number}>{s.side_a_games}–{s.side_b_games}</span>
                ))}
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground shrink-0">
              {m.completed_at ? new Date(m.completed_at).toLocaleDateString() : ""}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
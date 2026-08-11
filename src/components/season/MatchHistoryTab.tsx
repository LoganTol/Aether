import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Match, SideLabel } from "./types";
import { Surface, EmptyState } from "@/components/ui-system";

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
      <Surface level={1} padded={false}>
        <EmptyState
          icon={<Trophy size={16} aria-hidden />}
          title="No completed matches yet"
          description="Finished matches and their box scores collect here."
        />
      </Surface>
    );
  }

  return (
    <Surface level={1} padded={false} className="divide-y divide-border overflow-hidden">
      {completed.map((m) => {
        const r = results[m.id];
        const sets = scores[m.id] || [];
        const winnerSide = r?.winner_side === "a" ? m.side_a_id : r?.winner_side === "b" ? m.side_b_id : null;
        const loserSide = r?.winner_side === "a" ? m.side_b_id : r?.winner_side === "b" ? m.side_a_id : null;
        return (
          <Link
            key={m.id}
            to={`/app/matches/${m.id}/results`}
            className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-[hsl(var(--surface-2))]"
          >
            <div className="min-w-0">
              <p className="text-eyebrow">Round {m.round}</p>
              <p className="text-ui-title mt-1 truncate">
                {winnerSide ? (
                  <>
                    <span className="text-primary">{sideLabel(m.side_kind, winnerSide)}</span>
                    <span className="text-[hsl(var(--text-muted))]"> def. </span>
                    <span>{sideLabel(m.side_kind, loserSide!)}</span>
                  </>
                ) : (
                  <>{sideLabel(m.side_kind, m.side_a_id)} vs {sideLabel(m.side_kind, m.side_b_id)}</>
                )}
              </p>
              <div className="text-meta nums mt-1 flex flex-wrap gap-2">
                {sets.map((s) => (
                  <span key={s.set_number}>{s.side_a_games}–{s.side_b_games}</span>
                ))}
              </div>
            </div>
            <div className="text-meta shrink-0 text-right">
              {m.completed_at ? new Date(m.completed_at).toLocaleDateString() : ""}
            </div>
          </Link>
        );
      })}
    </Surface>
  );
}
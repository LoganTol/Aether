import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trophy, Check, Clock } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";

interface Match {
  id: string; season_id: string; round: number;
  side_kind: "player" | "team"; side_a_id: string; side_b_id: string;
  scheduled_at: string | null; status: string;
  completed_at: string | null;
}
interface Result { winner_side: "a" | "b"; entered_by: string | null; confirmed_by: string | null; disputed: boolean }
interface Score { id: string; set_number: number; side_a_games: number; side_b_games: number }
interface Participant { id: string; display_name: string }
interface Team { id: string; name: string }

export default function MatchScorecard() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    if (!matchId) return;
    (async () => {
      const { data: m } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
      if (!m) { setLoading(false); return; }
      setMatch(m as unknown as Match);
      const [r, sc, p, t] = await Promise.all([
        supabase.from("match_results").select("*").eq("match_id", matchId).maybeSingle(),
        supabase.from("match_scores").select("*").eq("match_id", matchId).order("set_number"),
        supabase.from("season_participants").select("id,display_name").eq("season_id", (m as { season_id: string }).season_id),
        supabase.from("doubles_teams").select("id,name").eq("season_id", (m as { season_id: string }).season_id),
      ]);
      setResult((r.data as Result) || null);
      setScores((sc.data as Score[]) || []);
      setParticipants((p.data as Participant[]) || []);
      setTeams((t.data as Team[]) || []);
      setLoading(false);
    })();
  }, [matchId]);

  if (loading) return <div className="min-h-screen bg-background"><AppHeader /><div className="container py-20 text-center text-muted-foreground">Loading…</div></div>;
  if (!match) return <div className="min-h-screen bg-background"><AppHeader /><div className="container py-20 text-center">Match not found.</div></div>;

  const sideLabel = (id: string) =>
    match.side_kind === "team"
      ? teams.find((t) => t.id === id)?.name || "Team"
      : participants.find((p) => p.id === id)?.display_name || "Player";

  const enteredBy = participants.find((p) => p.id === result?.entered_by);
  const confirmedBy = participants.find((p) => p.id === result?.confirmed_by);
  const winnerId = result?.winner_side === "a" ? match.side_a_id : result?.winner_side === "b" ? match.side_b_id : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 max-w-2xl">
        <button onClick={() => navigate(`/app/seasons/${match.season_id}`)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft size={16} /> Back to season
        </button>

        <div className="glass-card p-6 mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Round {match.round} · Scorecard</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            {sideLabel(match.side_a_id)} <span className="text-muted-foreground">vs</span> {sideLabel(match.side_b_id)}
          </h1>
          {winnerId && (
            <p className="inline-flex items-center gap-2 text-lg font-semibold text-primary">
              <Trophy size={18} /> Winner: {sideLabel(winnerId)}
            </p>
          )}
          {result?.disputed && (
            <p className="mt-2 inline-block px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-xs uppercase tracking-wider font-semibold border border-destructive/40">
              Disputed
            </p>
          )}
        </div>

        <div className="glass-card overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-black/30">
              <tr>
                <th className="text-left px-4 py-3">Set</th>
                <th className="text-right px-4 py-3">{sideLabel(match.side_a_id)}</th>
                <th className="text-right px-4 py-3">{sideLabel(match.side_b_id)}</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3">{s.set_number}</td>
                  <td className={`px-4 py-3 text-right font-mono ${s.side_a_games > s.side_b_games ? "text-primary font-bold" : ""}`}>{s.side_a_games}</td>
                  <td className={`px-4 py-3 text-right font-mono ${s.side_b_games > s.side_a_games ? "text-primary font-bold" : ""}`}>{s.side_b_games}</td>
                </tr>
              ))}
              {scores.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No score recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="glass-card p-6 space-y-2 text-sm">
          <Row label="Submitted by" value={enteredBy?.display_name || "—"} />
          <Row label="Confirmed by" value={confirmedBy?.display_name || (result?.disputed ? "Disputed" : "Pending")} icon={confirmedBy ? <Check size={14} className="text-primary" /> : undefined} />
          <Row label="Completed" value={match.completed_at ? new Date(match.completed_at).toLocaleString() : "—"} icon={<Clock size={14} />} />
          <div className="pt-3">
            <Link to={`/app/matches/${match.id}`} className="text-primary text-sm hover:underline">
              Open match detail →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1.5 font-medium">{icon}{value}</span>
    </div>
  );
}
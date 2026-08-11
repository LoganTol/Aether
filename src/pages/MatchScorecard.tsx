import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trophy, Check, Clock } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer, Surface, StatusPill, SectionHeading, EmptyState } from "@/components/ui-system";
import { Loader2 } from "lucide-react";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <PageContainer width="narrow" className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" aria-label="Loading scorecard" />
        </PageContainer>
      </div>
    );
  }
  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <PageContainer width="narrow" className="py-16">
          <Surface level={1} padded={false}>
            <EmptyState title="Match not found" description="This match may have been deleted." />
          </Surface>
        </PageContainer>
      </div>
    );
  }

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
      <main>
        <PageContainer width="narrow" className="space-y-6 py-8">
        <button onClick={() => navigate(`/app/seasons/${match.season_id}`)} className="text-meta inline-flex items-center gap-2 transition-colors hover:text-foreground">
          <ArrowLeft size={14} aria-hidden /> Back to season
        </button>

        <Surface level={1} padded="lg">
          <div className="flex items-center gap-3">
            <span className="text-eyebrow">Round {match.round} · Scorecard</span>
            {result?.disputed && <StatusPill tone="danger">Disputed</StatusPill>}
          </div>
          <h1 className="text-page-title mt-3">
            {sideLabel(match.side_a_id)} <span className="text-[hsl(var(--text-muted))]">vs</span> {sideLabel(match.side_b_id)}
          </h1>
          {winnerId && (
            <p className="mt-4 inline-flex items-center gap-2 border-t border-border pt-4 text-sm font-semibold text-primary">
              <Trophy size={16} aria-hidden /> Winner: {sideLabel(winnerId)}
            </p>
          )}
        </Surface>

        <Surface level={1} padded={false} className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-eyebrow px-4 py-3 text-left">Set</th>
                <th className="text-eyebrow px-4 py-3 text-right">{sideLabel(match.side_a_id)}</th>
                <th className="text-eyebrow px-4 py-3 text-right">{sideLabel(match.side_b_id)}</th>
              </tr>
            </thead>
            <tbody className="nums divide-y divide-border">
              {scores.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-[hsl(var(--text-muted))]">{s.set_number}</td>
                  <td className={`px-4 py-3 text-right ${s.side_a_games > s.side_b_games ? "font-bold text-primary" : "text-foreground"}`}>{s.side_a_games}</td>
                  <td className={`px-4 py-3 text-right ${s.side_b_games > s.side_a_games ? "font-bold text-primary" : "text-foreground"}`}>{s.side_b_games}</td>
                </tr>
              ))}
              {scores.length === 0 && (
                <tr><td colSpan={3} className="text-meta px-4 py-8 text-center">No score recorded.</td></tr>
              )}
            </tbody>
          </table>
        </Surface>

        <Surface level={1}>
          <SectionHeading title="Audit trail" />
          <div className="space-y-2 text-sm">
          <Row label="Submitted by" value={enteredBy?.display_name || "—"} />
          <Row label="Confirmed by" value={confirmedBy?.display_name || (result?.disputed ? "Disputed" : "Pending")} icon={confirmedBy ? <Check size={14} className="text-primary" /> : undefined} />
          <Row label="Completed" value={match.completed_at ? new Date(match.completed_at).toLocaleString() : "—"} icon={<Clock size={14} />} />
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <Link to={`/app/matches/${match.id}`} className="text-sm font-semibold text-primary hover:underline">
              Open match detail →
            </Link>
          </div>
        </Surface>
        </PageContainer>
      </main>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-meta">{label}</span>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">{icon}{value}</span>
    </div>
  );
}
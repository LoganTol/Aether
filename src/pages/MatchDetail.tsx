import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Check, Trophy, Loader2, AlertTriangle, MapPin, Plus, Trash2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Season } from "@/components/season/types";
import { PageContainer, Surface, StatusPill, SectionHeading, EmptyState } from "@/components/ui-system";
import { deriveStatus } from "@/components/season/MatchStatusBadge";

interface Match {
  id: string;
  season_id: string;
  round: number;
  side_kind: "player" | "team";
  side_a_id: string;
  side_b_id: string;
  scheduled_at: string | null;
  deadline_at: string;
  status: string;
  scheduling_captain_id: string | null;
  location: string | null;
}
interface Participant { id: string; display_name: string; user_id: string | null }
interface Team { id: string; name: string; player_a_id: string; player_b_id: string }
interface ScoreRow { id: string; set_number: number; side_a_games: number; side_b_games: number }
interface Result { id: string; winner_side: "a" | "b"; entered_by: string | null; confirmed_by: string | null; disputed: boolean }

const statusTone = {
  pending: "neutral",
  proposed: "warning",
  scheduled: "active",
  completed: "success",
  forfeited: "neutral",
  disputed: "danger",
  overdue: "danger",
} as const;

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState<Season | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  const refresh = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    const { data: m } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
    if (!m) { setLoading(false); return; }
    setMatch(m as Match);
    const [s, p, t, sc, res] = await Promise.all([
      supabase.from("seasons").select("*").eq("id", m.season_id).maybeSingle(),
      supabase.from("season_participants").select("id,display_name,user_id").eq("season_id", m.season_id),
      supabase.from("doubles_teams").select("*").eq("season_id", m.season_id),
      supabase.from("match_scores").select("*").eq("match_id", matchId).order("set_number"),
      supabase.from("match_results").select("*").eq("match_id", matchId).maybeSingle(),
    ]);
    setSeason((s.data as Season) || null);
    setParticipants((p.data as Participant[]) || []);
    setTeams((t.data as Team[]) || []);
    setScores((sc.data as ScoreRow[]) || []);
    setResult((res.data as Result) || null);
    setLoading(false);
  }, [matchId]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <PageContainer width="narrow" className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" aria-label="Loading match" />
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

  const sideLabel = (id: string) => match.side_kind === "team"
    ? teams.find((t) => t.id === id)?.name || "Team"
    : participants.find((p) => p.id === id)?.display_name || "Player";

  const isCreator = user?.id === season?.creator_id;

  const myParticipant = participants.find((p) => p.user_id === user?.id);
  const myId = myParticipant?.id;
  const myTeam = teams.find((t) => t.player_a_id === myId || t.player_b_id === myId);
  const myInvolved =
    (match.side_kind === "player" && (myId === match.side_a_id || myId === match.side_b_id)) ||
    (match.side_kind === "team" && myTeam && (myTeam.id === match.side_a_id || myTeam.id === match.side_b_id));

  const canDelete = isCreator && (match.status === "pending" || match.status === "scheduled" || match.status === "proposed");

  const deleteMatch = async () => {
    if (!match || !isCreator) return;
    const confirmed = window.confirm("Delete this match? This cannot be undone.");
    if (!confirmed) return;
    setLoading(true);
    try {
      await supabase.from("match_scores").delete().eq("match_id", match.id);
      await supabase.from("match_results").delete().eq("match_id", match.id);
      await supabase.from("match_time_proposals").delete().eq("match_id", match.id);
      const { error } = await supabase.from("matches").delete().eq("id", match.id);
      if (error) throw error;
      toast({ title: "Match deleted" });
      navigate(`/app/seasons/${match.season_id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not delete match";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setLoading(false);
    }
  };

  const derived = deriveStatus(match.status, match.deadline_at);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main>
        <PageContainer width="narrow" className="space-y-6 py-8">
          <button
            onClick={() => navigate(`/app/seasons/${match.season_id}`)}
            className="text-meta inline-flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} aria-hidden /> Back to season
          </button>

          {/* Match header */}
          <Surface level={1} padded="lg">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-eyebrow">Round {match.round}</span>
                  <StatusPill tone={statusTone[derived]}>{derived}</StatusPill>
                </div>
                <h1 className="text-page-title mt-3">
                  {sideLabel(match.side_a_id)}{" "}
                  <span className="text-[hsl(var(--text-muted))]">vs</span>{" "}
                  {sideLabel(match.side_b_id)}
                </h1>
              </div>
              {canDelete && (
                <button onClick={deleteMatch} aria-label="Delete match" className="icon-btn shrink-0 hover:border-destructive/40 hover:text-destructive">
                  <Trash2 size={15} aria-hidden />
                </button>
              )}
            </div>

            {/* Scheduling details stay visible regardless of the primary action */}
            <dl className="text-meta mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4">
              <div className="inline-flex items-center gap-1.5">
                <Calendar size={13} aria-hidden />
                <span>Deadline {new Date(match.deadline_at).toLocaleDateString()}</span>
              </div>
              {match.scheduled_at && (
                <div className="inline-flex items-center gap-1.5 text-primary">
                  <Clock size={13} aria-hidden />
                  <span>{new Date(match.scheduled_at).toLocaleString()}</span>
                </div>
              )}
              {match.location && (
                <div className="inline-flex items-center gap-1.5">
                  <MapPin size={13} aria-hidden />
                  <span>{match.location}</span>
                </div>
              )}
            </dl>
          </Surface>

          {(match.status === "scheduled" || match.status === "pending" || match.status === "proposed") && (
            <ScoreEntrySection match={match} sideLabel={sideLabel} myParticipantId={myId} myInvolved={!!myInvolved} scores={scores} result={result} onChange={refresh} />
          )}

          {match.status === "completed" && (
            <BoxScore match={match} scores={scores} result={result} sideLabel={sideLabel} />
          )}
        </PageContainer>
      </main>
    </div>
  );
}

function BoxScore({ match, scores, result, sideLabel }: {
  match: Match; scores: ScoreRow[]; result: Result | null; sideLabel: (id: string) => string;
}) {
  const setsA = scores.filter((s) => s.side_a_games > s.side_b_games).length;
  const setsB = scores.filter((s) => s.side_b_games > s.side_a_games).length;
  const winnerA = result?.winner_side === "a";
  return (
    <Surface level={1}>
      <SectionHeading title="Final box score" />
      <div className="scrollbar-dark -mx-2 overflow-x-auto px-2">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="text-eyebrow pb-2 pr-3 text-left font-semibold">Side</th>
              {scores.map((s) => (
                <th key={s.id} className="text-eyebrow w-10 px-2 pb-2 text-center font-semibold">{s.set_number}</th>
              ))}
              <th className="text-eyebrow w-12 pb-2 pl-3 text-center font-semibold">Sets</th>
            </tr>
          </thead>
          <tbody className="nums">
            <tr className={winnerA ? "text-foreground" : "text-[hsl(var(--text-muted))]"}>
              <td className="border-t border-border py-3 pr-3">
                <span className="inline-flex items-center gap-2">
                  {winnerA && <Trophy size={13} className="text-primary" aria-label="Winner" />}
                  <span className="font-semibold">{sideLabel(match.side_a_id)}</span>
                </span>
              </td>
              {scores.map((s) => (
                <td key={s.id} className={`border-t border-border px-2 py-3 text-center ${s.side_a_games > s.side_b_games ? "font-bold text-primary" : ""}`}>
                  {s.side_a_games}
                </td>
              ))}
              <td className="border-t border-border py-3 pl-3 text-center font-bold">{setsA}</td>
            </tr>
            <tr className={!winnerA ? "text-foreground" : "text-[hsl(var(--text-muted))]"}>
              <td className="border-t border-border py-3 pr-3">
                <span className="inline-flex items-center gap-2">
                  {!winnerA && <Trophy size={13} className="text-primary" aria-label="Winner" />}
                  <span className="font-semibold">{sideLabel(match.side_b_id)}</span>
                </span>
              </td>
              {scores.map((s) => (
                <td key={s.id} className={`border-t border-border px-2 py-3 text-center ${s.side_b_games > s.side_a_games ? "font-bold text-primary" : ""}`}>
                  {s.side_b_games}
                </td>
              ))}
              <td className="border-t border-border py-3 pl-3 text-center font-bold">{setsB}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {result?.confirmed_by && !result.disputed && (
        <p className="text-meta mt-4 inline-flex items-center gap-1.5 font-semibold text-primary">
          <Check size={12} aria-hidden /> Confirmed by opponent
        </p>
      )}
      {result?.disputed && (
        <p className="text-meta mt-4 inline-flex items-center gap-1.5 font-semibold text-destructive">
          <AlertTriangle size={12} aria-hidden /> Disputed
        </p>
      )}
    </Surface>
  );
}

function ScoreEntrySection({ match, sideLabel, myParticipantId, myInvolved, scores, result, onChange }: {
  match: Match; sideLabel: (id: string) => string; myParticipantId?: string; myInvolved: boolean;
  scores: ScoreRow[]; result: Result | null; onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [sets, setSets] = useState<{ a: string; b: string }[]>(
    scores.length > 0
      ? scores.map((s) => ({ a: String(s.side_a_games), b: String(s.side_b_games) }))
      : [{ a: "", b: "" }, { a: "", b: "" }]
  );
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const valid = sets
      .map((s) => ({ a: parseInt(s.a), b: parseInt(s.b) }))
      .filter((s) => !isNaN(s.a) && !isNaN(s.b));
    if (valid.length === 0) {
      toast({ title: "Enter at least one set", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      // wipe & re-insert scores
      await supabase.from("match_scores").delete().eq("match_id", match.id);
      const { error: scoresErr } = await supabase.from("match_scores").insert(valid.map((v, i) => ({
        match_id: match.id, set_number: i + 1, side_a_games: v.a, side_b_games: v.b,
      })));
      if (scoresErr) throw scoresErr;
      const setsA = valid.filter((s) => s.a > s.b).length;
      const setsB = valid.filter((s) => s.b > s.a).length;
      const winner: "a" | "b" = setsA > setsB ? "a" : "b";
      const { error: resErr } = await supabase.from("match_results").upsert({
        match_id: match.id, winner_side: winner, entered_by: myParticipantId ?? null, disputed: false,
      }, { onConflict: "match_id" });
      if (resErr) throw resErr;
      const { error: matchErr } = await supabase.from("matches").update({
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", match.id);
      if (matchErr) throw matchErr;
      toast({ title: "Score recorded" });
      setOpen(false);
      onChange();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not save score";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    const isOpponent = myParticipantId && result.entered_by && myParticipantId !== result.entered_by && myInvolved;
    const awaitingConfirm = !result.confirmed_by && !result.disputed;

    const confirm = async () => {
      await supabase.from("match_results").update({
        confirmed_by: myParticipantId,
      }).eq("id", result.id);
      await supabase.from("matches").update({
        result_confirmed_at: new Date().toISOString(),
      }).eq("id", match.id);
      toast({ title: "Result confirmed" });
      onChange();
    };
    const dispute = async () => {
      await supabase.from("match_results").update({ disputed: true }).eq("id", result.id);
      toast({ title: "Result disputed", description: "A creator can resolve from the admin tab." });
      onChange();
    };

    return (
      <Surface level={1}>
        <SectionHeading title="Result entered" />
        <p className="text-ui-title">
          Winner:{" "}
          <span className="text-primary">
            {sideLabel(result.winner_side === "a" ? match.side_a_id : match.side_b_id)}
          </span>
        </p>
        {result.disputed && (
          <p className="text-body mt-3 inline-flex items-center gap-1.5 font-semibold text-destructive">
            <AlertTriangle size={14} aria-hidden /> Disputed — awaiting admin review
          </p>
        )}
        {result.confirmed_by && !result.disputed && (
          <p className="text-body mt-3 inline-flex items-center gap-1.5 font-semibold text-primary">
            <Check size={14} aria-hidden /> Confirmed by opponent
          </p>
        )}
        {isOpponent && awaitingConfirm && (
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={confirm} className="btn-primary">
              <Check size={14} aria-hidden /> Confirm result
            </button>
            <button onClick={dispute} className="btn-danger">
              <AlertTriangle size={14} aria-hidden /> Dispute
            </button>
          </div>
        )}
        {!isOpponent && awaitingConfirm && (
          <p className="text-meta mt-3">Waiting for opponent to confirm…</p>
        )}
      </Surface>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border surface-1 p-5 text-left transition-colors hover:border-primary/50"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
            <Plus size={18} aria-hidden />
          </span>
          <span>
            <span className="text-ui-title block">Add score</span>
            <span className="text-meta mt-0.5 block">Enter the final games for each set.</span>
          </span>
        </span>
        <Trophy size={16} aria-hidden className="text-[hsl(var(--text-muted))] transition-colors group-hover:text-primary" />
      </button>
    );
  }

  return (
    <Surface level={1}>
      <SectionHeading title="Box score" hint="Games won in each set" />
      <div className="mb-2 grid grid-cols-[1fr_auto_1fr] gap-3 text-meta">
        <span className="truncate">{sideLabel(match.side_a_id)}</span>
        <span />
        <span className="truncate text-right">{sideLabel(match.side_b_id)}</span>
      </div>
      <div className="mb-5 space-y-2">
        {sets.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <input
              type="number" min={0} max={20} inputMode="numeric"
              aria-label={`${sideLabel(match.side_a_id)} games in set ${i + 1}`}
              value={s.a}
              onChange={(e) => setSets((arr) => arr.map((r, idx) => idx === i ? { ...r, a: e.target.value } : r))}
              className="field nums text-center"
            />
            <span className="text-meta w-14 text-center">Set {i + 1}</span>
            <input
              type="number" min={0} max={20} inputMode="numeric"
              aria-label={`${sideLabel(match.side_b_id)} games in set ${i + 1}`}
              value={s.b}
              onChange={(e) => setSets((arr) => arr.map((r, idx) => idx === i ? { ...r, b: e.target.value } : r))}
              className="field nums text-center"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setSets((s) => [...s, { a: "", b: "" }])} className="btn-secondary">
          Add set
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost">
          Cancel
        </button>
        <button onClick={submit} disabled={busy} className="btn-primary ml-auto">
          {busy && <Loader2 className="animate-spin" size={14} aria-hidden />} Save score
        </button>
      </div>
    </Surface>
  );
}

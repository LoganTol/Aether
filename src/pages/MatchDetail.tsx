import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Check, Trophy, Loader2, AlertTriangle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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
}
interface Participant { id: string; display_name: string; user_id: string | null }
interface Team { id: string; name: string; player_a_id: string; player_b_id: string }
interface Proposal {
  id: string;
  match_id: string;
  proposed_by: string;
  slot_1: string; slot_2: string | null; slot_3: string | null;
  accepted_slot: string | null;
  expires_at: string;
}
interface ScoreRow { id: string; set_number: number; side_a_games: number; side_b_games: number }
interface Result { id: string; winner_side: "a" | "b"; entered_by: string | null; confirmed_by: string | null; disputed: boolean }

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  const refresh = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    const { data: m } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
    if (!m) { setLoading(false); return; }
    setMatch(m as Match);
    const [p, t, pr, sc, res] = await Promise.all([
      supabase.from("season_participants").select("id,display_name,user_id").eq("season_id", m.season_id),
      supabase.from("doubles_teams").select("*").eq("season_id", m.season_id),
      supabase.from("match_time_proposals").select("*").eq("match_id", matchId).order("created_at", { ascending: false }).limit(1),
      supabase.from("match_scores").select("*").eq("match_id", matchId).order("set_number"),
      supabase.from("match_results").select("*").eq("match_id", matchId).maybeSingle(),
    ]);
    setParticipants((p.data as Participant[]) || []);
    setTeams((t.data as Team[]) || []);
    setProposal((pr.data?.[0] as Proposal) || null);
    setScores((sc.data as ScoreRow[]) || []);
    setResult((res.data as Result) || null);
    setLoading(false);
  }, [matchId]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) return <div className="min-h-screen bg-background"><AppHeader /><div className="container py-20 text-center text-muted-foreground">Loading…</div></div>;
  if (!match) return <div className="min-h-screen bg-background"><AppHeader /><div className="container py-20 text-center">Match not found.</div></div>;

  const sideLabel = (id: string) => match.side_kind === "team"
    ? teams.find((t) => t.id === id)?.name || "Team"
    : participants.find((p) => p.id === id)?.display_name || "Player";

  const myParticipant = participants.find((p) => p.user_id === user?.id);
  const myId = myParticipant?.id;
  const myTeam = teams.find((t) => t.player_a_id === myId || t.player_b_id === myId);
  const myInvolved =
    (match.side_kind === "player" && (myId === match.side_a_id || myId === match.side_b_id)) ||
    (match.side_kind === "team" && myTeam && (myTeam.id === match.side_a_id || myTeam.id === match.side_b_id));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 max-w-2xl">
        <button onClick={() => navigate(`/app/seasons/${match.season_id}`)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft size={16} /> Back to season
        </button>

        <div className="glass-card p-6 mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Round {match.round}</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            {sideLabel(match.side_a_id)} <span className="text-muted-foreground">vs</span> {sideLabel(match.side_b_id)}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Calendar size={14} /> Deadline {new Date(match.deadline_at).toLocaleDateString()}</span>
            {match.scheduled_at && (
              <span className="inline-flex items-center gap-1 text-primary"><Clock size={14} /> {new Date(match.scheduled_at).toLocaleString()}</span>
            )}
            <span className="capitalize">{match.status}</span>
          </div>
        </div>

        {match.status !== "completed" && match.status !== "forfeited" && (
          <SchedulingSection
            match={match}
            proposal={proposal}
            myParticipantId={myId}
            myInvolved={!!myInvolved}
            onChange={refresh}
          />
        )}

        {match.status === "scheduled" && (
          <ScoreEntrySection match={match} sideLabel={sideLabel} myParticipantId={myId} myInvolved={!!myInvolved} scores={scores} result={result} onChange={refresh} />
        )}

        {match.status === "completed" && (
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="text-primary" />
              <h3 className="font-bold">Final</h3>
            </div>
            <p className="text-lg font-semibold mb-3">
              Winner: {sideLabel(result?.winner_side === "a" ? match.side_a_id : match.side_b_id)}
            </p>
            <div className="space-y-1 text-sm">
              {scores.map((s) => (
                <div key={s.id} className="flex justify-between border-b border-border py-1">
                  <span className="text-muted-foreground">Set {s.set_number}</span>
                  <span className="font-mono">{s.side_a_games} – {s.side_b_games}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SchedulingSection({ match, proposal, myParticipantId, myInvolved, onChange }: {
  match: Match; proposal: Proposal | null; myParticipantId?: string; myInvolved: boolean; onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [slots, setSlots] = useState<[string, string, string]>(["", "", ""]);

  const propose = async () => {
    if (!myParticipantId) return;
    const valid = slots.filter(Boolean);
    if (valid.length < 1) return;
    setBusy(true);
    const { error } = await supabase.from("match_time_proposals").insert({
      match_id: match.id,
      proposed_by: myParticipantId,
      slot_1: slots[0],
      slot_2: slots[1] || null,
      slot_3: slots[2] || null,
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    if (!error) {
      await supabase.from("matches").update({ status: "proposed" }).eq("id", match.id);
      toast({ title: "Times proposed" });
      onChange();
    } else toast({ title: "Error", description: error.message, variant: "destructive" });
    setBusy(false);
  };

  const accept = async (slot: string) => {
    if (!proposal) return;
    setBusy(true);
    await supabase.from("match_time_proposals").update({ accepted_slot: slot, responded_at: new Date().toISOString() }).eq("id", proposal.id);
    await supabase.from("matches").update({
      status: "scheduled",
      scheduled_at: slot,
      scheduled_by: proposal.proposed_by,
    }).eq("id", match.id);
    toast({ title: "Match scheduled" });
    setBusy(false);
    onChange();
  };

  if (proposal && !proposal.accepted_slot) {
    const proposedByMe = proposal.proposed_by === myParticipantId;
    return (
      <div className="glass-card p-6 mb-4">
        <h3 className="font-bold mb-3">Proposed times</h3>
        <div className="space-y-2">
          {[proposal.slot_1, proposal.slot_2, proposal.slot_3].filter(Boolean).map((s) => (
            <div key={s!} className="flex items-center justify-between p-3 rounded-xl border border-border">
              <span>{new Date(s!).toLocaleString()}</span>
              {!proposedByMe && myInvolved ? (
                <button onClick={() => accept(s!)} disabled={busy} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                  <Check size={14} /> Pick this
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">{proposedByMe ? "Waiting for opponent" : "View only"}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 mb-4">
      <h3 className="font-bold mb-2">Propose up to 3 times</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {myInvolved ? "Pick 1–3 options. Your opponent will one-tap to confirm." : "Only players in this match (or the captain) can propose times."}
      </p>
      <div className="space-y-2 mb-4">
        {[0, 1, 2].map((i) => (
          <input
            key={i}
            type="datetime-local"
            value={slots[i]}
            onChange={(e) => setSlots(([a, b, c]) => {
              const v: [string, string, string] = [a, b, c];
              v[i] = e.target.value;
              return v;
            })}
            className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
          />
        ))}
      </div>
      <button
        onClick={propose}
        disabled={busy || !myInvolved || !slots[0]}
        className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold glow-shadow disabled:opacity-50 flex items-center gap-2"
      >
        {busy && <Loader2 className="animate-spin" size={14} />} Send proposal
      </button>
    </div>
  );
}

function ScoreEntrySection({ match, sideLabel, myParticipantId, myInvolved, scores, result, onChange }: {
  match: Match; sideLabel: (id: string) => string; myParticipantId?: string; myInvolved: boolean;
  scores: ScoreRow[]; result: Result | null; onChange: () => void;
}) {
  const [sets, setSets] = useState<{ a: string; b: string }[]>(
    scores.length > 0
      ? scores.map((s) => ({ a: String(s.side_a_games), b: String(s.side_b_games) }))
      : [{ a: "", b: "" }, { a: "", b: "" }]
  );
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!myParticipantId) return;
    const valid = sets
      .map((s) => ({ a: parseInt(s.a), b: parseInt(s.b) }))
      .filter((s) => !isNaN(s.a) && !isNaN(s.b));
    if (valid.length === 0) return;
    setBusy(true);
    try {
      // wipe & re-insert scores
      await supabase.from("match_scores").delete().eq("match_id", match.id);
      await supabase.from("match_scores").insert(valid.map((v, i) => ({
        match_id: match.id, set_number: i + 1, side_a_games: v.a, side_b_games: v.b,
      })));
      const setsA = valid.filter((s) => s.a > s.b).length;
      const setsB = valid.filter((s) => s.b > s.a).length;
      const winner: "a" | "b" = setsA > setsB ? "a" : "b";
      await supabase.from("match_results").upsert({
        match_id: match.id, winner_side: winner, entered_by: myParticipantId, disputed: false,
      }, { onConflict: "match_id" });
      await supabase.from("matches").update({
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", match.id);
      toast({ title: "Score recorded" });
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
      <div className="glass-card p-6">
        <h3 className="font-bold mb-2 inline-flex items-center gap-2"><Trophy className="text-primary" size={18} /> Result entered</h3>
        <p className="text-muted-foreground text-sm">Winner: {sideLabel(result.winner_side === "a" ? match.side_a_id : match.side_b_id)}</p>
        {result.disputed && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-destructive text-sm font-semibold">
            <AlertTriangle size={14} /> Disputed — awaiting admin review
          </p>
        )}
        {result.confirmed_by && !result.disputed && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-primary text-sm font-semibold">
            <Check size={14} /> Confirmed by opponent
          </p>
        )}
        {isOpponent && awaitingConfirm && (
          <div className="mt-4 flex gap-2">
            <button onClick={confirm} className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-1.5">
              <Check size={14} /> Confirm result
            </button>
            <button onClick={dispute} className="px-4 py-2 rounded-full border border-destructive/40 text-destructive font-semibold text-sm inline-flex items-center gap-1.5">
              <AlertTriangle size={14} /> Dispute
            </button>
          </div>
        )}
        {!isOpponent && awaitingConfirm && (
          <p className="text-xs text-muted-foreground mt-3">Waiting for opponent to confirm…</p>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="font-bold mb-3">Enter score</h3>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 mb-2 text-xs text-muted-foreground">
        <span>{sideLabel(match.side_a_id)}</span>
        <span></span>
        <span className="text-right">{sideLabel(match.side_b_id)}</span>
      </div>
      <div className="space-y-2 mb-4">
        {sets.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <input
              type="number" min={0} max={20}
              value={s.a}
              onChange={(e) => setSets((arr) => arr.map((r, idx) => idx === i ? { ...r, a: e.target.value } : r))}
              className="px-3 py-2 rounded-lg bg-black/30 border border-border focus:border-primary outline-none text-center font-mono"
            />
            <span className="text-muted-foreground text-sm">Set {i + 1}</span>
            <input
              type="number" min={0} max={20}
              value={s.b}
              onChange={(e) => setSets((arr) => arr.map((r, idx) => idx === i ? { ...r, b: e.target.value } : r))}
              className="px-3 py-2 rounded-lg bg-black/30 border border-border focus:border-primary outline-none text-center font-mono"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setSets((s) => [...s, { a: "", b: "" }])} className="px-3 py-2 rounded-lg border border-border text-sm hover:border-primary/50">
          + Add set
        </button>
        <button
          onClick={submit}
          disabled={busy || !myInvolved}
          className="ml-auto px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          {busy && <Loader2 className="animate-spin" size={14} />} Save score
        </button>
      </div>
    </div>
  );
}
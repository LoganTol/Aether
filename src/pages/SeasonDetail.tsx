import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Trophy, Users, Crown, Copy, Settings, Loader2, AlertCircle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Season {
  id: string;
  name: string;
  format: "singles" | "doubles";
  status: string;
  start_date: string;
  end_date: string;
  creator_id: string;
}
interface Participant {
  id: string;
  display_name: string;
  invited_email: string | null;
  user_id: string | null;
  status: string;
  join_token: string | null;
}
interface Team {
  id: string;
  name: string;
  player_a_id: string;
  player_b_id: string;
}
interface Match {
  id: string;
  round: number;
  side_kind: "player" | "team";
  side_a_id: string;
  side_b_id: string;
  scheduled_at: string | null;
  deadline_at: string;
  status: string;
  scheduling_captain_id: string | null;
}
interface CaptainSlot {
  id: string;
  participant_id: string;
  position: number;
  is_current: boolean;
  window_start: string | null;
  window_end: string | null;
}
interface StandingRow {
  side_id: string;
  side_kind: string;
  wins: number;
  losses: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
}

type Tab = "schedule" | "standings" | "members" | "admin";

export default function SeasonDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("schedule");
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState<Season | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [rotation, setRotation] = useState<CaptainSlot[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [s, p, t, m, r, st] = await Promise.all([
      supabase.from("seasons").select("*").eq("id", id).maybeSingle(),
      supabase.from("season_participants").select("*").eq("season_id", id),
      supabase.from("doubles_teams").select("*").eq("season_id", id),
      supabase.from("matches").select("*").eq("season_id", id).order("round").order("created_at"),
      supabase.from("captain_rotation").select("*").eq("season_id", id).order("position"),
      supabase.from("standings").select("*").eq("season_id", id),
    ]);
    if (s.data) setSeason(s.data as Season);
    setParticipants((p.data as Participant[]) || []);
    setTeams((t.data as Team[]) || []);
    setMatches((m.data as Match[]) || []);
    setRotation((r.data as CaptainSlot[]) || []);
    setStandings((st.data as StandingRow[]) || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-20 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!season) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-20 text-center">
          <AlertCircle className="mx-auto mb-4 text-muted-foreground" />
          <p>Season not found.</p>
        </div>
      </div>
    );
  }

  const isCreator = user?.id === season.creator_id;
  const myParticipant = participants.find((p) => p.user_id === user?.id);
  const currentCaptain = rotation.find((r) => r.is_current);
  const currentCaptainPid = currentCaptain?.participant_id;
  const iAmCaptain = currentCaptainPid && currentCaptainPid === myParticipant?.id;

  const sideLabel = (kind: string, sideId: string): string => {
    if (kind === "team") return teams.find((t) => t.id === sideId)?.name || "Team";
    return participants.find((p) => p.id === sideId)?.display_name || "Player";
  };

  const pendingMatches = matches.filter((m) => ["pending", "proposed"].includes(m.status));
  const upcomingMatches = matches.filter((m) => m.status === "scheduled").sort((a, b) =>
    (a.scheduled_at || "").localeCompare(b.scheduled_at || "")
  );
  const completedMatches = matches.filter((m) => ["completed", "forfeited"].includes(m.status));

  const copyInvite = (token: string | null) => {
    if (!token) return;
    const url = `${window.location.origin}/join/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Invite link copied" });
  };

  const advanceCaptain = async () => {
    if (!season || !isCreator) return;
    const { error } = await supabase.functions.invoke("rotate-captain", { body: { season_id: season.id } });
    if (error) toast({ title: "Could not rotate", description: error.message, variant: "destructive" });
    else { toast({ title: "Captain rotated" }); refresh(); }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <button onClick={() => navigate("/app")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft size={16} /> All seasons
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{season.name}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 capitalize"><Users size={14} /> {season.format}</span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={14} /> {new Date(season.start_date).toLocaleDateString()} – {new Date(season.end_date).toLocaleDateString()}
              </span>
              <span className={`uppercase tracking-wider text-xs px-2 py-0.5 rounded-full ${
                season.status === "active" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>{season.status}</span>
            </div>
          </div>
        </div>

        {/* Captain banner */}
        {currentCaptain && (
          <div className={`glass-card p-5 md:p-6 mb-6 border ${iAmCaptain ? "border-primary/50 glow-shadow" : "border-border"}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <Crown className="text-primary" size={22} />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Scheduling Captain</p>
                <p className="text-lg font-bold">
                  {iAmCaptain ? "You're the captain this window" : participants.find((p) => p.id === currentCaptainPid)?.display_name}
                </p>
                {currentCaptain.window_end && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Window ends {new Date(currentCaptain.window_end).toLocaleDateString()} ·{" "}
                    {pendingMatches.length} match{pendingMatches.length === 1 ? "" : "es"} need a time
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
          {(["schedule", "standings", "members", ...(isCreator ? ["admin" as Tab] : [])] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "admin" ? <span className="inline-flex items-center gap-1.5"><Settings size={14} /> Admin</span> : t}
            </button>
          ))}
        </div>

        {tab === "schedule" && (
          <div className="space-y-6">
            {upcomingMatches.length > 0 && (
              <div>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Upcoming</h3>
                <div className="space-y-2">
                  {upcomingMatches.map((m) => (
                    <MatchRow key={m.id} m={m} sideLabel={sideLabel} />
                  ))}
                </div>
              </div>
            )}
            {pendingMatches.length > 0 && (
              <div>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Needs scheduling</h3>
                <div className="space-y-2">
                  {pendingMatches.map((m) => (
                    <MatchRow key={m.id} m={m} sideLabel={sideLabel} />
                  ))}
                </div>
              </div>
            )}
            {completedMatches.length > 0 && (
              <div>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Played</h3>
                <div className="space-y-2">
                  {completedMatches.map((m) => (
                    <MatchRow key={m.id} m={m} sideLabel={sideLabel} />
                  ))}
                </div>
              </div>
            )}
            {matches.length === 0 && (
              <p className="text-muted-foreground">No matches yet.</p>
            )}
          </div>
        )}

        {tab === "standings" && (
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
                {sortStandings(standings, season.format).map((s, i) => (
                  <tr key={s.side_id} className="border-t border-border">
                    <td className="px-4 py-3 font-bold">{i + 1}</td>
                    <td className="px-4 py-3">{sideLabel(s.side_kind, s.side_id)}</td>
                    <td className="px-2 py-3 text-right text-primary font-semibold">{s.wins}</td>
                    <td className="px-2 py-3 text-right">{s.losses}</td>
                    <td className="px-2 py-3 text-right hidden sm:table-cell">{s.sets_won}-{s.sets_lost}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">{s.games_won}-{s.games_lost}</td>
                  </tr>
                ))}
                {standings.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No matches played yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "members" && (
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.id} className="glass-card p-4 flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.invited_email || "no email"} ·{" "}
                    <span className={p.status === "active" ? "text-primary" : ""}>{p.status}</span>
                  </p>
                </div>
                {p.status === "invited" && isCreator && p.join_token && (
                  <button
                    onClick={() => copyInvite(p.join_token)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:border-primary/50"
                  >
                    <Copy size={12} /> Copy invite link
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "admin" && isCreator && (
          <div className="space-y-4">
            <div className="glass-card p-6">
              <h3 className="font-bold mb-2">Rotate captain</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manually advance the scheduling captain to the next person in rotation.
              </p>
              <button
                onClick={advanceCaptain}
                className="px-4 py-2 rounded-xl border border-border hover:border-primary/50 text-sm"
              >
                Advance captain
              </button>
            </div>
            <div className="glass-card p-6">
              <h3 className="font-bold mb-2">Captain rotation order</h3>
              <ol className="text-sm space-y-1">
                {rotation.map((r) => {
                  const p = participants.find((x) => x.id === r.participant_id);
                  return (
                    <li key={r.id} className={r.is_current ? "text-primary font-semibold" : "text-muted-foreground"}>
                      {r.position + 1}. {p?.display_name || "—"} {r.is_current && "← current"}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MatchRow({ m, sideLabel }: { m: Match; sideLabel: (k: string, id: string) => string }) {
  return (
    <Link
      to={`/app/matches/${m.id}`}
      className="glass-card p-4 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
    >
      <div className="flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Round {m.round}</p>
        <p className="font-medium">
          {sideLabel(m.side_kind, m.side_a_id)} <span className="text-muted-foreground">vs</span> {sideLabel(m.side_kind, m.side_b_id)}
        </p>
      </div>
      <div className="text-right text-xs">
        {m.status === "scheduled" && m.scheduled_at ? (
          <span className="text-primary font-semibold">{new Date(m.scheduled_at).toLocaleString()}</span>
        ) : m.status === "completed" ? (
          <span className="text-muted-foreground">Played</span>
        ) : m.status === "forfeited" ? (
          <span className="text-muted-foreground">Forfeit</span>
        ) : (
          <span className="text-muted-foreground">Due {new Date(m.deadline_at).toLocaleDateString()}</span>
        )}
      </div>
    </Link>
  );
}

function sortStandings(rows: StandingRow[], _format: string): StandingRow[] {
  return [...rows].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const sa = a.sets_won - a.sets_lost;
    const sb = b.sets_won - b.sets_lost;
    if (sb !== sa) return sb - sa;
    const ga = a.games_won - a.games_lost;
    const gb = b.games_won - b.games_lost;
    return gb - ga;
  });
}
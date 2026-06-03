import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Users, Copy, Settings, AlertCircle, LayoutDashboard, CalendarDays, Trophy, History, UserCircle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import OverviewTab from "@/components/season/OverviewTab";
import ScheduleTab from "@/components/season/ScheduleTab";
import StandingsTab from "@/components/season/StandingsTab";
import MatchHistoryTab from "@/components/season/MatchHistoryTab";
import type { Season, Participant, Team, Match, CaptainSlot, StandingRow } from "@/components/season/types";

type Tab = "overview" | "schedule" | "standings" | "history" | "members" | "admin";

export default function SeasonDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
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
      supabase.from("season_standings" as never).select("*").eq("season_id", id),
    ]);
    if (s.data) setSeason(s.data as Season);
    setParticipants((p.data as Participant[]) || []);
    setTeams((t.data as Team[]) || []);
    setMatches((m.data as Match[]) || []);
    setRotation((r.data as CaptainSlot[]) || []);
    setStandings(((st.data as StandingRow[] | null) || []));
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

  const sideLabel = (kind: string, sideId: string): string => {
    if (kind === "team") return teams.find((t) => t.id === sideId)?.name || "Team";
    return participants.find((p) => p.id === sideId)?.display_name || "Player";
  };

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

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "schedule", label: "Schedule", icon: CalendarDays },
    { id: "standings", label: "Standings", icon: Trophy },
    { id: "history", label: "History", icon: History },
    { id: "members", label: "Members", icon: UserCircle },
    ...(isCreator ? [{ id: "admin" as Tab, label: "Admin", icon: Settings }] : []),
  ];

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

        {/* Tabs */}
        <div className="mb-6 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="glass-card p-1.5 flex gap-1 overflow-x-auto hide-scrollbar snap-x">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`snap-start shrink-0 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground glow-shadow"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "overview" && (
          <OverviewTab
            season={season}
            participants={participants}
            teams={teams}
            matches={matches}
            rotation={rotation}
            myParticipantId={myParticipant?.id}
            isCreator={isCreator}
            sideLabel={sideLabel}
            onGoToSchedule={() => setTab("schedule")}
            onChange={refresh}
          />
        )}
        {tab === "schedule" && <ScheduleTab matches={matches} sideLabel={sideLabel} />}
        {tab === "standings" && <StandingsTab season={season} standings={standings} sideLabel={sideLabel} />}
        {tab === "history" && <MatchHistoryTab matches={matches} sideLabel={sideLabel} />}

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
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Users, Copy, Settings, AlertCircle, LayoutDashboard, CalendarDays, Trophy, History, UserCircle, UserPlus, Loader2, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

  const removeParticipant = async (p: { id: string; display_name: string; status: string }) => {
    if (!isCreator) return;
    const confirmed = window.confirm(`Remove ${p.display_name} from this season?`);
    if (!confirmed) return;
    const { error } = p.status === "invited"
      ? await supabase.from("season_participants").delete().eq("id", p.id)
      : await supabase.from("season_participants").update({ status: "withdrawn" }).eq("id", p.id);
    if (error) {
      toast({ title: "Could not remove member", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: p.status === "invited" ? "Invite removed" : "Member withdrawn" });
    refresh();
  };

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "schedule", label: "Schedule", icon: CalendarDays },
    { id: "standings", label: "Standings", icon: Trophy },
    { id: "history", label: "History", icon: History },
    { id: "members", label: "Members", icon: UserCircle },
    ...(isCreator ? [{ id: "admin" as Tab, label: "Admin", icon: Settings }] : []),
  ];

  const selectTab = (id: Tab) => {
    setTab(id);
    const el = tabRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
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

        {/* Tabs */}
        <div className="mb-6 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="glass-card p-1.5 flex gap-1 overflow-x-auto hide-scrollbar">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => { tabRefs.current[t.id] = el; }}
                  onClick={() => selectTab(t.id)}
                  className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors ${
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
          <div className="space-y-3">
            {isCreator && (
              <div className="flex justify-end">
                <AddMemberDialog seasonId={season.id} onAdded={refresh} />
              </div>
            )}
            {participants.length === 0 && (
              <div className="glass-card p-8 text-center">
                <p className="font-semibold">No members yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isCreator ? "Use Add member to invite players." : "The creator hasn't invited anyone yet."}
                </p>
              </div>
            )}
            {participants.map((p) => (
              <div key={p.id} className="glass-card p-4 flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.invited_email || "no email"} ·{" "}
                    <span className={p.status === "active" ? "text-primary" : ""}>{p.status}</span>
                  </p>
                </div>
                {isCreator && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.status === "invited" && p.join_token && (
                      <button
                        onClick={() => copyInvite(p.join_token)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:border-primary/50"
                      >
                        <Copy size={12} /> Copy invite
                      </button>
                    )}
                    {p.status !== "withdrawn" && (
                      <button
                        onClick={() => removeParticipant(p)}
                        aria-label="Remove member"
                        className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
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

function AddMemberDialog({ seasonId, onAdded }: { seasonId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<{ name: string; email: string }[]>([
    { name: "", email: "" },
    { name: "", email: "" },
  ]);
  const [busy, setBusy] = useState(false);

  const updateRow = (idx: number, patch: Partial<{ name: string; email: string }>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { name: "", email: "" }]);
  const removeRow = (idx: number) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((_, i) => i !== idx) : rs));

  const submit = async () => {
    const cleaned = rows
      .map((r) => ({ name: r.name.trim(), email: r.email.trim() }))
      .filter((r) => r.name);
    if (cleaned.length === 0) {
      toast({ title: "Add at least one name", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("season_participants")
      .insert(
        cleaned.map((r) => ({
          season_id: seasonId,
          display_name: r.name,
          invited_email: r.email || null,
          user_id: null,
          status: "invited" as const,
          joined_at: null,
        }))
      )
      .select("display_name,join_token");
    setBusy(false);
    if (error) {
      toast({ title: "Could not add members", description: error.message, variant: "destructive" });
      return;
    }
    if (data?.length === 1 && data[0].join_token) {
      const url = `${window.location.origin}/join/${data[0].join_token}`;
      navigator.clipboard.writeText(url).catch(() => {});
      toast({ title: "Member added", description: "Invite link copied to clipboard." });
    } else if (data?.length) {
      toast({ title: `Added ${data.length} members`, description: "Copy each invite link from the list." });
    }
    setRows([{ name: "", email: "" }, { name: "", email: "" }]);
    setOpen(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold glow-shadow">
          <UserPlus size={14} /> Add member
        </button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle>Add members</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs uppercase tracking-wider text-muted-foreground px-1">
            <span>Display name</span>
            <span>Email (optional)</span>
            <span className="sr-only">Remove</span>
          </div>
          <div className="space-y-2 max-h-[40vh] overflow-y-auto scrollbar-dark pr-1">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <input
                  type="text"
                  value={r.name}
                  onChange={(e) => updateRow(i, { name: e.target.value })}
                  placeholder="Alex Rivera"
                  className="px-3 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
                />
                <input
                  type="email"
                  value={r.email}
                  onChange={(e) => updateRow(i, { email: e.target.value })}
                  placeholder="player@example.com"
                  className="px-3 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
                />
                <button
                  onClick={() => removeRow(i)}
                  disabled={rows.length === 1}
                  aria-label="Remove row"
                  className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 disabled:opacity-30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/50"
          >
            <Plus size={12} /> Add another
          </button>
          <p className="text-xs text-muted-foreground">
            An invite link is generated for each member — copy it from the members list.
          </p>
          <button
            onClick={submit}
            disabled={busy}
            className="w-full mt-1 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold glow-shadow disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="animate-spin" size={14} />} Save members
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
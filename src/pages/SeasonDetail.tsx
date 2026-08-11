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
import { PageContainer, Surface, StatusPill, SectionHeading, EmptyState } from "@/components/ui-system";

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
        <PageContainer width="wide" className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" aria-label="Loading season" />
        </PageContainer>
      </div>
    );
  }
  if (!season) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <PageContainer width="wide" className="py-16">
          <Surface level={1} padded={false}>
            <EmptyState
              icon={<AlertCircle size={16} aria-hidden />}
              title="Season not found"
              description="This season may have been deleted, or you no longer have access to it."
            />
          </Surface>
        </PageContainer>
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
      <main>
        <PageContainer width="wide" className="py-8">
        <button onClick={() => navigate("/app")} className="text-meta mb-5 inline-flex items-center gap-2 transition-colors hover:text-foreground">
          <ArrowLeft size={14} aria-hidden /> All seasons
        </button>

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="min-w-0">
            <h1 className="text-page-title">{season.name}</h1>
            <div className="text-meta mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-1.5 capitalize"><Users size={13} aria-hidden /> {season.format}</span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} aria-hidden /> {new Date(season.start_date).toLocaleDateString()} – {new Date(season.end_date).toLocaleDateString()}
              </span>
              <StatusPill tone={season.status === "active" ? "active" : "neutral"}>{season.status}</StatusPill>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="-mx-4 mb-6 px-4 md:mx-0 md:px-0">
          <div className="flex gap-1 overflow-x-auto border-b border-border hide-scrollbar" role="tablist">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => { tabRefs.current[t.id] = el; }}
                  onClick={() => selectTab(t.id)}
                  role="tab"
                  aria-selected={active}
                  className={`-mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-[hsl(var(--text-muted))] hover:text-foreground"
                  }`}
                >
                  <Icon size={14} aria-hidden /> {t.label}
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
        {tab === "schedule" && (
          <ScheduleTab
            matches={matches}
            sideLabel={sideLabel}
            isCreator={isCreator}
            onDelete={async (matchId) => {
              if (!isCreator) return;
              const confirmed = window.confirm("Delete this match? This cannot be undone.");
              if (!confirmed) return;
              try {
                await supabase.from("match_scores").delete().eq("match_id", matchId);
                await supabase.from("match_results").delete().eq("match_id", matchId);
                await supabase.from("match_time_proposals").delete().eq("match_id", matchId);
                const { error } = await supabase.from("matches").delete().eq("id", matchId);
                if (error) throw error;
                toast({ title: "Match deleted" });
                refresh();
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : "Could not delete match";
                toast({ title: "Error", description: msg, variant: "destructive" });
              }
            }}
          />
        )}
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
              <Surface level={1} padded={false}>
                <EmptyState
                  title="No members yet"
                  description={isCreator ? "Use Add member to invite players." : "The creator hasn't invited anyone yet."}
                />
              </Surface>
            )}
            {participants.length > 0 && (
            <Surface level={1} padded={false} className="divide-y divide-border overflow-hidden">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-ui-title truncate">{p.display_name}</p>
                  <p className="text-meta mt-0.5 truncate">
                    {p.invited_email || "no email"} ·{" "}
                    <span className={p.status === "active" ? "text-primary" : ""}>{p.status}</span>
                  </p>
                </div>
                {isCreator && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.status === "invited" && p.join_token && (
                      <button
                        onClick={() => copyInvite(p.join_token)}
                        className="btn-secondary px-3 py-1.5 text-xs"
                      >
                        <Copy size={12} aria-hidden /> Copy invite
                      </button>
                    )}
                    {p.status !== "withdrawn" && (
                      <button
                        onClick={() => removeParticipant(p)}
                        aria-label="Remove member"
                        className="icon-btn h-8 w-8 hover:border-destructive/40 hover:text-destructive"
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            </Surface>
            )}
          </div>
        )}

        {tab === "admin" && isCreator && (
          <div className="space-y-4">
            <Surface level={1}>
              <SectionHeading title="Rotate captain" hint="Commissioner override" />
              <p className="text-body mb-4">
                Manually advance the scheduling captain to the next person in rotation.
              </p>
              <button onClick={advanceCaptain} className="btn-secondary">
                Advance captain
              </button>
            </Surface>
            <Surface level={1}>
              <SectionHeading title="Captain rotation order" />
              <ol className="divide-y divide-border text-sm">
                {rotation.map((r) => {
                  const p = participants.find((x) => x.id === r.participant_id);
                  return (
                    <li key={r.id} className={`flex items-center justify-between gap-3 py-2.5 ${r.is_current ? "font-semibold text-primary" : "text-[hsl(var(--text-muted))]"}`}>
                      <span className="nums truncate">{r.position + 1}. {p?.display_name || "—"}</span>
                      {r.is_current && <StatusPill tone="active">Current</StatusPill>}
                    </li>
                  );
                })}
              </ol>
            </Surface>
          </div>
        )}
        </PageContainer>
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
        <button className="btn-primary">
          <UserPlus size={14} aria-hidden /> Add member
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg border-border surface-elevated">
        <DialogHeader>
          <DialogTitle>Add members</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-eyebrow grid grid-cols-[1fr_1fr_auto] gap-2 px-1">
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
                  className="field"
                />
                <input
                  type="email"
                  value={r.email}
                  onChange={(e) => updateRow(i, { email: e.target.value })}
                  placeholder="player@example.com"
                  className="field"
                />
                <button
                  onClick={() => removeRow(i)}
                  disabled={rows.length === 1}
                  aria-label="Remove row"
                  className="icon-btn hover:border-destructive/40 hover:text-destructive disabled:opacity-30"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addRow}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            <Plus size={12} aria-hidden /> Add another
          </button>
          <p className="text-meta">
            An invite link is generated for each member — copy it from the members list.
          </p>
          <button
            onClick={submit}
            disabled={busy}
            className="btn-primary mt-1 w-full"
          >
            {busy && <Loader2 className="animate-spin" size={14} aria-hidden />} Save members
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
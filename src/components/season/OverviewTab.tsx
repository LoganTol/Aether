import { Link } from "react-router-dom";
import { useState } from "react";
import { Crown, Calendar, ArrowRight, Clock, Plus, Loader2, UserPlus, CalendarCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Season, Participant, Team, Match, CaptainSlot, SideLabel } from "./types";

interface Props {
  season: Season;
  participants: Participant[];
  teams: Team[];
  matches: Match[];
  rotation: CaptainSlot[];
  myParticipantId?: string;
  isCreator: boolean;
  sideLabel: SideLabel;
  onGoToSchedule: () => void;
  onChange: () => void;
}

export default function OverviewTab({ season, participants, teams, matches, rotation, myParticipantId, isCreator, sideLabel, onGoToSchedule, onChange }: Props) {
  const total = matches.length;
  const completed = matches.filter((m) => m.status === "completed" || m.status === "forfeited").length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const current = rotation.find((r) => r.is_current);
  const captain = participants.find((p) => p.id === current?.participant_id);
  const iAmCaptain = !!current && current.participant_id === myParticipantId;

  const needsScheduling = matches.filter((m) => m.status === "pending" || m.status === "proposed").length;
  const upcoming = matches
    .filter((m) => m.status === "scheduled" || m.status === "pending" || m.status === "proposed")
    .sort((a, b) => {
      const ad = a.scheduled_at || a.deadline_at;
      const bd = b.scheduled_at || b.deadline_at;
      return ad.localeCompare(bd);
    })
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      {isCreator && (
        <div className="flex flex-wrap items-center gap-2">
          <CreateMatchDialog
            season={season}
            participants={participants}
            teams={teams}
            matches={matches}
            captainParticipantId={current?.participant_id || null}
            onCreated={onChange}
          />
        </div>
      )}

      {/* Hero */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <Stat label="Players" value={participants.filter((p) => p.status !== "withdrawn").length} />
          <Stat label="Matches" value={total} />
          <Stat label="Completed" value={completed} />
          <Stat label="Captain" value={captain?.display_name?.split(" ")[0] || "—"} />
        </div>
        <div className="flex items-center justify-between mb-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span>Season Progress</span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {/* Action Required */}
      <div className={`glass-card p-6 border ${iAmCaptain ? "border-primary/50 glow-shadow" : "border-border"}`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <Crown className="text-primary" size={22} />
          </div>
          <div className="flex-1 min-w-0">
            {iAmCaptain ? (
              <>
                <p className="text-xs uppercase tracking-wider text-primary font-semibold">You are Scheduling Captain</p>
                <h3 className="text-xl font-bold mt-1">
                  {needsScheduling} {needsScheduling === 1 ? "match needs" : "matches need"} scheduling
                </h3>
                {current?.window_end && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Captain window ends {new Date(current.window_end).toLocaleDateString()}
                  </p>
                )}
                <button
                  onClick={onGoToSchedule}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm glow-shadow"
                >
                  Schedule matches <ArrowRight size={14} />
                </button>
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Current Captain</p>
                <h3 className="text-xl font-bold mt-1">{captain?.display_name || "Not assigned"}</h3>
                {current?.window_end && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Captain window ends {new Date(current.window_end).toLocaleDateString()}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Upcoming matches</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming matches.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((m) => (
              <Link
                key={m.id}
                to={`/app/matches/${m.id}`}
                className="glass-card p-4 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {sideLabel(m.side_kind, m.side_a_id)} <span className="text-muted-foreground">vs</span> {sideLabel(m.side_kind, m.side_b_id)}
                  </p>
                  <p className="text-xs text-muted-foreground">Round {m.round}</p>
                </div>
                <div className="text-right text-xs shrink-0">
                  {m.scheduled_at ? (
                    <span className="text-primary font-semibold inline-flex items-center gap-1">
                      <Clock size={12} /> {new Date(m.scheduled_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground inline-flex items-center gap-1">
                      <Calendar size={12} /> Waiting to be scheduled
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function CreateMatchDialog({
  season,
  participants,
  teams,
  matches,
  captainParticipantId,
  onCreated,
}: {
  season: Season;
  participants: Participant[];
  teams: Team[];
  matches: Match[];
  captainParticipantId: string | null;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [sideA, setSideA] = useState("");
  const [sideB, setSideB] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [busy, setBusy] = useState(false);

  const sides: { id: string; label: string }[] =
    season.format === "doubles"
      ? teams.map((t) => ({ id: t.id, label: t.name }))
      : participants.filter((p) => p.status !== "withdrawn").map((p) => ({ id: p.id, label: p.display_name }));

  const create = async () => {
    if (!sideA || !sideB || sideA === sideB) {
      toast({ title: "Pick two different sides", variant: "destructive" });
      return;
    }
    const scheduledIso = scheduledAt ? new Date(scheduledAt).toISOString() : null;
    const deadlineIso = deadlineAt
      ? new Date(deadlineAt + "T23:59").toISOString()
      : scheduledIso || new Date(Date.now() + 14 * 86400000).toISOString();
    if (scheduledIso && new Date(scheduledIso).getTime() < Date.now() - 60_000) {
      toast({ title: "Scheduled time must be in the future", variant: "destructive" });
      return;
    }
    const nextRound = matches.length ? Math.max(...matches.map((m) => m.round)) + 1 : 1;
    setBusy(true);
    const { data: inserted, error } = await supabase.from("matches").insert({
      season_id: season.id,
      round: nextRound,
      side_kind: season.format === "doubles" ? "team" : "player",
      side_a_id: sideA,
      side_b_id: sideB,
      scheduled_at: scheduledIso,
      deadline_at: deadlineIso,
      status: scheduledIso ? "scheduled" : "pending",
      scheduling_captain_id: captainParticipantId,
      scheduled_by: scheduledIso ? captainParticipantId : null,
    }).select("id").single();
    setBusy(false);
    if (error) {
      toast({ title: "Could not create match", description: error.message, variant: "destructive" });
      return;
    }
    const aLabel = sides.find((s) => s.id === sideA)?.label;
    const bLabel = sides.find((s) => s.id === sideB)?.label;
    toast({
      title: scheduledIso ? "Match scheduled" : "Match added",
      description: `${aLabel} vs ${bLabel}${scheduledIso ? ` · ${new Date(scheduledIso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : " — set a time later"}`,
    });
    setOpen(false);
    setSideA(""); setSideB(""); setScheduledAt(""); setDeadlineAt("");
    onCreated();
  };

  const hasSides = sides.length >= 2;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold glow-shadow">
          <Plus size={14} /> Schedule a match
        </button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            <CalendarCheck className="text-primary" size={18} /> Schedule a match
          </DialogTitle>
        </DialogHeader>
        {!hasSides ? (
          <div className="space-y-3 pt-1">
            <div className="rounded-2xl border border-border bg-black/30 p-4">
              <p className="font-semibold text-sm">
                You need at least two {season.format === "doubles" ? "teams" : "players"} first.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add members from the Members tab, then come back here to schedule a match.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-full px-5 py-2.5 rounded-full border border-border text-sm font-medium hover:border-primary/50 inline-flex items-center justify-center gap-2"
            >
              <UserPlus size={14} /> Go add members
            </button>
          </div>
        ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Side A</label>
            <select
              value={sideA}
              onChange={(e) => setSideA(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
            >
              <option value="">Select…</option>
              {sides.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Side B</label>
            <select
              value={sideB}
              onChange={(e) => setSideB(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
            >
              <option value="">Select…</option>
              {sides.filter((s) => s.id !== sideA).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Date & time</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Deadline (optional)</label>
              <input
                type="date"
                value={deadlineAt}
                onChange={(e) => setDeadlineAt(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Skip the time to add a "to be scheduled" placeholder — players can propose times from the match page.
          </p>
          <button
            onClick={create}
            disabled={busy || !sideA || !sideB}
            className="w-full mt-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold glow-shadow disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="animate-spin" size={14} />} {scheduledAt ? "Schedule match" : "Add match"}
          </button>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
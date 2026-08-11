import { Link } from "react-router-dom";
import { useState } from "react";
import { Crown, Calendar, ArrowRight, Clock, Plus, Loader2, UserPlus, CalendarCheck, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Season, Participant, Team, Match, CaptainSlot, SideLabel } from "./types";
import { Surface, StatBlock, SectionHeading, EmptyState } from "@/components/ui-system";

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
      <Surface level={1}>
        <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatBlock label="Players" value={participants.filter((p) => p.status !== "withdrawn").length} />
          <StatBlock label="Matches" value={total} />
          <StatBlock label="Completed" value={completed} />
          <StatBlock label="Captain" value={captain?.display_name?.split(" ")[0] || "—"} />
        </div>
        <div className="text-eyebrow mb-2 flex items-center justify-between">
          <span>Season progress</span>
          <span className="nums">{pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </Surface>

      {/* Action Required */}
      <Surface level={1} className={iAmCaptain ? "border-primary/40" : undefined}>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <Crown className="text-primary" size={20} aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            {iAmCaptain ? (
              <>
                <p className="text-eyebrow text-primary">You are scheduling captain</p>
                <h3 className="text-section-title mt-1.5">
                  {needsScheduling} {needsScheduling === 1 ? "match needs" : "matches need"} scheduling
                </h3>
                {current?.window_end && (
                  <p className="text-meta mt-1.5">
                    Captain window ends {new Date(current.window_end).toLocaleDateString()}
                  </p>
                )}
                <button onClick={onGoToSchedule} className="btn-primary mt-4">
                  Schedule matches <ArrowRight size={14} aria-hidden />
                </button>
              </>
            ) : (
              <>
                <p className="text-eyebrow">Current captain</p>
                <h3 className="text-section-title mt-1.5">{captain?.display_name || "Not assigned"}</h3>
                {current?.window_end && (
                  <p className="text-meta mt-1.5">
                    Captain window ends {new Date(current.window_end).toLocaleDateString()}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </Surface>

      {/* Upcoming */}
      <div>
        <SectionHeading title="Upcoming matches" />
        {upcoming.length === 0 ? (
          <Surface level={1} padded={false}>
            <EmptyState title="No upcoming matches" description="Scheduled matches will appear here." />
          </Surface>
        ) : (
          <Surface level={1} padded={false} className="divide-y divide-border overflow-hidden">
            {upcoming.map((m) => (
              <Link
                key={m.id}
                to={`/app/matches/${m.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <p className="text-ui-title truncate">
                    {sideLabel(m.side_kind, m.side_a_id)} <span className="text-[hsl(var(--text-muted))]">vs</span> {sideLabel(m.side_kind, m.side_b_id)}
                  </p>
                  <p className="text-meta mt-0.5 truncate">
                    Round {m.round}{m.location ? ` · ${m.location}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs">
                  {m.scheduled_at ? (
                    <span className="nums inline-flex items-center gap-1 font-semibold text-primary">
                      <Clock size={12} aria-hidden /> {new Date(m.scheduled_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[hsl(var(--text-muted))]">
                      <Calendar size={12} aria-hidden /> Waiting to be scheduled
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </Surface>
        )}
      </div>
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
  const [location, setLocation] = useState("");
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
    const deadlineIso = scheduledIso || new Date(Date.now() + 14 * 86400000).toISOString();
    if (scheduledIso && new Date(scheduledIso).getTime() < Date.now() - 60_000) {
      toast({ title: "Scheduled time must be in the future", variant: "destructive" });
      return;
    }
    const nextRound = matches.length ? Math.max(...matches.map((m) => m.round)) + 1 : 1;
    setBusy(true);
    const { error } = await supabase.from("matches").insert({
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
      location: location.trim() || null,
    });
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
    setSideA(""); setSideB(""); setScheduledAt(""); setLocation("");
    onCreated();
  };

  const hasSides = sides.length >= 2;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="btn-primary">
          <Plus size={14} aria-hidden /> Schedule a match
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-border surface-elevated">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            <CalendarCheck className="text-primary" size={18} /> Schedule a match
          </DialogTitle>
        </DialogHeader>
        {!hasSides ? (
          <div className="space-y-3 pt-1">
            <div className="rounded-xl border border-border bg-black/30 p-4">
              <p className="text-ui-title">
                You need at least two {season.format === "doubles" ? "teams" : "players"} first.
              </p>
              <p className="text-meta mt-1">
                Add members from the Members tab, then come back here to schedule a match.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="btn-secondary w-full justify-center"
            >
              <UserPlus size={14} aria-hidden /> Go add members
            </button>
          </div>
        ) : (
        <div className="space-y-3">
          <div>
            <label className="text-eyebrow">Side A</label>
            <select
              value={sideA}
              onChange={(e) => setSideA(e.target.value)}
              className="field mt-1.5"
            >
              <option value="">Select…</option>
              {sides.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-eyebrow">Side B</label>
            <select
              value={sideB}
              onChange={(e) => setSideB(e.target.value)}
              className="field mt-1.5"
            >
              <option value="">Select…</option>
              {sides.filter((s) => s.id !== sideA).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-eyebrow">Date & time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16)}
              className="field mt-1.5"
            />
          </div>
          <div>
            <label className="text-eyebrow inline-flex items-center gap-1">
              <MapPin size={12} /> Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Riverside Park · Court 3"
              className="field mt-1.5"
            />
          </div>
          <p className="text-meta">
            Skip the time to add a "to be scheduled" placeholder — players can propose times from the match page.
          </p>
          <button
            onClick={create}
            disabled={busy || !sideA || !sideB}
            className="btn-primary mt-2 w-full"
          >
            {busy && <Loader2 className="animate-spin" size={14} aria-hidden />} {scheduledAt ? "Schedule match" : "Add match"}
          </button>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
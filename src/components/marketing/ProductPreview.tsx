import { Surface, DataList, DataRow, StatusPill, SectionHeading, StatBlock } from "@/components/ui-system";
import { Clock, MapPin } from "lucide-react";

/**
 * Static, non-interactive fragments of the real product UI.
 * These deliberately reuse the same primitives as the authenticated app
 * so the marketing site shows the actual interface, not a separate mock.
 */

function PreviewFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Surface level={1} padded={false} className="overflow-hidden" aria-hidden>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-[hsl(var(--border-strong))]" />
        <span className="text-eyebrow">{label}</span>
      </div>
      {children}
    </Surface>
  );
}

export function CaptainPreview() {
  return (
    <PreviewFrame label="This week">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-eyebrow">Scheduling captain</div>
            <p className="mt-1.5 font-heading text-2xl font-bold tracking-tight">Maya R.</p>
          </div>
          <StatusPill tone="active">On the clock</StatusPill>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-4">
          <StatBlock label="Rotates in" value="3d" emphasis />
          <StatBlock label="To book" value="2" />
          <StatBlock label="Overdue" value="0" />
        </div>
      </div>
    </PreviewFrame>
  );
}

export function ScheduledPreview() {
  return (
    <PreviewFrame label="Upcoming matches">
      <DataList>
        <DataRow
          title="Maya R. vs. Dev P."
          subtitle="Sat 9:00 AM · Court 3"
          trailing={<StatusPill tone="active">Confirmed</StatusPill>}
        />
        <DataRow
          title="Leah K. vs. Tom B."
          subtitle="Sun 4:30 PM · Riverside"
          trailing={<StatusPill>Scheduled</StatusPill>}
        />
        <DataRow
          title="Chris O. vs. Ana W."
          subtitle="Needs a time · due in 2 days"
          trailing={<StatusPill tone="warning">Action</StatusPill>}
        />
      </DataList>
    </PreviewFrame>
  );
}

export function StandingsPreview() {
  const rows = [
    { p: "Maya R.", w: 5, l: 1, sets: "11-4" },
    { p: "Dev P.", w: 4, l: 2, sets: "9-6" },
    { p: "Leah K.", w: 3, l: 3, sets: "8-7" },
    { p: "Tom B.", w: 1, l: 5, sets: "4-11" },
  ];
  return (
    <PreviewFrame label="Standings">
      <div className="px-4 pb-4 pt-3">
        <div className="text-eyebrow grid grid-cols-[1.6rem_1fr_2rem_2rem_3.2rem] gap-2 pb-2">
          <span>#</span>
          <span>Player</span>
          <span className="text-right">W</span>
          <span className="text-right">L</span>
          <span className="text-right">Sets</span>
        </div>
        <div className="divide-y divide-border">
          {rows.map((r, i) => (
            <div
              key={r.p}
              className="nums grid grid-cols-[1.6rem_1fr_2rem_2rem_3.2rem] gap-2 py-2.5 text-sm"
            >
              <span className={i === 0 ? "text-primary font-semibold" : "text-[hsl(var(--text-muted))]"}>
                {i + 1}
              </span>
              <span className="truncate text-foreground">{r.p}</span>
              <span className="text-right text-foreground">{r.w}</span>
              <span className="text-right text-[hsl(var(--text-muted))]">{r.l}</span>
              <span className="text-right text-[hsl(var(--text-muted))]">{r.sets}</span>
            </div>
          ))}
        </div>
      </div>
    </PreviewFrame>
  );
}

export function MatchCardPreview() {
  return (
    <Surface level={1} padded={false} className="overflow-hidden" aria-hidden>
      <div className="border-b border-border px-5 py-4">
        <SectionHeading title="Match detail" hint="Round 3 · Singles" className="mb-0" />
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-ui-title">Maya R. <span className="text-[hsl(var(--text-muted))]">vs.</span> Dev P.</p>
          <StatusPill tone="success">Final</StatusPill>
        </div>
        <div className="nums grid grid-cols-[1fr_2.2rem_2.2rem_2.2rem] gap-2 text-sm">
          <span className="text-eyebrow self-end">Set</span>
          <span className="text-eyebrow text-right">1</span>
          <span className="text-eyebrow text-right">2</span>
          <span className="text-eyebrow text-right">3</span>
          <span className="text-foreground">Maya R.</span>
          <span className="text-right text-foreground">6</span>
          <span className="text-right text-[hsl(var(--text-muted))]">4</span>
          <span className="text-right text-foreground">7</span>
          <span className="text-[hsl(var(--text-muted))]">Dev P.</span>
          <span className="text-right text-[hsl(var(--text-muted))]">3</span>
          <span className="text-right text-foreground">6</span>
          <span className="text-right text-[hsl(var(--text-muted))]">5</span>
        </div>
        <div className="text-meta flex flex-wrap items-center gap-4 border-t border-border pt-3">
          <span className="inline-flex items-center gap-1.5"><Clock size={13} /> Sat 9:00 AM</span>
          <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> Court 3</span>
        </div>
      </div>
    </Surface>
  );
}

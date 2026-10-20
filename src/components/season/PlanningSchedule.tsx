import { CalendarDays, Users, UserRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PreviewFixture } from "@/components/season-wizard/lib/creationV2";

export default function PlanningSchedule({ fixtures, onOverview }: { fixtures: PreviewFixture[]; onOverview: () => void }) {
  const rounds = [...new Set(fixtures.map(fixture => fixture.round))].sort((a, b) => a - b);
  const sides = new Set(fixtures.flatMap(fixture => [fixture.a, fixture.b])).size;
  return <div className="space-y-7">
    <section className="border-b border-border pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-primary"><CalendarDays size={14} aria-hidden /> Planning Preview</span>
          <h2 className="text-page-title">Full Season Schedule</h2>
          <p className="max-w-xl text-body">Invited players are included. Match dates will be set after the season is activated.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onOverview}><ArrowLeft />Season Overview</Button>
      </div>
      <dl className="mt-6 grid grid-cols-3 divide-x divide-border border-y border-border py-4">
        {[{ value: fixtures.length, label: "Matches" }, { value: rounds.length, label: "Rounds" }, { value: sides, label: "Sides" }].map((stat, index) => <div key={stat.label} className={index ? "pl-5" : ""}><dt className="text-meta">{stat.label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{stat.value}</dd></div>)}
      </dl>
    </section>
    {rounds.map(round => {
      const matches = fixtures.filter(fixture => fixture.round === round);
      return <section key={round} className="space-y-3" aria-label={`Round ${round}`}>
        <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-3 text-lg font-semibold"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-sm tabular-nums text-accent-foreground">{String(round).padStart(2, "0")}</span>Round {round}</h3><span className="text-meta">{matches.length} {matches.length === 1 ? "match" : "matches"}</span></div>
        <div className="grid gap-3 md:grid-cols-2">
          {matches.map((fixture, index) => <article key={`${fixture.a}:${fixture.b}`} className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
            <div className="mb-4 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Users size={13} aria-hidden />Match {index + 1}</span><span className="rounded-sm bg-accent px-2 py-1 text-accent-foreground">Preview</span></div>
            <div className="space-y-2">
              <p className="flex items-start gap-3 text-sm font-semibold"><UserRound size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden /><span className="min-w-0 break-words">{fixture.aName}</span></p>
              <span className="block pl-7 text-xs text-muted-foreground">vs</span>
              <p className="flex items-start gap-3 text-sm font-semibold"><UserRound size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden /><span className="min-w-0 break-words">{fixture.bName}</span></p>
            </div>
          </article>)}
        </div>
      </section>;
    })}
  </div>;
}
import { Link } from "react-router-dom";
import { Repeat, CalendarCheck, Trophy, ShieldCheck } from "lucide-react";
import AetherLogo from "@/components/AetherLogo";
import { PageContainer, Surface } from "@/components/ui-system";
import {
  CaptainPreview,
  ScheduledPreview,
  StandingsPreview,
  MatchCardPreview,
} from "@/components/marketing/ProductPreview";
import CourtScrollAnimation from "@/components/marketing/CourtScrollAnimation";

const pillars = [
  {
    icon: Repeat,
    title: "Rotating captains",
    desc: "Scheduling duty passes on a fixed window. Nobody becomes the permanent organizer.",
  },
  {
    icon: CalendarCheck,
    title: "Deadlines that hold",
    desc: "Every fixture carries a due date, so a season never quietly stalls in a group chat.",
  },
  {
    icon: Trophy,
    title: "Standings on their own",
    desc: "Enter a box score once. Wins, sets and games update for everyone instantly.",
  },
  {
    icon: ShieldCheck,
    title: "A commissioner when needed",
    desc: "The season creator can reschedule, correct a score, or nudge the rotation forward.",
  },
];

const audiences = [
  "Couples",
  "Neighborhoods",
  "HOAs",
  "Friend groups",
  "Local clubs",
  "Office leagues",
  "Mixed doubles",
  "Coaching groups",
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md">
        <PageContainer width="wide" className="flex h-14 items-center justify-between gap-4">
          <AetherLogo to="/" className="text-xl sm:text-2xl" />
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/auth"
              className="inline-flex items-center rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get Started
            </Link>
            <Link
              to="/auth"
              className="rounded-lg px-3 py-1.5 text-sm text-[hsl(var(--text-muted))] transition-colors hover:text-foreground"
            >
              Log In
            </Link>
          </div>
        </PageContainer>
      </header>

      <main>
        {/* Hero — asymmetric split: claim left, real product surface right */}
        <section className="border-b border-border py-16 sm:py-24">
          <PageContainer width="wide">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16">
              <div className="animate-fade-up">
                <p className="text-eyebrow">Tennis Seasons Made Simple.</p>
                <h1 className="text-display mt-5">
                  Your Season. Your Players. <span className="text-primary">Your Way.</span>
                </h1>
                <p className="text-body mt-6 max-w-xl text-base">
                  Aether Tennis turns a group of players into a real round-robin season: generated fixtures, rotating
                  scheduling captains, hard deadlines and standings that keep themselves current.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    to="/auth"
                    className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Get Started
                  </Link>
                  <a
                    href="#how"
                    className="rounded-lg border border-border px-5 py-2.5 text-sm text-[hsl(var(--text-secondary))] transition-colors hover:border-strong hover:text-foreground"
                  >
                    See how it works
                  </a>
                </div>
              </div>

              <div className="animate-fade-up-delay-1 space-y-4">
                <CaptainPreview />
                <ScheduledPreview />
              </div>
            </div>
          </PageContainer>
        </section>

        {/* Pillars */}
        <section id="how" className="border-b border-border py-16 sm:py-24">
          <PageContainer width="wide">
            <div className="max-w-2xl">
              <p className="text-eyebrow">The accountability engine</p>
              <h2 className="text-section mt-4">Every screen answers who owes what, by when, and what happens next.</h2>
            </div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
              {pillars.map((p) => (
                <div key={p.title} className="surface-1 p-6 sm:p-8">
                  <p.icon className="text-primary" size={20} aria-hidden />
                  <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight">{p.title}</h3>
                  <p className="text-body mt-2">{p.desc}</p>
                </div>
              ))}
            </div>
          </PageContainer>
        </section>

        {/* Scoring / standings — reversed split */}
        <CourtScrollAnimation />

        <section className="border-b border-border py-16 sm:py-24">
          <PageContainer width="wide">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
              <div className="order-2 space-y-4 lg:order-1">
                <MatchCardPreview />
                <StandingsPreview />
              </div>
              <div className="order-1 lg:order-2">
                <p className="text-eyebrow">Scores and standings</p>
                <h2 className="text-section mt-4">One box score, and the table takes care of itself.</h2>
                <p className="text-body mt-5 max-w-lg text-base">
                  Any member of the season can enter a result. Sets, games and win records propagate to the standings
                  immediately — and the creator can correct a score if something was entered wrong.
                </p>
                <ul className="mt-7 space-y-3 border-t border-border pt-6">
                  {[
                    "Set-by-set entry built for a phone at courtside",
                    "Match history and scorecards kept for the whole season",
                    "Location and time stay attached to every fixture",
                  ].map((line) => (
                    <li key={line} className="text-body flex gap-3">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </PageContainer>
        </section>

        {/* Audiences */}
        <section className="border-b border-border py-16 sm:py-20">
          <PageContainer width="wide">
            <p className="text-eyebrow">Built for</p>
            <h2 className="text-section mt-4 max-w-2xl">Groups that want to actually finish their season.</h2>
            <div className="mt-8 flex flex-wrap gap-2">
              {audiences.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-border px-3.5 py-1.5 text-sm text-[hsl(var(--text-secondary))]"
                >
                  {a}
                </span>
              ))}
            </div>
          </PageContainer>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24">
          <PageContainer width="wide">
            <Surface level={1} padded="lg" className="text-center">
              <h2 className="text-section mx-auto max-w-2xl">
                Your next season starts in <span className="text-primary">under a minute</span>.
              </h2>
              <p className="text-body mx-auto mt-4 max-w-xl">
                Name it, pick singles or doubles, invite your players. Aether builds the schedule and rotates the
                captain so the season finishes.
              </p>
              <Link
                to="/auth"
                className="mt-8 inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Get started free
              </Link>
            </Surface>
          </PageContainer>
        </section>
      </main>

      <footer className="border-t border-border">
        <PageContainer width="wide" className="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <p className="text-meta">© 2026 Aether Tennis. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="text-meta transition-colors hover:text-foreground">
              Terms &amp; Conditions
            </Link>
            <Link to="/privacy" className="text-meta transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </PageContainer>
      </footer>
    </div>
  );
};

export default Index;

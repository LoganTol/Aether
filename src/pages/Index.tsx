import { Link } from "react-router-dom";
import { Users, CalendarCheck, Trophy, GitBranch } from "lucide-react";
import AetherLogo from "@/components/AetherLogo";
import { PageContainer, Surface } from "@/components/ui-system";
import {
  SeasonPreview,
  ScheduledPreview,
  StandingsPreview,
  MatchCardPreview,
} from "@/components/marketing/ProductPreview";
import CourtScrollAnimation from "@/components/marketing/CourtScrollAnimation";
import Seo from "@/components/Seo";

const pillars = [
  {
    icon: Users,
    title: "Your players, your season",
    desc: "Create a season in three simple steps. Invite players now or later, then finalize your roster to start.",
  },
  {
    icon: CalendarCheck,
    title: "Players set the details",
    desc: "Players choose the date, time and place for their matches. Saved details stay on the season schedule.",
  },
  {
    icon: Trophy,
    title: "Scores that fit your game",
    desc: "Record short sets, full sets or deciding tiebreaks in a clean box score. Keep results and standings together.",
  },
  {
    icon: GitBranch,
    title: "The whole season in view",
    desc: "See every round-robin matchup in Schedule or Bracket view, with match details and saved scores in one place.",
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
    <>
    <Seo title="Aether Tennis — Tennis Seasons Made Simple" description="Create your tennis season, invite players and start a full round-robin schedule. Players set match dates, times and locations, record box scores and follow standings." path="/" />
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md transition-colors duration-300 hover:border-primary/30 hover:bg-primary/25">
        <PageContainer width="wide" className="flex h-[4.5rem] items-center justify-between gap-4">
          <AetherLogo to="/" className="text-2xl sm:text-3xl" />
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
                  Bring your players together for a singles or doubles season. Start a full round-robin schedule,
                  let players arrange their matches, and keep every score and standing in one place.
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
                <SeasonPreview />
                <ScheduledPreview />
              </div>
            </div>
          </PageContainer>
        </section>

        {/* Pillars */}
        <section id="how" className="border-b border-border py-16 sm:py-24">
          <PageContainer width="wide">
            <div className="max-w-2xl">
              <p className="text-eyebrow">From your first invite to your final set</p>
              <h2 className="text-section mt-4">Create it. Schedule it. Play it.</h2>
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
                <h2 className="text-section mt-4">Every set has a place. Every result stays with your season.</h2>
                <p className="text-body mt-5 max-w-lg text-base">
                  Match players or the organizer can save a result in a player-by-set box score. Short sets,
                  pro sets and deciding tiebreaks all fit, with opposing-side confirmation when enabled.
                </p>
                <ul className="mt-7 space-y-3 border-t border-border pt-6">
                  {[
                    "Player rows, set columns and clear set totals",
                    "Flexible scoring for the way your group plays",
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
                Your next season starts with <span className="text-primary">your players</span>.
              </h2>
              <p className="text-body mx-auto mt-4 max-w-xl">
                Name your season, choose singles or doubles, and invite your players now or later.
                Finalize your roster to start the full schedule—even before everyone accepts their invite.
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
          <p className="text-meta">
            © 2026 Aether Tennis. All rights reserved.{" "}
            <span>
              Powered by{" "}
              <a
                href="https://Wintagen.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground underline underline-offset-2"
              >
                Wintagen
              </a>
            </span>
          </p>
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
    </>
  );
};

export default Index;

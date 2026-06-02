import { Link } from "react-router-dom";
import { ArrowRight, Trophy, Users, Repeat, CalendarCheck, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AetherLogo from "@/components/AetherLogo";

const features = [
  {
    icon: Repeat,
    title: "Rotating Captains",
    desc: "Scheduling responsibility passes between players each week. No single organizer burns out — the season keeps moving.",
  },
  {
    icon: CalendarCheck,
    title: "One-Tap Scheduling",
    desc: "Captains propose three times. Opponents tap to confirm. Matches get booked without endless group chats.",
  },
  {
    icon: Trophy,
    title: "Auto Standings",
    desc: "Singles and doubles round-robins with live wins, sets, and games. No spreadsheets.",
  },
];

const Index = () => {
  const { user } = useAuth();
  const target = user ? "/app" : "/auth";
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 w-full py-4 md:py-6 z-50 bg-background/80 backdrop-blur-md">
        <div className="container flex justify-between items-center">
          <AetherLogo to="/" className="text-2xl md:text-3xl" />
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              to={target}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {user ? "Dashboard" : "Sign in"}
            </Link>
            <Link
              to={target}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm md:px-7 md:py-3 md:text-base font-semibold rounded-full bg-primary text-primary-foreground glow-shadow transition-all duration-300 hover:-translate-y-0.5"
            >
              {user ? "Open app" : "Start a season"} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-[88vh] flex items-center relative overflow-hidden pt-10">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,hsl(var(--secondary))_0%,transparent_70%)] opacity-50 blur-[80px] -z-10" />
        <div className="absolute bottom-[10%] -left-[5%] w-[400px] h-[400px] bg-[radial-gradient(circle,hsl(var(--primary)/0.15)_0%,transparent_70%)] blur-[60px] -z-10" />

        <div className="container text-center max-w-4xl mx-auto">
          <p className="text-primary font-semibold tracking-widest uppercase text-xs md:text-sm mb-5 animate-fade-up">
            Social Tennis Seasons
          </p>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-up leading-[1.05]">
            Run a tennis season <span className="text-primary">without</span> running yourself ragged.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-up-delay-1">
            Aether Tennis helps neighborhoods, couples, friend groups, HOAs, and clubs organize their own round-robin season — with rotating scheduling captains so nobody gets stuck managing everything.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up-delay-2">
            <Link
              to={target}
              className="inline-flex items-center gap-2 px-10 py-4 text-lg font-semibold rounded-full bg-primary text-primary-foreground glow-shadow transition-all duration-300 hover:-translate-y-0.5"
            >
              {user ? "Open dashboard" : "Create your season"} <ArrowRight size={18} />
            </Link>
            <a href="#how" className="px-6 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how" className="py-24 bg-gradient-to-b from-transparent to-card relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="container">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            The <span className="text-primary">accountability</span> engine
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
            Every screen answers three questions: who owes what, by when, and what happens next.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass-card p-8 md:p-10 transition-all duration-300 hover:-translate-y-2 hover:border-primary/30 hover:glow-shadow group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="text-primary" size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {f.title}
                </h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Built for groups that <span className="text-primary">actually finish</span> their seasons
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["Couples", "Neighborhoods", "HOAs", "Friend Groups", "Local Clubs", "Office Leagues", "Mixed Doubles", "Coaching Groups"].map((g) => (
              <div key={g} className="glass-card px-4 py-5 text-center text-sm md:text-base font-medium">
                <Users className="text-primary mx-auto mb-2" size={20} />
                {g}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container max-w-3xl text-center">
          <Award className="text-primary mx-auto mb-6" size={40} />
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Your next season starts in <span className="text-primary">under a minute</span>.
          </h2>
          <p className="text-muted-foreground mb-10 text-lg">
            Name it, pick singles or doubles, invite your players. We handle the schedule and rotate the captain so the season actually finishes.
          </p>
          <Link
            to={target}
            className="inline-flex items-center gap-2 px-10 py-4 text-lg font-semibold rounded-full bg-primary text-primary-foreground glow-shadow transition-all duration-300 hover:-translate-y-0.5"
          >
            {user ? "Open dashboard" : "Get started free"} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-card/50">
        <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Aether Tennis. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
      <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
    </div>
  );
};

export default Index;

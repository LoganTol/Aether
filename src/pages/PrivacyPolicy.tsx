import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Seo from "@/components/Seo";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  return (
  <>
    <Seo title="Privacy Policy — Aether Tennis" description="How Aether Tennis collects, uses, and protects your account and season data." path="/privacy" />
    <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 w-full py-4 md:py-8 z-50 bg-background/80 backdrop-blur-md">
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-border bg-muted text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors" aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <Link to="/" className="font-heading text-2xl md:text-3xl font-bold tracking-wide">
            AETHER<span className="text-primary">.</span>
          </Link>
        </div>
      </div>
    </header>

    <main className="container max-w-3xl py-12 space-y-8">
      <h1 className="text-4xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm">Effective Date: June 2026</p>
      <p>This Privacy Policy describes what information Aether Tennis collects when you use our platform to organize and play social tennis seasons, and how we use it.</p>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
        <p className="text-muted-foreground"><strong>Account information:</strong> your name, email address, and (if you sign in with Google) your Google profile picture.</p>
        <p className="text-muted-foreground"><strong>Season information:</strong> season names, the participants you invite, scheduled match times, scores you enter, and standings derived from those scores.</p>
        <p className="text-muted-foreground"><strong>Invite information:</strong> when a season creator invites you, your name and email may be added to the platform by them before you create an account.</p>
        <p className="text-muted-foreground"><strong>Usage data:</strong> standard log and device information (IP address, browser type) used to operate and secure the Service.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">2. How We Use Information</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>To operate the Service — create seasons, generate schedules, track scores and standings, and rotate scheduling captains.</li>
          <li>To send transactional emails such as invitations, match reminders, and captain-rotation notifications.</li>
          <li>To improve the Service and prevent abuse.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">3. Who Can See Your Information</h2>
        <p className="text-muted-foreground">Other participants in a season you join can see your display name, your match results, and your position in the standings. Your email is visible to the season creator who invited you. We do not sell or rent your personal information to anyone.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">4. Cookies & Analytics</h2>
        <p className="text-muted-foreground">We use cookies and local storage to keep you signed in and to remember your preferences. We may use privacy-respecting analytics to understand aggregate platform usage.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">5. Your Rights</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li><strong>Access:</strong> request a copy of your data.</li>
          <li><strong>Correction:</strong> request that we correct inaccurate information.</li>
          <li><strong>Deletion:</strong> request deletion of your account and associated data, subject to season-history retention for other participants.</li>
          <li><strong>Withdraw consent:</strong> stop using the Service at any time.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">6. Data Retention</h2>
        <p className="text-muted-foreground">We retain season data for as long as the season exists. If you delete your account, your personal identifiers are removed; aggregate season history may be retained so other participants' standings remain intact.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">7. Contact</h2>
        <p className="text-muted-foreground">For privacy questions or data requests, contact the platform operator through the site.</p>
      </section>

      <p className="text-muted-foreground text-sm pt-4 border-t border-border">© 2026 Aether Tennis. All Rights Reserved.</p>
    </main>
  </div>
);
};

export default PrivacyPolicy;

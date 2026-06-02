import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsAndConditions = () => {
  const navigate = useNavigate();
  return (
  <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 w-full py-4 md:py-8 z-50 bg-background/80 backdrop-blur-md">
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-border bg-black/30 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors" aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <Link to="/" className="font-heading text-2xl md:text-3xl font-bold tracking-wide">
            AETHER<span className="text-primary">.</span>
          </Link>
        </div>
      </div>
    </header>

    <main className="container max-w-3xl py-12 space-y-8">
      <h1 className="text-4xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground text-sm">Last Updated: June 2026</p>
      <p>Welcome to Aether Tennis. These Terms of Service ("Terms") govern your access to and use of the Aether Tennis platform for organizing social tennis seasons. By creating an account or joining a season, you agree to these Terms.</p>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">1. The Service</h2>
        <p className="text-muted-foreground">Aether Tennis is a software platform that helps groups of players run their own round-robin tennis seasons, including scheduling, score tracking, and rotating scheduling-captain responsibilities. We do not organize matches, provide courts, or guarantee any particular outcome.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">2. Eligibility & Accounts</h2>
        <p className="text-muted-foreground">You must be at least 13 years old to use the Service. You are responsible for keeping your login credentials secure and for all activity under your account.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">3. Seasons, Captains, and Conduct</h2>
        <p className="text-muted-foreground">Season creators are responsible for the participants they invite and for resolving disputes within their own group. All users agree to use the Service in good faith — entering accurate scores, honoring scheduled matches, and treating other players respectfully.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">4. Assumption of Risk</h2>
        <p className="text-muted-foreground">Tennis is a physical activity. You play matches at your own risk. Aether Tennis is not responsible for any injury, property damage, or other loss that occurs during a match scheduled through the platform.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">5. Acceptable Use</h2>
        <p className="text-muted-foreground">You may not use the Service to harass other users, submit false scores, spam invites, attempt to access another account, or interfere with the platform's operation.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">6. Service Changes & Termination</h2>
        <p className="text-muted-foreground">We may modify, suspend, or discontinue any part of the Service at any time. We may suspend or terminate accounts that violate these Terms.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">7. Intellectual Property</h2>
        <p className="text-muted-foreground">The Aether Tennis name, brand, and software are owned by Aether Tennis. Content you submit (season names, scores, comments) remains yours, but you grant us a non-exclusive license to display it within the Service.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">8. Limitation of Liability</h2>
        <p className="text-muted-foreground">To the maximum extent permitted by law, Aether Tennis is not liable for any indirect, incidental, punitive, special, or consequential damages arising from your use of the Service.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">9. Governing Law</h2>
        <p className="text-muted-foreground">These Terms are governed by applicable law in the jurisdiction of the platform operator. Disputes will be resolved through binding arbitration where permitted by law.</p>
      </section>

      <p className="text-muted-foreground text-sm pt-4 border-t border-border">© 2026 Aether Tennis. All Rights Reserved.</p>
    </main>
  </div>
);
};

export default TermsAndConditions;

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Surface } from "@/components/ui-system";

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const nextParam = new URLSearchParams(loc.search).get("next");
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;
  const from = safeNext || (loc.state as { from?: string } | null)?.from || "/app";

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, from, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + from,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast({ title: "Account created", description: "You're signed in." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Auth error", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + from,
    });
    if (error) {
      toast({ title: "Google sign-in error", description: error.message, variant: "destructive" });
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-4">
        <div className="container flex items-center justify-between">
          <Link to="/" className="text-meta inline-flex items-center gap-2 hover:text-primary">
            <ArrowLeft size={16} aria-hidden /> Home
          </Link>
          <Link to="/" className="font-heading text-xl font-bold">
            AETHER<span className="text-primary">.</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <Surface level={2} padded="lg" className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-page-title">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
            <p className="text-body">
              {mode === "signup" ? "Start a season in under a minute." : "Sign in to manage your seasons."}
            </p>
          </div>

          <button onClick={google} disabled={busy} className="btn-secondary w-full py-3">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#fff"
                d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.36-1.6 4-5.27 4-3.17 0-5.76-2.62-5.76-5.85S8.99 6.31 12.17 6.31c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.76 3.86 14.7 3 12.17 3 6.93 3 2.7 7.23 2.7 12.17S6.93 21.33 12.17 21.33c7 0 9.27-4.92 9.27-7.45 0-.5-.05-.88-.09-1.78z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-meta">
            <span className="flex-1 h-px bg-border" /> OR <span className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-eyebrow mb-1 block">Display name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="field"
                  placeholder="Jane Smith"
                />
              </div>
            )}
            <div>
              <label className="text-eyebrow mb-1 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-eyebrow mb-1 block">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              {busy && <Loader2 className="animate-spin" size={16} aria-hidden />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-body">
            {mode === "signup" ? "Already have an account?" : "New to Aether?"}{" "}
            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-primary hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Sign Up"}
            </button>
          </p>
        </Surface>
      </main>
    </div>
  );
}

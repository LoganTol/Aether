import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AetherLogo from "@/components/AetherLogo";
import { Loader2 } from "lucide-react";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-8 space-y-6 text-center">
        <AetherLogo to="/" className="text-2xl justify-center" />
        {error ? (
          <p className="text-sm text-destructive">Could not load this authorization request: {error}</p>
        ) : !details ? (
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={16} /> Loading…
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">
                Connect {details.client?.name ?? "an app"} to your account
              </h1>
              <p className="text-sm text-muted-foreground">
                This lets {details.client?.name ?? "the client"} read your seasons, matches and standings, and
                schedule matches or submit scores as you.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                disabled={busy}
                onClick={() => decide(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-black/30 hover:border-primary/50 transition-colors disabled:opacity-60"
              >
                Deny
              </button>
              <button
                disabled={busy}
                onClick={() => decide(true)}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold glow-shadow disabled:opacity-60"
              >
                Approve
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
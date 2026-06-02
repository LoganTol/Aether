import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, Trophy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Participant { id: string; season_id: string; display_name: string; user_id: string | null; status: string }
interface Season { id: string; name: string; format: string }

export default function JoinSeason() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data: p } = await supabase
        .from("season_participants")
        .select("id,season_id,display_name,user_id,status")
        .eq("join_token", token)
        .maybeSingle();
      if (!p) { setError("Invite link is invalid or expired."); return; }
      setParticipant(p as Participant);
      const { data: s } = await supabase.from("seasons").select("id,name,format").eq("id", p.season_id).maybeSingle();
      setSeason(s as Season);
    })();
  }, [token]);

  const join = async () => {
    if (!user || !participant) return;
    setJoining(true);
    const { error } = await supabase
      .from("season_participants")
      .update({ user_id: user.id, status: "active", joined_at: new Date().toISOString() })
      .eq("id", participant.id);
    if (error) {
      toast({ title: "Could not join", description: error.message, variant: "destructive" });
      setJoining(false);
    } else {
      toast({ title: `Welcome to ${season?.name}` });
      navigate(`/app/seasons/${participant.season_id}`);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Invite not found</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link to="/" className="text-primary hover:underline">Back to home</Link>
        </div>
      </div>
    );
  }

  if (!participant || authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (participant.user_id && participant.user_id !== user?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md text-center">
          <p>This invite was already claimed by another account.</p>
        </div>
      </div>
    );
  }

  if (participant.status === "active" && participant.user_id === user?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md text-center">
          <CheckCircle2 className="text-primary mx-auto mb-3" />
          <p className="mb-4">You're already in this season.</p>
          <Link to={`/app/seasons/${participant.season_id}`} className="inline-block px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold">
            Open season
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="glass-card p-8 max-w-md text-center">
        <Trophy className="text-primary mx-auto mb-4" size={36} />
        <h1 className="text-2xl font-bold mb-2">Join {season?.name}</h1>
        <p className="text-muted-foreground mb-6">
          You've been invited to play as <span className="text-foreground font-medium">{participant.display_name}</span> in this {season?.format} season.
        </p>
        {!user ? (
          <Link
            to="/auth"
            state={{ from: `/join/${token}` }}
            className="inline-block px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold glow-shadow"
          >
            Sign in to accept
          </Link>
        ) : (
          <button
            onClick={join}
            disabled={joining}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold glow-shadow disabled:opacity-60"
          >
            {joining && <Loader2 className="animate-spin" size={16} />} Accept invite
          </button>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  ChevronRight,
  Crown,
  Loader2,
  Mail,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";

interface SeasonRow {
  id: string;
  name: string;
  format: string;
  start_date: string;
  end_date: string;
}

export default function SeasonCommandCenter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState<SeasonRow | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [currentCaptain, setCurrentCaptain] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: s }, { count: pc }, { count: mc }, { data: rot }] = await Promise.all([
        supabase.from("seasons").select("id,name,format,start_date,end_date").eq("id", id).single(),
        supabase
          .from("season_participants")
          .select("id", { count: "exact", head: true })
          .eq("season_id", id),
        supabase
          .from("matches")
          .select("id", { count: "exact", head: true })
          .eq("season_id", id),
        supabase
          .from("captain_rotation")
          .select("participant_id")
          .eq("season_id", id)
          .eq("is_current", true)
          .maybeSingle(),
      ]);
      setSeason(s as SeasonRow | null);
      setPlayerCount(pc || 0);
      setMatchCount(mc || 0);
      if (rot?.participant_id) {
        const { data: p } = await supabase
          .from("season_participants")
          .select("display_name")
          .eq("id", rot.participant_id)
          .maybeSingle();
        setCurrentCaptain(p?.display_name || null);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-16 flex justify-center">
          <Loader2 className="animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-16 text-center text-muted-foreground">Season not found.</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 max-w-4xl space-y-6">
        {/* Hero */}
        <div className="glass-card p-6 md:p-8 border-primary/40 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
            Season Ready
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{season.name}</h1>
          <p className="text-sm text-muted-foreground capitalize mb-6">
            {season.format} · {season.start_date} → {season.end_date}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric icon={<Users size={16} />} label="Players" value={playerCount} />
            <Metric icon={<Trophy size={16} />} label="Matches generated" value={matchCount} />
            <Metric
              icon={<Crown size={16} />}
              label="Current captain"
              value={currentCaptain || "TBD"}
              big={false}
            />
            <Metric
              icon={<Calendar size={16} />}
              label="Season starts"
              value={season.start_date}
              big={false}
            />
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionCard
            icon={<Trophy size={18} />}
            title="View Schedule"
            desc="Fixtures, rounds and matches"
            onClick={() => navigate(`/app/seasons/${id}`)}
          />
          <ActionCard
            icon={<Mail size={18} />}
            title="Invite More Players"
            desc="Add players or share invite links"
            onClick={() => navigate(`/app/seasons/${id}?tab=players`)}
          />
          <ActionCard
            icon={<Settings size={18} />}
            title="Season Settings"
            desc="Rules, rotation, deadlines"
            onClick={() => navigate(`/app/seasons/${id}?tab=settings`)}
          />
          <ActionCard
            icon={<Users size={18} />}
            title="Manage Participants"
            desc="Status, withdrawals, captain order"
            onClick={() => navigate(`/app/seasons/${id}?tab=players`)}
          />
        </div>
      </main>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  big = true,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  big?: boolean;
}) {
  return (
    <div>
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs mb-1">
        {icon}
        {label}
      </div>
      <div className={big ? "text-3xl font-bold" : "text-lg font-bold truncate"}>{value}</div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-card p-5 text-left hover:border-primary/50 transition-all group flex items-center justify-between gap-3"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/15 text-primary">{icon}</div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <ChevronRight
        size={18}
        className="text-muted-foreground group-hover:text-primary transition-colors"
      />
    </button>
  );
}
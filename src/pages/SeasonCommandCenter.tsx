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
import {
  PageContainer,
  PageHeader,
  Surface,
  StatBlock,
  StatusPill,
  SectionHeading,
  EmptyState,
} from "@/components/ui-system";

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
        <PageContainer className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" aria-label="Loading season" />
        </PageContainer>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <PageContainer className="py-16">
          <Surface level={1} padded={false}>
            <EmptyState
              title="Season not found"
              description="This season may have been deleted, or you no longer have access to it."
            />
          </Surface>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main>
        <PageContainer className="space-y-8 py-8">
          <PageHeader
            eyebrow={<StatusPill tone="active">Season ready</StatusPill>}
            title={season.name}
            description={
              <span className="capitalize">
                {season.format} · {season.start_date} → {season.end_date}
              </span>
            }
            actions={
              <button
                onClick={() => navigate(`/app/seasons/${id}`)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Open season <ChevronRight size={16} aria-hidden />
              </button>
            }
          />

          <Surface level={1}>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <StatBlock label="Players" value={playerCount} hint="In this season" />
              <StatBlock label="Matches" value={matchCount} hint="Fixtures generated" />
              <StatBlock
                label="Current captain"
                value={<span className="text-lg">{currentCaptain || "TBD"}</span>}
                emphasis={!!currentCaptain}
                hint="Holds scheduling duty"
              />
              <StatBlock
                label="Starts"
                value={<span className="text-lg">{season.start_date}</span>}
                hint="First round opens"
              />
            </div>
          </Surface>

          <section>
            <SectionHeading title="Next steps" hint="Everything you can do from here" />
            <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
              <ActionCard
                icon={<Trophy size={16} />}
                title="View schedule"
                desc="Fixtures, rounds and matches"
                onClick={() => navigate(`/app/seasons/${id}`)}
              />
              <ActionCard
                icon={<Mail size={16} />}
                title="Invite more players"
                desc="Add players or share invite links"
                onClick={() => navigate(`/app/seasons/${id}?tab=players`)}
              />
              <ActionCard
                icon={<Settings size={16} />}
                title="Season settings"
                desc="Rules, rotation, deadlines"
                onClick={() => navigate(`/app/seasons/${id}?tab=settings`)}
              />
              <ActionCard
                icon={<Users size={16} />}
                title="Manage participants"
                desc="Status, withdrawals, captain order"
                onClick={() => navigate(`/app/seasons/${id}?tab=players`)}
              />
            </div>
          </section>

          <p className="text-meta flex items-center gap-2">
            <Crown size={13} aria-hidden />
            The captain rotates automatically — you will not need to chase anyone.
            <Calendar size={13} className="ml-1" aria-hidden />
          </p>
        </PageContainer>
      </main>
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
      className="surface-1 group flex items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-[hsl(var(--surface-2))]"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-primary" aria-hidden>
          {icon}
        </span>
        <span>
          <span className="text-ui-title block text-foreground">{title}</span>
          <span className="text-meta mt-0.5 block">{desc}</span>
        </span>
      </div>
      <ChevronRight
        size={16}
        aria-hidden
        className="shrink-0 text-[hsl(var(--text-muted))] transition-colors group-hover:text-primary"
      />
    </button>
  );
}

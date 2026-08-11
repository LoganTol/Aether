import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar, Users, Trophy, ArrowRight } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { PageContainer, PageHeader, Surface, StatusPill, EmptyState } from "@/components/ui-system";

interface SeasonRow {
  id: string;
  name: string;
  format: "singles" | "doubles";
  status: string;
  start_date: string;
  end_date: string;
  creator_id: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("id,name,format,status,start_date,end_date,creator_id")
        .order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Could not load seasons", description: error.message, variant: "destructive" });
      } else {
        setSeasons((data as SeasonRow[]) || []);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main>
        <PageContainer width="wide" className="py-8 md:py-12">
          <PageHeader
            title="Your seasons"
            description="Run them. Finish them. Repeat."
            actions={
              <Link to="/app/seasons/new" className="btn-primary">
                <Plus size={16} aria-hidden /> New season
              </Link>
            }
            className="mb-8"
          />

          {loading ? (
            <p className="text-body">Loading…</p>
          ) : seasons.length === 0 ? (
            <Surface level={1} padded={false}>
              <EmptyState
                icon={<Trophy size={16} aria-hidden />}
                title="No seasons yet"
                description="Create your first season — invite your group, and we'll generate the schedule and rotate the captain for you."
                action={
                  <Link to="/app/seasons/new" className="btn-primary">
                    <Plus size={16} aria-hidden /> Create your first season
                  </Link>
                }
              />
            </Surface>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seasons.map((s) => (
                <Link key={s.id} to={`/app/seasons/${s.id}`}>
                  <Surface level={2} interactive className="group h-full">
                    <div className="flex items-start justify-between mb-3">
                      <StatusPill tone={s.status === "active" ? "active" : "neutral"}>{s.status}</StatusPill>
                      {s.creator_id === user?.id && (
                        <span className="text-meta">You host</span>
                      )}
                    </div>
                    <h3 className="text-ui-title text-lg mb-2 group-hover:text-primary transition-colors">{s.name}</h3>
                    <div className="flex flex-wrap gap-3 text-meta">
                      <span className="inline-flex items-center gap-1"><Users size={14} aria-hidden /> {s.format}</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={14} aria-hidden />
                        {new Date(s.start_date).toLocaleDateString()} – {new Date(s.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-4 inline-flex items-center text-primary text-sm font-semibold">
                      Open <ArrowRight size={14} className="ml-1" aria-hidden />
                    </div>
                  </Surface>
                </Link>
              ))}
            </div>
          )}
        </PageContainer>
      </main>
    </div>
  );
}

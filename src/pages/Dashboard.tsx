import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar, Users, Trophy, ArrowRight } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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
      <main className="container py-8 md:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Your seasons</h1>
            <p className="text-muted-foreground mt-1">Run them. Finish them. Repeat.</p>
          </div>
          <Link
            to="/app/seasons/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold glow-shadow hover:-translate-y-0.5 transition-all"
          >
            <Plus size={18} /> New season
          </Link>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : seasons.length === 0 ? (
          <div className="glass-card p-10 md:p-16 text-center">
            <Trophy className="text-primary mx-auto mb-4" size={36} />
            <h2 className="text-2xl font-bold mb-2">No seasons yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first season — invite your group, and we'll generate the schedule and rotate the captain for you.
            </p>
            <Link
              to="/app/seasons/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold glow-shadow hover:-translate-y-0.5 transition-all"
            >
              <Plus size={18} /> Create your first season
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seasons.map((s) => (
              <Link
                key={s.id}
                to={`/app/seasons/${s.id}`}
                className="glass-card p-6 hover:border-primary/40 hover:-translate-y-1 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs uppercase tracking-wider px-2 py-1 rounded-full ${
                    s.status === "active" ? "bg-primary/20 text-primary" :
                    s.status === "completed" ? "bg-muted text-muted-foreground" :
                    "bg-secondary text-secondary-foreground"
                  }`}>{s.status}</span>
                  {s.creator_id === user?.id && (
                    <span className="text-xs text-muted-foreground">You host</span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{s.name}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users size={14} /> {s.format}</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(s.start_date).toLocaleDateString()} – {new Date(s.end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-4 inline-flex items-center text-primary text-sm font-semibold">
                  Open <ArrowRight size={14} className="ml-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
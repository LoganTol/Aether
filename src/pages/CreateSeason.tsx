import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type Format = "singles" | "doubles";

interface ParticipantInput {
  display_name: string;
  email: string;
}

export default function CreateSeason() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<Format>("singles");
  const today = new Date().toISOString().slice(0, 10);
  const eightWeeksOut = new Date(Date.now() + 56 * 86400000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(eightWeeksOut);
  const [captainWindowDays, setCaptainWindowDays] = useState(7);
  const [matchDeadlineDays, setMatchDeadlineDays] = useState(14);
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { display_name: "", email: "" },
    { display_name: "", email: "" },
    { display_name: "", email: "" },
    { display_name: "", email: "" },
  ]);
  const [busy, setBusy] = useState(false);

  const minParticipants = 1;

  const addRow = () => setParticipants((p) => [...p, { display_name: "", email: "" }]);
  const removeRow = (i: number) =>
    setParticipants((p) => (p.length <= minParticipants ? p : p.filter((_, idx) => idx !== i)));
  const updateRow = (i: number, k: keyof ParticipantInput, v: string) =>
    setParticipants((p) => p.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const valid = participants.filter((p) => p.display_name.trim());
    if (valid.length < minParticipants) {
      toast({ title: "Need more players", description: `Add at least ${minParticipants} players.`, variant: "destructive" });
      return;
    }
    if (format === "doubles" && valid.length % 2 !== 0) {
      toast({ title: "Doubles needs even players", description: "Add one more or remove one so it's even.", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      // 1. Create season
      const { data: season, error: sErr } = await supabase
        .from("seasons")
        .insert({
          creator_id: user.id,
          name,
          format,
          start_date: startDate,
          end_date: endDate,
          status: "active",
        })
        .select()
        .single();
      if (sErr) throw sErr;

      // 2. Settings
      const { error: setErr } = await supabase.from("season_settings").insert({
        season_id: season.id,
        captain_window_days: captainWindowDays,
        match_deadline_days: matchDeadlineDays,
      });
      if (setErr) throw setErr;

      // 3. Auto-join creator as a participant
      const allParticipants = [
        { display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "Host", email: user.email || "", user_id: user.id, status: "active" as const, joined_at: new Date().toISOString() },
        ...valid.map((p) => ({
          display_name: p.display_name.trim(),
          email: p.email.trim() || null,
          user_id: null,
          status: "invited" as const,
          joined_at: null,
        })),
      ];
      const { data: insertedParticipants, error: pErr } = await supabase
        .from("season_participants")
        .insert(
          allParticipants.map((p) => ({
            season_id: season.id,
            display_name: p.display_name,
            invited_email: p.email,
            user_id: p.user_id,
            status: p.status,
            joined_at: p.joined_at,
          }))
        )
        .select();
      if (pErr) throw pErr;

      // 4. Generate fixtures via edge function
      const { error: fErr } = await supabase.functions.invoke("generate-fixtures", {
        body: { season_id: season.id },
      });
      if (fErr) throw fErr;

      toast({ title: "Season created", description: "Schedule generated. Share invite links with your players." });
      navigate(`/app/seasons/${season.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not create season";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 max-w-3xl">
        <button
          onClick={() => navigate("/app")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </button>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Create a season</h1>
        <p className="text-muted-foreground mb-8">Name it, pick a format, list the players. We'll handle the rest.</p>

        <form onSubmit={submit} className="space-y-6">
          <div className="glass-card p-6 space-y-5">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Season name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Spring Neighborhood Tennis"
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Format</label>
              <div className="inline-flex items-center rounded-full border border-border bg-black/30 p-1">
                {(["singles", "doubles"] as Format[]).map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-5 py-2 text-sm font-semibold rounded-full capitalize transition-all ${
                      format === f ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {format === "doubles" && (
                <p className="text-xs text-muted-foreground mt-2">
                  Doubles uses fixed pairs. After creating the season you'll assign players to teams.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Start date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">End date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Captain window (days)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={captainWindowDays}
                  onChange={(e) => setCaptainWindowDays(parseInt(e.target.value) || 7)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Match deadline (days)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={matchDeadlineDays}
                  onChange={(e) => setMatchDeadlineDays(parseInt(e.target.value) || 14)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-border focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Players</h2>
                <p className="text-xs text-muted-foreground">
                  You're auto-added as a player. Add at least {minParticipants} more.
                </p>
              </div>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm hover:border-primary/50"
              >
                <Plus size={14} /> Add player
              </button>
            </div>
            <div className="space-y-2">
              {participants.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="Name"
                    value={p.display_name}
                    onChange={(e) => updateRow(i, "display_name", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-border focus:border-primary outline-none text-sm"
                  />
                  <input
                    type="email"
                    placeholder="email@example.com (optional)"
                    value={p.email}
                    onChange={(e) => updateRow(i, "email", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-border focus:border-primary outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={participants.length <= minParticipants}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold glow-shadow hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy && <Loader2 className="animate-spin" size={16} />}
            Create season & generate schedule
          </button>
        </form>
      </main>
    </div>
  );
}
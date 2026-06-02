// Generates round-robin matches + captain rotation for a season.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateRoundRobin<T>(ids: T[]): [T | null, T | null][][] {
  const list: (T | null)[] = [...ids];
  if (list.length < 2) return [];
  if (list.length % 2 === 1) list.push(null);
  const n = list.length;
  const rounds: [T | null, T | null][][] = [];
  const arr = [...list];
  for (let r = 0; r < n - 1; r++) {
    const pairings: [T | null, T | null][] = [];
    for (let i = 0; i < n / 2; i++) {
      pairings.push([arr[i], arr[n - 1 - i]]);
    }
    rounds.push(pairings);
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr.splice(0, arr.length, fixed, ...rest);
  }
  return rounds;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { season_id } = await req.json();
    if (!season_id) throw new Error("season_id required");

    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("unauthorized");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify caller is the season creator
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("unauthorized");

    const { data: season } = await supabase.from("seasons").select("*").eq("id", season_id).maybeSingle();
    if (!season) throw new Error("season not found");
    if (season.creator_id !== user.id) throw new Error("only creator can generate fixtures");

    const { data: settings } = await supabase.from("season_settings").select("*").eq("season_id", season_id).maybeSingle();
    const captainWindowDays = settings?.captain_window_days ?? 7;
    const matchDeadlineDays = settings?.match_deadline_days ?? 14;

    const { data: participants } = await supabase
      .from("season_participants")
      .select("id")
      .eq("season_id", season_id)
      .neq("status", "withdrawn");
    if (!participants || participants.length < 2) throw new Error("need at least 2 participants");

    let sideKind: "player" | "team" = "player";
    let sideIds: string[] = participants.map((p) => p.id);

    if (season.format === "doubles") {
      // Auto-build teams: pair participants sequentially (creator can rename later)
      sideKind = "team";
      const pairs: { name: string; player_a_id: string; player_b_id: string }[] = [];
      for (let i = 0; i + 1 < participants.length; i += 2) {
        pairs.push({
          name: `Team ${i / 2 + 1}`,
          player_a_id: participants[i].id,
          player_b_id: participants[i + 1].id,
        });
      }
      const { data: teams, error: tErr } = await supabase
        .from("doubles_teams")
        .insert(pairs.map((p) => ({ season_id, ...p })))
        .select();
      if (tErr) throw tErr;
      sideIds = (teams || []).map((t) => t.id);
    }

    // Wipe existing matches/rotation for idempotency
    await supabase.from("matches").delete().eq("season_id", season_id);
    await supabase.from("captain_rotation").delete().eq("season_id", season_id);

    const rounds = generateRoundRobin(sideIds);
    const start = new Date(season.start_date);
    const matchRows: Record<string, unknown>[] = [];
    rounds.forEach((round, rIdx) => {
      const deadline = new Date(start);
      deadline.setDate(deadline.getDate() + matchDeadlineDays * (rIdx + 1));
      round.forEach(([a, b]) => {
        if (!a || !b) return; // skip bye
        matchRows.push({
          season_id,
          round: rIdx + 1,
          side_kind: sideKind,
          side_a_id: a,
          side_b_id: b,
          deadline_at: deadline.toISOString(),
          status: "pending",
        });
      });
    });
    if (matchRows.length > 0) {
      const { error: mErr } = await supabase.from("matches").insert(matchRows);
      if (mErr) throw mErr;
    }

    // Captain rotation: shuffle participants for fairness, first one is current
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + captainWindowDays);
    const rotationRows = shuffled.map((p, idx) => ({
      season_id,
      participant_id: p.id,
      position: idx,
      is_current: idx === 0,
      window_start: idx === 0 ? now.toISOString() : null,
      window_end: idx === 0 ? windowEnd.toISOString() : null,
    }));
    const { error: rErr } = await supabase.from("captain_rotation").insert(rotationRows);
    if (rErr) throw rErr;

    return new Response(JSON.stringify({ ok: true, matches: matchRows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
// Advance the scheduling captain to the next participant in rotation.
// Callable by the season creator OR by cron (no auth = cron path).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function advance(supabase: ReturnType<typeof createClient>, season_id: string) {
  const { data: settings } = await supabase.from("season_settings").select("captain_window_days").eq("season_id", season_id).maybeSingle();
  const days = (settings as { captain_window_days?: number } | null)?.captain_window_days ?? 7;

  const { data: rotation } = await supabase
    .from("captain_rotation")
    .select("*")
    .eq("season_id", season_id)
    .order("position");
  if (!rotation || rotation.length === 0) return;

  const currentIdx = (rotation as Array<{ is_current: boolean }>).findIndex((r) => r.is_current);
  const nextIdx = (currentIdx + 1) % rotation.length;
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + days);

  await supabase.from("captain_rotation").update({ is_current: false, window_end: now.toISOString() }).eq("season_id", season_id).eq("is_current", true);
  const next = (rotation as Array<{ id: string }>)[nextIdx];
  await supabase.from("captain_rotation").update({
    is_current: true,
    window_start: now.toISOString(),
    window_end: end.toISOString(),
  }).eq("id", next.id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (body.season_id) {
      // Manual trigger — verify creator
      const auth = req.headers.get("Authorization");
      if (auth) {
        const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: auth } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (!user) throw new Error("unauthorized");
        const { data: s } = await supabase.from("seasons").select("creator_id").eq("id", body.season_id).maybeSingle();
        if (!s || (s as { creator_id: string }).creator_id !== user.id) throw new Error("forbidden");
      }
      await advance(supabase, body.season_id);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Cron path: advance all active seasons whose window has ended
    const { data: due } = await supabase
      .from("captain_rotation")
      .select("season_id, window_end")
      .eq("is_current", true)
      .lt("window_end", new Date().toISOString());
    for (const row of (due || []) as Array<{ season_id: string }>) {
      await advance(supabase, row.season_id);
    }
    return new Response(JSON.stringify({ ok: true, advanced: (due || []).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
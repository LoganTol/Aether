import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_season",
  title: "Get season details",
  description: "Get a season's participants, doubles teams, and current scheduling captain.",
  inputSchema: { season_id: z.string().describe("The season id.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ season_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const [season, participants, teams, captains] = await Promise.all([
      supabase.from("seasons").select("*").eq("id", season_id).maybeSingle(),
      supabase
        .from("season_participants")
        .select("id, display_name, status, user_id, invited_email")
        .eq("season_id", season_id),
      supabase.from("doubles_teams").select("id, name, player_a_id, player_b_id").eq("season_id", season_id),
      supabase
        .from("captain_rotation")
        .select("participant_id, position, is_current, window_start, window_end")
        .eq("season_id", season_id)
        .eq("is_current", true),
    ]);
    const error = season.error ?? participants.error ?? teams.error ?? captains.error;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!season.data) return { content: [{ type: "text", text: "Season not found or not visible to you." }], isError: true };
    const payload = {
      season: season.data,
      participants: participants.data ?? [],
      doubles_teams: teams.data ?? [],
      current_captain: captains.data?.[0] ?? null,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
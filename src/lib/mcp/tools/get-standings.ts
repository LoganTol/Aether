import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_standings",
  title: "Get standings",
  description: "Get the current standings (wins, losses, sets, games) for a season.",
  inputSchema: { season_id: z.string().describe("The season id.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ season_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("season_standings")
      .select("side_id, side_kind, wins, losses, sets_won, sets_lost, games_won, games_lost")
      .eq("season_id", season_id);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = [...(data ?? [])].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { standings: rows },
    };
  },
});
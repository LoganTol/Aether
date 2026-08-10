import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_matches",
  title: "List matches",
  description: "List matches in a season, optionally filtered by status (pending, scheduled, completed).",
  inputSchema: {
    season_id: z.string().describe("The season id."),
    status: z.string().optional().describe("Optional match status filter, e.g. scheduled or completed."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ season_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("matches")
      .select("id, round, status, side_kind, side_a_id, side_b_id, scheduled_at, location, deadline_at, completed_at")
      .eq("season_id", season_id)
      .order("round", { ascending: true });
    if (status) query = query.eq("status", status as never);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { matches: data ?? [] },
    };
  },
});
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "schedule_match",
  title: "Schedule a match",
  description: "Set the date/time and location for an existing match in a season.",
  inputSchema: {
    match_id: z.string().describe("The match id."),
    scheduled_at: z.string().describe("ISO 8601 date-time for the match."),
    location: z.string().optional().describe("Optional court or venue name."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ match_id, scheduled_at, location }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const when = new Date(scheduled_at);
    if (Number.isNaN(when.getTime())) {
      return { content: [{ type: "text", text: "scheduled_at must be a valid ISO 8601 date-time." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("matches")
      .update({
        scheduled_at: when.toISOString(),
        location: location ?? null,
        status: "scheduled",
        scheduled_by: ctx.getUserId(),
      })
      .eq("id", match_id)
      .select("id, status, scheduled_at, location")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Match not found or you do not have permission to update it." }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { match: data },
    };
  },
});
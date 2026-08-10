import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "record_match_score",
  title: "Record match score",
  description: "Record the set-by-set box score for a match and mark it completed.",
  inputSchema: {
    match_id: z.string().describe("The match id."),
    sets: z
      .array(z.object({ side_a_games: z.number().int(), side_b_games: z.number().int() }))
      .describe("Sets in order, each with games won by side A and side B. Provide 1 to 5 sets."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  handler: async ({ match_id, sets }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    if (!sets.length || sets.length > 5) {
      return { content: [{ type: "text", text: "Provide between 1 and 5 sets." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let aSets = 0;
    let bSets = 0;
    for (const s of sets) {
      if (s.side_a_games > s.side_b_games) aSets++;
      else if (s.side_b_games > s.side_a_games) bSets++;
    }
    if (aSets === bSets) {
      return { content: [{ type: "text", text: "The score is tied — a winner could not be determined." }], isError: true };
    }
    const winner_side = aSets > bSets ? "a" : "b";

    await supabase.from("match_scores").delete().eq("match_id", match_id);
    const { error: scoreError } = await supabase.from("match_scores").insert(
      sets.map((s, i) => ({
        match_id,
        set_number: i + 1,
        side_a_games: s.side_a_games,
        side_b_games: s.side_b_games,
      })),
    );
    if (scoreError) return { content: [{ type: "text", text: scoreError.message }], isError: true };

    const { error: resultError } = await supabase
      .from("match_results")
      .upsert({ match_id, winner_side, entered_by: ctx.getUserId() }, { onConflict: "match_id" });
    if (resultError) return { content: [{ type: "text", text: resultError.message }], isError: true };

    const { error: matchError } = await supabase
      .from("matches")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", match_id);
    if (matchError) return { content: [{ type: "text", text: matchError.message }], isError: true };

    const payload = { match_id, winner_side, sets };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
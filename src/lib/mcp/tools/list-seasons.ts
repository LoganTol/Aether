import { defineTool } from "@lovable.dev/mcp-js";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_seasons",
  title: "List seasons",
  description: "List the tennis seasons the signed-in user created or participates in.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("seasons")
      .select("id, name, format, status, lifecycle_status, start_date, end_date, creator_id")
      .order("start_date", { ascending: false });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const seasons = (data ?? []).map((s) => ({ ...s, is_creator: s.creator_id === ctx.getUserId() }));
    return {
      content: [{ type: "text", text: JSON.stringify(seasons, null, 2) }],
      structuredContent: { seasons },
    };
  },
});
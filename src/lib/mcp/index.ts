import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listSeasons from "./tools/list-seasons";
import getSeason from "./tools/get-season";
import listMatches from "./tools/list-matches";
import getStandings from "./tools/get-standings";
import scheduleMatch from "./tools/schedule-match";
import recordScore from "./tools/record-score";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "aether",
  title: "Aether Tennis",
  version: "0.1.0",
  instructions:
    "Tools for Aether Tennis, a social tennis season platform. Use list_seasons to find the user's seasons, get_season for participants and the current scheduling captain, list_matches for the schedule, get_standings for the table, schedule_match to set a match date/time and location, and record_match_score to submit a box score.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listSeasons, getSeason, listMatches, getStandings, scheduleMatch, recordScore],
});
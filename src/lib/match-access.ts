export function isOwnMatch(match: { side_kind: string; side_a_id: string; side_b_id: string }, participantId: string | undefined, teams: { id: string; player_a_id: string; player_b_id: string }[]): boolean {
  if (!participantId) return false;
  if (match.side_kind === "player") return [match.side_a_id, match.side_b_id].includes(participantId);
  return teams.some(team => [match.side_a_id, match.side_b_id].includes(team.id) && [team.player_a_id, team.player_b_id].includes(participantId));
}
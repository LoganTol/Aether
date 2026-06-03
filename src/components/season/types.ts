export interface Season {
  id: string;
  name: string;
  format: "singles" | "doubles";
  status: string;
  start_date: string;
  end_date: string;
  creator_id: string;
}
export interface Participant {
  id: string;
  display_name: string;
  invited_email: string | null;
  user_id: string | null;
  status: string;
  join_token: string | null;
}
export interface Team {
  id: string;
  name: string;
  player_a_id: string;
  player_b_id: string;
}
export interface Match {
  id: string;
  round: number;
  side_kind: "player" | "team";
  side_a_id: string;
  side_b_id: string;
  scheduled_at: string | null;
  deadline_at: string;
  status: string;
  scheduling_captain_id: string | null;
  completed_at?: string | null;
  updated_at?: string;
  location?: string | null;
}
export interface CaptainSlot {
  id: string;
  participant_id: string;
  position: number;
  is_current: boolean;
  window_start: string | null;
  window_end: string | null;
}
export interface StandingRow {
  side_id: string;
  side_kind: string;
  wins: number;
  losses: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
}

export type SideLabel = (kind: string, sideId: string) => string;
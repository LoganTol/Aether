export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_actions_log: {
        Row: {
          action_type: string
          actor_id: string
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
          season_id: string
          target_id: string | null
        }
        Insert: {
          action_type: string
          actor_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          season_id: string
          target_id?: string | null
        }
        Update: {
          action_type?: string
          actor_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          season_id?: string
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_log_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      captain_rotation: {
        Row: {
          created_at: string
          id: string
          is_current: boolean
          participant_id: string
          position: number
          season_id: string
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_current?: boolean
          participant_id: string
          position: number
          season_id: string
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_current?: boolean
          participant_id?: string
          position?: number
          season_id?: string
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "captain_rotation_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captain_rotation_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      doubles_teams: {
        Row: {
          created_at: string
          id: string
          name: string
          player_a_id: string
          player_b_id: string
          season_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          player_a_id: string
          player_b_id: string
          season_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          player_a_id?: string
          player_b_id?: string
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubles_teams_player_a_id_fkey"
            columns: ["player_a_id"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doubles_teams_player_b_id_fkey"
            columns: ["player_b_id"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doubles_teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          confirmed_by: string | null
          created_at: string
          disputed: boolean
          entered_by: string | null
          id: string
          match_id: string
          resolved_by_admin: string | null
          updated_at: string
          winner_side: Database["public"]["Enums"]["winner_side"]
        }
        Insert: {
          confirmed_by?: string | null
          created_at?: string
          disputed?: boolean
          entered_by?: string | null
          id?: string
          match_id: string
          resolved_by_admin?: string | null
          updated_at?: string
          winner_side: Database["public"]["Enums"]["winner_side"]
        }
        Update: {
          confirmed_by?: string | null
          created_at?: string
          disputed?: boolean
          entered_by?: string | null
          id?: string
          match_id?: string
          resolved_by_admin?: string | null
          updated_at?: string
          winner_side?: Database["public"]["Enums"]["winner_side"]
        }
        Relationships: [
          {
            foreignKeyName: "match_results_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_scores: {
        Row: {
          id: string
          match_id: string
          set_number: number
          side_a_games: number
          side_b_games: number
        }
        Insert: {
          id?: string
          match_id: string
          set_number: number
          side_a_games: number
          side_b_games: number
        }
        Update: {
          id?: string
          match_id?: string
          set_number?: number
          side_a_games?: number
          side_b_games?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_scores_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_time_proposals: {
        Row: {
          accepted_slot: string | null
          created_at: string
          expires_at: string
          id: string
          match_id: string
          proposed_by: string
          responded_at: string | null
          slot_1: string
          slot_2: string | null
          slot_3: string | null
        }
        Insert: {
          accepted_slot?: string | null
          created_at?: string
          expires_at: string
          id?: string
          match_id: string
          proposed_by: string
          responded_at?: string | null
          slot_1: string
          slot_2?: string | null
          slot_3?: string | null
        }
        Update: {
          accepted_slot?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          match_id?: string
          proposed_by?: string
          responded_at?: string | null
          slot_1?: string
          slot_2?: string | null
          slot_3?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_time_proposals_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_time_proposals_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          deadline_at: string
          id: string
          round: number
          scheduled_at: string | null
          scheduling_captain_id: string | null
          season_id: string
          side_a_id: string
          side_b_id: string
          side_kind: Database["public"]["Enums"]["match_side_kind"]
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline_at: string
          id?: string
          round?: number
          scheduled_at?: string | null
          scheduling_captain_id?: string | null
          season_id: string
          side_a_id: string
          side_b_id: string
          side_kind: Database["public"]["Enums"]["match_side_kind"]
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline_at?: string
          id?: string
          round?: number
          scheduled_at?: string | null
          scheduling_captain_id?: string | null
          season_id?: string
          side_a_id?: string
          side_b_id?: string
          side_kind?: Database["public"]["Enums"]["match_side_kind"]
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_scheduling_captain_id_fkey"
            columns: ["scheduling_captain_id"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_log: {
        Row: {
          body: string | null
          id: string
          payload: Json | null
          read_at: string | null
          season_id: string | null
          sent_at: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          id?: string
          payload?: Json | null
          read_at?: string | null
          season_id?: string | null
          sent_at?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          id?: string
          payload?: Json | null
          read_at?: string | null
          season_id?: string | null
          sent_at?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      season_participants: {
        Row: {
          created_at: string
          display_name: string
          id: string
          invited_email: string | null
          join_token: string | null
          joined_at: string | null
          season_id: string
          status: Database["public"]["Enums"]["participant_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          invited_email?: string | null
          join_token?: string | null
          joined_at?: string | null
          season_id: string
          status?: Database["public"]["Enums"]["participant_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          invited_email?: string | null
          join_token?: string | null
          joined_at?: string | null
          season_id?: string
          status?: Database["public"]["Enums"]["participant_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "season_participants_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      season_settings: {
        Row: {
          auto_rotate_captain: boolean
          captain_window_days: number
          created_at: string
          creator_can_override: boolean
          match_deadline_days: number
          reminder_frequency_hours: number
          season_id: string
          tiebreaker_order: string[]
          updated_at: string
        }
        Insert: {
          auto_rotate_captain?: boolean
          captain_window_days?: number
          created_at?: string
          creator_can_override?: boolean
          match_deadline_days?: number
          reminder_frequency_hours?: number
          season_id: string
          tiebreaker_order?: string[]
          updated_at?: string
        }
        Update: {
          auto_rotate_captain?: boolean
          captain_window_days?: number
          created_at?: string
          creator_can_override?: boolean
          match_deadline_days?: number
          reminder_frequency_hours?: number
          season_id?: string
          tiebreaker_order?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_settings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: true
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          creator_id: string
          end_date: string
          format: Database["public"]["Enums"]["season_format"]
          id: string
          name: string
          start_date: string
          status: Database["public"]["Enums"]["season_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          end_date: string
          format: Database["public"]["Enums"]["season_format"]
          id?: string
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["season_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          end_date?: string
          format?: Database["public"]["Enums"]["season_format"]
          id?: string
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["season_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      standings: {
        Row: {
          games_lost: number | null
          games_won: number | null
          losses: number | null
          season_id: string | null
          sets_lost: number | null
          sets_won: number | null
          side_id: string | null
          side_kind: Database["public"]["Enums"]["match_side_kind"] | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_season_creator: {
        Args: { _season_id: string; _user_id: string }
        Returns: boolean
      }
      is_season_member: {
        Args: { _season_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      match_side_kind: "player" | "team"
      match_status:
        | "pending"
        | "proposed"
        | "scheduled"
        | "completed"
        | "forfeited"
        | "disputed"
      participant_status: "invited" | "active" | "withdrawn"
      season_format: "singles" | "doubles"
      season_status: "draft" | "active" | "paused" | "completed"
      winner_side: "a" | "b"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      match_side_kind: ["player", "team"],
      match_status: [
        "pending",
        "proposed",
        "scheduled",
        "completed",
        "forfeited",
        "disputed",
      ],
      participant_status: ["invited", "active", "withdrawn"],
      season_format: ["singles", "doubles"],
      season_status: ["draft", "active", "paused", "completed"],
      winner_side: ["a", "b"],
    },
  },
} as const

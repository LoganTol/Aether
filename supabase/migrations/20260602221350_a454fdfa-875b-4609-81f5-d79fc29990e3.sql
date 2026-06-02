
-- ============ ENUMS ============
CREATE TYPE public.season_format AS ENUM ('singles', 'doubles');
CREATE TYPE public.season_status AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE public.participant_status AS ENUM ('invited', 'active', 'withdrawn');
CREATE TYPE public.match_side_kind AS ENUM ('player', 'team');
CREATE TYPE public.match_status AS ENUM ('pending', 'proposed', 'scheduled', 'completed', 'forfeited', 'disputed');
CREATE TYPE public.winner_side AS ENUM ('a', 'b');

-- ============ updated_at trigger fn already exists ============

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are publicly viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SEASONS ============
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format public.season_format NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status public.season_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seasons TO authenticated;
GRANT ALL ON public.seasons TO service_role;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_seasons_updated_at BEFORE UPDATE ON public.seasons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SEASON SETTINGS ============
CREATE TABLE public.season_settings (
  season_id UUID PRIMARY KEY REFERENCES public.seasons(id) ON DELETE CASCADE,
  creator_can_override BOOLEAN NOT NULL DEFAULT true,
  auto_rotate_captain BOOLEAN NOT NULL DEFAULT true,
  captain_window_days INTEGER NOT NULL DEFAULT 7,
  reminder_frequency_hours INTEGER NOT NULL DEFAULT 48,
  match_deadline_days INTEGER NOT NULL DEFAULT 14,
  tiebreaker_order TEXT[] NOT NULL DEFAULT ARRAY['wins','set_diff','game_diff','head_to_head'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.season_settings TO authenticated;
GRANT ALL ON public.season_settings TO service_role;
ALTER TABLE public.season_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_season_settings_updated_at BEFORE UPDATE ON public.season_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SEASON PARTICIPANTS ============
CREATE TABLE public.season_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email TEXT,
  display_name TEXT NOT NULL,
  status public.participant_status NOT NULL DEFAULT 'invited',
  join_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url'),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_participants_season ON public.season_participants(season_id);
CREATE INDEX idx_participants_user ON public.season_participants(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.season_participants TO authenticated;
GRANT SELECT ON public.season_participants TO anon; -- for join-by-token lookup
GRANT ALL ON public.season_participants TO service_role;
ALTER TABLE public.season_participants ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_participants_updated_at BEFORE UPDATE ON public.season_participants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ HELPER FUNCTIONS (security definer to avoid recursion) ============
CREATE OR REPLACE FUNCTION public.is_season_member(_season_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.season_participants
    WHERE season_id = _season_id AND user_id = _user_id AND status != 'withdrawn'
  ) OR EXISTS (
    SELECT 1 FROM public.seasons WHERE id = _season_id AND creator_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_season_creator(_season_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.seasons WHERE id = _season_id AND creator_id = _user_id);
$$;

-- ============ SEASONS RLS ============
CREATE POLICY "Members view seasons" ON public.seasons FOR SELECT TO authenticated
  USING (creator_id = auth.uid() OR public.is_season_member(id, auth.uid()));
CREATE POLICY "Anyone authenticated can create season" ON public.seasons FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Creator can update season" ON public.seasons FOR UPDATE TO authenticated
  USING (creator_id = auth.uid());
CREATE POLICY "Creator can delete season" ON public.seasons FOR DELETE TO authenticated
  USING (creator_id = auth.uid());

-- ============ SEASON SETTINGS RLS ============
CREATE POLICY "Members view settings" ON public.season_settings FOR SELECT TO authenticated
  USING (public.is_season_member(season_id, auth.uid()));
CREATE POLICY "Creator manages settings" ON public.season_settings FOR ALL TO authenticated
  USING (public.is_season_creator(season_id, auth.uid()))
  WITH CHECK (public.is_season_creator(season_id, auth.uid()));

-- ============ PARTICIPANTS RLS ============
CREATE POLICY "Members view participants" ON public.season_participants FOR SELECT TO authenticated
  USING (public.is_season_member(season_id, auth.uid()));
CREATE POLICY "Creator manages participants" ON public.season_participants FOR ALL TO authenticated
  USING (public.is_season_creator(season_id, auth.uid()))
  WITH CHECK (public.is_season_creator(season_id, auth.uid()));
CREATE POLICY "Invitee can accept own invite" ON public.season_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR (user_id IS NULL AND invited_email = (auth.jwt() ->> 'email')));

-- ============ DOUBLES TEAMS ============
CREATE TABLE public.doubles_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  player_a_id UUID NOT NULL REFERENCES public.season_participants(id) ON DELETE CASCADE,
  player_b_id UUID NOT NULL REFERENCES public.season_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_teams_season ON public.doubles_teams(season_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doubles_teams TO authenticated;
GRANT ALL ON public.doubles_teams TO service_role;
ALTER TABLE public.doubles_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view teams" ON public.doubles_teams FOR SELECT TO authenticated
  USING (public.is_season_member(season_id, auth.uid()));
CREATE POLICY "Creator manages teams" ON public.doubles_teams FOR ALL TO authenticated
  USING (public.is_season_creator(season_id, auth.uid()))
  WITH CHECK (public.is_season_creator(season_id, auth.uid()));

-- ============ MATCHES ============
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  round INTEGER NOT NULL DEFAULT 1,
  side_kind public.match_side_kind NOT NULL,
  side_a_id UUID NOT NULL,
  side_b_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ NOT NULL,
  status public.match_status NOT NULL DEFAULT 'pending',
  scheduling_captain_id UUID REFERENCES public.season_participants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_matches_season ON public.matches(season_id);
CREATE INDEX idx_matches_captain ON public.matches(scheduling_captain_id);
CREATE INDEX idx_matches_status ON public.matches(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Members view matches" ON public.matches FOR SELECT TO authenticated
  USING (public.is_season_member(season_id, auth.uid()));
CREATE POLICY "Members can update matches" ON public.matches FOR UPDATE TO authenticated
  USING (public.is_season_member(season_id, auth.uid()));
CREATE POLICY "Creator manages matches" ON public.matches FOR ALL TO authenticated
  USING (public.is_season_creator(season_id, auth.uid()))
  WITH CHECK (public.is_season_creator(season_id, auth.uid()));

-- ============ TIME PROPOSALS ============
CREATE TABLE public.match_time_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL REFERENCES public.season_participants(id) ON DELETE CASCADE,
  slot_1 TIMESTAMPTZ NOT NULL,
  slot_2 TIMESTAMPTZ,
  slot_3 TIMESTAMPTZ,
  accepted_slot TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_proposals_match ON public.match_time_proposals(match_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_time_proposals TO authenticated;
GRANT ALL ON public.match_time_proposals TO service_role;
ALTER TABLE public.match_time_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view proposals" ON public.match_time_proposals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.is_season_member(m.season_id, auth.uid())));
CREATE POLICY "Members manage proposals" ON public.match_time_proposals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.is_season_member(m.season_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.is_season_member(m.season_id, auth.uid())));

-- ============ SCORES + RESULTS ============
CREATE TABLE public.match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  side_a_games INTEGER NOT NULL,
  side_b_games INTEGER NOT NULL,
  UNIQUE(match_id, set_number)
);
CREATE INDEX idx_scores_match ON public.match_scores(match_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_scores TO authenticated;
GRANT ALL ON public.match_scores TO service_role;
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view scores" ON public.match_scores FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.is_season_member(m.season_id, auth.uid())));
CREATE POLICY "Members manage scores" ON public.match_scores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.is_season_member(m.season_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.is_season_member(m.season_id, auth.uid())));

CREATE TABLE public.match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL UNIQUE REFERENCES public.matches(id) ON DELETE CASCADE,
  winner_side public.winner_side NOT NULL,
  entered_by UUID REFERENCES public.season_participants(id) ON DELETE SET NULL,
  confirmed_by UUID REFERENCES public.season_participants(id) ON DELETE SET NULL,
  disputed BOOLEAN NOT NULL DEFAULT false,
  resolved_by_admin UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_results TO authenticated;
GRANT ALL ON public.match_results TO service_role;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_results_updated_at BEFORE UPDATE ON public.match_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Members view results" ON public.match_results FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.is_season_member(m.season_id, auth.uid())));
CREATE POLICY "Members manage results" ON public.match_results FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.is_season_member(m.season_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.is_season_member(m.season_id, auth.uid())));

-- ============ CAPTAIN ROTATION ============
CREATE TABLE public.captain_rotation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.season_participants(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(season_id, position)
);
CREATE INDEX idx_rotation_season ON public.captain_rotation(season_id);
CREATE INDEX idx_rotation_current ON public.captain_rotation(season_id, is_current);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.captain_rotation TO authenticated;
GRANT ALL ON public.captain_rotation TO service_role;
ALTER TABLE public.captain_rotation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view rotation" ON public.captain_rotation FOR SELECT TO authenticated
  USING (public.is_season_member(season_id, auth.uid()));
CREATE POLICY "Creator manages rotation" ON public.captain_rotation FOR ALL TO authenticated
  USING (public.is_season_creator(season_id, auth.uid()))
  WITH CHECK (public.is_season_creator(season_id, auth.uid()));

-- ============ ADMIN ACTIONS LOG ============
CREATE TABLE public.admin_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_id UUID,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_log_season ON public.admin_actions_log(season_id);
GRANT SELECT, INSERT ON public.admin_actions_log TO authenticated;
GRANT ALL ON public.admin_actions_log TO service_role;
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view admin log" ON public.admin_actions_log FOR SELECT TO authenticated
  USING (public.is_season_member(season_id, auth.uid()));
CREATE POLICY "Creator writes admin log" ON public.admin_actions_log FOR INSERT TO authenticated
  WITH CHECK (public.is_season_creator(season_id, auth.uid()) AND actor_id = auth.uid());

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON public.notifications_log(user_id, read_at);
GRANT SELECT, INSERT, UPDATE ON public.notifications_log TO authenticated;
GRANT ALL ON public.notifications_log TO service_role;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications_log FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ============ STANDINGS VIEW ============
CREATE OR REPLACE VIEW public.standings AS
WITH sides AS (
  SELECT
    m.season_id,
    m.id AS match_id,
    m.side_kind,
    m.side_a_id AS side_id, 'a'::public.winner_side AS side,
    r.winner_side,
    COALESCE(SUM(CASE WHEN s.side_a_games > s.side_b_games THEN 1 ELSE 0 END), 0) AS sets_won,
    COALESCE(SUM(CASE WHEN s.side_a_games < s.side_b_games THEN 1 ELSE 0 END), 0) AS sets_lost,
    COALESCE(SUM(s.side_a_games), 0) AS games_won,
    COALESCE(SUM(s.side_b_games), 0) AS games_lost
  FROM public.matches m
  JOIN public.match_results r ON r.match_id = m.id AND r.disputed = false
  LEFT JOIN public.match_scores s ON s.match_id = m.id
  WHERE m.status = 'completed'
  GROUP BY m.season_id, m.id, m.side_kind, m.side_a_id, r.winner_side
  UNION ALL
  SELECT
    m.season_id, m.id, m.side_kind,
    m.side_b_id, 'b'::public.winner_side,
    r.winner_side,
    COALESCE(SUM(CASE WHEN s.side_b_games > s.side_a_games THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN s.side_b_games < s.side_a_games THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(s.side_b_games), 0),
    COALESCE(SUM(s.side_a_games), 0)
  FROM public.matches m
  JOIN public.match_results r ON r.match_id = m.id AND r.disputed = false
  LEFT JOIN public.match_scores s ON s.match_id = m.id
  WHERE m.status = 'completed'
  GROUP BY m.season_id, m.id, m.side_kind, m.side_b_id, r.winner_side
)
SELECT
  season_id,
  side_kind,
  side_id,
  COUNT(*) FILTER (WHERE winner_side = side) AS wins,
  COUNT(*) FILTER (WHERE winner_side != side) AS losses,
  COALESCE(SUM(sets_won), 0) AS sets_won,
  COALESCE(SUM(sets_lost), 0) AS sets_lost,
  COALESCE(SUM(games_won), 0) AS games_won,
  COALESCE(SUM(games_lost), 0) AS games_lost
FROM sides
GROUP BY season_id, side_kind, side_id;

GRANT SELECT ON public.standings TO authenticated;
GRANT SELECT ON public.standings TO service_role;

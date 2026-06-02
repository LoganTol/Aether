ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_by uuid,
  ADD COLUMN IF NOT EXISTS result_confirmed_at timestamptz;

DROP VIEW IF EXISTS public.season_standings;

CREATE VIEW public.season_standings
WITH (security_invoker = true)
AS
WITH sides AS (
  SELECT m.id AS match_id, m.season_id, m.side_kind,
         m.side_a_id AS side_id,
         (r.winner_side = 'a') AS won,
         s.side_a_games AS games_for, s.side_b_games AS games_against
  FROM public.matches m
  JOIN public.match_results r ON r.match_id = m.id
  JOIN public.match_scores  s ON s.match_id = m.id
  WHERE m.status = 'completed'
  UNION ALL
  SELECT m.id, m.season_id, m.side_kind,
         m.side_b_id,
         (r.winner_side = 'b'),
         s.side_b_games, s.side_a_games
  FROM public.matches m
  JOIN public.match_results r ON r.match_id = m.id
  JOIN public.match_scores  s ON s.match_id = m.id
  WHERE m.status = 'completed'
),
sets_agg AS (
  SELECT season_id, side_kind, side_id,
         SUM(CASE WHEN games_for > games_against THEN 1 ELSE 0 END)::int AS sets_won,
         SUM(CASE WHEN games_for < games_against THEN 1 ELSE 0 END)::int AS sets_lost,
         SUM(games_for)::int     AS games_won,
         SUM(games_against)::int AS games_lost
  FROM sides GROUP BY season_id, side_kind, side_id
),
match_wl AS (
  SELECT DISTINCT match_id, season_id, side_kind, side_id, won FROM sides
),
wl AS (
  SELECT season_id, side_kind, side_id,
         COUNT(*) FILTER (WHERE won)::int     AS wins,
         COUNT(*) FILTER (WHERE NOT won)::int AS losses
  FROM match_wl GROUP BY season_id, side_kind, side_id
)
SELECT s.season_id, s.side_kind, s.side_id,
       COALESCE(w.wins,0) AS wins, COALESCE(w.losses,0) AS losses,
       s.sets_won, s.sets_lost, s.games_won, s.games_lost
FROM sets_agg s
LEFT JOIN wl w USING (season_id, side_kind, side_id);

GRANT SELECT ON public.season_standings TO authenticated;
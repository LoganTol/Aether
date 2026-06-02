# Season Operations — Build Plan

Transform the existing Season Detail page into a six-tab operational dashboard, add a public scorecard route, and back standings with a SQL view so they're always correct.

## What already exists (keep & extend)

- `SeasonDetail.tsx` has Schedule / Standings / Members / Admin tabs and a captain banner. We will **add Overview and Match History**, and split Schedule into round groups with status badges.
- `MatchDetail.tsx` already covers time proposals + score entry. We will extend it to write `completed_at`, `scheduled_by`, and `result_confirmed_at`, and add a **separate read-only scorecard** at `/app/matches/:id/results`.
- `standings` table is read directly today and may drift. We replace it with a `season_standings` SQL view computed from `match_results` + `match_scores`.
- `season_settings.score_format` already exists (best_of_3 / pro_set_8 / single_set_6) — score entry will respect it.

## Tab structure

```text
Season Dashboard
├── Overview      ← NEW (default tab)
├── Schedule      ← refactored: grouped by round + status badges
├── Standings     ← reuses existing table, sourced from the new view, top 3 podium
├── Match History ← NEW
├── Members       ← unchanged
└── Admin         ← unchanged (creator-only)
```

### Overview tab content

1. **Hero card** — season name, player/match counts, current captain, progress %.
2. **Action Required** — captain variant ("You're the captain · N matches need scheduling · deadline") vs non-captain variant (who the captain is + window end).
3. **Upcoming matches** — next 3 scheduled or awaiting-time matches.
4. **Progress bar** — completed / total matches.

### Schedule tab

- Group by `round` (Round 1, Round 2, …).
- Status badges with semantic colors: `pending` (muted), `proposed` (amber), `scheduled` (primary/lime), `completed` (green-ish), `disputed` (destructive), `overdue` (destructive — derived when `deadline_at < now()` and not completed).
- Card links to `/app/matches/:id`.

### Match History tab

- Completed matches only, newest first (by `completed_at` desc, fallback `updated_at`).
- "Sarah def. Mike" headline + per-set scores inline.
- Card links to `/app/matches/:id/results` (read-only scorecard).

### Standings tab

- Same table, sorted by the new view.
- Add a **podium row** (top 3) above the table with gold/silver/bronze treatment using existing tokens.

## New route: Match Scorecard

`/app/matches/:id/results` — read-only:
- Players/teams, winner, set-by-set table, submitted by, confirmed by, completed date.
- Back link to Season → Match History.

## Match Detail enhancements

- On schedule confirmation: also set `matches.scheduled_by = <participant who proposed>`.
- On score submit: set `matches.completed_at = now()`.
- Add **Confirm / Dispute** controls visible to the opponent (non-entering side) when `match_results` exists but `confirmed_by` is null:
  - Confirm → set `result_confirmed_at = now()`, `confirmed_by = my participant id`.
  - Dispute → set `disputed = true`, status stays `completed` but row badged "Disputed".
- Score form already supports N sets; we'll constrain default rows per `score_format`.

## Database changes

### Migration

```sql
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_by uuid,
  ADD COLUMN IF NOT EXISTS result_confirmed_at timestamptz;

CREATE OR REPLACE VIEW public.season_standings AS
WITH sides AS (
  SELECT m.season_id, m.side_kind, m.side_a_id AS side_id,
         r.winner_side = 'a' AS won,
         s.side_a_games AS games_for, s.side_b_games AS games_against
  FROM matches m
  JOIN match_results r ON r.match_id = m.id
  JOIN match_scores  s ON s.match_id = m.id
  WHERE m.status = 'completed'
  UNION ALL
  SELECT m.season_id, m.side_kind, m.side_b_id,
         r.winner_side = 'b',
         s.side_b_games, s.side_a_games
  FROM matches m
  JOIN match_results r ON r.match_id = m.id
  JOIN match_scores  s ON s.match_id = m.id
  WHERE m.status = 'completed'
),
sets AS (
  SELECT season_id, side_kind, side_id,
         SUM(CASE WHEN games_for > games_against THEN 1 ELSE 0 END) AS sets_won,
         SUM(CASE WHEN games_for < games_against THEN 1 ELSE 0 END) AS sets_lost,
         SUM(games_for) AS games_won,
         SUM(games_against) AS games_lost
  FROM sides GROUP BY season_id, side_kind, side_id
),
wl AS (
  SELECT season_id, side_kind, side_id,
         COUNT(*) FILTER (WHERE won) AS wins,
         COUNT(*) FILTER (WHERE NOT won) AS losses
  FROM (SELECT DISTINCT ON (m.id, side_id) * FROM sides
        JOIN matches m USING (season_id)) x
  GROUP BY season_id, side_kind, side_id
)
SELECT s.season_id, s.side_kind, s.side_id,
       COALESCE(w.wins,0) AS wins, COALESCE(w.losses,0) AS losses,
       s.sets_won, s.sets_lost, s.games_won, s.games_lost
FROM sets s LEFT JOIN wl w USING (season_id, side_kind, side_id);

GRANT SELECT ON public.season_standings TO authenticated;
```

(Views inherit RLS from underlying tables via `is_season_member`, so no extra policy needed; the `standings` table will be kept for backwards-compat but the UI reads from `season_standings`.)

## Files

**New**
- `src/pages/MatchScorecard.tsx` — `/app/matches/:id/results`
- `src/components/season/OverviewTab.tsx`
- `src/components/season/ScheduleTab.tsx` (round-grouped, status badges)
- `src/components/season/MatchHistoryTab.tsx`
- `src/components/season/StandingsTab.tsx` (with podium)
- `src/components/season/MatchStatusBadge.tsx`

**Edited**
- `src/pages/SeasonDetail.tsx` — add Overview + History tabs, default to Overview, delegate to new components.
- `src/pages/MatchDetail.tsx` — write `completed_at` / `scheduled_by` / confirm/dispute flow.
- `src/App.tsx` — register `/app/matches/:id/results`.
- `src/integrations/supabase/types.ts` — regenerated by migration.

## Out of scope (deferred)

- Real email/push notifications for "result pending confirmation".
- Auto-overdue cron — `overdue` is derived client-side only.
- Editing a submitted score after confirmation (admin override only).
- Doubles team head-to-head tiebreak; we keep the existing wins → set diff → game diff order.

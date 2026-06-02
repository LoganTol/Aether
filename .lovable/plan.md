
# Aether Tennis — Social Season Platform (Revised MVP)

## Positioning

**Aether Tennis: Social Tennis Seasons** — for neighborhoods, couples, friend groups, HOAs, and clubs. Not "league software." The product is an **Accountability Engine**: Create Season → Assign Responsibility → Keep Season Moving → Finish Season. Standings are a byproduct.

Every screen answers three questions: **Who owes what? By when? What happens next?**

## Locked Decisions

1. **Round-robin only** (singles + doubles, with auto BYE for odd counts). Playoffs/ladders = Phase 2.
2. **Fixed doubles pairs** declared at season start.
3. **Creator = Commissioner Lite** with override powers (edit scores, reassign captain, extend deadlines, remove/forfeit, pause/end season). Hidden behind **Season Settings → Admin Actions**, invisible to participants.
4. **Captain rotation = time window** (weekly default), configurable.
5. **In-app scheduling proposals are MVP**, not v2. Captain proposes up to 3 times → opponent one-taps to confirm. Scheduling friction is the core problem; it cannot live outside the app.

## Database (revised)

```text
profiles               (id=auth.uid, display_name, avatar_url, timezone)

seasons                (id, creator_id, name, format[singles|doubles],
                        start_date, end_date, status[draft|active|paused|completed])

season_settings        (season_id PK, creator_can_override bool,
                        auto_rotate_captain bool, captain_window_days int,
                        reminder_frequency_hours int, match_deadline_days int,
                        tiebreaker_order text[])

season_participants    (id, season_id, user_id NULL, invited_email,
                        display_name, status[invited|active|withdrawn],
                        join_token, joined_at)

doubles_teams          (id, season_id, name, player_a_id, player_b_id)

matches                (id, season_id, round, side_a_id, side_b_id,
                        side_kind[player|team], scheduled_at NULL,
                        deadline_at, status[pending|proposed|scheduled|
                        completed|forfeited|disputed],
                        scheduling_captain_id)

match_time_proposals   (id, match_id, proposed_by, slot_1, slot_2, slot_3,
                        accepted_slot NULL, responded_at NULL, expires_at)

match_scores           (id, match_id, set_number, side_a_games, side_b_games)

match_results          (id, match_id, winner_side, entered_by,
                        confirmed_by NULL, disputed bool, resolved_by_admin NULL)

captain_rotation       (id, season_id, user_id, position, current bool,
                        window_start, window_end)

admin_actions_log      (id, season_id, actor_id, action_type, target_id,
                        reason, created_at)            -- audit trail for overrides

notifications_log      (id, user_id, type, payload, sent_at)
```

Standings = SQL view over `match_results` + `match_scores`, ordered by configurable `tiebreaker_order` (default: wins → set diff → game diff → head-to-head).

RLS: `is_season_member(season_id)` security-definer fn for participants; `is_season_creator(season_id)` for admin actions. All overrides write to `admin_actions_log`.

## Core Flows

**Create season** → name, dates, format, captain window (default 7d), match deadline (default 14d) → add participants by email → fixed doubles teams if applicable → app generates round-robin fixtures with rolling deadlines → first captain assigned → Resend invites.

**Captain's week** → dashboard banner: "You're Scheduling Captain until Sun. 2 matches need times." → for each match, captain picks up to 3 time slots → opponent receives proposal email + in-app card → one-tap accept → match `scheduled`.

**Play & report** → either side enters score → opponent confirms or disputes → on confirm, standings update; on dispute, creator pinged and can resolve via admin action.

**Rotation** → daily cron edge function: when window ends OR all owed matches scheduled, advance `current` flag to next position; notify new captain.

**Creator overrides** → Admin panel: reassign captain, edit any score, force-schedule, extend deadline, forfeit, remove participant, pause/end. Every action logged.

## Notifications (Resend)

- Invite received / accepted
- "You're now Scheduling Captain" (week start)
- Time proposal received → awaiting your tap
- Match scheduled / rescheduled
- Match deadline 48h / overdue
- Score awaiting your confirmation
- Captain window ending in 24h with unfinished obligations
- Weekly standings + "what's next" digest

## MVP Scope

**In:** Auth (email + Google), profiles with timezone, season CRUD, fixed-pair doubles, email + link invites, auto-fixtures, **time-window captain rotation**, **3-slot scheduling proposals with one-tap accept**, score entry + confirm/dispute, standings view, season dashboard, **creator admin panel + audit log**, Resend transactional emails, daily cron for rotation/reminders, mobile-first responsive UI in current Aether brand.

**Out (Phase 2):** playoffs, consolation brackets, ladders, partner shuffle, King of the Court, court/venue booking, payments, in-app chat, push/SMS, photos, public spectator pages, ICS export, badges/streaks, captain leaderboard.

**Removed from current app:** cart, Order page, Stripe checkout, product carousel, "Buy Now", price fetching, ProductCarousel, StripeEmbeddedCheckout, PaymentTestModeBanner, related edge functions. Keep: branding tokens, header/footer shell, T&C/Privacy (rewritten for platform).

## Visual / Brand

Reuse existing color tokens, typography, and premium aesthetic from `index.css` and `tailwind.config.ts`. New surfaces: Dashboard, Season detail, Match card, Captain banner, Standings table, Admin panel — all in the same premium dark palette already in use.

## Build Order

1. Tear out ecommerce; keep brand shell, T&C, Privacy (rewritten).
2. Auth + profiles + timezone.
3. Season + participants + fixed-pair doubles + invite flow (Resend).
4. Fixture generator + deadlines + captain rotation cron.
5. Scheduling proposals + one-tap accept.
6. Score entry + confirm/dispute + standings view.
7. Dashboard (captain banner, upcoming, standings, progress).
8. Creator admin panel + audit log.
9. Notification suite + weekly digest.
10. Polish, empty states, mobile QA.

---

Ready to build when you approve.

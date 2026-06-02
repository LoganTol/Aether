## Goal

Replace single-page `CreateSeason.tsx` with a 7-step Season Setup Wizard. Support draft/ready/active lifecycle, season visibility, and a richer Command Center post-launch.

## Wizard Step Order (revised)

1. **Basics** — name, format, start/end date, captain window days, match deadline days.
2. **Participants** — add by email, shareable invite link, live list with checkmarks, Round-Robin Impact card (matches, rounds, estimated weeks).
3. **Format Review** — read-only summary, rounds & match count.
4. **Doubles Teams** — only when format = doubles. Pair into fixed teams; validate every player assigned once.
5. **Rules & Captain Rotation** — score format, dispute resolution, forfeit handling, **season visibility**, **captain rotation mode** (Random / Invite Order / Alphabetical / Manual — manual reorders the now-known participant list).
6. **Notifications** — captain reminders, deadline reminders, weekly digest + frequency.
7. **Review & Launch** — full summary card + **Preview Schedule** (first 3 matchups grouped by week) + "Launch Season" CTA.

## Component Structure

`src/components/season-wizard/`
- `SeasonWizard.tsx` — orchestrator (state, validation, nav, submit).
- `WizardShell.tsx` — stepper header, mobile-collapsed "Step X of 7" + dots, sticky bottom Back/Next/Launch bar.
- `steps/Step1Basics.tsx`
- `steps/Step2Participants.tsx` — list with checkmarks + `RoundRobinImpact` card.
- `steps/Step3FormatReview.tsx`
- `steps/Step4DoublesTeams.tsx`
- `steps/Step5RulesAndRotation.tsx` — includes `CaptainRotationConfig` (radio + up/down reorder for manual) and `VisibilityPicker`.
- `steps/Step6Notifications.tsx`
- `steps/Step7ReviewLaunch.tsx` — includes `SchedulePreview` (computes first 3 round-robin pairings client-side from ordered participants/teams).
- `hooks/useWizardState.ts` — typed `useReducer` for all wizard fields.
- `lib/wizardEstimates.ts` — `matchCount`, `roundCount`, `estimatedWeeks`, `recommendedSeasonLength(players, cadence)`, `previewSchedule(participants|teams, n)`.

New page: `src/pages/SeasonCommandCenter.tsx` at `/app/seasons/:id/launched`.

Hero: "Season Ready" + season name, player count, matches generated, current captain, season start date. Quick actions: View Schedule, Invite More Players, Season Settings, Manage Participants.

## State Shape

```ts
type WizardState = {
  step: 1|2|3|4|5|6|7;
  basics: { name; format; startDate; endDate; captainWindowDays; matchDeadlineDays };
  participants: ParticipantInput[];
  doublesTeams: { name; playerAIdx; playerBIdx }[];
  rules: {
    scoreFormat: 'best_of_3'|'pro_set_8'|'single_set_6';
    disputeResolution: 'creator_decides'|'majority_vote';
    forfeitHandling: 'auto_loss'|'manual_review';
    visibility: 'private'|'invite_only';
    rotationMode: 'random'|'invite_order'|'alphabetical'|'manual';
    manualOrder: number[]; // indexes into participants
  };
  notifications: { captainReminders; deadlineReminders; weeklyDigest; digestFrequencyDays };
};
```

## Route Updates

`src/App.tsx`:
- `/app/seasons/new` → `CreateSeason` (renders `SeasonWizard`).
- `/app/seasons/:id/launched` → `SeasonCommandCenter`.

## Database Changes (single migration)

Add lifecycle + visibility to `seasons`, plus rules/notifications/rotation to `season_settings`.

```sql
-- seasons
ALTER TABLE public.seasons
  ADD COLUMN visibility text NOT NULL DEFAULT 'invite_only'
    CHECK (visibility IN ('private','invite_only')),
  ADD COLUMN lifecycle_status text NOT NULL DEFAULT 'draft'
    CHECK (lifecycle_status IN ('draft','ready','active','completed','archived'));

-- season_settings
CREATE TYPE score_format AS ENUM ('best_of_3','pro_set_8','single_set_6');
CREATE TYPE dispute_resolution AS ENUM ('creator_decides','majority_vote');
CREATE TYPE forfeit_handling AS ENUM ('auto_loss','manual_review');
CREATE TYPE captain_rotation_mode AS ENUM ('random','invite_order','alphabetical','manual');

ALTER TABLE public.season_settings
  ADD COLUMN score_format score_format NOT NULL DEFAULT 'best_of_3',
  ADD COLUMN dispute_resolution dispute_resolution NOT NULL DEFAULT 'creator_decides',
  ADD COLUMN forfeit_handling forfeit_handling NOT NULL DEFAULT 'manual_review',
  ADD COLUMN captain_rotation_mode captain_rotation_mode NOT NULL DEFAULT 'invite_order',
  ADD COLUMN captain_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN deadline_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN weekly_digest boolean NOT NULL DEFAULT true,
  ADD COLUMN digest_frequency_days integer NOT NULL DEFAULT 7;
```

Existing RLS/GRANTs cover both tables — no policy changes needed.

`doubles_teams` already exists — Step 4 inserts after participants return IDs.

## Submit Sequence (Launch)

1. Insert `seasons` (`lifecycle_status='active'`, `status='active'`, visibility from wizard).
2. Insert `season_settings` with all new fields.
3. Insert `season_participants` (creator + invitees) → capture IDs.
4. If doubles → insert `doubles_teams` rows using returned participant IDs.
5. Invoke `generate-fixtures` edge function.
6. Navigate to `/app/seasons/:id/launched`.

Save-as-draft is not built in this pass but the `lifecycle_status` column is in place for the follow-up.

## Design

Glass cards, Outfit headings, Inter body, lime-yellow primary CTAs. Mobile-first single-column with sticky bottom action bar. Step 2 Round-Robin Impact and Step 7 Schedule Preview use accent typography to create the "this is real" moment.

## Out of Scope (deferred, columns/flags in place)

- Save as Draft button + draft resume flow (lifecycle column ready).
- Edge function honoring rotation mode, score format, forfeit handling (settings stored; logic follow-up).
- Real email delivery for invites (link copy only).
- Drag-and-drop manual rotation polish (use up/down arrows for MVP).

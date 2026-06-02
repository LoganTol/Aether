-- seasons: visibility + lifecycle_status
ALTER TABLE public.seasons
  ADD COLUMN visibility text NOT NULL DEFAULT 'invite_only'
    CHECK (visibility IN ('private','invite_only')),
  ADD COLUMN lifecycle_status text NOT NULL DEFAULT 'draft'
    CHECK (lifecycle_status IN ('draft','ready','active','completed','archived'));

-- enums for season_settings
CREATE TYPE public.score_format AS ENUM ('best_of_3','pro_set_8','single_set_6');
CREATE TYPE public.dispute_resolution AS ENUM ('creator_decides','majority_vote');
CREATE TYPE public.forfeit_handling AS ENUM ('auto_loss','manual_review');
CREATE TYPE public.captain_rotation_mode AS ENUM ('random','invite_order','alphabetical','manual');

ALTER TABLE public.season_settings
  ADD COLUMN score_format public.score_format NOT NULL DEFAULT 'best_of_3',
  ADD COLUMN dispute_resolution public.dispute_resolution NOT NULL DEFAULT 'creator_decides',
  ADD COLUMN forfeit_handling public.forfeit_handling NOT NULL DEFAULT 'manual_review',
  ADD COLUMN captain_rotation_mode public.captain_rotation_mode NOT NULL DEFAULT 'invite_order',
  ADD COLUMN captain_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN deadline_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN weekly_digest boolean NOT NULL DEFAULT true,
  ADD COLUMN digest_frequency_days integer NOT NULL DEFAULT 7;
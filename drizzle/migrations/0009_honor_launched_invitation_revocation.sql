DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.claim_launched_roster_invite_v2(text,boolean)'::regprocedure) INTO definition;
 definition:=replace(definition,'IF EXISTS(SELECT 1 FROM public.season_participants WHERE season_id=s.id AND user_id=auth.uid() AND id<>p.id) THEN','IF EXISTS(SELECT 1 FROM public.season_invites WHERE season_id=s.id AND lower(recipient_email)=email) AND NOT EXISTS(SELECT 1 FROM public.season_invites WHERE season_id=s.id AND lower(recipient_email)=email AND status=''pending'' AND expires_at>now()) THEN RAISE EXCEPTION ''Invitation expired or revoked''; END IF;
 IF EXISTS(SELECT 1 FROM public.season_participants WHERE season_id=s.id AND user_id=auth.uid() AND id<>p.id) THEN');
 EXECUTE definition;
END $migration$;
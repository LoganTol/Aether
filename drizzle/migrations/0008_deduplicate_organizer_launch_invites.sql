DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.finalize_season_schedule_v2(uuid,jsonb)'::regprocedure) INTO definition;
 definition:=replace(definition,'AND lower(invited_email)=lower(inv.recipient_email) ORDER BY created_at,id LIMIT 1;','AND (lower(invited_email)=lower(inv.recipient_email) OR (user_id=auth.uid() AND lower(inv.recipient_email)=lower(auth.jwt()->>''email''))) ORDER BY created_at,id LIMIT 1;');
 EXECUTE definition;
END $migration$;
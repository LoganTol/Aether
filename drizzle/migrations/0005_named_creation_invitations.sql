ALTER TABLE public.season_invites ADD COLUMN recipient_name text;
CREATE OR REPLACE FUNCTION public.save_named_season_draft_v2(_key uuid,_name text,_format text,_start date,_end date,_players jsonb DEFAULT '[]') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb; player jsonb; emails text[] := '{}';
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
 IF _players IS NULL OR jsonb_typeof(_players)<>'array' THEN RAISE EXCEPTION 'Invalid player invitations'; END IF;
 IF jsonb_array_length(_players)>50 THEN RAISE EXCEPTION 'Prepare at most 50 invitations at a time'; END IF;
 FOR player IN SELECT value FROM jsonb_array_elements(_players) LOOP
  IF jsonb_typeof(player)<>'object' OR jsonb_typeof(player->'name') IS DISTINCT FROM 'string' OR jsonb_typeof(player->'email') IS DISTINCT FROM 'string' OR length(trim(player->>'name')) NOT BETWEEN 1 AND 60 OR length(trim(player->>'email')) NOT BETWEEN 3 AND 254 THEN RAISE EXCEPTION 'Enter a name and email for each player'; END IF;
  emails:=array_append(emails,lower(trim(player->>'email')));
 END LOOP;
 IF cardinality(emails)<>(SELECT count(DISTINCT e) FROM unnest(emails) e) THEN RAISE EXCEPTION 'Use a different email for each player'; END IF;
 result:=public.save_season_draft_v2(_key,_name,_format,_start,_end,emails);
 FOR player IN SELECT value FROM jsonb_array_elements(_players) LOOP
  UPDATE public.season_invites SET recipient_name=trim(player->>'name') WHERE season_id=(result->>'id')::uuid AND recipient_email=lower(trim(player->>'email')) AND status='pending';
 END LOOP;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.save_named_season_draft_v2(uuid,text,text,date,date,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_named_season_draft_v2(uuid,text,text,date,date,jsonb) TO authenticated;
DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.accept_season_invite_v2(text,boolean)'::regprocedure) INTO definition;
 definition:=replace(definition,'coalesce(nullif(auth.jwt()->''user_metadata''->>''display_name'',''''),split_part(auth.jwt()->>''email'',''@'',1))','coalesce(nullif(i.recipient_name,''''),nullif(auth.jwt()->''user_metadata''->>''display_name'',''''),split_part(auth.jwt()->>''email'',''@'',1))');
 EXECUTE definition;
END $migration$;
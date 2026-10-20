CREATE OR REPLACE FUNCTION public.prepare_named_season_invites_v2(_season uuid,_players jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE player jsonb; emails text[]:='{}';
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_season_creator(_season,auth.uid()) THEN RAISE EXCEPTION 'Organizer access required'; END IF;
 IF _players IS NULL OR jsonb_typeof(_players)<>'array' THEN RAISE EXCEPTION 'Invalid player invitations'; END IF;
 IF jsonb_array_length(_players) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Enter between 1 and 50 players'; END IF;
 FOR player IN SELECT value FROM jsonb_array_elements(_players) LOOP
  IF jsonb_typeof(player)<>'object' OR jsonb_typeof(player->'name') IS DISTINCT FROM 'string' OR jsonb_typeof(player->'email') IS DISTINCT FROM 'string' OR length(trim(player->>'name')) NOT BETWEEN 1 AND 60 OR length(trim(player->>'email')) NOT BETWEEN 3 AND 254 THEN RAISE EXCEPTION 'Enter a name and email for each player'; END IF;
  emails:=array_append(emails,lower(trim(player->>'email')));
 END LOOP;
 IF cardinality(emails)<>(SELECT count(DISTINCT e) FROM unnest(emails) e) THEN RAISE EXCEPTION 'Use a different email for each player'; END IF;
 FOR player IN SELECT value FROM jsonb_array_elements(_players) LOOP
  PERFORM public.manage_season_invite_v2(_season,player->>'email');
  UPDATE public.season_invites SET recipient_name=trim(player->>'name') WHERE season_id=_season AND recipient_email=lower(trim(player->>'email')) AND status='pending';
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.prepare_named_season_invites_v2(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.prepare_named_season_invites_v2(uuid,jsonb) TO authenticated;
DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.accept_season_invite_v2(text,boolean)'::regprocedure) INTO definition;
 definition:=replace(definition,'coalesce(nullif(i.recipient_name,''''),nullif(auth.jwt()', 'coalesce(nullif(i.recipient_name,''''),(SELECT nullif(recipient_name,'''') FROM public.season_invites WHERE season_id=s.id AND lower(recipient_email)=lower(auth.jwt()->>''email'') AND status=''pending'' AND expires_at>now() ORDER BY created_at DESC LIMIT 1),nullif(auth.jwt()');
 definition:=replace(definition,'IF i.recipient_email IS NOT NULL THEN UPDATE public.season_invites', 'UPDATE public.season_participants SET display_name=coalesce(nullif(i.recipient_name,''''),(SELECT nullif(recipient_name,'''') FROM public.season_invites WHERE season_id=s.id AND lower(recipient_email)=lower(auth.jwt()->>''email'') AND status=''pending'' AND expires_at>now() ORDER BY created_at DESC LIMIT 1),display_name) WHERE season_id=s.id AND user_id=auth.uid() AND status=''active''; IF i.recipient_email IS NOT NULL THEN UPDATE public.season_invites');
 EXECUTE definition;
END $migration$;
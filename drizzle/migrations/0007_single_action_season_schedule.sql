ALTER TABLE public.season_settings ADD COLUMN direct_match_scheduling boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.season_settings.direct_match_scheduling IS 'Single-action roster launch; assigned invitees can accept after launch and participants directly save match details. False preserves existing agreements.';
CREATE OR REPLACE FUNCTION public.finalize_season_schedule_v2(_season uuid, _teams jsonb DEFAULT '[]') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.seasons; cfg public.season_settings; inv public.season_invites; pid uuid; mapping jsonb:='{}'; t jsonb; a uuid; b uuid; used uuid[]:='{}'; players uuid[]; ids uuid[]; n integer; r integer; k integer; last_id uuid; total integer;
BEGIN
 SELECT * INTO s FROM public.seasons WHERE id=_season FOR UPDATE;
 IF NOT FOUND OR auth.uid() IS NULL OR NOT public.is_season_creator(_season,auth.uid()) THEN RAISE EXCEPTION 'Organizer access required'; END IF;
 SELECT * INTO cfg FROM public.season_settings WHERE season_id=_season FOR UPDATE;
 IF cfg.scheduling_mode IS NULL THEN RAISE EXCEPTION 'Use the existing season workflow'; END IF;
 SELECT count(*) INTO total FROM public.matches WHERE season_id=_season;
 IF s.status='active' AND total>0 THEN RETURN jsonb_build_object('existing',true,'matches',total); END IF;
 IF s.status<>'draft' OR total>0 OR s.roster_finalized THEN RAISE EXCEPTION 'Only an unstarted draft can be finalized'; END IF;
 FOR inv IN SELECT * FROM public.season_invites WHERE season_id=_season AND recipient_email IS NOT NULL AND status='pending' AND expires_at>now() ORDER BY created_at,id LOOP
  SELECT id INTO pid FROM public.season_participants WHERE season_id=_season AND status IN('active','invited') AND lower(invited_email)=lower(inv.recipient_email) ORDER BY created_at,id LIMIT 1;
  IF pid IS NULL THEN INSERT INTO public.season_participants(season_id,display_name,invited_email,status) VALUES(_season,coalesce(nullif(inv.recipient_name,''),inv.recipient_email),lower(inv.recipient_email),'invited') RETURNING id INTO pid; END IF;
  mapping:=mapping||jsonb_build_object('invite:'||inv.id::text,pid::text);
 END LOOP;
 SELECT array_agg(id ORDER BY created_at,id) INTO players FROM public.season_participants WHERE season_id=_season AND (status='active' AND user_id IS NOT NULL OR status='invited');
 IF coalesce(cardinality(players),0)<2 THEN RAISE EXCEPTION 'Add at least two players'; END IF;
 ids:=players;
 IF s.format='doubles' THEN
  IF cardinality(players)<4 OR cardinality(players)%2<>0 OR _teams IS NULL OR jsonb_typeof(_teams)<>'array' OR jsonb_array_length(_teams)*2<>cardinality(players) THEN RAISE EXCEPTION 'Assign every player to a fixed doubles team'; END IF;
  FOR t IN SELECT value FROM jsonb_array_elements(_teams) LOOP
   a:=coalesce(mapping->>(t->>'a'),t->>'a')::uuid; b:=coalesce(mapping->>(t->>'b'),t->>'b')::uuid;
   IF a IS NULL OR b IS NULL OR a=b OR NOT a=ANY(players) OR NOT b=ANY(players) OR a=ANY(used) OR b=ANY(used) OR length(coalesce(t->>'name',''))>80 THEN RAISE EXCEPTION 'Each player must belong to one fixed team'; END IF;
   used:=used||ARRAY[a,b];
  END LOOP;
  DELETE FROM public.doubles_teams WHERE season_id=_season;
  FOR t IN SELECT value FROM jsonb_array_elements(_teams) LOOP
   INSERT INTO public.doubles_teams(season_id,name,player_a_id,player_b_id) VALUES(_season,coalesce(nullif(trim(t->>'name'),''),'Team'),coalesce(mapping->>(t->>'a'),t->>'a')::uuid,coalesce(mapping->>(t->>'b'),t->>'b')::uuid);
  END LOOP;
  SELECT array_agg(id ORDER BY created_at,id) INTO ids FROM public.doubles_teams WHERE season_id=_season;
 END IF;
 n:=cardinality(ids); IF n*(n-1)/2>1000 THEN RAISE EXCEPTION 'Maximum 1000 fixtures'; END IF;
 UPDATE public.season_settings SET direct_match_scheduling=true WHERE season_id=_season;
 IF n%2=1 THEN ids:=array_append(ids,NULL); n:=n+1; END IF;
 FOR r IN 1..n-1 LOOP
  FOR k IN 1..n/2 LOOP
   a:=ids[k]; b:=ids[n+1-k];
   IF a IS NOT NULL AND b IS NOT NULL THEN INSERT INTO public.matches(season_id,round,side_kind,side_a_id,side_b_id,deadline_at,status) VALUES(_season,r,CASE WHEN s.format='doubles' THEN 'team'::public.match_side_kind ELSE 'player'::public.match_side_kind END,a,b,least((s.end_date+1)::timestamptz,(s.start_date+r*cfg.match_deadline_days)::timestamptz),'pending'); END IF;
  END LOOP;
  last_id:=ids[n]; ids:=ARRAY[ids[1],last_id]||ids[2:n-1];
 END LOOP;
 IF cfg.scheduling_mode='rotating_captain' AND NOT EXISTS(SELECT 1 FROM public.captain_rotation WHERE season_id=_season) THEN
  INSERT INTO public.captain_rotation(season_id,participant_id,position,is_current) SELECT _season,id,(row_number() OVER(ORDER BY CASE WHEN cfg.captain_rotation_mode='alphabetical' THEN display_name END,CASE WHEN cfg.captain_rotation_mode='random' THEN random() END,created_at,id)-1)::integer,false FROM public.season_participants WHERE id=ANY(players);
  UPDATE public.captain_rotation SET is_current=(position=0),window_start=CASE WHEN position=0 THEN now() END,window_end=CASE WHEN position=0 THEN now()+make_interval(days=>cfg.captain_window_days) END WHERE season_id=_season;
 END IF;
 UPDATE public.seasons SET status='active',lifecycle_status='active',roster_finalized=true WHERE id=_season;
 SELECT count(*) INTO total FROM public.matches WHERE season_id=_season;
 RETURN jsonb_build_object('existing',false,'matches',total);
END $$;
REVOKE ALL ON FUNCTION public.finalize_season_schedule_v2(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finalize_season_schedule_v2(uuid,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.claim_launched_roster_invite_v2(_token text,_decline boolean) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.season_invites; p public.season_participants; s public.seasons; email text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
 email:=lower(auth.jwt()->>'email');
 SELECT * INTO i FROM public.season_invites WHERE token=_token FOR UPDATE;
 IF FOUND THEN
  SELECT * INTO s FROM public.seasons WHERE id=i.season_id FOR UPDATE;
  IF i.status<>'pending' OR i.expires_at<=now() OR (i.recipient_email IS NOT NULL AND lower(i.recipient_email) IS DISTINCT FROM email) THEN RAISE EXCEPTION 'Use a valid invitation for your email address'; END IF;
  SELECT * INTO p FROM public.season_participants WHERE season_id=s.id AND status='invited' AND user_id IS NULL AND lower(invited_email)=email ORDER BY created_at,id LIMIT 1 FOR UPDATE;
 ELSE
  SELECT * INTO p FROM public.season_participants WHERE join_token=_token AND status='invited' AND user_id IS NULL FOR UPDATE;
  IF NOT FOUND OR p.invited_email IS NULL OR lower(p.invited_email) IS DISTINCT FROM email THEN RAISE EXCEPTION 'Use a valid invitation for your email address'; END IF;
  SELECT * INTO s FROM public.seasons WHERE id=p.season_id FOR UPDATE;
 END IF;
 IF p.id IS NULL OR s.status<>'active' OR NOT EXISTS(SELECT 1 FROM public.season_settings WHERE season_id=s.id AND direct_match_scheduling) THEN RAISE EXCEPTION 'You are not on the finalized roster'; END IF;
 IF EXISTS(SELECT 1 FROM public.season_participants WHERE season_id=s.id AND user_id=auth.uid() AND id<>p.id) THEN RAISE EXCEPTION 'You already belong to this season'; END IF;
 IF coalesce(_decline,false) THEN
  UPDATE public.season_participants SET status='withdrawn' WHERE id=p.id;
  UPDATE public.season_invites SET status='declined' WHERE season_id=s.id AND lower(recipient_email)=email AND status='pending'; RETURN NULL;
 END IF;
 UPDATE public.season_participants SET user_id=auth.uid(),status='active',joined_at=now() WHERE id=p.id;
 UPDATE public.season_invites SET status='accepted',accepted_by=auth.uid() WHERE season_id=s.id AND lower(recipient_email)=email AND status='pending';
 RETURN s.id;
END $$;
REVOKE ALL ON FUNCTION public.claim_launched_roster_invite_v2(text,boolean) FROM PUBLIC,anon,authenticated;
DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.guard_v2_lifecycle_write()'::regprocedure) INTO definition;
 definition:=replace(definition,'IF NEW.user_id IS NULL OR EXISTS(SELECT 1 FROM public.seasons WHERE id=new_sid AND (roster_finalized OR status<>''draft'')) THEN','IF NEW.user_id IS NULL OR (EXISTS(SELECT 1 FROM public.seasons WHERE id=new_sid AND (roster_finalized OR status<>''draft'')) AND NOT (TG_OP=''UPDATE'' AND OLD.status=''invited'' AND OLD.user_id IS NULL AND NEW.season_id=OLD.season_id AND NEW.id=OLD.id AND current_user IN(''postgres'',''service_role'') AND EXISTS(SELECT 1 FROM public.season_settings cfg JOIN public.seasons s ON s.id=cfg.season_id WHERE s.id=new_sid AND s.status=''active'' AND cfg.direct_match_scheduling))) THEN');
 EXECUTE definition;
 SELECT pg_get_functiondef('public.accept_season_invite_v2(text,boolean)'::regprocedure) INTO definition;
 definition:=replace(definition,'IF auth.uid() IS NULL THEN RAISE EXCEPTION ''Sign in first''; END IF;','IF auth.uid() IS NULL THEN RAISE EXCEPTION ''Sign in first''; END IF; IF EXISTS(SELECT 1 FROM public.season_settings cfg JOIN public.seasons s ON s.id=cfg.season_id WHERE cfg.direct_match_scheduling AND s.status=''active'' AND (EXISTS(SELECT 1 FROM public.season_invites WHERE season_id=s.id AND token=_token) OR EXISTS(SELECT 1 FROM public.season_participants WHERE season_id=s.id AND join_token=_token))) THEN RETURN public.claim_launched_roster_invite_v2(_token,_decline); END IF;');
 EXECUTE definition;
 SELECT pg_get_functiondef('public.inspect_season_invite_v2(text)'::regprocedure) INTO definition;
 definition:=replace(definition,'IF length(_token)>150 THEN RETURN NULL; END IF;','IF length(_token)>150 THEN RETURN NULL; END IF; SELECT s0.* INTO s FROM public.seasons s0 JOIN public.season_settings cfg ON cfg.season_id=s0.id WHERE s0.status=''active'' AND cfg.direct_match_scheduling AND (EXISTS(SELECT 1 FROM public.season_invites x WHERE x.season_id=s0.id AND x.token=_token AND x.status=''pending'' AND x.expires_at>now()) OR EXISTS(SELECT 1 FROM public.season_participants x WHERE x.season_id=s0.id AND x.join_token=_token AND x.status=''invited'' AND x.user_id IS NULL)); IF FOUND THEN RETURN jsonb_build_object(''id'',s.id,''name'',s.name,''format'',s.format,''targeted'',true,''legacy'',false); END IF;');
 EXECUTE definition;
 SELECT pg_get_functiondef('public.match_action_v2(uuid,text,timestamp with time zone,text,jsonb)'::regprocedure) INTO definition;
 definition:=replace(definition,'IF _action IN (''propose'',''accept_time'',''override_time'') THEN','IF _action=''save_details'' THEN
 IF NOT cfg.direct_match_scheduling OR (side IS NULL AND NOT creator) THEN RAISE EXCEPTION ''Only match participants or the organizer can edit this match''; END IF;
 IF m.status IN(''completed'',''forfeited'',''disputed'') OR EXISTS(SELECT 1 FROM public.match_results WHERE match_id=_match) THEN RAISE EXCEPTION ''Match already has a result''; END IF;
 IF _time IS NULL OR length(coalesce(_location,''''))>200 OR _time<(SELECT start_date::timestamptz FROM public.seasons WHERE id=m.season_id) OR _time>=(SELECT (end_date+1)::timestamptz FROM public.seasons WHERE id=m.season_id) THEN RAISE EXCEPTION ''Choose a date and time within the season''; END IF;
 UPDATE public.match_time_proposals SET responded_at=now() WHERE match_id=_match AND responded_at IS NULL;
 UPDATE public.matches SET scheduled_at=_time,location=nullif(trim(_location),''''),scheduled_by=me,status=''scheduled'' WHERE id=_match;
 RETURN;
 END IF;
 IF _action IN (''propose'',''accept_time'',''override_time'') THEN');
 definition:=replace(definition,'IF m.status<>''scheduled'' THEN RAISE EXCEPTION ''Schedule the match before submitting a score''; END IF;','IF NOT cfg.direct_match_scheduling AND m.status<>''scheduled'' THEN RAISE EXCEPTION ''Schedule the match before submitting a score''; END IF;');
 EXECUTE definition;
END $migration$;
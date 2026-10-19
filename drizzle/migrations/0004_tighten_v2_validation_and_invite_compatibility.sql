DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.save_season_draft_v2(uuid,text,text,date,date,text[])'::regprocedure) INTO definition;
 definition:=replace(definition,'IF _key IS NULL OR length(trim(_name))','IF _name IS NULL OR _emails IS NULL OR _format IS NULL OR _key IS NULL OR length(trim(_name))');
 EXECUTE definition;
 SELECT pg_get_functiondef('public.accept_season_invite_v2(text,boolean)'::regprocedure) INTO definition;
 definition:=replace(definition,'IF _decline THEN UPDATE public.season_participants','SELECT * INTO s FROM public.seasons WHERE id=p.season_id FOR UPDATE; IF public.is_v2_season(s.id) AND (s.roster_finalized OR s.status<>''draft'') THEN RAISE EXCEPTION ''Roster finalized''; END IF; IF EXISTS(SELECT 1 FROM public.season_participants WHERE season_id=p.season_id AND user_id=auth.uid() AND status=''active'' AND id<>p.id) THEN RAISE EXCEPTION ''You already belong to this season''; END IF; IF _decline THEN UPDATE public.season_participants');
 EXECUTE definition;
 SELECT pg_get_functiondef('public.inspect_season_invite_v2(text)'::regprocedure) INTO definition;
 definition:=replace(definition,'RETURN jsonb_build_object(''id'',s.id,''name'',s.name,''format'',s.format,''display_name''','IF public.is_v2_season(s.id) AND (s.roster_finalized OR s.status<>''draft'') THEN RETURN NULL; END IF; RETURN jsonb_build_object(''id'',s.id,''name'',s.name,''format'',s.format,''display_name''');
 EXECUTE definition;
 SELECT pg_get_functiondef('public.match_action_v2(uuid,text,timestamptz,text,jsonb)'::regprocedure) INTO definition;
 definition:=replace(definition,'IF NOT creator OR _time IS NULL OR _time<=now() THEN','IF NOT creator OR _time IS NULL OR _time<=now() OR length(coalesce(_location,''''))>200 OR _time>(SELECT (end_date+1)::timestamptz FROM public.seasons WHERE id=m.season_id) THEN');
 definition:=replace(definition,'IF side IS NULL AND NOT creator THEN','IF m.status<>''scheduled'' THEN RAISE EXCEPTION ''Schedule the match before submitting a score''; END IF; IF side IS NULL AND NOT creator THEN');
 definition:=replace(definition,'OR m.status=''completed'' THEN','OR m.status IN(''completed'',''forfeited'') THEN');
 EXECUTE definition;
END $migration$;
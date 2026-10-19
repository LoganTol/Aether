ALTER TABLE public.seasons ADD COLUMN setup_key uuid;
ALTER TABLE public.seasons ADD COLUMN roster_finalized boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX seasons_setup_key_idx ON public.seasons(creator_id,setup_key) WHERE setup_key IS NOT NULL;
ALTER TABLE public.season_settings ADD COLUMN scheduling_mode text;
ALTER TABLE public.season_settings ADD COLUMN result_confirmation boolean NOT NULL DEFAULT true;
ALTER TABLE public.match_time_proposals ADD COLUMN confirmed_participant_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.match_time_proposals ADD COLUMN location text;
CREATE TABLE public.season_invites(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32),'hex'),recipient_email text,status text NOT NULL DEFAULT 'pending',expires_at timestamptz NOT NULL DEFAULT now()+interval '30 days',accepted_by uuid,created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.season_invites TO authenticated;
GRANT ALL ON public.season_invites TO service_role;
ALTER TABLE public.season_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creator views invitations" ON public.season_invites FOR SELECT TO authenticated USING(public.is_season_creator(season_id,auth.uid()));
CREATE OR REPLACE FUNCTION public.is_v2_season(_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.season_settings WHERE season_id=_id AND scheduling_mode IS NOT NULL) $$;
CREATE OR REPLACE FUNCTION public.save_season_draft_v2(_key uuid,_name text,_format text,_start date,_end date,_emails text[] DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.seasons; e text; tok text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
 IF _key IS NULL OR length(trim(_name)) NOT BETWEEN 1 AND 80 OR _format NOT IN ('singles','doubles') OR _start IS NULL OR _end IS NULL OR _end<=_start OR cardinality(_emails)>50 THEN RAISE EXCEPTION 'Invalid season details'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text||_key::text,0));
 SELECT * INTO s FROM public.seasons WHERE creator_id=auth.uid() AND setup_key=_key FOR UPDATE;
 IF FOUND AND (s.status<>'draft' OR s.roster_finalized) THEN RAISE EXCEPTION 'This season has already started'; END IF;
 IF s.id IS NULL THEN
 INSERT INTO public.seasons(creator_id,name,format,start_date,end_date,status,lifecycle_status,setup_key) VALUES(auth.uid(),trim(_name),_format::public.season_format,_start,_end,'draft','draft',_key) RETURNING * INTO s;
 INSERT INTO public.season_settings(season_id,scheduling_mode,auto_rotate_captain,score_format,result_confirmation,weekly_digest) VALUES(s.id,'player_led',false,'best_of_3',true,false);
 INSERT INTO public.season_participants(season_id,user_id,display_name,status,joined_at) VALUES(s.id,auth.uid(),coalesce(nullif(auth.jwt()->'user_metadata'->>'display_name',''),split_part(auth.jwt()->>'email','@',1),'Organizer'),'active',now());
 INSERT INTO public.season_invites(season_id) VALUES(s.id);
 ELSE
 IF s.format::text<>_format AND EXISTS(SELECT 1 FROM public.doubles_teams WHERE season_id=s.id) THEN RAISE EXCEPTION 'Remove existing teams before changing format'; END IF;
 UPDATE public.seasons SET name=trim(_name),format=_format::public.season_format,start_date=_start,end_date=_end WHERE id=s.id;
 END IF;
 FOREACH e IN ARRAY _emails LOOP
 e:=lower(trim(e));
 IF e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(e)>254 THEN RAISE EXCEPTION 'Invalid email address'; END IF;
 IF e<>lower(auth.jwt()->>'email') AND NOT EXISTS(SELECT 1 FROM public.season_invites WHERE season_id=s.id AND recipient_email=e AND status IN('pending','accepted') AND expires_at>now()) THEN INSERT INTO public.season_invites(season_id,recipient_email) VALUES(s.id,e); END IF;
 END LOOP;
 SELECT token INTO tok FROM public.season_invites WHERE season_id=s.id AND recipient_email IS NULL AND status='pending' AND expires_at>now() ORDER BY created_at DESC LIMIT 1;
 IF tok IS NULL THEN INSERT INTO public.season_invites(season_id) VALUES(s.id) RETURNING token INTO tok; END IF;
 RETURN jsonb_build_object('id',s.id,'token',tok);
END $$;
CREATE OR REPLACE FUNCTION public.inspect_season_invite_v2(_token text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.season_invites; p public.season_participants; s public.seasons;
BEGIN
 IF length(_token)>150 THEN RETURN NULL; END IF;
 SELECT * INTO i FROM public.season_invites WHERE token=_token;
 IF FOUND THEN
 SELECT * INTO s FROM public.seasons WHERE id=i.season_id;
 IF i.status<>'pending' OR i.expires_at<=now() OR s.roster_finalized OR s.status<>'draft' THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('id',s.id,'name',s.name,'format',s.format,'targeted',i.recipient_email IS NOT NULL,'legacy',false);
 END IF;
 SELECT * INTO p FROM public.season_participants WHERE join_token=_token AND status='invited' AND user_id IS NULL;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT * INTO s FROM public.seasons WHERE id=p.season_id;
 RETURN jsonb_build_object('id',s.id,'name',s.name,'format',s.format,'display_name',p.display_name,'targeted',p.invited_email IS NOT NULL,'legacy',true);
END $$;
CREATE OR REPLACE FUNCTION public.accept_season_invite_v2(_token text,_decline boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.season_invites; p public.season_participants; s public.seasons;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
 SELECT * INTO i FROM public.season_invites WHERE token=_token FOR UPDATE;
 IF FOUND THEN
 SELECT * INTO s FROM public.seasons WHERE id=i.season_id FOR UPDATE;
 IF i.status<>'pending' OR i.expires_at<=now() OR s.roster_finalized OR s.status<>'draft' THEN RAISE EXCEPTION 'Invite expired, revoked or roster finalized'; END IF;
 IF i.recipient_email IS NOT NULL AND lower(i.recipient_email)<>lower(auth.jwt()->>'email') THEN RAISE EXCEPTION 'Sign in with the invited email address'; END IF;
 IF _decline THEN
 IF i.recipient_email IS NULL THEN RAISE EXCEPTION 'Only personal invites can be declined'; END IF;
 UPDATE public.season_invites SET status='declined' WHERE id=i.id; RETURN NULL;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.season_participants WHERE season_id=s.id AND user_id=auth.uid() AND status='active') THEN
 IF EXISTS(SELECT 1 FROM public.season_participants WHERE season_id=s.id AND user_id=auth.uid() AND status='withdrawn') THEN RAISE EXCEPTION 'Ask the organizer to restore membership'; END IF;
 INSERT INTO public.season_participants(season_id,user_id,display_name,invited_email,status,joined_at) VALUES(s.id,auth.uid(),coalesce(nullif(auth.jwt()->'user_metadata'->>'display_name',''),split_part(auth.jwt()->>'email','@',1)),auth.jwt()->>'email','active',now());
 END IF;
 IF i.recipient_email IS NOT NULL THEN UPDATE public.season_invites SET status='accepted',accepted_by=auth.uid() WHERE id=i.id; END IF;
 RETURN s.id;
 END IF;
 SELECT * INTO p FROM public.season_participants WHERE join_token=_token FOR UPDATE;
 IF NOT FOUND OR p.status<>'invited' OR p.user_id IS NOT NULL THEN RAISE EXCEPTION 'Invite invalid or already claimed'; END IF;
 IF p.invited_email IS NOT NULL AND lower(p.invited_email)<>lower(auth.jwt()->>'email') THEN RAISE EXCEPTION 'Sign in with the invited email address'; END IF;
 IF _decline THEN UPDATE public.season_participants SET status='withdrawn' WHERE id=p.id; RETURN NULL; END IF;
 UPDATE public.season_participants SET user_id=auth.uid(),status='active',joined_at=now() WHERE id=p.id;
 RETURN p.season_id;
END $$;
CREATE OR REPLACE FUNCTION public.manage_season_invite_v2(_season uuid,_email text DEFAULT NULL,_revoke uuid DEFAULT NULL) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tok text; s public.seasons;
BEGIN
 SELECT * INTO s FROM public.seasons WHERE id=_season FOR UPDATE;
 IF NOT FOUND OR NOT public.is_season_creator(_season,auth.uid()) THEN RAISE EXCEPTION 'Organizer access required'; END IF;
 IF _revoke IS NOT NULL THEN UPDATE public.season_invites SET status='revoked' WHERE id=_revoke AND season_id=_season AND status='pending'; RETURN NULL; END IF;
 IF s.status<>'draft' OR s.roster_finalized THEN RAISE EXCEPTION 'Roster finalized'; END IF;
 IF _email IS NOT NULL THEN _email:=lower(trim(_email)); IF _email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(_email)>254 THEN RAISE EXCEPTION 'Invalid email'; END IF; END IF;
 SELECT token INTO tok FROM public.season_invites WHERE season_id=_season AND recipient_email IS NOT DISTINCT FROM _email AND status='pending' AND expires_at>now() LIMIT 1;
 IF tok IS NULL THEN INSERT INTO public.season_invites(season_id,recipient_email) VALUES(_season,_email) RETURNING token INTO tok; END IF;
 RETURN tok;
END $$;
CREATE OR REPLACE FUNCTION public.save_doubles_teams_v2(_season uuid,_teams jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t jsonb; used uuid[]:='{}'; a uuid; b uuid; s public.seasons;
BEGIN
 SELECT * INTO s FROM public.seasons WHERE id=_season FOR UPDATE;
 IF NOT FOUND OR NOT public.is_season_creator(_season,auth.uid()) OR s.status<>'draft' OR s.roster_finalized OR s.format<>'doubles' THEN RAISE EXCEPTION 'Draft doubles organizer access required'; END IF;
 IF jsonb_typeof(_teams)<>'array' THEN RAISE EXCEPTION 'Invalid teams'; END IF;
 FOR t IN SELECT * FROM jsonb_array_elements(_teams) LOOP
 a:=(t->>'a')::uuid; b:=(t->>'b')::uuid;
 IF a IS NULL OR b IS NULL OR a=b OR a=ANY(used) OR b=ANY(used) OR (SELECT count(*) FROM public.season_participants WHERE season_id=_season AND status='active' AND id IN(a,b))<>2 THEN RAISE EXCEPTION 'Each confirmed player belongs to one fixed team'; END IF;
 used:=used||ARRAY[a,b]; END LOOP;
 DELETE FROM public.doubles_teams WHERE season_id=_season;
 FOR t IN SELECT * FROM jsonb_array_elements(_teams) LOOP INSERT INTO public.doubles_teams(season_id,name,player_a_id,player_b_id) VALUES(_season,left(coalesce(nullif(trim(t->>'name'),''),'Team'),80),(t->>'a')::uuid,(t->>'b')::uuid); END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.season_fixtures_v2(_season uuid,_activate boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.seasons; cfg public.season_settings; ids uuid[]; active_ids uuid[]; n integer; r integer; k integer; a uuid; b uuid; pairings jsonb:='[]'; row_count integer; last_id uuid;
BEGIN
 SELECT * INTO s FROM public.seasons WHERE id=_season FOR UPDATE;
 IF NOT FOUND OR NOT public.is_season_creator(_season,auth.uid()) THEN RAISE EXCEPTION 'Organizer access required'; END IF;
 SELECT * INTO cfg FROM public.season_settings WHERE season_id=_season;
 IF cfg.scheduling_mode IS NULL THEN RAISE EXCEPTION 'Use the existing legacy season workflow'; END IF;
 SELECT count(*) INTO row_count FROM public.matches WHERE season_id=_season;
 IF row_count>0 THEN RETURN jsonb_build_object('existing',true,'matches',row_count); END IF;
 IF s.status<>'draft' THEN RAISE EXCEPTION 'Only drafts can generate schedules'; END IF;
 SELECT array_agg(id ORDER BY created_at,id) INTO active_ids FROM public.season_participants WHERE season_id=_season AND status='active' AND user_id IS NOT NULL;
 IF coalesce(cardinality(active_ids),0)<2 THEN RAISE EXCEPTION 'At least two confirmed players required'; END IF;
 ids:=active_ids;
 IF s.format='doubles' THEN
 IF cardinality(active_ids)<4 OR cardinality(active_ids)%2<>0 THEN RAISE EXCEPTION 'Doubles needs at least four confirmed players and an even roster'; END IF;
 IF (SELECT count(*) FROM public.doubles_teams WHERE season_id=_season)*2<>cardinality(active_ids) OR (SELECT count(DISTINCT player) FROM (SELECT player_a_id AS player FROM public.doubles_teams WHERE season_id=_season UNION ALL SELECT player_b_id FROM public.doubles_teams WHERE season_id=_season) q WHERE player=ANY(active_ids))<>cardinality(active_ids) THEN RAISE EXCEPTION 'Assign every confirmed player to one fixed doubles team'; END IF;
 SELECT array_agg(id ORDER BY created_at,id) INTO ids FROM public.doubles_teams WHERE season_id=_season;
 END IF;
 n:=cardinality(ids); IF n*(n-1)/2>1000 THEN RAISE EXCEPTION 'Maximum 1000 fixtures'; END IF;
 IF n%2=1 THEN ids:=array_append(ids,NULL); n:=n+1; END IF;
 FOR r IN 1..n-1 LOOP
 FOR k IN 1..n/2 LOOP a:=ids[k]; b:=ids[n+1-k]; IF a IS NOT NULL AND b IS NOT NULL THEN pairings:=pairings||jsonb_build_array(jsonb_build_object('round',r,'a',a,'b',b)); END IF; END LOOP;
 last_id:=ids[n]; ids:=ARRAY[ids[1],last_id]||ids[2:n-1]; END LOOP;
 IF _activate THEN
 PERFORM set_config('aether.v2_internal','on',true);
 INSERT INTO public.matches(season_id,round,side_kind,side_a_id,side_b_id,deadline_at,status) SELECT _season,(p->>'round')::integer,CASE WHEN s.format='doubles' THEN 'team'::public.match_side_kind ELSE 'player'::public.match_side_kind END,(p->>'a')::uuid,(p->>'b')::uuid,least((s.end_date+1)::timestamptz,(s.start_date+((p->>'round')::integer*cfg.match_deadline_days))::timestamptz),'pending' FROM jsonb_array_elements(pairings) p;
 IF cfg.scheduling_mode='rotating_captain' AND NOT EXISTS(SELECT 1 FROM public.captain_rotation WHERE season_id=_season) THEN
 INSERT INTO public.captain_rotation(season_id,participant_id,position,is_current) SELECT _season,id,(row_number() OVER(ORDER BY CASE WHEN cfg.captain_rotation_mode='alphabetical' THEN display_name END,CASE WHEN cfg.captain_rotation_mode='random' THEN random() END,created_at,id)-1)::integer,false FROM public.season_participants WHERE id=ANY(active_ids);
 UPDATE public.captain_rotation SET is_current=(position=0),window_start=CASE WHEN position=0 THEN now() ELSE NULL END,window_end=CASE WHEN position=0 THEN now()+make_interval(days=>cfg.captain_window_days) ELSE NULL END WHERE season_id=_season;
 END IF;
 UPDATE public.seasons SET status='active',lifecycle_status='active',roster_finalized=true WHERE id=_season;
 END IF;
 RETURN jsonb_build_object('existing',false,'matches',jsonb_array_length(pairings),'fixtures',pairings);
END $$;
REVOKE ALL ON FUNCTION public.save_season_draft_v2(uuid,text,text,date,date,text[]),public.accept_season_invite_v2(text,boolean),public.manage_season_invite_v2(uuid,text,uuid),public.save_doubles_teams_v2(uuid,jsonb),public.season_fixtures_v2(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_season_draft_v2(uuid,text,text,date,date,text[]),public.accept_season_invite_v2(text,boolean),public.manage_season_invite_v2(uuid,text,uuid),public.save_doubles_teams_v2(uuid,jsonb),public.season_fixtures_v2(uuid,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.inspect_season_invite_v2(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inspect_season_invite_v2(text) TO anon,authenticated;
COMMENT ON COLUMN public.season_settings.scheduling_mode IS 'NULL preserves legacy captain behavior; explicitly set for Season Creation V2.';
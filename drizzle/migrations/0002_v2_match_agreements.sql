CREATE OR REPLACE FUNCTION public.match_side_v2(_match uuid,_participant uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT CASE WHEN m.side_kind='player' AND m.side_a_id=p.id THEN 'a' WHEN m.side_kind='player' AND m.side_b_id=p.id THEN 'b' WHEN m.side_kind='team' AND EXISTS(SELECT 1 FROM public.doubles_teams t WHERE t.id=m.side_a_id AND p.id IN(t.player_a_id,t.player_b_id)) THEN 'a' WHEN m.side_kind='team' AND EXISTS(SELECT 1 FROM public.doubles_teams t WHERE t.id=m.side_b_id AND p.id IN(t.player_a_id,t.player_b_id)) THEN 'b' END FROM public.matches m JOIN public.season_participants p ON p.season_id=m.season_id AND p.id=_participant AND p.status='active' WHERE m.id=_match
$$;
CREATE OR REPLACE FUNCTION public.match_action_v2(_match uuid,_action text,_time timestamptz DEFAULT NULL,_location text DEFAULT NULL,_scores jsonb DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.matches; cfg public.season_settings; me uuid; side text; proposal public.match_time_proposals; result public.match_results; required uuid[]; set_row jsonb; wa integer:=0; wb integer:=0; ga integer; gb integer; idx integer:=0; creator boolean;
BEGIN
 SELECT * INTO m FROM public.matches WHERE id=_match FOR UPDATE;
 IF NOT FOUND OR NOT public.is_season_member(m.season_id,auth.uid()) THEN RAISE EXCEPTION 'Match access required'; END IF;
 SELECT * INTO cfg FROM public.season_settings WHERE season_id=m.season_id;
 IF cfg.scheduling_mode IS NULL THEN RAISE EXCEPTION 'Legacy match'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.seasons WHERE id=m.season_id AND status='active') THEN RAISE EXCEPTION 'Competition is not active'; END IF;
 SELECT id INTO me FROM public.season_participants WHERE season_id=m.season_id AND user_id=auth.uid() AND status='active' LIMIT 1;
 side:=public.match_side_v2(_match,me); creator:=public.is_season_creator(m.season_id,auth.uid());
 PERFORM set_config('aether.v2_internal','on',true);
 IF _action IN ('propose','accept_time','override_time') THEN
 IF _action='override_time' THEN
 IF NOT creator OR _time IS NULL OR _time<=now() THEN RAISE EXCEPTION 'Organizer and future time required'; END IF;
 IF m.status IN('completed','forfeited','disputed') OR EXISTS(SELECT 1 FROM public.match_results WHERE match_id=_match) THEN RAISE EXCEPTION 'Match already has a result'; END IF;
 UPDATE public.match_time_proposals SET responded_at=now() WHERE match_id=_match AND responded_at IS NULL;
 UPDATE public.matches SET status='scheduled',scheduled_at=_time,location=left(trim(_location),200),scheduled_by=me WHERE id=_match;
 INSERT INTO public.admin_actions_log(season_id,actor_id,action_type,target_id) VALUES(m.season_id,auth.uid(),'schedule_override',_match);
 RETURN;
 END IF;
 IF side IS NULL THEN RAISE EXCEPTION 'Only match participants can coordinate this match'; END IF;
 IF cfg.scheduling_mode='organizer_managed' AND NOT creator THEN RAISE EXCEPTION 'Organizer manages scheduling'; END IF;
 IF m.status IN('completed','forfeited','disputed') OR EXISTS(SELECT 1 FROM public.match_results WHERE match_id=_match) THEN RAISE EXCEPTION 'Match already has a result'; END IF;
 IF m.side_kind='player' THEN
 SELECT array_agg(id) INTO required FROM public.season_participants WHERE id IN(m.side_a_id,m.side_b_id) AND status='active';
 ELSE SELECT array_agg(p.id) INTO required FROM public.season_participants p WHERE p.status='active' AND EXISTS(SELECT 1 FROM public.doubles_teams t WHERE t.id IN(m.side_a_id,m.side_b_id) AND p.id IN(t.player_a_id,t.player_b_id)); END IF;
 IF coalesce(cardinality(required),0) <> (CASE WHEN m.side_kind='player' THEN 2 ELSE 4 END) THEN RAISE EXCEPTION 'Players have withdrawn; ask the organizer'; END IF;
 IF _action='propose' THEN
 IF _time IS NULL OR _time<=now() OR length(coalesce(_location,''))>200 OR _time>(SELECT (end_date+1)::timestamptz FROM public.seasons WHERE id=m.season_id) THEN RAISE EXCEPTION 'Choose a future time within the season'; END IF;
 UPDATE public.match_time_proposals SET responded_at=now() WHERE match_id=_match AND responded_at IS NULL;
 INSERT INTO public.match_time_proposals(match_id,proposed_by,slot_1,expires_at,confirmed_participant_ids,location) VALUES(_match,me,_time,least(_time,now()+interval '7 days'),ARRAY[me],trim(_location));
 UPDATE public.matches SET status='proposed',scheduled_at=NULL,location=NULL WHERE id=_match;
 ELSE
 SELECT * INTO proposal FROM public.match_time_proposals WHERE match_id=_match AND responded_at IS NULL ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
 IF NOT FOUND OR proposal.expires_at<=now() THEN RAISE EXCEPTION 'Proposal expired; propose a new time'; END IF;
 IF NOT me=ANY(proposal.confirmed_participant_ids) THEN proposal.confirmed_participant_ids:=array_append(proposal.confirmed_participant_ids,me); END IF;
 UPDATE public.match_time_proposals SET confirmed_participant_ids=proposal.confirmed_participant_ids WHERE id=proposal.id;
 IF required<@proposal.confirmed_participant_ids THEN
 UPDATE public.match_time_proposals SET accepted_slot=slot_1,responded_at=now() WHERE id=proposal.id;
 UPDATE public.matches SET status='scheduled',scheduled_at=proposal.slot_1,location=proposal.location,scheduled_by=proposal.proposed_by WHERE id=_match;
 END IF;
 END IF;
 ELSIF _action='submit_score' THEN
 IF side IS NULL AND NOT creator THEN RAISE EXCEPTION 'Either match side or organizer may submit results'; END IF;
 IF m.status IN('completed','forfeited') OR EXISTS(SELECT 1 FROM public.match_results WHERE match_id=_match) THEN RAISE EXCEPTION 'Result already submitted'; END IF;
 IF _scores IS NULL OR jsonb_typeof(_scores)<>'array' OR jsonb_array_length(_scores) NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'Enter valid sets'; END IF;
 FOR set_row IN SELECT * FROM jsonb_array_elements(_scores) LOOP
 ga:=(set_row->>'a')::integer; gb:=(set_row->>'b')::integer; idx:=idx+1;
 IF ga IS NULL OR gb IS NULL OR ga<0 OR gb<0 OR ga>20 OR gb>20 OR ga=gb THEN RAISE EXCEPTION 'Invalid games'; END IF;
 IF cfg.score_format='best_of_3' AND (wa=2 OR wb=2) THEN RAISE EXCEPTION 'No sets after match decided'; END IF;
 IF cfg.score_format='pro_set_8' THEN
 IF NOT ((greatest(ga,gb)=8 AND least(ga,gb)<=6) OR (greatest(ga,gb)=9 AND least(ga,gb) IN(7,8))) THEN RAISE EXCEPTION 'Invalid pro-set score'; END IF;
 ELSE
 IF NOT ((greatest(ga,gb)=6 AND least(ga,gb)<=4) OR (greatest(ga,gb)=7 AND least(ga,gb) IN(5,6))) THEN RAISE EXCEPTION 'Sets must finish at 6 or 7 games'; END IF;
 END IF;
 IF ga>gb THEN wa:=wa+1; ELSE wb:=wb+1; END IF;
 END LOOP;
 IF (cfg.score_format='best_of_3' AND greatest(wa,wb)<>2) OR (cfg.score_format<>'best_of_3' AND idx<>1) THEN RAISE EXCEPTION 'Enter a complete match score'; END IF;
 INSERT INTO public.match_scores(match_id,set_number,side_a_games,side_b_games) SELECT _match,ord::integer,(v->>'a')::integer,(v->>'b')::integer FROM jsonb_array_elements(_scores) WITH ORDINALITY q(v,ord);
 INSERT INTO public.match_results(match_id,winner_side,entered_by,resolved_by_admin) VALUES(_match,CASE WHEN wa>wb THEN 'a'::public.winner_side ELSE 'b'::public.winner_side END,me,CASE WHEN side IS NULL AND creator THEN auth.uid() ELSE NULL END);
 UPDATE public.matches SET status=CASE WHEN NOT cfg.result_confirmation OR (side IS NULL AND creator) THEN 'completed'::public.match_status ELSE 'scheduled'::public.match_status END,completed_at=CASE WHEN NOT cfg.result_confirmation OR (side IS NULL AND creator) THEN now() ELSE NULL END,result_confirmed_at=CASE WHEN NOT cfg.result_confirmation OR (side IS NULL AND creator) THEN now() ELSE NULL END WHERE id=_match;
 ELSIF _action IN('confirm_score','dispute_score','resolve_score','forfeit') THEN
 IF _action='forfeit' THEN
 IF NOT creator OR m.status IN('completed','forfeited') THEN RAISE EXCEPTION 'Organizer review required'; END IF;
 UPDATE public.matches SET status='forfeited',completed_at=now() WHERE id=_match;
 INSERT INTO public.admin_actions_log(season_id,actor_id,action_type,target_id) VALUES(m.season_id,auth.uid(),'forfeit_review',_match); RETURN;
 END IF;
 SELECT * INTO result FROM public.match_results WHERE match_id=_match FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'No result submitted'; END IF;
 IF _action='resolve_score' THEN
 IF NOT creator OR NOT result.disputed THEN RAISE EXCEPTION 'Organizer resolves disputed results'; END IF;
 UPDATE public.match_results SET disputed=false,resolved_by_admin=auth.uid() WHERE id=result.id;
 UPDATE public.matches SET status='completed',completed_at=now(),result_confirmed_at=now() WHERE id=_match;
 INSERT INTO public.admin_actions_log(season_id,actor_id,action_type,target_id) VALUES(m.season_id,auth.uid(),'result_resolved',_match);
 ELSE
 IF side IS NULL OR side IS NOT DISTINCT FROM public.match_side_v2(_match,result.entered_by) OR result.confirmed_by IS NOT NULL OR result.disputed OR m.status='completed' THEN RAISE EXCEPTION 'Opposing side must respond to pending result'; END IF;
 IF _action='confirm_score' THEN
 UPDATE public.match_results SET confirmed_by=me WHERE id=result.id;
 UPDATE public.matches SET status='completed',completed_at=now(),result_confirmed_at=now() WHERE id=_match;
 ELSE
 UPDATE public.match_results SET disputed=true WHERE id=result.id;
 UPDATE public.matches SET status='disputed',completed_at=NULL,result_confirmed_at=NULL WHERE id=_match;
 END IF;
 END IF;
 ELSE RAISE EXCEPTION 'Unknown match action'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.guard_v2_match_write() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE sid uuid;
BEGIN
 IF TG_TABLE_NAME='matches' THEN sid:=NEW.season_id; ELSE SELECT season_id INTO sid FROM public.matches WHERE id=coalesce(NEW.match_id,OLD.match_id); END IF;
 IF public.is_v2_season(sid) AND coalesce(current_setting('aether.v2_internal',true),'')<>'on' AND current_user NOT IN('postgres','service_role') THEN
 IF TG_TABLE_NAME='matches' AND TG_OP='INSERT' AND public.is_season_creator(sid,auth.uid()) THEN
 IF NOT EXISTS(SELECT 1 FROM public.seasons WHERE id=sid AND status='active') THEN RAISE EXCEPTION 'Generate draft schedule first'; END IF;
 ELSE RAISE EXCEPTION 'Use protected match workflow'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER guard_v2_matches BEFORE INSERT OR UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.guard_v2_match_write();
CREATE TRIGGER guard_v2_scores BEFORE INSERT OR UPDATE OR DELETE ON public.match_scores FOR EACH ROW EXECUTE FUNCTION public.guard_v2_match_write();
CREATE TRIGGER guard_v2_results BEFORE INSERT OR UPDATE OR DELETE ON public.match_results FOR EACH ROW EXECUTE FUNCTION public.guard_v2_match_write();
CREATE TRIGGER guard_v2_proposals BEFORE INSERT OR UPDATE OR DELETE ON public.match_time_proposals FOR EACH ROW EXECUTE FUNCTION public.guard_v2_match_write();
CREATE OR REPLACE FUNCTION public.save_season_settings_v2(_season uuid,_settings jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cfg public.season_settings; s public.seasons; mode text; score public.score_format; days integer; window_days integer;
BEGIN
 SELECT * INTO s FROM public.seasons WHERE id=_season FOR UPDATE;
 IF NOT FOUND OR NOT public.is_season_creator(_season,auth.uid()) THEN RAISE EXCEPTION 'Organizer access required'; END IF;
 SELECT * INTO cfg FROM public.season_settings WHERE season_id=_season FOR UPDATE;
 mode:=_settings->>'scheduling_mode'; score:=(_settings->>'score_format')::public.score_format; days:=(_settings->>'match_deadline_days')::integer; window_days:=(_settings->>'captain_window_days')::integer;
 IF mode IS NULL OR mode NOT IN('player_led','rotating_captain','organizer_managed') OR score IS NULL OR days IS NULL OR days NOT BETWEEN 1 AND 60 OR window_days IS NULL OR window_days NOT BETWEEN 1 AND 30 THEN RAISE EXCEPTION 'Invalid settings'; END IF;
 IF EXISTS(SELECT 1 FROM public.matches WHERE season_id=_season) AND (mode IS DISTINCT FROM coalesce(cfg.scheduling_mode,'rotating_captain') OR score IS DISTINCT FROM cfg.score_format OR days IS DISTINCT FROM cfg.match_deadline_days OR (_settings->>'result_confirmation')::boolean IS DISTINCT FROM cfg.result_confirmation OR (_settings->>'captain_rotation_mode')::text IS DISTINCT FROM cfg.captain_rotation_mode::text) THEN RAISE EXCEPTION 'Competition rules locked once fixtures exist'; END IF;
 IF cfg.scheduling_mode IS NULL AND EXISTS(SELECT 1 FROM public.matches WHERE season_id=_season) THEN mode:=NULL; END IF;
 UPDATE public.season_settings SET scheduling_mode=mode,score_format=score,match_deadline_days=days,captain_window_days=window_days,auto_rotate_captain=coalesce(mode,'rotating_captain')='rotating_captain',result_confirmation=coalesce((_settings->>'result_confirmation')::boolean,true),captain_reminders=coalesce((_settings->>'captain_reminders')::boolean,true),deadline_reminders=coalesce((_settings->>'deadline_reminders')::boolean,true),weekly_digest=coalesce((_settings->>'weekly_digest')::boolean,false),dispute_resolution=(_settings->>'dispute_resolution')::public.dispute_resolution,forfeit_handling=(_settings->>'forfeit_handling')::public.forfeit_handling,captain_rotation_mode=(_settings->>'captain_rotation_mode')::public.captain_rotation_mode WHERE season_id=_season;
END $$;
REVOKE ALL ON FUNCTION public.match_action_v2(uuid,text,timestamptz,text,jsonb),public.save_season_settings_v2(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.match_action_v2(uuid,text,timestamptz,text,jsonb),public.save_season_settings_v2(uuid,jsonb) TO authenticated;
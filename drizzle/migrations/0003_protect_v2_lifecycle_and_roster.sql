CREATE OR REPLACE FUNCTION public.guard_v2_lifecycle_write() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE old_sid uuid; new_sid uuid; protected boolean;
BEGIN
 IF TG_TABLE_NAME='seasons' THEN
  IF TG_OP<>'INSERT' THEN old_sid:=OLD.id; END IF;
  IF TG_OP<>'DELETE' THEN new_sid:=NEW.id; END IF;
 ELSE
  IF TG_OP<>'INSERT' THEN old_sid:=OLD.season_id; END IF;
  IF TG_OP<>'DELETE' THEN new_sid:=NEW.season_id; END IF;
 END IF;
 protected:=public.is_v2_season(old_sid) OR public.is_v2_season(new_sid);
 IF TG_TABLE_NAME='seasons' AND TG_OP<>'DELETE' THEN protected:=protected OR NEW.setup_key IS NOT NULL; END IF;
 IF TG_TABLE_NAME='season_settings' AND TG_OP<>'DELETE' THEN protected:=protected OR NEW.scheduling_mode IS NOT NULL; END IF;
 IF TG_TABLE_NAME='season_participants' AND protected AND TG_OP<>'DELETE' THEN
  PERFORM 1 FROM public.seasons WHERE id=new_sid FOR UPDATE;
  IF NEW.status='active' AND (TG_OP='INSERT' OR OLD.status<>'active' OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
   IF NEW.user_id IS NULL OR EXISTS(SELECT 1 FROM public.seasons WHERE id=new_sid AND (roster_finalized OR status<>'draft')) THEN RAISE EXCEPTION 'Confirmed membership requires an open draft roster'; END IF;
   IF EXISTS(SELECT 1 FROM public.season_participants WHERE season_id=new_sid AND user_id=NEW.user_id AND status='active' AND id<>NEW.id) THEN RAISE EXCEPTION 'Player already belongs to the roster'; END IF;
  END IF;
 END IF;
 IF protected AND current_user NOT IN('postgres','service_role') THEN RAISE EXCEPTION 'Use the protected season workflow'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER guard_v2_seasons BEFORE INSERT OR UPDATE OR DELETE ON public.seasons FOR EACH ROW EXECUTE FUNCTION public.guard_v2_lifecycle_write();
CREATE TRIGGER guard_v2_settings BEFORE INSERT OR UPDATE OR DELETE ON public.season_settings FOR EACH ROW EXECUTE FUNCTION public.guard_v2_lifecycle_write();
CREATE TRIGGER guard_v2_participants BEFORE INSERT OR UPDATE OR DELETE ON public.season_participants FOR EACH ROW EXECUTE FUNCTION public.guard_v2_lifecycle_write();
CREATE TRIGGER guard_v2_teams BEFORE INSERT OR UPDATE OR DELETE ON public.doubles_teams FOR EACH ROW EXECUTE FUNCTION public.guard_v2_lifecycle_write();
CREATE OR REPLACE FUNCTION public.withdraw_season_player_v2(_participant uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.season_participants;
BEGIN
 SELECT * INTO p FROM public.season_participants WHERE id=_participant;
 IF NOT FOUND OR NOT public.is_season_creator(p.season_id,auth.uid()) THEN RAISE EXCEPTION 'Organizer access required'; END IF;
 PERFORM 1 FROM public.seasons WHERE id=p.season_id FOR UPDATE;
 IF p.user_id=auth.uid() THEN RAISE EXCEPTION 'Organizer cannot withdraw their own membership'; END IF;
 UPDATE public.season_participants SET status='withdrawn' WHERE id=p.id;
END $$;
REVOKE ALL ON FUNCTION public.withdraw_season_player_v2(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.withdraw_season_player_v2(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.guard_v2_match_write() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE sid uuid; old_sid uuid; a_count integer; b_count integer;
BEGIN
 IF TG_TABLE_NAME='matches' THEN
  IF TG_OP<>'DELETE' THEN sid:=NEW.season_id; END IF;
  IF TG_OP<>'INSERT' THEN old_sid:=OLD.season_id; END IF;
 ELSE
  IF TG_OP<>'DELETE' THEN SELECT season_id INTO sid FROM public.matches WHERE id=NEW.match_id; END IF;
  IF TG_OP<>'INSERT' THEN SELECT season_id INTO old_sid FROM public.matches WHERE id=OLD.match_id; END IF;
 END IF;
 IF (public.is_v2_season(sid) OR public.is_v2_season(old_sid)) AND current_user NOT IN('postgres','service_role') THEN
  IF TG_TABLE_NAME='matches' AND TG_OP='INSERT' AND public.is_season_creator(sid,auth.uid()) THEN
   IF NOT EXISTS(SELECT 1 FROM public.seasons WHERE id=sid AND status='active') THEN RAISE EXCEPTION 'Generate draft schedule first'; END IF;
   IF NEW.side_kind='player' THEN
    SELECT count(*) INTO a_count FROM public.season_participants WHERE id=NEW.side_a_id AND season_id=sid AND status='active' AND user_id IS NOT NULL;
    SELECT count(*) INTO b_count FROM public.season_participants WHERE id=NEW.side_b_id AND season_id=sid AND status='active' AND user_id IS NOT NULL;
   ELSE
    SELECT count(*) INTO a_count FROM public.doubles_teams WHERE id=NEW.side_a_id AND season_id=sid;
    SELECT count(*) INTO b_count FROM public.doubles_teams WHERE id=NEW.side_b_id AND season_id=sid;
   END IF;
   IF a_count<>1 OR b_count<>1 OR NEW.side_a_id=NEW.side_b_id OR NEW.status NOT IN('pending','scheduled') THEN RAISE EXCEPTION 'Choose two valid season sides'; END IF;
  ELSIF TG_TABLE_NAME='matches' AND TG_OP='DELETE' AND public.is_season_creator(old_sid,auth.uid()) THEN
   IF OLD.status NOT IN('pending','proposed','scheduled') OR EXISTS(SELECT 1 FROM public.match_results WHERE match_id=OLD.id) THEN RAISE EXCEPTION 'Only upcoming matches without results may be deleted'; END IF;
  ELSE RAISE EXCEPTION 'Use protected match workflow'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER guard_v2_match_deletes BEFORE DELETE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.guard_v2_match_write();
REVOKE ALL ON FUNCTION public.match_side_v2(uuid,uuid) FROM PUBLIC,anon,authenticated;
COMMENT ON FUNCTION public.guard_v2_match_write() IS 'Trusted database-owner RPC writes only; caller-set custom configuration never bypasses guards.';
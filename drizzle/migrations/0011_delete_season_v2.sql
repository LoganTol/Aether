CREATE OR REPLACE FUNCTION public.delete_season_v2(_season uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_season_creator(_season, auth.uid()) THEN
    RAISE EXCEPTION 'Only the season creator can delete this season';
  END IF;
  DELETE FROM public.match_scores WHERE match_id IN (SELECT id FROM public.matches WHERE season_id = _season);
  DELETE FROM public.match_results WHERE match_id IN (SELECT id FROM public.matches WHERE season_id = _season);
  DELETE FROM public.match_time_proposals WHERE match_id IN (SELECT id FROM public.matches WHERE season_id = _season);
  DELETE FROM public.matches WHERE season_id = _season;
  DELETE FROM public.captain_rotation WHERE season_id = _season;
  DELETE FROM public.doubles_teams WHERE season_id = _season;
  DELETE FROM public.seasons WHERE id = _season;
END $$;
REVOKE ALL ON FUNCTION public.delete_season_v2(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_season_v2(uuid) TO authenticated;
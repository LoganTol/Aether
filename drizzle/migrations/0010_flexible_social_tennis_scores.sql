DO $migration$
DECLARE definition text; old_validation text; new_validation text;
BEGIN
 SELECT pg_get_functiondef('public.match_action_v2(uuid,text,timestamp with time zone,text,jsonb)'::regprocedure) INTO definition;
 old_validation := $old$ IF _scores IS NULL OR jsonb_typeof(_scores)<>'array' OR jsonb_array_length(_scores) NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'Enter valid sets'; END IF;
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
 IF (cfg.score_format='best_of_3' AND greatest(wa,wb)<>2) OR (cfg.score_format<>'best_of_3' AND idx<>1) THEN RAISE EXCEPTION 'Enter a complete match score'; END IF;$old$;
 new_validation := $new$ IF _scores IS NULL OR jsonb_typeof(_scores)<>'array' THEN RAISE EXCEPTION 'Enter between one and five sets'; END IF;
 IF jsonb_array_length(_scores) NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'Enter between one and five sets'; END IF;
 FOR set_row IN SELECT * FROM jsonb_array_elements(_scores) LOOP
 idx:=idx+1;
 IF jsonb_typeof(set_row)<>'object' OR jsonb_typeof(set_row->'a') IS DISTINCT FROM 'number' OR jsonb_typeof(set_row->'b') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Fill both scores for Set % with whole numbers',idx; END IF;
 IF (set_row->>'a')::numeric<0 OR (set_row->>'b')::numeric<0 OR (set_row->>'a')::numeric>99 OR (set_row->>'b')::numeric>99 OR trunc((set_row->>'a')::numeric)<>(set_row->>'a')::numeric OR trunc((set_row->>'b')::numeric)<>(set_row->>'b')::numeric THEN RAISE EXCEPTION 'Set % needs whole numbers from 0 to 99',idx; END IF;
 ga:=(set_row->>'a')::numeric::integer; gb:=(set_row->>'b')::numeric::integer;
 IF ga=gb THEN RAISE EXCEPTION 'Set % needs a winner; the scores cannot be tied',idx; END IF;
 IF ga>gb THEN wa:=wa+1; ELSE wb:=wb+1; END IF;
 END LOOP;
 IF wa=wb THEN RAISE EXCEPTION 'The match is tied in sets. Add the deciding set before saving'; END IF;$new$;
 IF position(old_validation in definition)=0 THEN RAISE EXCEPTION 'Score validation has changed; migration aborted'; END IF;
 EXECUTE replace(definition,old_validation,new_validation);
END $migration$;
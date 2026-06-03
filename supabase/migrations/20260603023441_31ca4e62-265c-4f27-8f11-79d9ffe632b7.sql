ALTER TABLE public.season_participants 
ALTER COLUMN join_token SET DEFAULT replace(replace(replace(encode(extensions.gen_random_bytes(24), 'base64'), '+', '-'), '/', '_'), '=', '');
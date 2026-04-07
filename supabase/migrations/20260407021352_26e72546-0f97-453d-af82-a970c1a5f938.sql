
ALTER TABLE public.profiles ADD COLUMN status text NOT NULL DEFAULT 'offline';

UPDATE public.profiles SET status = CASE WHEN is_online THEN 'online' ELSE 'offline' END;


-- Create a security definer function to check channel membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_channel_member(_channel_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channel_members
    WHERE channel_id = _channel_id AND user_id = _user_id
  )
$$;

-- Fix channel_members SELECT: use security definer function to avoid recursion
DROP POLICY IF EXISTS "Members see members" ON public.channel_members;
CREATE POLICY "Members see members" ON public.channel_members
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_channel_member(channel_id, auth.uid()));

-- Fix channels SELECT: use security definer function
DROP POLICY IF EXISTS "Members see channels" ON public.channels;
CREATE POLICY "Members see channels" ON public.channels
FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR is_channel_member(id, auth.uid()));

-- Fix messages SELECT: use security definer function
DROP POLICY IF EXISTS "Members read messages" ON public.messages;
CREATE POLICY "Members read messages" ON public.messages
FOR SELECT TO authenticated
USING (is_channel_member(channel_id, auth.uid()));

-- Fix messages INSERT: use security definer function
DROP POLICY IF EXISTS "Members send messages" ON public.messages;
CREATE POLICY "Members send messages" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id AND is_channel_member(channel_id, auth.uid()));

-- Fix channel_members INSERT: allow owner or self, using security definer for channel lookup
DROP POLICY IF EXISTS "Owner or self add member" ON public.channel_members;
CREATE POLICY "Owner or self add member" ON public.channel_members
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM channels c WHERE c.id = channel_id AND c.owner_id = auth.uid())
);


-- Fix channels SELECT policy: was comparing cm.channel_id = cm.id (same table alias)
DROP POLICY IF EXISTS "Members see channels" ON public.channels;
CREATE POLICY "Members see channels" ON public.channels
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM channel_members cm
  WHERE cm.channel_id = channels.id AND cm.user_id = auth.uid()
));

-- Fix channel_members SELECT policy: was comparing cm.channel_id = cm.channel_id (always true)
DROP POLICY IF EXISTS "Members see members" ON public.channel_members;
CREATE POLICY "Members see members" ON public.channel_members
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM channel_members cm
  WHERE cm.channel_id = channel_members.channel_id AND cm.user_id = auth.uid()
));

-- Fix messages SELECT policy
DROP POLICY IF EXISTS "Members read messages" ON public.messages;
CREATE POLICY "Members read messages" ON public.messages
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM channel_members cm
  WHERE cm.channel_id = messages.channel_id AND cm.user_id = auth.uid()
));

-- Fix messages INSERT policy
DROP POLICY IF EXISTS "Members send messages" ON public.messages;
CREATE POLICY "Members send messages" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM channel_members cm
    WHERE cm.channel_id = messages.channel_id AND cm.user_id = auth.uid()
  )
);

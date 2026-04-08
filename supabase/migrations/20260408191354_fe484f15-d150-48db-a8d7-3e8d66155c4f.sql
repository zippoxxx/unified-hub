
CREATE POLICY "Sender can update own messages"
ON public.messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Sender can delete own messages"
ON public.messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

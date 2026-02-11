
-- Add missing UPDATE policy for quests table
CREATE POLICY "Users can update their own quests"
ON public.quests
FOR UPDATE
USING (auth.uid() = user_id);

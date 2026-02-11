
-- Create quest messages table
CREATE TABLE public.quest_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quest_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view messages for quests they can see
CREATE POLICY "Anyone can view quest messages"
ON public.quest_messages FOR SELECT
USING (true);

-- Only authenticated users can send messages (must be creator or participant of the quest)
CREATE POLICY "Quest members can send messages"
ON public.quest_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (SELECT 1 FROM public.quests WHERE id = quest_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.quest_participants WHERE quest_id = quest_messages.quest_id AND user_id = auth.uid())
  )
);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.quest_messages FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.quest_messages;

-- Index for fast lookups
CREATE INDEX idx_quest_messages_quest_id ON public.quest_messages(quest_id, created_at);

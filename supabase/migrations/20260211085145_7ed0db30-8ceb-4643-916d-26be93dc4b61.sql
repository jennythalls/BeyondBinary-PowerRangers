
-- Create quest_participants table
CREATE TABLE public.quest_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quest_id, user_id)
);

-- Enable RLS
ALTER TABLE public.quest_participants ENABLE ROW LEVEL SECURITY;

-- Anyone can view participants
CREATE POLICY "Anyone can view quest participants"
ON public.quest_participants
FOR SELECT
USING (true);

-- Authenticated users can join quests
CREATE POLICY "Users can join quests"
ON public.quest_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can leave quests
CREATE POLICY "Users can leave quests"
ON public.quest_participants
FOR DELETE
USING (auth.uid() = user_id);

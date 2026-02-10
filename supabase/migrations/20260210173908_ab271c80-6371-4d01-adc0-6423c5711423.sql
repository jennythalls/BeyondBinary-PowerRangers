
CREATE TABLE public.quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  quest_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  details TEXT,
  location TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view all quests
CREATE POLICY "Anyone can view quests"
  ON public.quests FOR SELECT
  TO authenticated
  USING (true);

-- Users can create their own quests
CREATE POLICY "Users can create quests"
  ON public.quests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own quests
CREATE POLICY "Users can delete their own quests"
  ON public.quests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- Create table to track message read receipts
CREATE TABLE public.quest_message_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.quest_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.quest_message_reads ENABLE ROW LEVEL SECURITY;

-- Anyone can view read receipts
CREATE POLICY "Anyone can view message reads"
ON public.quest_message_reads
FOR SELECT
USING (true);

-- Users can mark messages as read
CREATE POLICY "Users can mark messages as read"
ON public.quest_message_reads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for read receipts
ALTER PUBLICATION supabase_realtime ADD TABLE public.quest_message_reads;


CREATE TABLE public.reflection_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reflection_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own responses"
ON public.reflection_responses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
ON public.reflection_responses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responses"
ON public.reflection_responses
FOR DELETE
USING (auth.uid() = user_id);

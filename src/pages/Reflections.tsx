import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Wind, BriefcaseBusiness, Moon, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const reflectionItems = [
  { label: "Feeling stressed", icon: Wind, category: "stressed" },
  { label: "Study / work burnout", icon: BriefcaseBusiness, category: "burnout" },
  { label: "Sleep issues", icon: Moon, category: "sleep" },
];

const fallbackQuestions: Record<string, string> = {
  stressed: "What is one thing within your control right now that you can let go of?",
  burnout: "When was the last time you did something purely for enjoyment, not productivity?",
  sleep: "What thoughts keep you awake, and what would it feel like to set them aside for tonight?",
};

const Reflections = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    setQuestion("");
    setAnswer("");
    setSubmitted(false);

    try {
      const { data, error } = await supabase.functions.invoke("daily-reflection", {
        body: { category },
      });
      if (!error && data?.question) {
        setQuestion(data.question);
      } else {
        setQuestion(fallbackQuestions[category]);
      }
    } catch {
      setQuestion(fallbackQuestions[category]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim() || !user || !selectedCategory) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reflection_responses").insert({
        user_id: user.id,
        category: selectedCategory,
        question,
        response: answer.trim(),
      });

      if (error) throw error;

      toast({ title: "Saved", description: "Your reflection has been recorded." });
      setSubmitted(true);
    } catch (e) {
      console.error("Error saving reflection:", e);
      toast({ title: "Error", description: "Failed to save your reflection.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center px-6 py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (selectedCategory) {
              setSelectedCategory(null);
              setQuestion("");
              setAnswer("");
              setSubmitted(false);
            } else {
              navigate("/questbook");
            }
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 font-display text-xl font-semibold text-foreground">Reflections</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-8">
        {!selectedCategory ? (
          reflectionItems.map(({ label, icon: Icon, category }) => (
            <button
              key={label}
              onClick={() => handleSelect(category)}
              className="flex w-72 items-center gap-4 rounded-xl border-2 border-border p-6 transition-colors hover:border-primary"
            >
              <Icon className="h-10 w-10 shrink-0 text-primary" />
              <span className="font-display text-lg font-semibold text-foreground text-left">{label}</span>
            </button>
          ))
        ) : loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex w-full max-w-md flex-col gap-6">
            <div className="rounded-2xl border-2 border-border p-8 text-center">
              <p className="text-xl font-semibold leading-relaxed text-foreground">{question}</p>
            </div>

            <Textarea
              placeholder="Take a moment to reflect and write your thoughts here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={submitted}
              className="min-h-[140px] resize-none text-base"
              maxLength={2000}
            />

            {!submitted ? (
              <Button onClick={handleSubmit} disabled={submitting || !answer.trim()} className="w-full">
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit Reflection
              </Button>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                ✓ Your reflection has been saved. Take care of yourself 💙
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reflections;

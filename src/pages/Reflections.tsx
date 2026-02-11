import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wind, BriefcaseBusiness, Moon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSelect = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    setQuestion("");

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
            } else {
              navigate("/questbook");
            }
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 font-display text-xl font-semibold text-foreground">Reflections</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
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
          <div className="flex w-full max-w-md flex-col items-center justify-center rounded-2xl border-2 border-border p-8 text-center">
            <p className="text-xl font-semibold leading-relaxed text-foreground">{question}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reflections;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Wind, BriefcaseBusiness, Moon, Loader2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

type SavedReflection = {
  id: string;
  question: string;
  response: string;
  created_at: string;
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
  const [savedReflections, setSavedReflections] = useState<SavedReflection[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const fetchHistory = async (category: string) => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data } = await supabase
        .from("reflection_responses")
        .select("id, question, response, created_at")
        .eq("user_id", user.id)
        .eq("category", category)
        .order("created_at", { ascending: false })
        .limit(50);
      setSavedReflections((data as SavedReflection[]) || []);
    } catch {
      setSavedReflections([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelect = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    setQuestion("");
    setAnswer("");
    setSubmitted(false);

    fetchHistory(category);

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
      const { data: inserted, error } = await supabase
        .from("reflection_responses")
        .insert({
          user_id: user.id,
          category: selectedCategory,
          question,
          response: answer.trim(),
        })
        .select("id, question, response, created_at")
        .single();

      if (error) throw error;

      toast({ title: "Saved", description: "Your reflection has been recorded." });
      setSubmitted(true);
      if (inserted) {
        setSavedReflections((prev) => [inserted as SavedReflection, ...prev]);
      }
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
              setSavedReflections([]);
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
          <div className="flex w-full max-w-5xl gap-8">
            {/* Left: question + answer */}
            <div className="flex flex-1 flex-col gap-6">
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
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Reflection
                </Button>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  ✓ Your reflection has been saved. Take care of yourself 💙
                </p>
              )}
            </div>

            {/* Right: saved reflections */}
            <div className="hidden w-80 shrink-0 flex-col md:flex">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Saved Reflections
                </h2>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue placeholder="Filter month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All months</SelectItem>
                    {Array.from(
                      new Set(
                        savedReflections.map((r) => format(new Date(r.created_at), "yyyy-MM"))
                      )
                    )
                      .sort()
                      .reverse()
                      .map((ym) => (
                        <SelectItem key={ym} value={ym}>
                          {format(new Date(ym + "-01"), "MMM yyyy")}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : savedReflections.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved reflections yet.</p>
              ) : (
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="flex flex-col gap-3 pr-3">
                    {savedReflections
                      .filter((r) =>
                        filterMonth === "all"
                          ? true
                          : format(new Date(r.created_at), "yyyy-MM") === filterMonth
                      )
                      .map((r) => (
                        <div key={r.id} className="rounded-xl border border-border p-4">
                          <p className="text-xs font-medium text-muted-foreground">
                            {format(new Date(r.created_at), "MMM d, yyyy")}
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">{r.question}</p>
                          <p className="mt-2 text-sm text-muted-foreground">{r.response}</p>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reflections;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const fallbackQuotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
];

const MotivationQuotes = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState(fallbackQuotes);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("daily-quotes");
        if (!error && data?.quotes?.length) {
          setQuotes(data.quotes);
          setCurrent(Math.floor(Math.random() * data.quotes.length));
        }
      } catch (e) {
        console.error("Failed to fetch daily quotes:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, []);

  const prev = () => setCurrent((c) => (c === 0 ? quotes.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === quotes.length - 1 ? 0 : c + 1));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/questbook")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 font-display text-xl font-semibold text-foreground">Motivation Quotes</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <div className="relative flex w-full max-w-md items-center justify-center">
            <Button variant="ghost" size="icon" onClick={prev} className="absolute -left-14">
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div className="flex min-h-[280px] w-full flex-col items-center justify-center rounded-2xl border-2 border-border p-8 text-center transition-all">
              <p className="text-xl font-semibold leading-relaxed text-foreground">
                "{quotes[current].text}"
              </p>
              <p className="mt-4 text-sm text-muted-foreground">— {quotes[current].author}</p>
            </div>

            <Button variant="ghost" size="icon" onClick={next} className="absolute -right-14">
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MotivationQuotes;

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, BookOpen, Lightbulb } from "lucide-react";

const QuestBook = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 font-display text-xl font-semibold text-foreground">QuestBreak</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <button
          onClick={() => navigate("/questbook/motivation")}
          className="flex w-72 items-center gap-4 rounded-xl border-2 border-border p-6 transition-colors hover:border-primary"
        >
          <Sparkles className="h-10 w-10 text-primary" />
          <span className="font-display text-lg font-semibold text-foreground">Motivational Quotes</span>
        </button>

        <button
          onClick={() => navigate("/questbook/reflections")}
          className="flex w-72 items-center gap-4 rounded-xl border-2 border-border p-6 transition-colors hover:border-primary"
        >
          <BookOpen className="h-10 w-10 text-primary" />
          <span className="font-display text-lg font-semibold text-foreground">Reflections</span>
        </button>

        <button
          onClick={() => navigate("/questbook/selfhelp")}
          className="flex w-72 items-center gap-4 rounded-xl border-2 border-border p-6 transition-colors hover:border-primary"
        >
          <Lightbulb className="h-10 w-10 text-primary" />
          <span className="font-display text-lg font-semibold text-foreground">Support Resources</span>
        </button>
      </div>
    </div>
  );
};

export default QuestBook;

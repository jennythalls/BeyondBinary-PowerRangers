import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

const questions = [
  "What am I most grateful for today?",
  "What is one thing I learned about myself this week?",
  "What would I do differently if I could relive today?",
  "Who has had the biggest positive impact on my life and why?",
  "What fears are holding me back from reaching my potential?",
  "What does my ideal day look like?",
  "What habits do I want to build or break?",
  "When do I feel most at peace?",
  "What accomplishment am I most proud of?",
  "How do I handle failure, and how can I improve?",
  "What values matter most to me?",
  "Am I spending my time on things that truly matter?",
  "What relationships in my life need more attention?",
  "What would I attempt if I knew I could not fail?",
  "How do I define success for myself?",
  "What drains my energy, and how can I minimize it?",
  "What brings me the most joy?",
  "How have I grown in the past year?",
  "What negative thought patterns do I need to let go of?",
  "What am I avoiding, and why?",
  "How do I want to be remembered?",
  "What boundaries do I need to set or reinforce?",
  "What is one kind thing I can do for someone today?",
  "Am I being honest with myself about what I want?",
  "What does forgiveness mean to me?",
  "How do I respond to stress, and is it healthy?",
  "What small step can I take today toward a big goal?",
  "What does self-care look like for me?",
  "What lesson has been the hardest to learn?",
  "If I could give my younger self one piece of advice, what would it be?",
];

const Reflections = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? questions.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === questions.length - 1 ? 0 : c + 1));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/questbook")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 font-display text-xl font-semibold text-foreground">Reflections</h1>
        <span className="ml-auto text-sm text-muted-foreground">
          {current + 1} / {questions.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="relative flex w-full max-w-md items-center justify-center">
          <Button variant="ghost" size="icon" onClick={prev} className="absolute -left-14">
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="flex min-h-[280px] w-full flex-col items-center justify-center rounded-2xl border-2 border-border p-8 text-center transition-all">
            <p className="text-xl font-semibold leading-relaxed text-foreground">
              {questions[current]}
            </p>
          </div>

          <Button variant="ghost" size="icon" onClick={next} className="absolute -right-14">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Reflections;

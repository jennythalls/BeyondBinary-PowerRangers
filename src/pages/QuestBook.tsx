import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, UserCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const sampleCards = [
  { question: "What is your biggest dream?", answer: "Think deeply about what drives you." },
  { question: "What are you grateful for today?", answer: "Gratitude opens the door to happiness." },
  { question: "What challenge did you overcome recently?", answer: "Reflect on your growth." },
];

const QuestBook = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const currentCard = sampleCards[currentIndex];

  const handleNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % sampleCards.length);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserCircle className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              {user?.email}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Flash card - top half */}
      <div className="flex flex-col items-center justify-center px-6 py-8" style={{ minHeight: "45vh" }}>
        <div
          className="w-full max-w-md cursor-pointer perspective-1000"
          onClick={() => setFlipped(!flipped)}
        >
          <Card className="relative min-h-[240px] flex items-center justify-center transition-transform duration-500 hover:shadow-lg">
            <CardContent className="flex items-center justify-center p-8 text-center">
              <p className="text-xl font-semibold text-foreground">
                {flipped ? currentCard.answer : currentCard.question}
              </p>
            </CardContent>
          </Card>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            {flipped ? "Answer" : "Tap to reveal"} · {currentIndex + 1}/{sampleCards.length}
          </p>
        </div>
        <Button variant="outline" className="mt-4" onClick={handleNext}>
          Next Card
        </Button>
      </div>

      {/* Category buttons */}
      <div className="flex flex-col items-center gap-4 px-6 py-8">
        <Button variant="outline" className="w-full max-w-md h-14 text-lg font-semibold">
          Motivation Quotes
        </Button>
        <Button variant="outline" className="w-full max-w-md h-14 text-lg font-semibold">
          Reflections
        </Button>
        <Button variant="outline" className="w-full max-w-md h-14 text-lg font-semibold">
          Self-Help Resources
        </Button>
      </div>
    </div>
  );
};

export default QuestBook;

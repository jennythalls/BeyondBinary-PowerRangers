import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Reflections = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/questbook")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 font-display text-xl font-semibold text-foreground">Reflections</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
};

export default Reflections;

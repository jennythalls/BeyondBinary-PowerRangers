import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart } from "lucide-react";

const resources = [
  { label: "Mental health support", icon: Heart },
];

const SelfHelpResources = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/questbook")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 font-display text-xl font-semibold text-foreground">Self-Help Resources</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        {resources.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="flex w-72 items-center gap-4 rounded-xl border-2 border-border p-6 transition-colors hover:border-primary"
          >
            <Icon className="h-10 w-10 shrink-0 text-primary" />
            <span className="font-display text-lg font-semibold text-foreground text-left">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SelfHelpResources;

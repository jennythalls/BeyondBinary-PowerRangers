import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import NTULogo from "@/components/NTULogo";
import { LogOut, User, Heart } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="animate-fade-in text-center">
        <NTULogo className="mb-8" />
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Welcome back
        </h1>
        <p className="text-muted-foreground mb-8">
          {user?.email}
        </p>

        <div className="flex gap-6 mb-8">
          <button className="flex flex-col items-center gap-3 p-6 border-2 border-border rounded-lg hover:border-primary transition-colors w-40">
            <div className="w-20 h-20 border-2 border-foreground rounded-md flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <span className="font-display font-semibold text-foreground">SideQuest</span>
          </button>

          <button className="flex flex-col items-center gap-3 p-6 border-2 border-border rounded-lg hover:border-primary transition-colors w-40">
            <div className="w-20 h-20 border-2 border-foreground rounded-md flex items-center justify-center">
              <Heart className="h-10 w-10 text-primary fill-primary/30" />
            </div>
            <span className="font-display font-semibold text-foreground">QuestBook</span>
          </button>
        </div>

        <Button variant="outline" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Index;

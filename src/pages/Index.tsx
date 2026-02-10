import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import NTULogo from "@/components/NTULogo";
import { LogOut } from "lucide-react";

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
        <Button variant="outline" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Index;

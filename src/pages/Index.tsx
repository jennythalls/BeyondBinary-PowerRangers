import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import NTULogo from "@/components/NTULogo";
import { LogOut, User, Heart, UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <div />
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

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="animate-fade-in">
          <div className="flex gap-8">
            <button className="flex flex-col items-center gap-4 p-8 border-2 border-border rounded-xl hover:border-primary transition-colors w-52">
              <div className="w-28 h-28 border-2 border-foreground rounded-md flex items-center justify-center">
                <User className="h-14 w-14 text-primary" />
              </div>
              <span className="font-display font-semibold text-lg text-foreground">SideQuest</span>
            </button>

            <button className="flex flex-col items-center gap-4 p-8 border-2 border-border rounded-xl hover:border-primary transition-colors w-52">
              <div className="w-28 h-28 border-2 border-foreground rounded-md flex items-center justify-center">
                <Heart className="h-14 w-14 text-primary fill-primary/30" />
              </div>
              <span className="font-display font-semibold text-lg text-foreground">QuestBook</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

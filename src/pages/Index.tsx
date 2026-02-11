import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Users, Heart, UserCircle, Pencil, Lock, Compass, Sunrise } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [gateOpening, setGateOpening] = useState<"left" | "right" | null>(null);

  const handleGateClick = useCallback((side: "left" | "right", path: string) => {
    if (gateOpening) return;
    setGateOpening(side);
    setTimeout(() => {
      navigate(path);
    }, 1800);
  }, [gateOpening, navigate]);

  const handleChangeUsername = async () => {
    if (!newDisplayName.trim()) {
      toast.error("Display name cannot be empty.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: newDisplayName.trim()
    }).eq("user_id", user?.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Display name updated!");
      setUsernameOpen(false);
      setNewDisplayName("");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated!");
      setPasswordOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background overflow-hidden relative">
      {/* Soft ambient background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/3 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Sunrise className="h-5 w-5 text-accent" />
          <span className="font-display text-sm font-medium text-muted-foreground tracking-wide">Your safe space</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
              <UserCircle className="h-6 w-6 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              {user?.email}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setUsernameOpen(true)} className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" />
              Change Username
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPasswordOpen(true)} className="cursor-pointer">
              <Lock className="mr-2 h-4 w-4" />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Welcome text */}
      <div className="relative z-10 mt-8 text-center px-4 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
          Where would you like to go?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Choose your path — connect with others or take a moment for yourself.
        </p>
      </div>

      {/* Main content - Gate */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="animate-fade-in flex" style={{ perspective: "1200px" }}>
          {/* Left door - SideQuest */}
          <button
            onClick={() => handleGateClick("left", "/sidequest")}
            className={`group flex flex-col items-center gap-4 p-10 rounded-l-2xl border-2 border-border border-r bg-card/80 backdrop-blur-sm w-56 origin-left transition-all duration-300 hover:bg-primary/5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 ${
              gateOpening ? "animate-gate-open-left" : ""
            }`}
            disabled={!!gateOpening}
          >
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <div className="text-center">
              <span className="font-display font-bold text-lg text-foreground flex items-center gap-1.5 justify-center">
                <Compass className="h-4 w-4 text-primary" />
                SideQuest
              </span>
              <span className="mt-1.5 block text-xs text-muted-foreground leading-relaxed">
                Create & discover quests<br />happening around you
              </span>
            </div>
          </button>

          {/* Right door - QuestBreak */}
          <button
            onClick={() => handleGateClick("right", "/questbook")}
            className={`group flex flex-col items-center gap-4 p-10 rounded-r-2xl border-2 border-border border-l-0 bg-card/80 backdrop-blur-sm w-56 origin-right transition-all duration-300 hover:bg-accent/5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10 ${
              gateOpening ? "animate-gate-open-right" : ""
            }`}
            disabled={!!gateOpening}
          >
            <div className="w-24 h-24 rounded-2xl bg-accent/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <Heart className="h-12 w-12 text-accent fill-accent/20" />
            </div>
            <div className="text-center">
              <span className="font-display font-bold text-lg text-foreground flex items-center gap-1.5 justify-center">
                <Sunrise className="h-4 w-4 text-accent" />
                QuestBreak
              </span>
              <span className="mt-1.5 block text-xs text-muted-foreground leading-relaxed">
                Recharge with quotes,<br />reflections & support
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Gentle footer */}
      <div className="relative z-10 pb-6 text-center">
        <p className="text-xs text-muted-foreground/60 tracking-wide">
          ✨ Every journey begins with a single step
        </p>
      </div>

      {/* Change Username Dialog */}
      <Dialog open={usernameOpen} onOpenChange={setUsernameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Display Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="newDisplayName">New Display Name</Label>
            <Input id="newDisplayName" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="Enter new display name" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsernameOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeUsername} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default Index;
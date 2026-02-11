import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, User, Heart, UserCircle, Pencil, Lock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const Index = () => {
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const handleChangeUsername = async () => {
    if (!newDisplayName.trim()) {
      toast.error("Display name cannot be empty.");
      return;
    }
    setSaving(true);
    const {
      error
    } = await supabase.from("profiles").update({
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
    const {
      error
    } = await supabase.auth.updateUser({
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
  return <div className="flex min-h-screen flex-col bg-background">
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

      {/* Main content */}
      <div className="flex-1 items-center justify-center px-4 flex flex-col text-destructive">
        <div className="animate-fade-in">
          <div className="flex gap-8">
            <button onClick={() => navigate("/sidequest")} className="flex flex-col items-center gap-3 p-8 border-2 border-border rounded-xl hover:border-primary transition-colors w-52">
              <div className="w-28 h-28 border-2 border-foreground rounded-md flex items-center justify-center">
                <User className="h-14 w-14 text-primary" />
              </div>
              <span className="font-display font-semibold text-lg text-foreground">SideQuest</span>
              <span className="text-xs text-muted-foreground text-center">Create & discover quests happening around you</span>
            </button>

            <button onClick={() => navigate("/questbook")} className="flex flex-col items-center gap-3 p-8 border-2 border-border rounded-xl hover:border-primary transition-colors w-52">
              <div className="w-28 h-28 border-2 border-foreground rounded-md flex items-center justify-center">
                <Heart className="h-14 w-14 text-primary fill-primary/30" />
              </div>
              <span className="font-display font-semibold text-lg text-foreground">QuestBreak</span>
              <span className="text-xs text-muted-foreground text-center">Recharge with quotes, reflections & support</span>
            </button>
          </div>
        </div>
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
    </div>;
};
export default Index;
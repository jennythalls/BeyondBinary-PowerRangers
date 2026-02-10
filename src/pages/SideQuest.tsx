import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  MapPin,
  Navigation,
  Plus,
  Minus,
  Layers,
  Menu,
} from "lucide-react";

const SideQuest = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-muted">
      {/* Map background placeholder */}
      <div className="absolute inset-0 bg-muted">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Fake map elements */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <MapPin className="h-10 w-10 text-primary drop-shadow-lg" />
        </div>
        <div className="absolute left-[30%] top-[35%]">
          <MapPin className="h-6 w-6 text-primary/60" />
        </div>
        <div className="absolute left-[65%] top-[55%]">
          <MapPin className="h-6 w-6 text-primary/60" />
        </div>
        <div className="absolute left-[45%] top-[70%]">
          <MapPin className="h-6 w-6 text-primary/60" />
        </div>
      </div>

      {/* Top search bar */}
      <div className="absolute left-4 right-4 top-4 z-10 flex items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="shrink-0 shadow-md"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-card pl-10 shadow-md"
          />
        </div>
        <Button variant="secondary" size="icon" className="shrink-0 shadow-md">
          <Layers className="h-5 w-5" />
        </Button>
      </div>

      {/* Right-side controls */}
      <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
        <Button variant="secondary" size="icon" className="shadow-md">
          <Plus className="h-5 w-5" />
        </Button>
        <Button variant="secondary" size="icon" className="shadow-md">
          <Minus className="h-5 w-5" />
        </Button>
        <Button variant="secondary" size="icon" className="mt-2 shadow-md">
          <Navigation className="h-5 w-5" />
        </Button>
      </div>

      {/* Bottom card */}
      <div className="absolute bottom-6 left-4 right-4 z-10 rounded-xl bg-card p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-display font-semibold text-foreground">
              Explore SideQuests
            </p>
            <p className="text-sm text-muted-foreground">
              Discover quests near you
            </p>
          </div>
          <Button size="sm">Go</Button>
        </div>
      </div>
    </div>
  );
};

export default SideQuest;

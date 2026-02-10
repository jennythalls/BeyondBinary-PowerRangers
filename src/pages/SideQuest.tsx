import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, List, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SideQuest = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const loadMap = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("get-maps-key");
        if (fnError || !data?.apiKey) {
          setError("Failed to load map API key.");
          return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}`;
        script.async = true;
        script.onload = () => {
          if (mapRef.current && (window as any).google) {
            new (window as any).google.maps.Map(mapRef.current, {
              center: { lat: 1.3521, lng: 103.8198 },
              zoom: 12,
            });
          }
        };
        script.onerror = () => setError("Failed to load Google Maps.");
        document.head.appendChild(script);
      } catch {
        setError("Something went wrong loading the map.");
      }
    };

    loadMap();
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-2 font-display text-xl font-semibold text-foreground">SideQuest</h1>
        </div>
        <Button variant="outline" size="icon" onClick={() => {}}>
          <List className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex-1 px-4 pb-4">
        {error ? (
          <div className="flex h-full items-center justify-center text-destructive">{error}</div>
        ) : (
          <div ref={mapRef} className="h-full w-full rounded-xl border-2 border-border" style={{ minHeight: "calc(100vh - 80px)" }} />
        )}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <Button onClick={() => setShowCreate(true)} className="rounded-full px-6 gap-2">
          <Plus className="h-5 w-5" />
          Create Quest
        </Button>
      </div>

      {/* Create Quest Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border-2 border-border bg-background p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">Create New Side Quest!</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Title:</label>
                <Input placeholder="Enter quest title" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category:</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="z-[60] bg-popover">
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="study">Study</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="errands">Errands</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Start Time:</label>
                  <Input type="time" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">End Time:</label>
                  <Input type="time" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Details:</label>
                <Textarea placeholder="Describe your quest..." rows={4} />
              </div>

              <Button className="w-full" onClick={() => setShowCreate(false)}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideQuest;

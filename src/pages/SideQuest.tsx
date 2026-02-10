import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, List, Plus, X, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Quest {
  title: string;
  category: string;
  startTime: string;
  endTime: string;
  details: string;
  location: string;
  lat: number;
  lng: number;
}

const SideQuest = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [quests, setQuests] = useState<Quest[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const loadMap = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("get-maps-key");
        if (fnError || !data?.apiKey) {
          setError("Failed to load map API key.");
          return;
        }

        if ((window as any).google?.maps) {
          initMap();
          return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places`;
        script.async = true;
        script.onload = () => initMap();
        script.onerror = () => setError("Failed to load Google Maps.");
        document.head.appendChild(script);
      } catch {
        setError("Something went wrong loading the map.");
      }
    };

    const initMap = () => {
      if (mapRef.current && (window as any).google) {
        mapInstanceRef.current = new (window as any).google.maps.Map(mapRef.current, {
          center: { lat: 1.3521, lng: 103.8198 },
          zoom: 12,
        });
      }
    };

    loadMap();
  }, []);

  const addMarker = useCallback((quest: Quest) => {
    const map = mapInstanceRef.current;
    const google = (window as any).google;
    if (!map || !google) return;

    const marker = new google.maps.Marker({
      position: { lat: quest.lat, lng: quest.lng },
      map,
      title: quest.title,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="color:#000;"><strong>${quest.title}</strong><br/><span>${quest.category}</span><br/><span>${quest.startTime} - ${quest.endTime}</span></div>`,
    });

    marker.addListener("click", () => infoWindow.open(map, marker));
    map.panTo({ lat: quest.lat, lng: quest.lng });
    map.setZoom(15);
  }, []);

  const handleCreate = () => {
    if (!title || !location) return;

    const google = (window as any).google;
    if (!google) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: location }, (results: any, status: string) => {
      if (status === "OK" && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        const newQuest: Quest = {
          title,
          category,
          startTime,
          endTime,
          details,
          location,
          lat: lat(),
          lng: lng(),
        };
        setQuests((prev) => [...prev, newQuest]);
        addMarker(newQuest);
        resetForm();
        setShowCreate(false);
      }
    });
  };

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setStartTime("");
    setEndTime("");
    setDetails("");
    setLocation("");
  };

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
                <Input placeholder="Enter quest title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category:</label>
                <Select value={category} onValueChange={setCategory}>
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Location:</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. NTU, Jurong East, Marina Bay"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Start Time:</label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">End Time:</label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Details:</label>
                <Textarea placeholder="Describe your quest..." rows={4} value={details} onChange={(e) => setDetails(e.target.value)} />
              </div>

              <Button className="w-full" onClick={handleCreate}>
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

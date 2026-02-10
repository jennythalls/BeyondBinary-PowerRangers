import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, List, Plus, X, MapPin, CalendarIcon, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Quest {
  id: string;
  title: string;
  category: string;
  quest_date: string;
  start_time: string;
  end_time: string;
  details: string | null;
  location: string;
  lat: number;
  lng: number;
  user_id: string;
  creator_name?: string;
}

const SideQuest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showList, setShowList] = useState(false);
  const [quests, setQuests] = useState<Quest[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [questDate, setQuestDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("");

  const clustererRef = useRef<any>(null);

  const clusterInfoWindowRef = useRef<any>(null);

  const rebuildMarkers = useCallback((questList: Quest[]) => {
    const map = mapInstanceRef.current;
    const google = (window as any).google;
    const MarkerClusterer = (window as any).markerClusterer?.MarkerClusterer;
    if (!map || !google || !MarkerClusterer) return;

    // Clear old
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    if (clusterInfoWindowRef.current) {
      clusterInfoWindowRef.current.close();
    }

    // Build a map from marker to quest for lookup
    const markerQuestMap = new Map<any, Quest>();

    const markers = questList.map((quest) => {
      const marker = new google.maps.Marker({
        position: { lat: quest.lat, lng: quest.lng },
        title: quest.title,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="color:#000;"><strong>${quest.title}</strong><br/><span>${quest.category}</span><br/><span>${quest.quest_date}</span><br/><span>${quest.start_time} - ${quest.end_time}</span><br/><small>by ${quest.creator_name || "Unknown"}</small></div>`,
      });

      marker.addListener("click", () => infoWindow.open(map, marker));
      markerQuestMap.set(marker, quest);
      return marker;
    });

    markersRef.current = markers;

    const clusterer = new MarkerClusterer({
      markers,
      map,
    });

    // Add hover listener on cluster icons
    google.maps.event.addListener(clusterer, "clusteringend", () => {
      const clusters = clusterer.clusters;
      clusters.forEach((cluster: any) => {
        const clusterMarker = cluster.marker;
        if (!clusterMarker) return;

        google.maps.event.clearListeners(clusterMarker, "mouseover");
        google.maps.event.clearListeners(clusterMarker, "mouseout");

        google.maps.event.addListener(clusterMarker, "mouseover", () => {
          if (clusterInfoWindowRef.current) {
            clusterInfoWindowRef.current.close();
          }

          const clusterMarkers = cluster.markers || [];
          const questItems = clusterMarkers
            .map((m: any) => markerQuestMap.get(m))
            .filter(Boolean) as Quest[];

          const content = `<div style="color:#000; max-height:200px; overflow-y:auto; min-width:180px;">
            <strong style="font-size:14px; display:block; margin-bottom:6px;">${questItems.length} Quests</strong>
            ${questItems.map((q) => `
              <div style="padding:4px 0; border-bottom:1px solid #eee;">
                <strong>${q.title}</strong>
                <div style="font-size:12px; color:#666;">${q.category} · ${q.quest_date}</div>
                <div style="font-size:12px; color:#666;">${q.start_time} – ${q.end_time}</div>
                <div style="font-size:11px; color:#999;">by ${q.creator_name || "Unknown"}</div>
              </div>
            `).join("")}
          </div>`;

          const iw = new google.maps.InfoWindow({
            content,
            position: clusterMarker.getPosition(),
          });
          iw.open(map);
          clusterInfoWindowRef.current = iw;
        });

        google.maps.event.addListener(clusterMarker, "mouseout", () => {
          setTimeout(() => {
            if (clusterInfoWindowRef.current) {
              clusterInfoWindowRef.current.close();
              clusterInfoWindowRef.current = null;
            }
          }, 2000);
        });
      });
    });

    clustererRef.current = clusterer;
  }, []);

  const loadQuests = useCallback(async () => {
    const now = new Date();
    const { data, error: fetchError } = await supabase
      .from("quests")
      .select("*");

    if (fetchError || !data) return;

    const activeQuests = data.filter((q: any) => {
      const endDateTime = new Date(`${q.quest_date}T${q.end_time}`);
      return endDateTime > now;
    });

    const userIds = [...new Set(activeQuests.map((q: any) => q.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

    const enriched: Quest[] = activeQuests.map((q: any) => ({
      ...q,
      creator_name: nameMap.get(q.user_id) || "Unknown",
    }));

    setQuests(enriched);
    rebuildMarkers(enriched);
  }, [rebuildMarkers]);

  useEffect(() => {
    const loadScript = (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject();
        document.head.appendChild(s);
      });

    const loadMap = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("get-maps-key");
        if (fnError || !data?.apiKey) {
          setError("Failed to load map API key.");
          return;
        }

        if (!(window as any).google?.maps) {
          await loadScript(`https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places`);
        }

        if (!(window as any).markerClusterer) {
          await loadScript("https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js");
        }

        initMap();
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
        loadQuests();
      }
    };

    loadMap();
  }, [loadQuests]);

  const handleCreate = async () => {
    if (!title || !location || !questDate || !startTime || !endTime || !user) return;

    const google = (window as any).google;
    if (!google) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: location }, async (results: any, status: string) => {
      if (status === "OK" && results[0]) {
        const { lat, lng } = results[0].geometry.location;

        const { error: insertError } = await supabase.from("quests").insert({
          user_id: user.id,
          title,
          category,
          quest_date: format(questDate, "yyyy-MM-dd"),
          start_time: startTime,
          end_time: endTime,
          details: details || null,
          location,
          lat: lat(),
          lng: lng(),
        });

        if (!insertError) {
          resetForm();
          setShowCreate(false);
          await loadQuests();
          const map = mapInstanceRef.current;
          if (map) {
            map.panTo({ lat: lat(), lng: lng() });
            map.setZoom(15);
          }
        }
      }
    });
  };

  const handleEndQuest = async (questId: string) => {
    const { error: deleteError } = await supabase
      .from("quests")
      .delete()
      .eq("id", questId);

    if (!deleteError) {
      await loadQuests();
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setQuestDate(undefined);
    setStartTime("");
    setEndTime("");
    setDetails("");
    setLocation("");
  };

  const myQuests = quests.filter((q) => q.user_id === user?.id);

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-2 font-display text-xl font-semibold text-foreground">SideQuest</h1>
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowList(true)}>
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

      {/* My Quests List */}
      {showList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border-2 border-border bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">My Quests</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowList(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {myQuests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">You haven't created any quests yet.</p>
            ) : (
              <div className="space-y-3">
                {myQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className="rounded-lg border border-border p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{quest.title}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{quest.category}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="shrink-0 gap-1.5"
                        onClick={() => handleEndQuest(quest.id)}
                      >
                        <Square className="h-3 w-3" />
                        End
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {quest.location}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {quest.quest_date}
                      </p>
                      <p>{quest.start_time} – {quest.end_time}</p>
                    </div>
                    {quest.details && (
                      <p className="text-sm text-muted-foreground border-t border-border pt-2">{quest.details}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Quest Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border-2 border-border bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto">
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Date:</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !questDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {questDate ? format(questDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                    <Calendar
                      mode="single"
                      selected={questDate}
                      onSelect={setQuestDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
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

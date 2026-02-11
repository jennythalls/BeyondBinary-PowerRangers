import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, List, Plus, X, MapPin, CalendarIcon, Square, Users, LogIn, LogOut, Send, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Participant {
  user_id: string;
  display_name: string;
}

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
  participants?: Participant[];
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
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [questDate, setQuestDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("");

  // Chat state
  interface ChatMessage {
    id: string;
    quest_id: string;
    user_id: string;
    message: string;
    created_at: string;
    display_name?: string;
  }
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatChannelRef = useRef<any>(null);

  const clustererRef = useRef<any>(null);
  const clusterInfoWindowRef = useRef<any>(null);
  const loadQuestsRef = useRef<() => Promise<void>>();

  const rebuildMarkers = useCallback((questList: Quest[], currentUserId?: string) => {
    const map = mapInstanceRef.current;
    const google = (window as any).google;
    const MarkerClusterer = (window as any).markerClusterer?.MarkerClusterer;
    if (!map || !google || !MarkerClusterer) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    if (clusterInfoWindowRef.current) {
      clusterInfoWindowRef.current.close();
    }

    const markerQuestMap = new Map<any, Quest[]>();

    // Set up global join handler for info window buttons
    (window as any).__questJoin = (questId: string) => {
      if (!currentUserId) return;
      supabase.from("quest_participants" as any).insert({
        quest_id: questId,
        user_id: currentUserId,
      } as any).then(() => loadQuestsRef.current?.());
    };

    (window as any).__questLeave = (questId: string) => {
      if (!currentUserId) return;
      supabase.from("quest_participants" as any)
        .delete()
        .eq("quest_id", questId)
        .eq("user_id", currentUserId)
        .then(() => loadQuestsRef.current?.());
    };

    (window as any).__questEnd = (questId: string) => {
      if (!currentUserId) return;
      supabase.from("quests")
        .delete()
        .eq("id", questId)
        .then(() => loadQuestsRef.current?.());
    };

    const questCardHtml = (q: Quest) => {
      const isJoined = q.participants?.some(p => p.user_id === currentUserId);
      const isOwner = q.user_id === currentUserId;
      const btnHtml = !currentUserId ? ''
        : isOwner
          ? `<button onclick="window.__questEnd('${q.id}')" style="margin-top:4px; padding:2px 10px; font-size:11px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer;">End Quest</button>`
        : isJoined
          ? `<button onclick="window.__questLeave('${q.id}')" style="margin-top:4px; padding:2px 10px; font-size:11px; background:#eee; border:1px solid #ccc; border-radius:4px; cursor:pointer;">Leave</button>`
          : `<button onclick="window.__questJoin('${q.id}')" style="margin-top:4px; padding:2px 10px; font-size:11px; background:#3b82f6; color:#fff; border:none; border-radius:4px; cursor:pointer;">Join</button>`;
      return `<div style="padding:4px 0; border-bottom:1px solid #eee;">
        <strong>${q.title}</strong>
        <div style="font-size:12px; color:#666;">${q.category} · ${q.quest_date}</div>
        <div style="font-size:12px; color:#666;">${q.start_time} – ${q.end_time}</div>
        <div style="font-size:11px; color:#999;">by ${q.creator_name || "Unknown"} · 👥 ${q.participants?.length || 0}</div>
        ${btnHtml}
      </div>`;
    };

    // Group quests by location
    const locationGroups = new Map<string, Quest[]>();
    questList.forEach((quest) => {
      const key = `${quest.lat},${quest.lng}`;
      const group = locationGroups.get(key) || [];
      group.push(quest);
      locationGroups.set(key, group);
    });

    const markers: any[] = [];
    locationGroups.forEach((groupQuests, key) => {
      const [lat, lng] = key.split(",").map(Number);
      const marker = new google.maps.Marker({
        position: { lat, lng },
        title: groupQuests.length === 1 ? groupQuests[0].title : `${groupQuests.length} Quests`,
      });

      const content = groupQuests.length === 1
        ? `<div style="color:#000; min-width:160px;">${questCardHtml(groupQuests[0])}</div>`
        : `<div style="color:#000; max-height:200px; overflow-y:auto; min-width:180px;">
            <strong style="font-size:14px; display:block; margin-bottom:6px;">${groupQuests.length} Quests</strong>
            ${groupQuests.map(questCardHtml).join("")}
          </div>`;

      const infoWindow = new google.maps.InfoWindow({ content });
      marker.addListener("click", () => infoWindow.open(map, marker));
      markerQuestMap.set(marker, groupQuests);
      markers.push(marker);
    });

    markersRef.current = markers;

    const clusterer = new MarkerClusterer({
      markers,
      map,
    });

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
            .flatMap((m: any) => markerQuestMap.get(m) || []);

          const content = `<div style="color:#000; max-height:200px; overflow-y:auto; min-width:180px;">
            <strong style="font-size:14px; display:block; margin-bottom:6px;">${questItems.length} Quests</strong>
            ${questItems.map(questCardHtml).join("")}
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

    const questIds = activeQuests.map((q: any) => q.id);
    const userIds = [...new Set(activeQuests.map((q: any) => q.user_id))];

    // Fetch participants for all active quests
    const { data: participants } = await supabase
      .from("quest_participants" as any)
      .select("quest_id, user_id")
      .in("quest_id", questIds.length > 0 ? questIds : ["__none__"]);

    // Gather all participant user IDs too
    const participantUserIds = (participants as any[] || []).map((p: any) => p.user_id);
    const allUserIds = [...new Set([...userIds, ...participantUserIds])];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", allUserIds.length > 0 ? allUserIds : ["__none__"]);

    const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

    // Group participants by quest_id
    const participantsByQuest = new Map<string, Participant[]>();
    (participants as any[] || []).forEach((p: any) => {
      const list = participantsByQuest.get(p.quest_id) || [];
      list.push({ user_id: p.user_id, display_name: nameMap.get(p.user_id) || "Unknown" });
      participantsByQuest.set(p.quest_id, list);
    });

    const enriched: Quest[] = activeQuests.map((q: any) => ({
      ...q,
      creator_name: nameMap.get(q.user_id) || "Unknown",
      participants: participantsByQuest.get(q.id) || [],
    }));

    setQuests(enriched);
    rebuildMarkers(enriched, user?.id);

    // Update selected quest if it's open
    if (selectedQuest) {
      const updated = enriched.find(q => q.id === selectedQuest.id);
      if (updated) setSelectedQuest(updated);
    }
  }, [rebuildMarkers, selectedQuest?.id]);

  useEffect(() => { loadQuestsRef.current = loadQuests; }, [loadQuests]);

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

  const handleJoinQuest = async (questId: string) => {
    if (!user) return;
    await supabase.from("quest_participants" as any).insert({
      quest_id: questId,
      user_id: user.id,
    } as any);
    await loadQuests();
  };

  const handleLeaveQuest = async (questId: string) => {
    if (!user) return;
    await supabase
      .from("quest_participants" as any)
      .delete()
      .eq("quest_id", questId)
      .eq("user_id", user.id);
    await loadQuests();
  };

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
      setSelectedQuest(null);
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

  // Chat: load messages + subscribe to realtime when a quest is selected
  const loadChatMessages = useCallback(async (questId: string) => {
    const { data: messages } = await supabase
      .from("quest_messages" as any)
      .select("*")
      .eq("quest_id", questId)
      .order("created_at", { ascending: true });

    if (!messages) return;

    const msgUserIds = [...new Set((messages as any[]).map((m: any) => m.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", msgUserIds.length > 0 ? msgUserIds : ["__none__"]);

    const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

    setChatMessages((messages as any[]).map((m: any) => ({
      ...m,
      display_name: nameMap.get(m.user_id) || "Unknown",
    })));
  }, []);

  useEffect(() => {
    if (!selectedQuest) {
      setChatMessages([]);
      setShowChat(false);
      setChatInput("");
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current);
        chatChannelRef.current = null;
      }
      return;
    }

    loadChatMessages(selectedQuest.id);

    // Subscribe to realtime
    const channel = supabase
      .channel(`quest-chat-${selectedQuest.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quest_messages',
          filter: `quest_id=eq.${selectedQuest.id}`,
        },
        async (payload: any) => {
          const msg = payload.new;
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", msg.user_id)
            .single();

          setChatMessages((prev) => [...prev, {
            ...msg,
            display_name: profile?.display_name || "Unknown",
          }]);
        }
      )
      .subscribe();

    chatChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      chatChannelRef.current = null;
    };
  }, [selectedQuest?.id, loadChatMessages]);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !user || !selectedQuest) return;
    const msg = chatInput.trim();
    setChatInput("");
    await supabase.from("quest_messages" as any).insert({
      quest_id: selectedQuest.id,
      user_id: user.id,
      message: msg,
    } as any);
  };

  const myQuests = quests.filter((q) => q.user_id === user?.id);
  const isParticipant = (quest: Quest) => quest.participants?.some(p => p.user_id === user?.id) || false;
  const isCreator = (quest: Quest) => quest.user_id === user?.id;
  const isMember = (quest: Quest) => isCreator(quest) || isParticipant(quest);

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-2 font-display text-xl font-semibold text-foreground">SideQuest</h1>
        </div>
        <Button variant="outline" onClick={() => setShowList(true)} className="gap-2">
          <List className="h-5 w-5" />
          My Quests
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

      {/* Quest Detail Modal */}
      {selectedQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border-2 border-border bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">{selectedQuest.title}</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedQuest(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="capitalize"><span className="font-medium text-foreground">Category:</span> {selectedQuest.category}</p>
              <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {selectedQuest.location}</p>
              <p className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> {selectedQuest.quest_date}</p>
              <p>{selectedQuest.start_time} – {selectedQuest.end_time}</p>
              <p><span className="font-medium text-foreground">Created by:</span> {selectedQuest.creator_name}</p>
              {selectedQuest.details && (
                <p className="border-t border-border pt-2">{selectedQuest.details}</p>
              )}

              {/* Participants Section */}
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-foreground" />
                  <span className="font-medium text-foreground">
                    Participants ({selectedQuest.participants?.length || 0})
                  </span>
                </div>
                {selectedQuest.participants && selectedQuest.participants.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedQuest.participants.map((p) => (
                      <span key={p.user_id} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {p.display_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No one has joined yet.</p>
                )}
              </div>

              {/* Join / Leave / End buttons */}
              <div className="pt-3 flex gap-2">
                {isCreator(selectedQuest) ? (
                  <Button variant="destructive" className="w-full gap-1.5" onClick={() => handleEndQuest(selectedQuest.id)}>
                    <Square className="h-3.5 w-3.5" /> End Quest
                  </Button>
                ) : isParticipant(selectedQuest) ? (
                  <Button variant="outline" className="w-full gap-1.5" onClick={() => handleLeaveQuest(selectedQuest.id)}>
                    <LogOut className="h-3.5 w-3.5" /> Leave Quest
                  </Button>
                ) : (
                  <Button className="w-full gap-1.5" onClick={() => handleJoinQuest(selectedQuest.id)}>
                    <LogIn className="h-3.5 w-3.5" /> Join Quest
                  </Button>
                )}
              </div>

              {/* Group Chat */}
              {isMember(selectedQuest) && (
                <div className="border-t border-border pt-3">
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-full"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Group Chat
                    {chatMessages.length > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                        {chatMessages.length}
                      </span>
                    )}
                  </button>

                  {showChat && (
                    <div className="mt-3 flex flex-col">
                      <div className="h-48 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                        {chatMessages.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center pt-16">No messages yet. Start the conversation!</p>
                        ) : (
                          chatMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={cn(
                                "max-w-[80%] rounded-lg px-3 py-1.5 text-xs",
                                msg.user_id === user?.id
                                  ? "ml-auto bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground"
                              )}
                            >
                              {msg.user_id !== user?.id && (
                                <p className="font-semibold text-[10px] opacity-70 mb-0.5">{msg.display_name}</p>
                              )}
                              <p>{msg.message}</p>
                            </div>
                          ))
                        )}
                        <div ref={chatEndRef} />
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                          className="text-xs h-8"
                        />
                        <Button size="sm" className="h-8 px-3" onClick={handleSendMessage} disabled={!chatInput.trim()}>
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                    className="rounded-lg border border-border p-4 space-y-2 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => { setShowList(false); setSelectedQuest(quest); }}
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
                        onClick={(e) => { e.stopPropagation(); handleEndQuest(quest.id); }}
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
                      <p className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {quest.participants?.length || 0} joined
                      </p>
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
                <label className="text-sm font-medium text-foreground">Title: <span className="text-destructive">*</span></label>
                <Input placeholder="Enter quest title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category: <span className="text-destructive">*</span></label>
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
                <label className="text-sm font-medium text-foreground">Location: <span className="text-destructive">*</span></label>
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
                <label className="text-sm font-medium text-foreground">Date: <span className="text-destructive">*</span></label>
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
                  <label className="text-sm font-medium text-foreground">Start Time: <span className="text-destructive">*</span></label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">End Time: <span className="text-destructive">*</span></label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Details: <span className="text-xs text-muted-foreground">(optional)</span></label>
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

import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, List, Plus, X, MapPin, CalendarIcon, Square, Users, LogIn, LogOut, Send, MessageCircle, ChevronUp, ChevronDown, Filter, Check, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Participant {
  user_id: string;
  display_name: string;
  gender?: string | null;
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
  const { toast } = useToast();
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showList, setShowList] = useState(false);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const CATEGORIES = ["food", "study", "fitness", "errands", "others"] as const;
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(CATEGORIES));
  const [filterDate, setFilterDate] = useState<Date>();
  const [filterStartTime, setFilterStartTime] = useState("");
  const [filterEndTime, setFilterEndTime] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [questDate, setQuestDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<{ description: string; place_id: string }[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const mapsApiKeyRef = useRef<string | null>(null);
  const locationInputRef = useRef<HTMLDivElement>(null);

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
  const [chatQuestId, setChatQuestId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatChannelRef = useRef<any>(null);
  const readChannelRef = useRef<any>(null);

  // Read receipts: map of message_id -> set of user_ids who read it
  const [messageReads, setMessageReads] = useState<Record<string, Set<string>>>({});

  const clustererRef = useRef<any>(null);
  const clusterInfoWindowRef = useRef<any>(null);
  const loadQuestsRef = useRef<() => Promise<void>>();

  // Unread message counts
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const getLastReadKey = (questId: string) => `chat_last_read_${questId}`;

  const fetchUnreadCounts = useCallback(async (questIds: string[]) => {
    if (!questIds.length) return;
    const counts: Record<string, number> = {};
    await Promise.all(
      questIds.map(async (qid) => {
        const lastRead = localStorage.getItem(getLastReadKey(qid));
        let query = supabase
          .from("quest_messages" as any)
          .select("id", { count: "exact", head: true })
          .eq("quest_id", qid);
        if (lastRead) {
          query = query.gt("created_at", lastRead);
        }
        const { count } = await query;
        counts[qid] = count || 0;
      })
    );
    setUnreadCounts(counts);
  }, []);

  const markQuestAsRead = useCallback((questId: string) => {
    localStorage.setItem(getLastReadKey(questId), new Date().toISOString());
    setUnreadCounts((prev) => ({ ...prev, [questId]: 0 }));
  }, []);

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

    const genderBreakdownHtml = (participants: Participant[] | undefined) => {
      const male = participants?.filter(p => p.gender === "male").length || 0;
      const female = participants?.filter(p => p.gender === "female").length || 0;
      const other = (participants?.length || 0) - male - female;
      return `<div style="font-size:10px; margin-top:2px;">
        <span style="color:#3b82f6;">♂ ${male}</span> · <span style="color:#f472b6;">♀ ${female}</span> · <span style="color:#9ca3af;">○ ${other}</span>
      </div>`;
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
        ${genderBreakdownHtml(q.participants)}
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
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#7DD3FC",
          fillOpacity: 1,
          strokeColor: "#0EA5E9",
          strokeWeight: 2,
          scale: 10,
        },
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
      let endDateTime = new Date(`${q.quest_date}T${q.end_time}`);
      // If end_time is earlier than start_time, the quest crosses midnight — add a day
      if (q.end_time <= q.start_time) {
        endDateTime = new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000);
      }
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
      .select("user_id, display_name, gender")
      .in("user_id", allUserIds.length > 0 ? allUserIds : ["__none__"]);

    const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);
    const genderMap = new Map(profiles?.map((p) => [p.user_id, p.gender]) || []);

    // Group participants by quest_id, always include the creator
    const participantsByQuest = new Map<string, Participant[]>();
    activeQuests.forEach((q: any) => {
      const list: Participant[] = [{ user_id: q.user_id, display_name: nameMap.get(q.user_id) || "Unknown", gender: genderMap.get(q.user_id) }];
      participantsByQuest.set(q.id, list);
    });
    (participants as any[] || []).forEach((p: any) => {
      const list = participantsByQuest.get(p.quest_id) || [];
      // Avoid duplicating the creator
      if (!list.some(existing => existing.user_id === p.user_id)) {
        list.push({ user_id: p.user_id, display_name: nameMap.get(p.user_id) || "Unknown", gender: genderMap.get(p.user_id) });
      }
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

  // Rebuild markers when filters change
  useEffect(() => {
    const filtered = quests.filter(q => {
      if (!selectedCategories.has(q.category)) return false;
      if (filterDate) {
        const fd = format(filterDate, "yyyy-MM-dd");
        if (q.quest_date !== fd) return false;
      }
      if (filterStartTime && q.start_time < filterStartTime) return false;
      if (filterEndTime && q.end_time > filterEndTime) return false;
      return true;
    });
    rebuildMarkers(filtered, user?.id);
  }, [selectedCategories, filterDate, filterStartTime, filterEndTime, quests, rebuildMarkers, user?.id]);

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
          streetViewControl: false,
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
    setChatQuestId(questId);
    await loadQuests();
  };

  const handleLeaveQuest = async (questId: string) => {
    if (!user) return;
    await supabase
      .from("quest_participants" as any)
      .delete()
      .eq("quest_id", questId)
      .eq("user_id", user.id);
    if (chatQuestId === questId) setChatQuestId(null);
    await loadQuests();
  };

  const handleCreate = async () => {
    const missing: string[] = [];
    if (!title) missing.push("Title");
    if (!category) missing.push("Category");
    if (!questDate) missing.push("Date");
    if (!startTime) missing.push("Start Time");
    if (!endTime) missing.push("End Time");
    if (!location) missing.push("Location");
    if (missing.length > 0) {
      toast({ title: "Please fill in the required fields", description: missing.join(", "), variant: "destructive" });
      return;
    }
    if (!user) return;

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

  const handleLocationInput = async (value: string) => {
    setLocation(value);
    if (!value.trim()) {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      return;
    }
    if (!mapsApiKeyRef.current) {
      const { data } = await supabase.functions.invoke("get-maps-key");
      if (data?.apiKey) mapsApiKeyRef.current = data.apiKey;
      else return;
    }
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places:autocomplete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": mapsApiKeyRef.current,
          },
          body: JSON.stringify({
            input: value,
            includedRegionCodes: ["sg"],
          }),
        }
      );
      const json = await res.json();
      const suggestions = (json.suggestions || [])
        .filter((s: any) => s.placePrediction)
        .map((s: any) => ({
          description: s.placePrediction.text?.text || s.placePrediction.structuredFormat?.mainText?.text || "",
          place_id: s.placePrediction.placeId,
        }));
      setLocationSuggestions(suggestions);
      setShowLocationDropdown(suggestions.length > 0);
    } catch {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
    }
  };

  const handleSelectLocation = (description: string) => {
    setLocation(description);
    setLocationSuggestions([]);
    setShowLocationDropdown(false);
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

    // Load read receipts for all messages
    const messageIds = (messages as any[]).map((m: any) => m.id);
    if (messageIds.length > 0) {
      const { data: reads } = await supabase
        .from("quest_message_reads" as any)
        .select("message_id, user_id")
        .in("message_id", messageIds);
      const readsMap: Record<string, Set<string>> = {};
      (reads || []).forEach((r: any) => {
        if (!readsMap[r.message_id]) readsMap[r.message_id] = new Set();
        readsMap[r.message_id].add(r.user_id);
      });
      setMessageReads(readsMap);
    }
  // Mark all messages in a quest as read by current user
  const markMessagesAsRead = useCallback(async (questId: string) => {
    if (!user) return;
    const { data: messages } = await supabase
      .from("quest_messages" as any)
      .select("id")
      .eq("quest_id", questId);
    if (!messages || messages.length === 0) return;

    // Upsert read receipts for all messages not yet read
    const rows = (messages as any[]).map((m: any) => ({
      message_id: m.id,
      user_id: user.id,
    }));
    await supabase.from("quest_message_reads" as any).upsert(rows as any, { onConflict: "message_id,user_id" });
  }, [user]);

  useEffect(() => {
    if (!chatQuestId) {
      setChatMessages([]);
      setChatInput("");
      setMessageReads({});
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current);
        chatChannelRef.current = null;
      }
      if (readChannelRef.current) {
        supabase.removeChannel(readChannelRef.current);
        readChannelRef.current = null;
      }
      return;
    }

    loadChatMessages(chatQuestId);
    markQuestAsRead(chatQuestId);
    markMessagesAsRead(chatQuestId);

    // Subscribe to new messages
    const channel = supabase
      .channel(`quest-chat-${chatQuestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quest_messages',
          filter: `quest_id=eq.${chatQuestId}`,
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

          // Mark new message as read immediately
          if (user && msg.user_id !== user.id) {
            await supabase.from("quest_message_reads" as any).upsert({
              message_id: msg.id,
              user_id: user.id,
            } as any, { onConflict: "message_id,user_id" });
          }
        }
      )
      .subscribe();

    chatChannelRef.current = channel;

    // Subscribe to read receipts realtime
    const readChannel = supabase
      .channel(`quest-reads-${chatQuestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quest_message_reads',
        },
        (payload: any) => {
          const read = payload.new;
          setMessageReads((prev) => {
            const updated = { ...prev };
            if (!updated[read.message_id]) updated[read.message_id] = new Set();
            else updated[read.message_id] = new Set(updated[read.message_id]);
            updated[read.message_id].add(read.user_id);
            return updated;
          });
        }
      )
      .subscribe();

    readChannelRef.current = readChannel;

    return () => {
      supabase.removeChannel(channel);
      chatChannelRef.current = null;
      supabase.removeChannel(readChannel);
      readChannelRef.current = null;
    };
  }, [chatQuestId, loadChatMessages, markQuestAsRead, markMessagesAsRead, user]);

  // Fetch unread counts when My Quests panel opens
  useEffect(() => {
    if (!showList || !user) return;
    const createdIds = quests.filter(q => q.user_id === user.id).map(q => q.id);
    const joinedIds = quests.filter(q => q.user_id !== user.id && q.participants?.some(p => p.user_id === user.id)).map(q => q.id);
    fetchUnreadCounts([...createdIds, ...joinedIds]);
  }, [showList, user, quests, fetchUnreadCounts]);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !user || !chatQuestId) return;
    const msg = chatInput.trim();
    setChatInput("");
    const { data } = await supabase.from("quest_messages" as any).insert({
      quest_id: chatQuestId,
      user_id: user.id,
      message: msg,
    } as any).select("id").single();
    // Auto-mark own message as read
    if (data) {
      await supabase.from("quest_message_reads" as any).upsert({
        message_id: (data as any).id,
        user_id: user.id,
      } as any, { onConflict: "message_id,user_id" });
    }
  };

  const myQuests = quests.filter((q) => q.user_id === user?.id || q.participants?.some(p => p.user_id === user?.id));
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
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-5 w-5" />
                Filter
                {(selectedCategories.size < CATEGORIES.length || filterDate || filterStartTime || filterEndTime) && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] px-1.5">●</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[60] bg-popover w-64 p-3 space-y-3">
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Category</p>
                {CATEGORIES.map((cat) => (
                  <DropdownMenuCheckboxItem
                    key={cat}
                    checked={selectedCategories.has(cat)}
                    onCheckedChange={(checked) => {
                      setSelectedCategories(prev => {
                        const next = new Set(prev);
                        if (checked) next.add(cat);
                        else next.delete(cat);
                        return next;
                      });
                    }}
                    className="capitalize"
                  >
                    {cat}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
              <div className="border-t border-border pt-2">
                <p className="text-xs font-medium text-foreground mb-1">Date</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn("w-full justify-start text-left text-xs h-8", !filterDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {filterDate ? format(filterDate, "PPP") : "Any date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[70]" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDate}
                      onSelect={setFilterDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="border-t border-border pt-2 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">Start after</p>
                  <Input type="time" value={filterStartTime} onChange={(e) => setFilterStartTime(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">End before</p>
                  <Input type="time" value={filterEndTime} onChange={(e) => setFilterEndTime(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-7"
                onClick={() => {
                  setSelectedCategories(new Set(CATEGORIES));
                  setFilterDate(undefined);
                  setFilterStartTime("");
                  setFilterEndTime("");
                }}
              >
                Clear all filters
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => setShowList(true)} className="gap-2">
            <List className="h-5 w-5" />
            My Quests
          </Button>
        </div>
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
      {/* Quest detail modal - only shown when NOT a member (no chat panel) */}
      {selectedQuest && !isMember(selectedQuest) && (
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
                      <span key={p.user_id} className={cn(
                        "rounded-full px-3 py-1 text-xs text-white",
                        p.gender === "male" ? "bg-blue-500" : p.gender === "female" ? "bg-pink-400" : "bg-gray-400"
                      )}>
                        {p.display_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No one has joined yet.</p>
                )}
              </div>

              {/* Join button for non-members */}
              <div className="pt-3 flex gap-2">
                <Button className="w-full gap-1.5" onClick={() => handleJoinQuest(selectedQuest.id)}>
                  <LogIn className="h-3.5 w-3.5" /> Join Quest
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right-side Panel: Quest Details + Chat (for members) */}
      {chatQuestId && (() => {
        const chatQuest = quests.find(q => q.id === chatQuestId);
        if (!chatQuest || !isMember(chatQuest)) return null;
        const showDetails = selectedQuest && selectedQuest.id === chatQuestId;
        return (
          <div className="fixed top-0 right-0 z-40 h-full w-80 border-l border-border bg-background shadow-lg flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm text-foreground truncate">{chatQuest.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                  if (showDetails) {
                    setSelectedQuest(null);
                  } else {
                    setSelectedQuest(chatQuest);
                  }
                }}>
                  {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setChatQuestId(null); setSelectedQuest(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Collapsible Quest Details */}
            {showDetails && (
              <div className="border-b border-border p-3 space-y-2 text-xs text-muted-foreground overflow-y-auto max-h-60">
                <p className="capitalize"><span className="font-medium text-foreground">Category:</span> {chatQuest.category}</p>
                <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {chatQuest.location}</p>
                <p className="flex items-center gap-1.5"><CalendarIcon className="h-3 w-3" /> {chatQuest.quest_date}</p>
                <p>{chatQuest.start_time} – {chatQuest.end_time}</p>
                <p><span className="font-medium text-foreground">Created by:</span> {chatQuest.creator_name}</p>
                {chatQuest.details && (
                  <p className="border-t border-border pt-2">{chatQuest.details}</p>
                )}
                <div className="border-t border-border pt-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="h-3 w-3 text-foreground" />
                    <span className="font-medium text-foreground">Participants ({chatQuest.participants?.length || 0})</span>
                  </div>
                  {chatQuest.participants && chatQuest.participants.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {chatQuest.participants.map((p) => (
                        <span key={p.user_id} className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] text-white",
                          p.gender === "male" ? "bg-blue-500" : p.gender === "female" ? "bg-pink-400" : "bg-gray-400"
                        )}>
                          {p.display_name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">No one has joined yet.</p>
                  )}
                </div>
                <div className="pt-2 flex gap-2">
                  {isCreator(chatQuest) ? (
                    <Button variant="destructive" size="sm" className="w-full gap-1 text-xs h-7" onClick={() => handleEndQuest(chatQuest.id)}>
                      <Square className="h-3 w-3" /> End Quest
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full gap-1 text-xs h-7" onClick={() => handleLeaveQuest(chatQuest.id)}>
                      <LogOut className="h-3 w-3" /> Leave Quest
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center pt-20">No messages yet. Start the conversation!</p>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-1.5 text-xs",
                      msg.user_id === user?.id
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {msg.user_id !== user?.id && (
                      <p className="font-semibold text-[10px] opacity-70 mb-0.5">{msg.display_name}</p>
                    )}
                    <p>{msg.message}</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <span className="text-[9px] opacity-50">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.user_id === user?.id && (() => {
                        const readers = messageReads[msg.id];
                        const othersRead = readers && [...readers].some(uid => uid !== user?.id);
                        return othersRead
                          ? <CheckCheck className="h-3 w-3 opacity-80 text-blue-300" />
                          : <Check className="h-3 w-3 opacity-50" />;
                      })()}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-border p-3 flex gap-2">
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
        );
      })()}
      {/* My Quests List */}
      {showList && (() => {
        const createdQuests = quests.filter((q) => q.user_id === user?.id);
        const joinedQuests = quests.filter((q) => q.user_id !== user?.id && q.participants?.some(p => p.user_id === user?.id));
        const allMyQuestIds = [...createdQuests, ...joinedQuests].map(q => q.id);

        const renderQuestCard = (quest: Quest, mode: 'created' | 'joined') => (
          <div
            key={quest.id}
            className="rounded-lg border border-border p-4 space-y-2 cursor-pointer hover:border-primary transition-colors"
            onClick={() => { setShowList(false); setSelectedQuest(quest); setChatQuestId(quest.id); }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate">{quest.title}</h3>
                  {(unreadCounts[quest.id] || 0) > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                      {unreadCounts[quest.id]} new {unreadCounts[quest.id] === 1 ? "message" : "messages"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize">{quest.category}</p>
              </div>
              {mode === 'created' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={(e) => { e.stopPropagation(); handleEndQuest(quest.id); }}
                >
                  <Square className="h-3 w-3" />
                  End
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={(e) => { e.stopPropagation(); handleLeaveQuest(quest.id); }}
                >
                  <LogOut className="h-3 w-3" />
                  Leave
                </Button>
              )}
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
                <span className="ml-1 text-xs">
                  <span className="text-blue-500">♂{quest.participants?.filter(p => p.gender === "male").length || 0}</span>
                  {" "}
                  <span className="text-pink-400">♀{quest.participants?.filter(p => p.gender === "female").length || 0}</span>
                  {" "}
                  <span className="text-gray-400">○{(quest.participants?.length || 0) - (quest.participants?.filter(p => p.gender === "male").length || 0) - (quest.participants?.filter(p => p.gender === "female").length || 0)}</span>
                </span>
              </p>
            </div>
            {quest.details && (
              <p className="text-sm text-muted-foreground border-t border-border pt-2">{quest.details}</p>
            )}
          </div>
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-xl border-2 border-border bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">My Quests</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowList(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <h3 className="font-semibold text-foreground text-sm mb-2">Created by me</h3>
              {createdQuests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No quests created yet.</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {createdQuests.map((quest) => renderQuestCard(quest, 'created'))}
                </div>
              )}

              <h3 className="font-semibold text-foreground text-sm mb-2">Joined</h3>
              {joinedQuests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">You haven't joined any quests yet.</p>
              ) : (
                <div className="space-y-3">
                  {joinedQuests.map((quest) => renderQuestCard(quest, 'joined'))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

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
                <div className="relative" ref={locationInputRef}>
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    placeholder="e.g. NTU, Jurong East, Marina Bay"
                    value={location}
                    onChange={(e) => handleLocationInput(e.target.value)}
                    onFocus={() => { if (locationSuggestions.length) setShowLocationDropdown(true); }}
                    onBlur={() => { setTimeout(() => setShowLocationDropdown(false), 200); }}
                    className="pl-9"
                  />
                  {showLocationDropdown && locationSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
                      {locationSuggestions.map((s) => (
                        <button
                          key={s.place_id}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectLocation(s.description)}
                        >
                          {s.description}
                        </button>
                      ))}
                    </div>
                  )}
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

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const SideQuestPage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("Google Maps API key is not set");
      return;
    }

    // Check if script is already loaded
    if (window.google?.maps) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    document.head.appendChild(script);

    return () => {
      // Cleanup not needed for Google Maps script
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current || !window.google) return;

    new window.google.maps.Map(mapRef.current, {
      center: { lat: 1.3521, lng: 103.8198 }, // Singapore
      zoom: 12,
      gestureHandling: "greedy", // allows zooming and panning
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 text-lg font-semibold text-foreground">SideQuest</h1>
      </header>
      <div ref={mapRef} className="flex-1 w-full" />
    </div>
  );
};

export default SideQuestPage;

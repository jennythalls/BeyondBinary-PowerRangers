import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SideQuest = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 font-display text-xl font-semibold text-foreground">SideQuest</h1>
      </header>

      <div className="flex-1 px-4 pb-4">
        {error ? (
          <div className="flex h-full items-center justify-center text-destructive">{error}</div>
        ) : (
          <div ref={mapRef} className="h-full w-full rounded-xl border-2 border-border" style={{ minHeight: "calc(100vh - 80px)" }} />
        )}
      </div>
    </div>
  );
};

export default SideQuest;

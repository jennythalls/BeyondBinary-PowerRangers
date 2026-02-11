const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory cache keyed by date
const cache: Record<string, { quotes: { text: string; author: string }[] }> = {};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    if (cache[today]) {
      return new Response(JSON.stringify(cache[today]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                "You generate motivational quotes. Return ONLY a JSON array of 30 objects with keys \"text\" and \"author\". No markdown, no explanation. Mix famous and lesser-known authors. Make them diverse in theme: perseverance, self-belief, growth, gratitude, courage, kindness, ambition.",
            },
            {
              role: "user",
              content: `Generate 30 unique motivational quotes for today (${today}). Use seed ${today} so they differ each day.`,
            },
          ],
          temperature: 1,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("AI gateway error:", err);
      return new Response(
        JSON.stringify({ error: "Failed to generate quotes" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Strip markdown fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const quotes = JSON.parse(content);
    cache[today] = { quotes };

    // Clean old cache entries
    for (const key of Object.keys(cache)) {
      if (key !== today) delete cache[key];
    }

    return new Response(JSON.stringify({ quotes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
